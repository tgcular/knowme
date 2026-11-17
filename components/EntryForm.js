"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadFriends } from "@/lib/friends";
import Confirm from "@/components/Confirm";
import PhotoSlot from "@/components/PhotoSlot";
import MusicPlayer from "@/components/MusicPlayer";
import VisibilityPicker from "@/components/VisibilityPicker";
import RichEditor from "@/components/RichEditor";
import Icon from "@/components/Icon";

export const MOODS = [["😊", "Happy"], ["😌", "Calm"], ["😐", "Okay"], ["😴", "Tired"], ["😢", "Sad"], ["😡", "Angry"]];
const Label = ({ icon, children }) => <p className="flex items-center gap-2 px-1 text-sm text-white/60"><Icon name={icon} size={16} />{children}</p>;

export default function EntryForm({ id }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(!id);
  const [mood, setMood] = useState("");
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [when, setWhen] = useState(new Date());
  const [visibility, setVisibility] = useState("private");
  const [shareIds, setShareIds] = useState([]);
  const [token, setToken] = useState(null);
  const [friends, setFriends] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState("");
  const [origVis, setOrigVis] = useState(null);
  const writeSecs = useRef(0);
  const lastInput = useRef(0);

  useEffect(() => { loadFriends().then(setFriends); }, []);
  // Counts "writing time": seconds with the tab visible and typing in the last minute.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput.current < 60000) writeSecs.current += 1;
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: e } = await supabase.from("entries").select("*").eq("id", id).single();
      if (!e) { setLoaded(true); return setMsg("Entry not found."); }
      const { data: s } = await supabase.storage.from("photos").createSignedUrls([e.front_path, e.back_path], 3600);
      setTitle(e.title || ""); setBody(e.body || ""); setLocation(e.location || ""); writeSecs.current = e.write_seconds || 0; setMood(e.mood); setWhen(new Date(e.created_at));
      setVisibility(e.visibility); setOrigVis(e.visibility); setToken(e.share_token);
      setFront({ path: e.front_path, url: s[0].signedUrl });
      setBack({ path: e.back_path, url: s[1].signedUrl });
      const { data: sh } = await supabase.from("entry_shares").select("friend_id").eq("entry_id", id);
      setShareIds((sh || []).map((r) => r.friend_id));
      setLoaded(true);
    })();
  }, [id]);

  const touch = () => { lastInput.current = Date.now(); };
  function locate() {
    if (!navigator.geolocation) return setMsg("Location isn't available on this device. You can type it instead.");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${coords.latitude}&lon=${coords.longitude}`);
        const j = await r.json(); const a = j.address || {};
        setLocation(j.name || [a.road, a.suburb || a.neighbourhood || a.village, a.city || a.town].filter(Boolean).join(", ") || "");
        touch();
      } catch { setMsg("Couldn't look up a place name. You can type it instead."); }
    }, () => setMsg("Location permission was denied. You can type it instead."), { timeout: 10000 });
  }

  const snap = (set) => (blob) => set((p) => ({ blob, url: URL.createObjectURL(blob), oldPath: p?.path || p?.oldPath }));

  const leave = () => (window.history.length > 1 ? router.back() : router.replace("/home"));

  async function save() {
    setDialog(null); setBusy(true); setMsg("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const eid = id || crypto.randomUUID();
      const up = async (p, side) => {
        if (!p.blob) return p.path;
        const path = `${user.id}/${eid}-${side}-${Date.now()}.${p.blob.type === "image/webp" ? "webp" : "jpg"}`;
        const { error } = await supabase.storage.from("photos").upload(path, p.blob, { contentType: p.blob.type || "image/jpeg" });
        if (error) throw error;
        if (p.oldPath) await supabase.storage.from("photos").remove([p.oldPath]);
        return path;
      };
      const row = {
        title: title.trim() || null, location: location.trim() || null, write_seconds: Math.round(writeSecs.current), mood, body,
        front_path: await up(front, "front"), back_path: await up(back, "back"),
        visibility, share_token: visibility === "link" ? (token || crypto.randomUUID()) : null,
        ...(visibility === "private" ? { shared_at: null } : (!id || origVis === "private") ? { shared_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      };
      const { error } = id ? await supabase.from("entries").update(row).eq("id", id)
        : await supabase.from("entries").insert({ ...row, id: eid, user_id: user.id });
      if (error) throw error;
      await supabase.from("entry_shares").delete().eq("entry_id", eid);
      if (visibility === "friends" && shareIds.length) {
        const { error: e2 } = await supabase.from("entry_shares").insert(shareIds.map((f) => ({ entry_id: eid, friend_id: f })));
        if (e2) throw e2;
      }
      if (id) leave();
      else { try { localStorage.setItem("nomi_new_entry", "1"); } catch {} router.replace("/home"); }
    } catch (e) { setMsg(e.message || "Could not save. Try again."); setBusy(false); }
  }

  async function remove() {
    setDialog(null); setBusy(true);
    await supabase.storage.from("photos").remove([front.path, back.path].filter(Boolean));
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) { setMsg(error.message); return setBusy(false); }
    leave();
  }

  const ready = mood && front && back && !busy;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button aria-label="Back" onClick={() => router.back()} className="glass grid h-11 w-11 place-items-center rounded-full"><Icon name="back" size={20} /></button>
        <p className="flex items-center gap-2 text-sm text-white/60"><Icon name="calendar" size={15} />{when.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
        {id ? <button aria-label="Delete entry" onClick={() => setDialog("delete")} className="glass grid h-11 w-11 place-items-center rounded-full text-blush"><Icon name="trash" size={20} /></button> : <span className="w-11" />}
      </div>

      <MusicPlayer autoPlay={!id} />

      <div className="glass space-y-3 rounded-3xl p-4">
        <input className="w-full bg-transparent text-2xl font-bold outline-none placeholder-white/30" placeholder="Give this day a title" maxLength={80} value={title} onChange={(e) => { setTitle(e.target.value); touch(); }} />
        <div className="h-px bg-white/10" />
        <RichEditor initial={body} loaded={loaded} onChange={(t) => { setBody(t); touch(); }} />
      </div>

      <div className="glass flex items-center gap-2 rounded-3xl p-2 pl-4">
        <Icon name="pin" size={18} className="shrink-0 text-blush" />
        <input className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder-white/35" placeholder="Add a location (optional)" maxLength={80} value={location} onChange={(e) => { setLocation(e.target.value); touch(); }} />
        <button type="button" onClick={locate} className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 text-sm">Use my location</button>
      </div>

      <Label icon="heart">Mood</Label>
      <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
        {MOODS.map(([e, n]) => (
          <button key={n} onClick={() => setMood(e)}
            className={`shrink-0 rounded-full px-4 py-2 transition ${mood === e ? "bg-gradient-to-br from-iris to-blush font-semibold" : "bg-white/10 text-white/80"}`}>{e} {n}</button>
        ))}
      </div>

      <Label icon="camera">Photos</Label>
      <div className="grid grid-cols-2 gap-3">
        <PhotoSlot facing="user" label="front photo" active photo={front} onCapture={snap(setFront)} />
        <PhotoSlot facing="environment" label="back photo" active={!!front} photo={back} onCapture={snap(setBack)} />
      </div>

      <Label icon="lock">Who can see this</Label>
      <VisibilityPicker visibility={visibility} setVisibility={setVisibility} shareIds={shareIds} setShareIds={setShareIds} friends={friends} token={token} />

      {msg && <p className="text-sm text-blush">{msg}</p>}
      <button className="btn flex w-full items-center justify-center gap-2" disabled={!ready} onClick={() => setDialog("save")}>
        <Icon name="check" size={20} />{id ? "Save changes" : "Save entry"}
      </button>
      {!ready && !busy && <p className="text-center text-xs text-white/50">Pick a mood and take both photos to save.</p>}
      {dialog === "save" && <Confirm title={id ? "Save changes?" : "Save this entry?"} body="Your entry and photos will be stored in your account." action={id ? "Save changes" : "Save entry"} onYes={save} onNo={() => setDialog(null)} />}
      {dialog === "delete" && <Confirm title="Delete entry?" body="This permanently deletes the entry and both photos." action="Delete entry" onYes={remove} onNo={() => setDialog(null)} />}
    </div>
  );
}

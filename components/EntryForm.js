"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Confirm from "@/components/Confirm";
import PhotoSlot from "@/components/PhotoSlot";
import MusicPlayer from "@/components/MusicPlayer";
import VisibilityPicker from "@/components/VisibilityPicker";
import { loadFriends } from "@/lib/friends";

export const MOODS = [["😊", "Happy"], ["😌", "Calm"], ["😐", "Okay"], ["😴", "Tired"], ["😢", "Sad"], ["😡", "Angry"]];

export default function EntryForm({ id }) {
  const router = useRouter();
  const [mood, setMood] = useState("");
  const [body, setBody] = useState("");
  const [front, setFront] = useState(null); // { url, path?, blob?, oldPath? }
  const [back, setBack] = useState(null);
  const [when, setWhen] = useState(new Date());
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [visibility, setVisibility] = useState("private");
  const [shareIds, setShareIds] = useState([]);
  const [token, setToken] = useState(null);
  const [friends, setFriends] = useState([]);

  useEffect(() => { loadFriends().then(setFriends); }, []);
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: e } = await supabase.from("entries").select("*").eq("id", id).single();
      if (!e) return setMsg("Entry not found.");
      const { data: s } = await supabase.storage.from("photos").createSignedUrls([e.front_path, e.back_path], 3600);
      setMood(e.mood); setBody(e.body || ""); setVisibility(e.visibility); setToken(e.share_token); setWhen(new Date(e.created_at));
      setFront({ path: e.front_path, url: s[0].signedUrl });
      setBack({ path: e.back_path, url: s[1].signedUrl });
      const { data: sh } = await supabase.from("entry_shares").select("friend_id").eq("entry_id", id);
      setShareIds((sh || []).map((r) => r.friend_id));
    })();
  }, [id]);

  const snap = (set) => (blob) => set((p) => ({ blob, url: URL.createObjectURL(blob), oldPath: p?.path || p?.oldPath }));

  async function save() {
    setDialog(null); setBusy(true); setMsg("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const eid = id || crypto.randomUUID();
      const up = async (p, side) => {
        if (!p.blob) return p.path;
        const path = `${user.id}/${eid}-${side}-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("photos").upload(path, p.blob, { contentType: "image/jpeg" });
        if (error) throw error;
        if (p.oldPath) await supabase.storage.from("photos").remove([p.oldPath]);
        return path;
      };
      const row = { mood, body, front_path: await up(front, "front"), back_path: await up(back, "back"), visibility, share_token: visibility === "link" ? (token || crypto.randomUUID()) : null, updated_at: new Date().toISOString() };
      const { error } = id ? await supabase.from("entries").update(row).eq("id", id)
        : await supabase.from("entries").insert({ ...row, id: eid, user_id: user.id });
      if (error) throw error;
      await supabase.from("entry_shares").delete().eq("entry_id", eid);
      if (visibility === "friends" && shareIds.length) {
        const { error: e2 } = await supabase.from("entry_shares").insert(shareIds.map((f) => ({ entry_id: eid, friend_id: f })));
        if (e2) throw e2;
      }
      router.replace("/home");
    } catch (e) { setMsg(e.message || "Could not save. Try again."); setBusy(false); }
  }

  async function remove() {
    setDialog(null); setBusy(true);
    await supabase.storage.from("photos").remove([front.path, back.path].filter(Boolean));
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) { setMsg(error.message); return setBusy(false); }
    router.replace("/home");
  }

  const ready = mood && front && back && !busy;
  return (
    <div className="space-y-4">
      <MusicPlayer />
      <h1 className="text-2xl font-bold">{id ? "Edit entry" : "New entry"}</h1>
      <p className="text-sm text-white/60">{when.toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map(([e, n]) => (
          <button key={n} onClick={() => setMood(e)} className={`rounded-2xl px-3 py-2 ${mood === e ? "btn" : "btn-ghost"}`}>{e} {n}</button>
        ))}
      </div>
      <textarea className="input min-h-40" placeholder="How was your day?" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <PhotoSlot facing="user" label="front photo" active photo={front} onCapture={snap(setFront)} />
        <PhotoSlot facing="environment" label="back photo" active={!!front} photo={back} onCapture={snap(setBack)} />
      </div>
      <VisibilityPicker visibility={visibility} setVisibility={setVisibility} shareIds={shareIds} setShareIds={setShareIds} friends={friends} token={token} />
      {msg && <p className="text-sm text-blush">{msg}</p>}
      <button className="btn w-full" disabled={!ready} onClick={() => setDialog("save")}>{id ? "Save changes" : "Save entry"}</button>
      {!ready && !busy && <p className="text-center text-xs text-white/50">Pick a mood and take both photos to save.</p>}
      {id && <button className="w-full py-3 text-sm text-blush" onClick={() => setDialog("delete")}>Delete entry</button>}
      {dialog === "save" && <Confirm title={id ? "Save changes?" : "Save this entry?"} body="Your entry and photos will be stored in your account." action={id ? "Save changes" : "Save entry"} onYes={save} onNo={() => setDialog(null)} />}
      {dialog === "delete" && <Confirm title="Delete entry?" body="This permanently deletes the entry and both photos." action="Delete entry" onYes={remove} onNo={() => setDialog(null)} />}
    </div>
  );
}

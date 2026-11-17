"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Confirm from "@/components/Confirm";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import StorageOptimizer from "@/components/StorageOptimizer";
import { compress } from "@/lib/images";

export default function Profile() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarPath, setAvatarPath] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // "save" | "signout" | "delete" | "removepic"

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      const { data: p } = await supabase.from("profiles").select("display_name,username,avatar_path").eq("id", data.user.id).single();
      setName(p?.display_name || ""); setUsername(p?.username || ""); setAvatarPath(p?.avatar_path || null);
      if (p?.avatar_path) {
        const { data: s } = await supabase.storage.from("avatars").createSignedUrl(p.avatar_path, 3600);
        setAvatarUrl(s?.signedUrl || null);
      }
    });
  }, []);

  async function pick(ev) {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setMsg("Please choose an image file.");
    setBusy(true); setMsg("");
    try {
      const { blob, ext, type } = await compress(f, { max: 320, square: true, quality: 0.8 });
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: type });
      if (error) throw error;
      const { error: e2 } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
      if (e2) throw e2;
      if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
      setAvatarPath(path); setAvatarUrl(URL.createObjectURL(blob)); setMsg("Profile picture updated.");
    } catch (e) { setMsg(e.message || "Couldn't upload the picture."); }
    setBusy(false);
  }
  async function removePic() {
    setDialog(null); setBusy(true);
    await supabase.storage.from("avatars").remove([avatarPath]);
    const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
    if (error) setMsg(error.message); else { setAvatarPath(null); setAvatarUrl(null); setMsg("Profile picture removed."); }
    setBusy(false);
  }
  async function save() {
    setDialog(null);
    const { error } = await supabase.from("profiles").update({ display_name: name, username: username || null }).eq("id", user.id);
    setMsg(error ? (error.code === "23505" ? "That username is taken." : error.code === "23514" ? "Username: 3–20 characters, lowercase letters, numbers, or underscore." : error.message) : "Saved.");
  }
  async function signOut() { await supabase.auth.signOut(); router.replace("/login"); }
  async function deleteAccount() {
    const { data } = await supabase.auth.getSession();
    const res = await fetch("/api/delete-account", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}` } });
    if (!res.ok) { setDialog(null); return setMsg("Could not delete account. Try again."); }
    await supabase.auth.signOut(); router.replace("/login");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Me</h1>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar url={avatarUrl} name={name || user?.email} size={112} />
          <button aria-label="Change profile picture" disabled={busy} onClick={() => fileRef.current?.click()}
            className="btn absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center !rounded-full !p-0 shadow-lg"><Icon name="camera" size={18} /></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        <div className="flex gap-2 text-sm">
          <button className="rounded-full bg-white/10 px-4 py-1.5" disabled={busy} onClick={() => fileRef.current?.click()}>{avatarUrl ? "Change photo" : "Add photo"}</button>
          {avatarPath && <button className="rounded-full bg-white/10 px-4 py-1.5 text-blush" disabled={busy} onClick={() => setDialog("removepic")}>Remove</button>}
        </div>
      </div>
      <p className="text-center text-white/60">{user?.email}</p>
      <input className="input" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder="Username (friends find you with this)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
      {msg && <p className="text-sm text-blush">{msg}</p>}
      <button className="btn w-full" onClick={() => setDialog("save")}>Save changes</button>
      <StorageOptimizer />
      <button className="btn-ghost w-full" onClick={() => setDialog("signout")}>Sign out</button>
      <button className="w-full py-3 text-sm text-blush" onClick={() => setDialog("delete")}>Delete account</button>
      {dialog === "save" && <Confirm title="Save changes?" body="Your display name and username will be updated." action="Save changes" onYes={save} onNo={() => setDialog(null)} />}
      {dialog === "removepic" && <Confirm title="Remove profile picture?" body="Friends will see your initial instead." action="Remove" onYes={removePic} onNo={() => setDialog(null)} />}
      {dialog === "signout" && <Confirm title="Sign out?" body="You can sign back in anytime." action="Sign out" onYes={signOut} onNo={() => setDialog(null)} />}
      {dialog === "delete" && <Confirm title="Delete account?" body="This permanently deletes your account, entries, and photos. It cannot be undone." word="DELETE" action="Delete account" onYes={deleteAccount} onNo={() => setDialog(null)} />}
    </div>
  );
}

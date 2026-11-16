"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Confirm from "@/components/Confirm";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [dialog, setDialog] = useState(null); // "save" | "signout" | "delete"

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", data.user.id).single();
      setName(p?.display_name || "");
    });
  }, []);

  async function save() {
    setDialog(null);
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    setMsg(error ? error.message : "Saved.");
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
      <p className="text-white/60">{user?.email}</p>
      <input className="input" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
      {msg && <p className="text-sm text-blush">{msg}</p>}
      <button className="btn w-full" onClick={() => setDialog("save")}>Save changes</button>
      <button className="btn-ghost w-full" onClick={() => setDialog("signout")}>Sign out</button>
      <button className="w-full py-3 text-sm text-blush" onClick={() => setDialog("delete")}>Delete account</button>
      {dialog === "save" && <Confirm title="Save changes?" body="Your display name will be updated." action="Save changes" onYes={save} onNo={() => setDialog(null)} />}
      {dialog === "signout" && <Confirm title="Sign out?" body="You can sign back in anytime." action="Sign out" onYes={signOut} onNo={() => setDialog(null)} />}
      {dialog === "delete" && <Confirm title="Delete account?" body="This permanently deletes your account, entries, and photos. It cannot be undone." word="DELETE" action="Delete account" onYes={deleteAccount} onNo={() => setDialog(null)} />}
    </div>
  );
}

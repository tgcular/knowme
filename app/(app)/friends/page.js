"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Confirm from "@/components/Confirm";

const Person = ({ p }) => <span>{p?.display_name || "Someone"} <span className="text-sm text-white/50">{p?.username ? `@${p.username}` : ""}</span></span>;

export default function Friends() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user.id);
    const { data: fr } = await supabase.from("friendships").select("*");
    const ids = [...new Set((fr || []).flatMap((r) => [r.requester, r.addressee]))].filter((i) => i !== user.id);
    const { data: ps } = ids.length ? await supabase.from("profiles").select("id,display_name,username").in("id", ids) : { data: [] };
    const by = Object.fromEntries((ps || []).map((p) => [p.id, p]));
    setRows((fr || []).map((r) => ({ ...r, other: by[r.requester === user.id ? r.addressee : r.requester] })));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function search() {
    setMsg("");
    const term = q.trim().toLowerCase().replace(/^@/, "").replace(/[_%]/g, "\\$&");
    if (term.length < 2) return setMsg("Type at least 2 characters of a username.");
    const { data } = await supabase.from("profiles").select("id,display_name,username").ilike("username", `${term}%`).neq("id", me).limit(10);
    const taken = new Set(rows.map((r) => r.other?.id));
    setResults((data || []).filter((p) => !taken.has(p.id)));
  }
  async function add(p) {
    const { error } = await supabase.from("friendships").insert({ requester: me, addressee: p.id });
    setMsg(error ? "Could not send the request." : `Request sent to @${p.username}.`);
    setResults(null); load();
  }
  const accept = async (r) => { await supabase.from("friendships").update({ status: "accepted" }).eq("id", r.id); load(); };
  const ask = (title, body, action, id) => setDialog({ title, body, action, run: () => supabase.from("friendships").delete().eq("id", id) });

  const incoming = rows.filter((r) => r.status === "pending" && r.addressee === me);
  const outgoing = rows.filter((r) => r.status === "pending" && r.requester === me);
  const friends = rows.filter((r) => r.status === "accepted");
  const Section = ({ title, list, children }) => list.length > 0 && (
    <div className="space-y-2"><h2 className="font-semibold text-white/70">{title}</h2>{children}</div>
  );
  const Row = ({ r, children }) => <div className="glass flex items-center justify-between gap-2 rounded-2xl p-3"><Person p={r.other} /><div className="flex gap-2">{children}</div></div>;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Friends</h1>
      <div className="flex gap-2">
        <input className="input" placeholder="Find a friend by username" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
        <button className="btn" onClick={search}>Search</button>
      </div>
      {msg && <p className="text-sm text-blush">{msg}</p>}
      {results && (results.length === 0 ? <p className="text-white/60">No one found. Check the username, and ask them to set one on their Me page.</p>
        : results.map((p) => <div key={p.id} className="glass flex items-center justify-between rounded-2xl p-3"><Person p={p} /><button className="btn" onClick={() => add(p)}>Add</button></div>))}
      <Section title="Requests for you" list={incoming}>
        {incoming.map((r) => <Row key={r.id} r={r}>
          <button className="btn" onClick={() => accept(r)}>Accept</button>
          <button className="btn-ghost" onClick={() => ask("Decline request?", "They won't be notified.", "Decline", r.id)}>Decline</button></Row>)}
      </Section>
      <Section title="Waiting for a reply" list={outgoing}>
        {outgoing.map((r) => <Row key={r.id} r={r}><button className="btn-ghost" onClick={() => ask("Cancel request?", "The request will be withdrawn.", "Cancel request", r.id)}>Cancel</button></Row>)}
      </Section>
      <Section title="Your friends" list={friends}>
        {friends.map((r) => <Row key={r.id} r={r}><button className="btn-ghost" onClick={() => ask("Remove friend?", "They will no longer see anything you shared with them.", "Remove friend", r.id)}>Remove</button></Row>)}
      </Section>
      {rows.length === 0 && !results && <p className="text-white/60">No friends yet. Search for a username above.</p>}
      {dialog && <Confirm title={dialog.title} body={dialog.body} action={dialog.action} onNo={() => setDialog(null)}
        onYes={async () => { await dialog.run(); setDialog(null); load(); }} />}
    </div>
  );
}

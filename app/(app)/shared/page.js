"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Shared() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("entries").select("*").neq("user_id", user.id).order("created_at", { ascending: false });
      const list = data || [];
      const uids = [...new Set(list.map((e) => e.user_id))];
      const { data: ps } = uids.length ? await supabase.from("profiles").select("id,display_name,username").in("id", uids) : { data: [] };
      const by = Object.fromEntries((ps || []).map((p) => [p.id, p]));
      const paths = list.flatMap((e) => [e.front_path, e.back_path]);
      const { data: s } = paths.length ? await supabase.storage.from("photos").createSignedUrls(paths, 3600) : { data: [] };
      setItems(list.map((e, i) => ({ ...e, who: by[e.user_id], front: s[i * 2]?.signedUrl, back: s[i * 2 + 1]?.signedUrl })));
    })();
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Shared with you</h1>
      {items === null ? <p className="text-white/50">Loading…</p>
        : items.length === 0 ? <div className="glass rounded-3xl p-6 text-white/70">Nothing shared with you yet. When friends share an entry with you, it shows up here.</div>
        : items.map((e) => (
          <div key={e.id} className="glass space-y-3 rounded-3xl p-4">
            <div className="flex justify-between text-sm text-white/60">
              <span>{e.who?.display_name} <span className="text-white/40">@{e.who?.username}</span></span>
              <span>{e.mood} {new Date(e.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[e.front, e.back].map((u, i) => <img key={i} src={u} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />)}
            </div>
            {e.body && <p className="text-white/80">{e.body}</p>}
          </div>
        ))}
    </div>
  );
}

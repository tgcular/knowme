"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [entries, setEntries] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("entries").select("*").order("created_at", { ascending: false });
      const list = data || [];
      const paths = list.flatMap((e) => [e.front_path, e.back_path]);
      const { data: s } = paths.length ? await supabase.storage.from("photos").createSignedUrls(paths, 3600) : { data: [] };
      setEntries(list.map((e, i) => ({ ...e, front: s[i * 2]?.signedUrl, back: s[i * 2 + 1]?.signedUrl })));
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your diary</h1>
        <Link href="/diary/new" className="btn">New entry</Link>
      </div>
      {entries === null ? <p className="text-white/50">Loading…</p>
        : entries.length === 0 ? <div className="glass rounded-3xl p-6 text-white/70">No entries yet. Tap New entry to write your first one.</div>
        : entries.map((e) => (
          <Link key={e.id} href={`/diary/${e.id}`} className="glass block space-y-3 rounded-3xl p-4">
            <div className="flex justify-between text-sm text-white/60">
              <span>{new Date(e.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
              <span className="text-xl">{e.mood}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[e.front, e.back].map((u, i) => <img key={i} src={u} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />)}
            </div>
            {e.body && <p className="line-clamp-3 text-white/80">{e.body}</p>}
          </Link>
        ))}
    </div>
  );
}

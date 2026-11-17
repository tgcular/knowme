"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { compress } from "@/lib/images";
import Confirm from "./Confirm";
import Icon from "./Icon";

const fmt = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

// One-time cleanup: re-saves your older, heavier photos in the smaller format.
// A photo is only replaced if the new copy is at least 15% smaller.
export default function StorageOptimizer() {
  const [ask, setAsk] = useState(false);
  const [st, setSt] = useState({ phase: "idle" });

  async function run() {
    setAsk(false);
    setSt({ phase: "scan" });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: files } = await supabase.storage.from("photos").list(user.id, { limit: 1000 });
      const todo = (files || []).filter((f) => f.metadata && f.metadata.size > 120 * 1024);
      let saved = 0, changed = 0;
      for (let i = 0; i < todo.length; i++) {
        setSt({ phase: "run", i: i + 1, n: todo.length });
        const old = `${user.id}/${todo[i].name}`;
        try {
          const { data: blob, error } = await supabase.storage.from("photos").download(old);
          if (error || !blob) continue;
          const out = await compress(blob, { max: 1080, quality: 0.72 });
          if (out.blob.size > blob.size * 0.85) continue;
          const path = `${user.id}/${todo[i].name.replace(/\.[^.]+$/, "").replace(/-o\d+$/, "")}-o${Date.now()}.${out.ext}`;
          const up = await supabase.storage.from("photos").upload(path, out.blob, { contentType: out.type });
          if (up.error) continue;
          const a = await supabase.from("entries").update({ front_path: path }).eq("front_path", old).select("id");
          const b = await supabase.from("entries").update({ back_path: path }).eq("back_path", old).select("id");
          if ((a.data?.length || 0) + (b.data?.length || 0) === 0) { await supabase.storage.from("photos").remove([path]); continue; }
          await supabase.storage.from("photos").remove([old]);
          saved += blob.size - out.blob.size; changed++;
        } catch {}
      }
      setSt({ phase: "done", saved, changed });
    } catch { setSt({ phase: "error" }); }
  }

  const busy = st.phase === "scan" || st.phase === "run";
  return (
    <div className="glass space-y-2 rounded-3xl p-4">
      <p className="flex items-center gap-2 font-semibold"><Icon name="camera" size={18} className="text-blush" />Photo storage</p>
      <p className="text-sm text-white/60">New photos are already saved in a smaller format. This shrinks your older ones too. Keep this page open while it runs.</p>
      {st.phase === "run" && <p className="text-sm text-blush">Shrinking photo {st.i} of {st.n}…</p>}
      {st.phase === "scan" && <p className="text-sm text-blush">Checking your photos…</p>}
      {st.phase === "done" && <p className="text-sm text-blush">{st.changed ? `Done. Shrank ${st.changed} photo${st.changed > 1 ? "s" : ""} and freed ${fmt(st.saved)}.` : "Your photos are already small. Nothing to shrink."}</p>}
      {st.phase === "error" && <p className="text-sm text-blush">Something went wrong. Try again in a moment.</p>}
      <button className="btn-ghost w-full" disabled={busy} onClick={() => setAsk(true)}>Shrink my older photos</button>
      {ask && <Confirm title="Shrink older photos?" body="Photos are re-saved at a smaller size (up to 1080 pixels on the longest side). The originals are replaced, so this can't be undone." action="Shrink photos" onYes={run} onNo={() => setAsk(false)} />}
    </div>
  );
}

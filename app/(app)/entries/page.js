"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { signMany } from "@/lib/sign";
import { dayKey, fromKey } from "@/lib/dates";
import Icon from "@/components/Icon";
import Confirm from "@/components/Confirm";
import EntryCard from "@/components/EntryCard";
import EntryViewer from "@/components/EntryViewer";

const MODES = [["day", "Day"], ["week", "Week"], ["month", "Month"], ["year", "Year"]];
const FILTERS = [["all", "All"], ["private", "Private"], ["friends", "Restricted"], ["users", "KnowMe users"], ["link", "By link"], ["public", "Public"]];
// "Public" = visible beyond your friends (all KnowMe users + anyone with the link)
const matches = (f, v) => f === "all" || (f === "public" ? v === "users" || v === "link" : v === f);
const pad = (n) => String(n).padStart(2, "0");
const weekStart = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

function keyOf(mode, iso) {
  const d = new Date(iso);
  if (mode === "day") return dayKey(d);
  if (mode === "week") return dayKey(weekStart(d));
  if (mode === "month") return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  return String(d.getFullYear());
}
function labelOf(mode, k) {
  const now = new Date();
  if (mode === "day") {
    const y = new Date(); y.setDate(now.getDate() - 1);
    if (k === dayKey(now)) return "Today";
    if (k === dayKey(y)) return "Yesterday";
    return fromKey(k).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  if (mode === "week") {
    if (k === dayKey(weekStart(now))) return "This week";
    const s = fromKey(k), e = new Date(s); e.setDate(s.getDate() + 6);
    const f = (d) => d.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${f(s)} – ${f(e)}${s.getFullYear() !== now.getFullYear() ? `, ${s.getFullYear()}` : ""}`;
  }
  if (mode === "month") { const [yy, mm] = k.split("-").map(Number); return new Date(yy, mm - 1, 1).toLocaleDateString([], { month: "long", year: "numeric" }); }
  return k;
}

export default function Entries() {
  const [items, setItems] = useState(null);
  const [mode, setMode] = useState("day");
  const [filter, setFilter] = useState("all");
  const [newest, setNewest] = useState(true);
  const [view, setView] = useState(null);
  const [del, setDel] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const list = data || [];
      const u = await signMany("photos", list.flatMap((e) => [e.front_path, e.back_path]));
      setItems(list.map((e) => ({ ...e, front: u[e.front_path], back: u[e.back_path] })));
    })();
  }, []);

  async function doDelete(e) {
    await supabase.storage.from("photos").remove([e.front_path, e.back_path]);
    const { error } = await supabase.from("entries").delete().eq("id", e.id);
    if (!error) setItems((l) => l.filter((x) => x.id !== e.id));
  }

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([f]) => [f, (items || []).filter((e) => matches(f, e.visibility)).length])), [items]);
  const sections = useMemo(() => {
    const m = {};
    (items || []).filter((e) => matches(filter, e.visibility)).forEach((e) => (m[keyOf(mode, e.created_at)] ||= []).push(e));
    const keys = Object.keys(m).sort();
    if (newest) keys.reverse();
    return keys.map((k) => ({ k, list: m[k].sort((a, b) => (newest ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at))) }));
  }, [items, mode, filter, newest]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold"><Icon name="layers" size={28} className="text-blush" />My Entries
          {items && <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-semibold text-white/70">{items.length}</span>}</h1>
        <Link href="/diary/new" aria-label="New entry" className="btn grid h-11 w-11 place-items-center !rounded-full !p-0 shadow-lg shadow-iris/30"><Icon name="plus" size={22} /></Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative grid max-w-md flex-1 grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.06] p-1">
          <span className="absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/4)] rounded-xl bg-gradient-to-r from-iris to-blush shadow-lg shadow-iris/30 transition-transform duration-500 ease-[cubic-bezier(.65,0,.35,1)]"
            style={{ transform: `translateX(${MODES.findIndex(([m]) => m === mode) * 100}%)` }} />
          {MODES.map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} className={`relative z-10 rounded-xl py-2 text-sm font-semibold transition-colors ${mode === m ? "text-white" : "text-white/60"}`}>{l}</button>
          ))}
        </div>
        <button onClick={() => setNewest(!newest)} className="glass flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-95">
          <Icon name={newest ? "down" : "up"} size={16} />{newest ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
        {FILTERS.map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition active:scale-95 ${filter === f ? "bg-gradient-to-r from-iris to-blush font-semibold shadow-lg shadow-iris/30" : "bg-white/10 text-white/75 hover:bg-white/15"}`}>
            {l}<span className={`rounded-full px-2 text-xs ${filter === f ? "bg-white/25" : "bg-white/10"}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {items === null ? <p className="text-white/50">Loading…</p>
        : sections.length === 0 ? (
          <div className="glass space-y-3 rounded-3xl p-8 text-center">
            <Icon name="layers" size={32} className="mx-auto text-blush" />
            <p className="text-white/70">{items.length === 0 ? "No entries yet. Tap + to write your first one." : "No entries match this filter."}</p>
          </div>
        ) : sections.map(({ k, list }) => (
          <section key={`${mode}-${filter}-${newest}-${k}`} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />{labelOf(mode, k)}
              <span className="rounded-full bg-white/10 px-2 text-xs">{list.length}</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-5">
              {list.map((e, i) => <EntryCard key={e.id} e={e} index={i} showDate={mode !== "day"} onOpen={(rect) => setView({ entry: e, rect })} onDelete={setDel} />)}
            </div>
          </section>
        ))}

      {view && <EntryViewer entry={view.entry} rect={view.rect} isOwner onClose={() => setView(null)} />}
      {del && <Confirm title="Delete entry?" body="This permanently deletes the entry and both photos." action="Delete entry"
        onYes={async () => { const x = del; setDel(null); await doDelete(x); }} onNo={() => setDel(null)} />}
    </div>
  );
}

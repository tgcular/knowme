"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dayKey, fromKey } from "@/lib/dates";
import Icon from "@/components/Icon";
import SharedCard from "@/components/SharedCard";
import EntryViewer from "@/components/EntryViewer";
import CalendarModal from "@/components/CalendarModal";

function labelFor(k) {
  const t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
  if (k === dayKey(t)) return "Today";
  if (k === dayKey(y)) return "Yesterday";
  return fromKey(k).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function Shared() {
  const today = dayKey(new Date());
  const [items, setItems] = useState(null);
  const [day, setDay] = useState(null); // null = show all dates
  const [cal, setCal] = useState(null);
  const [view, setView] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("entries").select("*").neq("user_id", user.id).order("created_at", { ascending: false });
      const list = data || [];
      const uids = [...new Set(list.map((e) => e.user_id))];
      const { data: ps } = uids.length ? await supabase.from("profiles").select("id,display_name,username,avatar_path").in("id", uids) : { data: [] };
      const aPaths = (ps || []).map((p) => p.avatar_path).filter(Boolean);
      const { data: a } = aPaths.length ? await supabase.storage.from("avatars").createSignedUrls(aPaths, 3600) : { data: [] };
      const au = Object.fromEntries((a || []).map((x) => [x.path, x.signedUrl]));
      const by = Object.fromEntries((ps || []).map((p) => [p.id, { ...p, avatar: au[p.avatar_path] }]));
      const paths = list.flatMap((e) => [e.front_path, e.back_path]);
      const { data: s } = paths.length ? await supabase.storage.from("photos").createSignedUrls(paths, 3600) : { data: [] };
      const u = Object.fromEntries((s || []).map((x) => [x.path, x.signedUrl]));
      setItems(list.map((e) => ({ ...e, who: by[e.user_id], front: u[e.front_path], back: u[e.back_path] })));
    })();
  }, []);

  const sections = useMemo(() => {
    const m = {};
    (items || []).filter((e) => !day || dayKey(e.created_at) === day).forEach((e) => (m[dayKey(e.created_at)] ||= []).push(e));
    return Object.keys(m).sort().reverse().map((k) => ({ k, list: m[k].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }));
  }, [items, day]);

  const shownDay = day || today;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold"><Icon name="heart" size={28} className="text-blush" />Shared with you</h1>
        <button aria-label="Pick a date" onClick={(e) => setCal({ rect: e.currentTarget.getBoundingClientRect() })}
          className="glass grid h-11 w-11 place-items-center rounded-full transition active:scale-90"><Icon name="calendar" size={22} /></button>
      </div>
      {day && (
        <div className="flex items-center gap-2 text-sm">
          <span className="glass flex items-center gap-2 rounded-full py-1 pl-3 pr-1">
            {fromKey(day).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}
            <button aria-label="Show all dates" onClick={() => setDay(null)} className="grid h-6 w-6 place-items-center rounded-full bg-white/10"><Icon name="x" size={14} /></button>
          </span>
        </div>
      )}

      {items === null ? <p className="text-white/50">Loading…</p>
        : sections.length === 0 ? (
          <div className="glass rounded-3xl p-6 text-white/70">
            {day ? "Nothing was shared with you on this day." : "Nothing shared with you yet. When friends share an entry with you, it shows up here."}
          </div>
        ) : sections.map(({ k, list }) => (
          <section key={k} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70"><span className="h-2.5 w-2.5 rounded-full bg-white" />{labelFor(k)}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-5">
              {list.map((e) => <SharedCard key={e.id} e={e} onOpen={(rect) => setView({ entry: e, rect })} />)}
            </div>
          </section>
        ))}

      {cal && <CalendarModal rect={cal.rect} marked={new Set((items || []).map((e) => dayKey(e.created_at)))} day={shownDay} setDay={setDay}
        dayEntries={(items || []).filter((e) => dayKey(e.created_at) === shownDay)}
        onOpen={(entry, rect) => setView({ entry, rect })} onClose={() => setCal(null)} />}
      {view && <EntryViewer entry={view.entry} rect={view.rect} isOwner={false} onClose={() => setView(null)} />}
    </div>
  );
}

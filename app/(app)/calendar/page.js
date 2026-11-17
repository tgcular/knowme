"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { signMany } from "@/lib/sign";
import { dayKey, fromKey } from "@/lib/dates";
import Icon from "@/components/Icon";
import Confirm from "@/components/Confirm";
import CalendarBody from "@/components/CalendarBody";
import EntryCard from "@/components/EntryCard";
import EntryViewer from "@/components/EntryViewer";

export default function CalendarPage() {
  const today = dayKey(new Date());
  const [entries, setEntries] = useState(null);
  const [day, setDay] = useState(today);
  const [urls, setUrls] = useState({});
  const [view, setView] = useState(null);
  const [del, setDel] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("entries").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
      setEntries(data || []);
    })();
  }, []);

  const byDay = useMemo(() => {
    const m = {};
    (entries || []).forEach((e) => (m[dayKey(e.created_at)] ||= []).push(e));
    return m;
  }, [entries]);
  const list = byDay[day] || [];

  useEffect(() => {
    const need = list.flatMap((e) => [e.front_path, e.back_path]).filter((p) => !urls[p]);
    if (need.length) signMany("photos", need).then((u) => setUrls((prev) => ({ ...prev, ...u })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, entries]);

  const withUrls = (e) => ({ ...e, front: urls[e.front_path], back: urls[e.back_path] });
  async function doDelete(e) {
    await supabase.storage.from("photos").remove([e.front_path, e.back_path]);
    const { error } = await supabase.from("entries").delete().eq("id", e.id);
    if (!error) setEntries((l) => l.filter((x) => x.id !== e.id));
  }

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><Icon name="calendar" size={28} className="text-blush" />Calendar</h1>
      <div className="grid gap-6 lg:grid-cols-[26rem_minmax(0,1fr)]">
        <div className="glass self-start rounded-3xl bg-gradient-to-br from-[#3b1d78]/40 to-[#1a0e3f]/40">
          <CalendarBody big hideList marked={new Set(Object.keys(byDay))} day={day} setDay={setDay} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/80">
              {fromKey(day).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              <span className="ml-2 rounded-full bg-white/10 px-2 text-xs">{list.length}</span>
            </h2>
            <Link href="/diary/new" aria-label="New entry" className="btn grid h-11 w-11 place-items-center !rounded-full !p-0 shadow-lg shadow-iris/30"><Icon name="plus" size={22} /></Link>
          </div>
          {entries === null ? <p className="text-white/50">Loading…</p>
            : list.length === 0 ? <div className="glass rounded-3xl p-8 text-center text-white/70">No entries on this day.</div>
            : (
              <div key={day} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
                {list.map((e, i) => <EntryCard key={e.id} e={withUrls(e)} index={i} onOpen={(rect) => setView({ entry: withUrls(e), rect })} onDelete={setDel} />)}
              </div>
            )}
        </div>
      </div>
      {view && <EntryViewer entry={view.entry} rect={view.rect} isOwner onClose={() => setView(null)} />}
      {del && <Confirm title="Delete entry?" body="This permanently deletes the entry and both photos." action="Delete entry"
        onYes={async () => { const x = del; setDel(null); await doDelete(x); }} onNo={() => setDel(null)} />}
    </div>
  );
}

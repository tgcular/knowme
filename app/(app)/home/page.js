"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { dayKey, fromKey } from "@/lib/dates";
import Icon from "@/components/Icon";
import Confirm from "@/components/Confirm";
import TimelineItem from "@/components/TimelineItem";
import EntryViewer from "@/components/EntryViewer";
import CalendarModal from "@/components/CalendarModal";
import NotificationBell from "@/components/NotificationBell";
import Clock from "@/components/Clock";
import { NomiButton } from "@/components/Sidebar";

function streakOf(byDay) {
  const d = new Date();
  if (!byDay[dayKey(d)]) d.setDate(d.getDate() - 1); // today not written yet: streak is still alive
  let n = 0;
  while (byDay[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const Stat = ({ n, label }) => (
  <div className="rounded-[1.75rem] bg-[#2d1670]/70 px-1 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_8px_20px_rgba(10,4,40,.5)]">
    <p className="text-3xl font-extrabold leading-none">{n}</p>
    <p className="mt-1 text-[11px] leading-tight text-white/85">{label}</p>
  </div>
);

export default function Home() {
  const today = dayKey(new Date());
  const [name, setName] = useState("");
  const [entries, setEntries] = useState(null);
  const [day, setDay] = useState(today);
  const [urls, setUrls] = useState({});
  const [cal, setCal] = useState(null);
  const [view, setView] = useState(null);
  const [del, setDel] = useState(null);
  // Play the timeline entrance after a new entry, or when you haven't been on this tab for 5+ minutes.
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    try {
      const last = Number(localStorage.getItem("nomi_diary_last") || 0);
      const fresh = localStorage.getItem("nomi_new_entry") === "1";
      if (fresh || Date.now() - last > 5 * 60 * 1000) { setAnim(true); setTimeout(() => setAnim(false), 3200); }
      localStorage.removeItem("nomi_new_entry");
      localStorage.setItem("nomi_diary_last", String(Date.now()));
    } catch {}
  }, []);
  // Stats card straddles the picture's bottom edge: its center line sits on that edge.
  const cardRef = useRef(null);
  const [ch, setCh] = useState(176);
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCh(el.offsetHeight));
    ro.observe(el); setCh(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: p }, { data }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).single(),
        supabase.from("entries").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);
      setName((p?.display_name || "").split(" ")[0]);
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
    if (!need.length) return;
    supabase.storage.from("photos").createSignedUrls(need, 3600).then(({ data }) =>
      setUrls((u) => ({ ...u, ...Object.fromEntries((data || []).map((x) => [x.path, x.signedUrl])) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, entries]);

  const withUrls = (e) => ({ ...e, front: urls[e.front_path], back: urls[e.back_path] });
  async function doDelete(e) {
    await supabase.storage.from("photos").remove([e.front_path, e.back_path]);
    const { error } = await supabase.from("entries").delete().eq("id", e.id);
    if (!error) setEntries((l) => l.filter((x) => x.id !== e.id));
  }

  const d = fromKey(day);
  const secs = list.reduce((a, e) => a + (e.write_seconds || 0), 0);
  const writing = secs >= 3600 ? [(secs / 3600).toFixed(1).replace(/\.0$/, ""), "hours writing"] : [Math.round(secs / 60), "min writing"];

  return (
    <div>
      <header>
        <div className="relative flex flex-col overflow-hidden rounded-b-[3.25rem] bg-cover px-3 pt-3"
          style={{ height: "clamp(17rem, 42vw, 30rem)", backgroundImage: "url(/nomi-backdrop.jpg)", backgroundPosition: "50% 30%" }}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0c0722]/45" />
          <div className="relative flex items-center justify-between">
            <NomiButton />
            <div className="flex items-center gap-2">
              <NotificationBell variant="hero" />
              <button aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#2a1650] shadow-lg"><Icon name="settings" size={20} /></button>
            </div>
          </div>
          <div className="relative flex flex-1 flex-col items-center justify-center text-center [text-shadow:0_2px_12px_rgba(20,8,60,.6)]" style={{ paddingBottom: ch / 2 }}>
            <h1 className="text-4xl font-extrabold md:text-5xl">Hello{name ? `, ${name}` : ""}!</h1>
            <p className="mt-1 text-lg text-white/90 md:text-xl">How’s your day been going?</p>
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-xl px-5" style={{ marginTop: -ch / 2 }}>
          <div ref={cardRef} className="rounded-[2.5rem] bg-gradient-to-br from-[#3b1d78] to-[#1a0e3f] p-5 shadow-[0_20px_60px_rgba(20,8,60,.7)] ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-extrabold sm:text-2xl">{d.toLocaleDateString([], { month: "long", day: "numeric" })}</p>
                <p className="text-sm text-white/80">{d.toLocaleDateString([], { weekday: "long" })}, {d.getFullYear()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock />
                <button aria-label="Open calendar" onClick={(e) => setCal({ rect: e.currentTarget.getBoundingClientRect() })}
                  className="grid h-11 w-11 place-items-center rounded-2xl transition active:scale-90"><Icon name="calendar" size={30} /></button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat n={list.length} label={day === today ? "Entries today" : "Entries"} />
              <Stat n={writing[0]} label={writing[1]} />
              <Stat n={streakOf(byDay)} label="day streak" />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-2xl space-y-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Icon name="book" size={16} />{day === today ? "Today’s timeline" : "Timeline"}
            {day !== today && <button className="rounded-full bg-white/10 px-2 py-0.5 text-xs" onClick={() => setDay(today)}>Back to today</button>}
          </div>
          <Link href="/diary/new" aria-label="New entry" className="btn grid h-11 w-11 place-items-center !rounded-full !p-0 shadow-lg shadow-iris/30"><Icon name="plus" size={22} /></Link>
        </div>

        {entries === null ? <p className="text-white/50">Loading…</p>
          : list.length === 0 ? (
            <div className="glass space-y-3 rounded-3xl p-8 text-center">
              <Icon name="camera" size={32} className="mx-auto text-blush" />
              <p className="text-white/70">{day === today ? "No entry yet today." : "No entries on this day."}</p>
            </div>
          ) : (
            <ol className="space-y-6">
              {list.map((e, i) => (
                <TimelineItem key={e.id} e={withUrls(e)} last={i === list.length - 1} index={i} total={list.length} animate={anim}
                  onOpen={(rect) => setView({ entry: withUrls(e), rect })} onDelete={setDel} />
              ))}
            </ol>
          )}
      </section>

      {cal && <CalendarModal rect={cal.rect} marked={new Set(Object.keys(byDay))} day={day} setDay={setDay}
        dayEntries={list.map(withUrls)} onOpen={(entry, rect) => setView({ entry, rect })} onClose={() => setCal(null)} />}
      {view && <EntryViewer entry={view.entry} rect={view.rect} isOwner onClose={() => setView(null)} />}
      {del && <Confirm title="Delete entry?" body="This permanently deletes the entry and both photos." action="Delete entry"
        onYes={async () => { const x = del; setDel(null); await doDelete(x); }} onNo={() => setDel(null)} />}
    </div>
  );
}

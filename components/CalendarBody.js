"use client";
import { useState } from "react";
import Icon from "./Icon";
import EntryRow from "./EntryRow";
import { dayKey, fromKey } from "@/lib/dates";

export default function CalendarBody({ marked, day, setDay, dayEntries = [], onOpen, onClose, hideList = false, big = false }) {
  const sel = fromKey(day);
  const [cur, setCur] = useState(new Date(sel.getFullYear(), sel.getMonth(), 1));
  const y = cur.getFullYear(), m = cur.getMonth();
  const cells = [...Array(cur.getDay()).fill(null), ...Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => i + 1)];
  const today = dayKey(new Date());
  const shift = (n) => setCur(new Date(y, m + n, 1));
  const Nav = ({ label, icon, onClick }) => (
    <button aria-label={label} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-90"><Icon name={icon} size={18} /></button>
  );
  const cell = (d, i) => {
    if (d === null) return <span key={i} />;
    const k = dayKey(new Date(y, m, d)), on = k === day;
    return (
      <button key={i} onClick={() => setDay(k)}
        className={`relative mx-auto grid place-items-center rounded-full transition ${big ? "h-12 w-12 text-base" : "h-10 w-10 text-sm"} ${on ? "bg-gradient-to-br from-iris to-blush font-bold" : k === today ? "ring-1 ring-blush/70" : "hover:bg-white/10"}`}>
        {d}
        {marked.has(k) && <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-blush"}`} />}
      </button>
    );
  };
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Nav label="Previous month" icon="left" onClick={() => shift(-1)} />
        <h2 className="flex-1 text-center font-bold">{cur.toLocaleString([], { month: "long", year: "numeric" })}</h2>
        <Nav label="Next month" icon="right" onClick={() => shift(1)} />
        {onClose && <><span className="w-1" /><Nav label="Close calendar" icon="x" onClick={onClose} /></>}
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-white/40">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-y-1">{cells.map(cell)}</div>
      {!hideList && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-sm text-white/60">{sel.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
          {dayEntries.length === 0
            ? <p className="text-white/50">No entries on this day.</p>
            : dayEntries.map((e) => <EntryRow key={e.id} e={e} onOpen={(r) => onOpen(e, r)} />)}
        </div>
      )}
    </div>
  );
}

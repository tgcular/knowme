"use client";
import Icon from "./Icon";
export default function EntryRow({ e, onOpen }) {
  return (
    <button onClick={(ev) => onOpen(ev.currentTarget.getBoundingClientRect())}
      className="glass fade-up flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[.98]">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/30">
        {e.back && <img src={e.back} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{e.title || "Untitled"}</p>
        <p className="flex items-center gap-1 text-sm text-white/50">
          <Icon name="calendar" size={13} />{new Date(e.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
      <span className="text-2xl">{e.mood}</span>
    </button>
  );
}

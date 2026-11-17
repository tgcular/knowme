"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { toSegments } from "@/lib/richtext";

const PILL = {
  private: ["Private", "bg-[#f2a33a]"],
  friends: ["Restricted", "bg-[#d4609f]"],
  users: ["Public", "bg-[#6f6af0]"],
  link: ["Link", "bg-[#8b5cf6]"],
};
const snippet = (body = "") => {
  const t = toSegments(body).map((s) => s.text).join("").replace(/\s+/g, " ").trim();
  return t.length > 100 ? t.slice(0, 100).trimEnd() + "..." : t;
};

export default function TimelineItem({ e, last, index = 0, total = 1, animate = false, onOpen, onDelete }) {
  const router = useRouter();
  const [swap, setSwap] = useState(false);
  const [menu, setMenu] = useState(false);
  const [label, color] = PILL[e.visibility] || PILL.private;
  const main = swap ? e.front : e.back;
  const behind = swap ? e.back : e.front;
  const time = new Date(e.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const text = snippet(e.body);
  const flip = (ev) => { ev.stopPropagation(); setSwap(!swap); };

  return (
    <li className={`relative pl-9 ${animate ? "tl-in" : ""}`} style={animate ? { "--d": `${index * Math.min(0.5, total > 1 ? 1.4 / (total - 1) : 0)}s` } : undefined}>
      <span className="tl-dot absolute left-0 top-1.5 h-4 w-4 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,.7)]" />
      {!last && <span className="tl-line absolute -bottom-6 left-[7px] top-7 border-l-2 border-dotted border-white/40" />}
      <div className="tl-time flex items-baseline gap-3">
        <span className="text-xl font-extrabold">{time}</span>
        {e.location && (
          <span className="flex min-w-0 items-center gap-1 text-xs italic text-white/65">
            <Icon name="pin" size={12} /><span className="truncate">{e.location}</span>
          </span>
        )}
      </div>

      <div onClick={(ev) => onOpen(ev.currentTarget.getBoundingClientRect())}
        className="tl-card relative mt-3 cursor-pointer rounded-3xl border border-white/10 bg-[#241247] p-4 shadow-xl transition active:scale-[.99]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-2xl font-extrabold leading-tight">{e.title || "Untitled"}</h3>
          <div className="flex shrink-0 items-center gap-1">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${color}`}>{label}</span>
            <div className="relative">
              <button aria-label="Entry options" onClick={(ev) => { ev.stopPropagation(); setMenu(!menu); }}
                className="grid h-9 w-9 place-items-center rounded-full text-white/85"><Icon name="pencil" size={20} /></button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={(ev) => { ev.stopPropagation(); setMenu(false); }} />
                  <div className="absolute right-0 top-10 z-30 w-36 overflow-hidden rounded-2xl border border-white/15 bg-[#2d1670] shadow-2xl">
                    <button className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/10"
                      onClick={(ev) => { ev.stopPropagation(); router.push(`/diary/${e.id}`); }}><Icon name="pencil" size={16} />Edit</button>
                    <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-blush hover:bg-white/10"
                      onClick={(ev) => { ev.stopPropagation(); setMenu(false); onDelete(e); }}><Icon name="trash" size={16} />Delete</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {text && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/80">{text}</p>}

        {(main || behind) && (
          <div className="relative mt-5 h-48">
            {behind && (
              <button aria-label="Swap photos" onClick={flip}
                className="absolute bottom-0.5 right-1 z-0 h-[11.5rem] w-[42%] rotate-[4deg] overflow-hidden rounded-3xl border-[3px] border-white shadow-lg">
                <img key={behind} src={behind} alt="" className="photo-in h-full w-full object-cover" />
              </button>
            )}
            {main && (
              <button aria-label="Swap photos" onClick={flip}
                className="absolute bottom-0 left-0 z-10 h-[9.5rem] w-[74%] overflow-hidden rounded-2xl border-[3px] border-white shadow-xl">
                <img key={main} src={main} alt="" className="photo-in h-full w-full object-cover" />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { toSegments } from "@/lib/richtext";
import { PILL } from "@/lib/visibility";

const snippet = (body = "") => {
  const t = toSegments(body).map((s) => s.text).join("").replace(/\s+/g, " ").trim();
  return t.length > 110 ? t.slice(0, 110).trimEnd() + "..." : t;
};

// Your own entry as a card: edit or delete from the pencil menu, tap photos to swap, tap the card to zoom in.
export default function EntryCard({ e, index = 0, showDate = false, onOpen, onDelete }) {
  const router = useRouter();
  const [swap, setSwap] = useState(false);
  const [menu, setMenu] = useState(false);
  const [label, color] = PILL[e.visibility] || PILL.private;
  const main = swap ? e.front : e.back;
  const behind = swap ? e.back : e.front;
  const d = new Date(e.created_at);
  const text = snippet(e.body);
  const flip = (ev) => { ev.stopPropagation(); setSwap(!swap); };
  return (
    <div onClick={(ev) => onOpen(ev.currentTarget.getBoundingClientRect())} style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      className={`card-in relative cursor-pointer rounded-3xl border border-white/10 bg-[#241247] p-3 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-white/25 active:scale-[.99] md:p-4 ${menu ? "z-40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <p className="font-bold md:text-lg">{d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
          {showDate && <p className="text-xs text-white/55">{d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-2xl">{e.mood}</span>
          <div className="relative">
            <button aria-label="Entry options" onClick={(ev) => { ev.stopPropagation(); setMenu(!menu); }}
              className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/10"><Icon name="pencil" size={19} /></button>
            {menu && (
              <>
                <div className="fixed inset-0 z-20" onClick={(ev) => { ev.stopPropagation(); setMenu(false); }} />
                <div className="fade-up absolute right-0 top-10 z-30 w-36 overflow-hidden rounded-2xl border border-white/15 bg-[#2d1670] shadow-2xl">
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
      <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-tight md:text-xl xl:text-2xl">{e.title || "Untitled"}</h3>
      <div className="mt-2 flex items-center gap-2">
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}>{label}</span>
        {e.location && <span className="flex min-w-0 items-center gap-1 text-xs italic text-white/60"><Icon name="pin" size={11} /><span className="truncate">{e.location}</span></span>}
      </div>
      {text && <p className="mt-2 line-clamp-2 text-sm text-white/75 md:line-clamp-3">{text}</p>}
      {(main || behind) && (
        <div className="relative mt-4 h-40 md:h-56 xl:h-64">
          {behind && (
            <button aria-label="Swap photos" onClick={flip}
              className="absolute bottom-0.5 right-1 z-0 h-[9.5rem] w-[44%] rotate-[4deg] overflow-hidden rounded-3xl border-[3px] border-white shadow-lg md:h-[13.5rem] xl:h-[15.5rem]">
              <img key={behind} src={behind} alt="" loading="lazy" className="photo-in h-full w-full object-cover" />
            </button>
          )}
          {main && (
            <button aria-label="Swap photos" onClick={flip}
              className="absolute bottom-0 left-0 z-10 h-[7.5rem] w-[72%] overflow-hidden rounded-2xl border-[3px] border-white shadow-xl md:h-[10.5rem] xl:h-[12.5rem]">
              <img key={main} src={main} alt="" loading="lazy" className="photo-in h-full w-full object-cover" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

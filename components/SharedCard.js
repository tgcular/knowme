"use client";
import { useState } from "react";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { toSegments } from "@/lib/richtext";

const snippet = (body = "") => {
  const t = toSegments(body).map((s) => s.text).join("").replace(/\s+/g, " ").trim();
  return t.length > 110 ? t.slice(0, 110).trimEnd() + "..." : t;
};

export default function SharedCard({ e, onOpen }) {
  const [swap, setSwap] = useState(false);
  const main = swap ? e.front : e.back;
  const behind = swap ? e.back : e.front;
  const flip = (ev) => { ev.stopPropagation(); setSwap(!swap); };
  const text = snippet(e.body);
  const name = e.who?.display_name || (e.who?.username ? `@${e.who.username}` : "KnowMe user");
  return (
    <div onClick={(ev) => onOpen(ev.currentTarget.getBoundingClientRect())}
      className="fade-up relative cursor-pointer rounded-3xl border border-white/10 bg-[#241247] p-3 shadow-xl transition active:scale-[.99] md:p-4">
      <div className="flex items-center gap-2.5">
        <Avatar url={e.who?.avatar} name={name} size={40} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-bold md:text-lg">{name}</p>
          <p className="text-xs text-white/55">{new Date(e.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
        </div>
        <span className="text-2xl">{e.mood}</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-extrabold leading-tight md:text-xl xl:text-2xl">{e.title || "Untitled"}</h3>
      {e.location && <p className="mt-1 flex items-center gap-1 text-xs italic text-white/60"><Icon name="pin" size={12} /><span className="truncate">{e.location}</span></p>}
      {text && <p className="mt-2 line-clamp-2 text-sm text-white/75 md:line-clamp-3">{text}</p>}
      {(main || behind) && (
        <div className="relative mt-4 h-40 md:h-56 xl:h-64">
          {behind && (
            <button aria-label="Swap photos" onClick={flip}
              className="absolute bottom-0.5 right-1 z-0 h-[9.5rem] w-[44%] rotate-[4deg] overflow-hidden rounded-3xl border-[3px] border-white shadow-lg md:h-[13.5rem] xl:h-[15.5rem]">
              <img key={behind} src={behind} alt="" className="photo-in h-full w-full object-cover" />
            </button>
          )}
          {main && (
            <button aria-label="Swap photos" onClick={flip}
              className="absolute bottom-0 left-0 z-10 h-[7.5rem] w-[72%] overflow-hidden rounded-2xl border-[3px] border-white shadow-xl md:h-[10.5rem] xl:h-[12.5rem]">
              <img key={main} src={main} alt="" className="photo-in h-full w-full object-cover" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";

// Big photo + small inset photo. Tap the small one to swap them (tap again to swap back).
export default function PhotoPair({ front, back, aspect = "aspect-[4/3]", onOpen, children }) {
  const [swap, setSwap] = useState(false);
  const big = swap ? front : back;
  const small = swap ? back : front;
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-black/40 ${aspect} ${onOpen ? "cursor-pointer" : ""}`}
      onClick={(e) => onOpen?.(e.currentTarget.getBoundingClientRect())}>
      {big && <img key={big} src={big} alt="" className="photo-in absolute inset-0 h-full w-full object-cover" />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120a26]/85 via-[#4b2470]/20 to-[#120a26]/30" />
      <div className="absolute inset-x-0 bottom-0 p-4 pr-28">{children}</div>
      {small && (
        <button aria-label="Swap photos" onClick={(e) => { e.stopPropagation(); setSwap(!swap); }}
          className="absolute bottom-3 right-3 aspect-[3/4] w-20 overflow-hidden rounded-2xl border-2 border-white/70 shadow-lg transition active:scale-95">
          <img key={small} src={small} alt="" className="photo-in h-full w-full object-cover" />
        </button>
      )}
    </div>
  );
}

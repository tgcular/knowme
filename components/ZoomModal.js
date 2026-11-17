"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Zooms out of `rect` (the element you tapped) and shrinks back into it on close.
export default function ZoomModal({ rect, onClose, z = 40, children }) {
  const card = useRef(null);
  const fin = useRef(null);
  const [shown, setShown] = useState(false);

  const from = () => {
    const r = fin.current;
    if (!rect || !r) return "translateY(24px) scale(.9)";
    const dx = rect.left + rect.width / 2 - (r.left + r.width / 2);
    const dy = rect.top + rect.height / 2 - (r.top + r.height / 2);
    const s = Math.max(Math.min(rect.width / r.width, 1), 0.3);
    return `translate(${dx}px,${dy}px) scale(${s})`;
  };

  useLayoutEffect(() => {
    const el = card.current;
    fin.current = el.getBoundingClientRect();
    el.style.transition = "none";
    el.style.transform = from();
    el.style.opacity = "0";
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1), opacity .35s ease";
      el.style.transform = "none";
      el.style.opacity = "1";
      setShown(true);
    }));
    document.body.style.overflow = "hidden";
    return () => { cancelAnimationFrame(id); document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    const el = card.current;
    setShown(false);
    el.style.transition = "transform .4s cubic-bezier(.65,0,.35,1), opacity .3s ease";
    el.style.transform = from();
    el.style.opacity = "0";
    setTimeout(onClose, 380);
  };

  useEffect(() => {
    const k = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: z }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" style={{ opacity: shown ? 1 : 0 }} onClick={close} />
      <div ref={card} className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-b from-[#2a1650] to-[#120a26] shadow-2xl">
        {children(close)}
      </div>
    </div>
  );
}

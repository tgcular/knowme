"use client";
import { useEffect, useState } from "react";
export default function Clock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span aria-label="Current time" className="min-w-[5.5rem] whitespace-nowrap text-right text-sm font-semibold tabular-nums text-white/90">
      {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "\u00A0"}
    </span>
  );
}

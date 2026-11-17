"use client";
import Icon from "./Icon";
import NotificationBell from "./NotificationBell";
import { NomiButton } from "./Sidebar";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-20 px-5 pt-3">
      <div className="mx-auto flex max-w-[110rem] items-center justify-between rounded-3xl border border-white/10 bg-white/[0.08] px-3 py-2.5 shadow-[0_10px_30px_rgba(8,3,30,.55)] backdrop-blur-xl">
        <NomiButton />
        <div className="flex items-center gap-2">
          <NotificationBell variant="hero" />
          <button aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#2a1650] shadow-lg"><Icon name="settings" size={20} /></button>
        </div>
      </div>
    </header>
  );
}

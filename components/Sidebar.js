"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Icon from "./Icon";
import Avatar from "./Avatar";

// Three states: closed -> rail (icons only) -> full (icons + names). Tap Nomi to open or close.
const Ctx = createContext({ mode: "closed", setMode() {}, toggle() {} });
export const useSidebar = () => useContext(Ctx);

const ITEMS = [
  { id: "entries", label: "My Entries", href: "/entries", icon: "layers" },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: "calendar" },
  { id: "friends", label: "Friends", href: "/friends", icon: "users" },
];

export function SidebarProvider({ children }) {
  const [mode, setMode] = useState("closed");
  const toggle = () => setMode((m) => (m === "closed" ? "rail" : "closed"));
  return <Ctx.Provider value={{ mode, setMode, toggle }}>{children}<Sidebar /></Ctx.Provider>;
}

export function NomiButton() {
  const { mode, toggle } = useSidebar();
  return (
    <button aria-label="Open menu" aria-expanded={mode !== "closed"} onClick={toggle}
      className="rounded-full bg-white px-5 py-1.5 font-extrabold text-[#2a1650] shadow-lg transition hover:scale-105 active:scale-95">Nomi</button>
  );
}

const Tip = ({ show, children }) => (
  <span className={`pointer-events-none absolute left-full top-1/2 z-10 ml-3 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0f0828] px-3 py-1.5 text-sm font-medium opacity-0 shadow-lg ring-1 ring-white/10 transition duration-200 ${show ? "group-hover:translate-x-0 group-hover:opacity-100" : "hidden"}`}>{children}</span>
);

function Sidebar() {
  const { mode, setMode } = useSidebar();
  const path = usePathname();
  const open = mode !== "closed";
  const full = mode === "full";
  const [me, setMe] = useState({ name: "", avatar: null });
  const active = ITEMS.findIndex((t) => path === t.href || path.startsWith(t.href + "/"));

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("display_name,avatar_path").eq("id", user.id).maybeSingle();
      let url = null;
      if (p?.avatar_path) { const { data: s } = await supabase.storage.from("avatars").createSignedUrl(p.avatar_path, 3600); url = s?.signedUrl || null; }
      setMe({ name: p?.display_name || "", avatar: url });
    })();
  }, [open]);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && setMode((m) => (m === "full" ? "rail" : "closed"));
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setMode]);

  const go = () => { if (window.matchMedia("(max-width: 767px)").matches) setMode("closed"); };
  const label = `overflow-hidden whitespace-nowrap font-semibold transition-all duration-300 ${full ? "max-w-[10rem] opacity-100 delay-100" : "max-w-0 opacity-0"}`;
  const stagger = (i) => ({ className: `transition duration-500 ${open ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"}`, style: { transitionDelay: open ? `${150 + i * 70}ms` : "0ms" } });

  return (
    <>
      <div onClick={() => setMode("rail")}
        className={`fixed inset-0 z-[34] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${full ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside aria-label="Sidebar"
        className={`fixed bottom-3 left-3 top-3 z-[35] flex flex-col rounded-3xl border border-white/10 bg-[#1a0f3d]/95 p-3 shadow-2xl backdrop-blur-xl transition-[width,transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${full ? "w-64" : "w-[4.5rem]"} ${open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-[130%] opacity-0"}`}>
        <div className="flex items-center justify-between">
          <button aria-label="Close sidebar" onClick={() => setMode("closed")}
            className={`group relative grid h-12 place-items-center rounded-2xl bg-white font-extrabold text-[#2a1650] shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${full ? "w-24" : "w-12"}`}>
            {full ? "Nomi" : "N"}<Tip show={!full}>Close menu</Tip>
          </button>
          {full && (
            <button aria-label="Collapse sidebar" onClick={() => setMode("rail")}
              className="fade-up grid h-10 w-10 place-items-center rounded-2xl bg-white/10 transition hover:bg-white/20 active:scale-90"><Icon name="chevrons-left" size={18} /></button>
          )}
        </div>
        {!full && (
          <button aria-label="Expand sidebar" onClick={() => setMode("full")}
            className="group fade-up relative mt-2 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 transition hover:bg-white/20 active:scale-90">
            <Icon name="chevrons-right" size={20} /><Tip show>Expand</Tip>
          </button>
        )}

        <nav className="relative mt-6 flex flex-col gap-1">
          {active >= 0 && (
            <span className="absolute left-0 top-0 h-12 w-full rounded-2xl bg-gradient-to-r from-iris via-[#b06ab3] to-blush shadow-lg shadow-iris/30 transition-transform duration-500 ease-[cubic-bezier(.65,0,.35,1)]"
              style={{ transform: `translateY(${active * 3.25}rem)` }} />
          )}
          {ITEMS.map((t, i) => (
            <div key={t.id} {...stagger(i)} className={`relative z-10 ${stagger(i).className}`}>
              <Link href={t.href} onClick={go}
                className={`group relative flex h-12 w-full items-center gap-3 rounded-2xl px-[13px] transition-colors hover:bg-white/10 ${i === active ? "text-white" : "text-white/75"}`}>
                <span className="shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-125"><Icon name={t.icon} size={22} /></span>
                <span className={label}>{t.label}</span>
                <Tip show={!full}>{t.label}</Tip>
              </Link>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-3">
          <div {...stagger(ITEMS.length)}>
            <Link href="/profile" onClick={go}
              className={`group relative flex h-14 items-center gap-3 rounded-2xl px-2 transition hover:bg-white/10 ${path === "/profile" ? "bg-white/15 ring-1 ring-white/20" : ""}`}>
              <span className="shrink-0 transition-transform duration-300 group-hover:scale-110"><Avatar url={me.avatar} name={me.name} size={34} /></span>
              <span className={label}>
                <span className="block truncate text-sm">{me.name || "Profile"}</span>
                <span className="block text-xs font-normal text-white/50">View profile</span>
              </span>
              <Tip show={!full}>Profile</Tip>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

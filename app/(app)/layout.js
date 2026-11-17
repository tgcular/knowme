"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { modules } from "@/modules";
import Icon from "@/components/Icon";
import TopBar from "@/components/TopBar";
import { SidebarProvider } from "@/components/Sidebar";

// Older accounts may have no profile row, which shows up as "Someone". Create it if missing.
async function ensureProfile(user) {
  const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!data) await supabase.from("profiles").insert({ id: user.id, display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || (user.email || "").split("@")[0] });
}

export default function AppShell({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { ensureProfile(data.session.user); setReady(true); } else router.replace("/login");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) router.replace("/login"); });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ready) return null;
  const tabs = [...modules, { id: "profile", label: "Me", href: "/profile", icon: "user" }];
  const active = ["/diary", "/entries", "/calendar"].some((p) => path.startsWith(p)) ? 0 : tabs.findIndex((t) => path === t.href || path.startsWith(t.href + "/"));
  const bar = ["/shared", "/friends", "/profile", "/entries", "/calendar"].some((p) => path === p || path.startsWith(p + "/"));
  const mainClass = path === "/home" ? "" : ["/shared", "/entries", "/calendar"].includes(path) ? "mx-auto max-w-[110rem] p-5" : "mx-auto max-w-2xl p-5";
  return (
    <SidebarProvider>
    <div className="min-h-screen pb-28">
      {bar && <TopBar />}
      <main className={mainClass}>{children}</main>
      <nav className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-[#170d33]/85 p-1.5 shadow-2xl backdrop-blur-xl">
        <div className="relative flex">
          {active >= 0 && (
            <span className="absolute left-0 top-0 h-14 w-14 rounded-full bg-gradient-to-br from-iris via-[#b06ab3] to-blush shadow-lg shadow-iris/40"
              style={{ transform: `translateX(${active * 3.5}rem)`, transition: "transform .45s cubic-bezier(.65,0,.35,1)" }} />
          )}
          {tabs.map((t, i) => (
            <Link key={t.id} href={t.href} aria-label={t.label}
              className={`relative z-10 grid h-14 w-14 place-items-center transition-colors duration-300 ${i === active ? "text-white" : "text-white/55"}`}>
              <Icon name={t.icon} size={24} />
            </Link>
          ))}
        </div>
      </nav>
    </div>
    </SidebarProvider>
  );
}

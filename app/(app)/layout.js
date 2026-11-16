"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { modules } from "@/modules";

export default function AppShell({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => (data.session ? setReady(true) : router.replace("/login")));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) router.replace("/login"); });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ready) return null;
  const tabs = [...modules, { id: "profile", label: "Me", href: "/profile", icon: "👤" }];
  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-24">
      <main className="p-5">{children}</main>
      <nav className="glass fixed inset-x-0 bottom-0 mx-auto flex max-w-2xl justify-around rounded-t-3xl bg-ink/80 py-3">
        {tabs.map((t) => (
          <Link key={t.id} href={t.href} className={`flex flex-col items-center text-sm ${path === t.href ? "text-blush" : "text-white/60"}`}>
            <span className="text-xl">{t.icon}</span>{t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

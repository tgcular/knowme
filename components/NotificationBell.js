"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/dates";
import Icon from "./Icon";
import Avatar from "./Avatar";
import ZoomModal from "./ZoomModal";

// Notifications = friends' entries shared with you + incoming friend requests, newer than the last time you opened this.
async function context() {
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: me }, { data: fr }] = await Promise.all([
    supabase.from("profiles").select("notifs_seen_at").eq("id", user.id).maybeSingle(),
    supabase.from("friendships").select("requester,addressee,status,created_at"),
  ]);
  const seen = me?.notifs_seen_at || new Date(0).toISOString();
  const friendIds = (fr || []).filter((r) => r.status === "accepted").map((r) => (r.requester === user.id ? r.addressee : r.requester));
  const incoming = (fr || []).filter((r) => r.status === "pending" && r.addressee === user.id);
  return { user, seen, friendIds, incoming };
}
const newer = (a, b) => new Date(a) > new Date(b);

export default function NotificationBell({ variant = "hero" }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [panel, setPanel] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const c = await context();
      const { count } = c.friendIds.length
        ? await supabase.from("entries").select("id", { count: "exact", head: true }).in("user_id", c.friendIds).gt("shared_at", c.seen)
        : { count: 0 };
      setUnread((count || 0) + c.incoming.filter((r) => newer(r.created_at, c.seen)).length);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    const v = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", v);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", v); };
  }, [refresh]);

  async function open(ev) {
    setPanel({ rect: ev.currentTarget.getBoundingClientRect(), items: null });
    try {
      const c = await context();
      const ids = [...new Set([...c.friendIds, ...c.incoming.map((r) => r.requester)])];
      const [{ data: ents }, { data: ps }] = await Promise.all([
        c.friendIds.length
          ? supabase.from("entries").select("id,user_id,title,shared_at,back_path").in("user_id", c.friendIds).not("shared_at", "is", null).order("shared_at", { ascending: false }).limit(30)
          : { data: [] },
        ids.length ? supabase.from("profiles").select("id,display_name,username,avatar_path").in("id", ids) : { data: [] },
      ]);
      const aPaths = (ps || []).map((p) => p.avatar_path).filter(Boolean);
      const tPaths = (ents || []).map((e) => e.back_path);
      const [{ data: a }, { data: t }] = await Promise.all([
        aPaths.length ? supabase.storage.from("avatars").createSignedUrls(aPaths, 3600) : { data: [] },
        tPaths.length ? supabase.storage.from("photos").createSignedUrls(tPaths, 3600) : { data: [] },
      ]);
      const au = Object.fromEntries((a || []).map((x) => [x.path, x.signedUrl]));
      const tu = Object.fromEntries((t || []).map((x) => [x.path, x.signedUrl]));
      const by = Object.fromEntries((ps || []).map((p) => [p.id, { ...p, avatar: au[p.avatar_path] }]));
      const items = [
        ...(ents || []).map((e) => ({ kind: "entry", id: e.id, at: e.shared_at, who: by[e.user_id], title: e.title, thumb: tu[e.back_path] })),
        ...c.incoming.map((r) => ({ kind: "request", id: `r-${r.requester}`, at: r.created_at, who: by[r.requester] })),
      ].map((n) => ({ ...n, isNew: newer(n.at, c.seen) })).sort((x, y) => new Date(y.at) - new Date(x.at));
      setPanel((p) => p && { ...p, items });
      await supabase.from("profiles").update({ notifs_seen_at: new Date().toISOString() }).eq("id", c.user.id);
      setUnread(0);
    } catch { setPanel((p) => p && { ...p, items: [] }); }
  }

  const who = (n) => n.who?.display_name || (n.who?.username ? `@${n.who.username}` : "KnowMe user");
  return (
    <>
      <button aria-label="Notifications" onClick={open}
        className={`relative grid h-10 w-10 place-items-center rounded-full text-[#2a1650] shadow-lg ${variant === "bar" ? "bg-[#efe9fb]" : "bg-white"}`}>
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {panel && typeof document !== "undefined" && createPortal(
        <ZoomModal rect={panel.rect} onClose={() => setPanel(null)} z={60}>
          {(close) => (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Notifications</h2>
                <button aria-label="Close" onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><Icon name="x" size={18} /></button>
              </div>
              {panel.items === null ? <p className="py-8 text-center text-white/50">Loading…</p>
                : panel.items.length === 0 ? <p className="py-8 text-center text-white/60">No notifications yet. When friends share an entry with you or send a request, it shows up here.</p>
                : (
                  <ul className="space-y-1">
                    {panel.items.map((n) => (
                      <li key={n.id}>
                        <button onClick={() => { close(); setTimeout(() => router.push(n.kind === "entry" ? "/shared" : "/friends"), 400); }}
                          className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/10 ${n.isNew ? "bg-iris/20" : ""}`}>
                          <Avatar url={n.who?.avatar} name={who(n)} size={44} />
                          <div className="min-w-0 flex-1 text-sm leading-snug">
                            <p><b>{who(n)}</b>{" "}
                              {n.kind === "entry"
                                ? <>shared an entry with you{n.title ? <>: <span className="text-white/70">“{n.title}”</span></> : "."}</>
                                : "sent you a friend request."}</p>
                            <p className="text-xs text-white/50">{timeAgo(n.at)}</p>
                          </div>
                          {n.thumb && <img src={n.thumb} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
                          {n.isNew && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blush" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}
        </ZoomModal>, document.body)}
    </>
  );
}

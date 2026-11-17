"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

export const DEFAULT_MUSIC = "https://www.youtube.com/watch?v=rFZHOHl-L8A";

function toEmbed(link) {
  try {
    const u = new URL(link);
    if (u.hostname.includes("youtu")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (u.hostname.includes("spotify")) return `https://open.spotify.com/embed${u.pathname}`;
  } catch {}
  return null;
}

export default function MusicPlayer({ autoPlay }) {
  const [on, setOn] = useState(!!autoPlay);
  const [link, setLink] = useState(DEFAULT_MUSIC);
  const [edit, setEdit] = useState(false);
  useEffect(() => { try { const v = localStorage.getItem("knowme_music"); if (v) setLink(v); } catch {} }, []);
  const change = (v) => { setLink(v); try { localStorage.setItem("knowme_music", v); } catch {} };
  const embed = toEmbed(link);
  const src = embed || toEmbed(DEFAULT_MUSIC);
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="flex items-center gap-3 p-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-iris to-blush"><Icon name="music" size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">Background music</p>
          <p className="truncate text-xs text-white/50">{link === DEFAULT_MUSIC ? "Default track" : "Your link"}</p>
        </div>
        <button aria-label="Change music" onClick={() => setEdit(!edit)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><Icon name="pencil" size={16} /></button>
        <button role="switch" aria-checked={on} aria-label="Music on or off" onClick={() => setOn(!on)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-iris" : "bg-white/20"}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
      {edit && (
        <div className="space-y-2 px-3 pb-3">
          <input className="input text-sm" placeholder="YouTube or Spotify link" value={link} onChange={(e) => change(e.target.value)} />
          <div className="flex items-center justify-between text-xs">
            <span className="text-blush">{link && !embed ? "Only YouTube and Spotify links work. Playing the default." : ""}</span>
            <button className="text-white/70 underline" onClick={() => change(DEFAULT_MUSIC)}>Use default</button>
          </div>
        </div>
      )}
      {on && <iframe key={src} src={src} title="Music" allow="autoplay; encrypted-media" className="h-36 w-full" />}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
const LOFI = "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1";

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

export default function MusicPlayer() {
  const [on, setOn] = useState(false);
  const [link, setLink] = useState("");
  const [bad, setBad] = useState(false);
  useEffect(() => { try { setLink(localStorage.getItem("knowme_music") || ""); } catch {} }, []);
  function change(v) {
    setLink(v); setBad(!!v && !toEmbed(v));
    try { localStorage.setItem("knowme_music", v); } catch {}
  }
  const src = (link && toEmbed(link)) || LOFI;
  return (
    <div className="glass space-y-3 rounded-3xl p-4">
      <label className="flex items-center justify-between">
        <span className="font-semibold">🎧 Music {link && !bad ? "(your link)" : "(lofi)"}</span>
        <input type="checkbox" className="h-6 w-11 accent-iris" checked={on} onChange={(e) => setOn(e.target.checked)} />
      </label>
      <input className="input text-sm" placeholder="Paste a YouTube or Spotify link (optional)" value={link} onChange={(e) => change(e.target.value)} />
      {bad && <p className="text-xs text-blush">Only YouTube and Spotify links work. Playing lofi instead.</p>}
      {on && <iframe src={src} title="Music" allow="autoplay; encrypted-media" className="h-40 w-full rounded-2xl" />}
    </div>
  );
}

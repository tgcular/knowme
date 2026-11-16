"use client";
import { useState } from "react";
// Confirmation dialog. Pass `word` to require typing it (e.g. "DELETE").
export default function Confirm({ title, body, word, action, onYes, onNo }) {
  const [typed, setTyped] = useState("");
  const ok = !word || typed === word;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="glass w-full max-w-sm space-y-4 rounded-3xl bg-ink/90 p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-white/70">{body}</p>
        {word && <input className="input" placeholder={`Type ${word}`} value={typed} onChange={(e) => setTyped(e.target.value)} />}
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onNo}>Cancel</button>
          <button className="btn flex-1" disabled={!ok} onClick={onYes}>{action}</button>
        </div>
      </div>
    </div>
  );
}

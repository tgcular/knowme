"use client";
import { useEffect, useRef, useState } from "react";
// One camera at a time: the back slot only opens after the front is taken.
export default function PhotoSlot({ facing, label, active, photo, onCapture }) {
  const video = useRef(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (active && !photo) setOpen(true); }, [active, photo]);
  useEffect(() => {
    if (!open || !active) return;
    let stream;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false })
      .then((m) => { stream = m; if (video.current) video.current.srcObject = m; })
      .catch(() => setErr("Camera unavailable. Allow camera access in your browser settings."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [open, active, facing]);

  function snap() {
    const v = video.current, c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob((b) => { onCapture(b); setOpen(false); }, "image/jpeg", 0.8);
  }

  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="aspect-[3/4] bg-black/40">
        {open && active ? <video ref={video} autoPlay playsInline muted className="h-full w-full object-cover" />
          : photo ? <img src={photo.url} alt={label} className="h-full w-full object-cover" />
          : <p className="grid h-full place-items-center p-3 text-center text-sm text-white/50">Take the front photo first</p>}
      </div>
      <div className="p-3">
        {err && <p className="mb-2 text-xs text-blush">{err}</p>}
        {open && active ? <button className="btn w-full" onClick={snap}>Capture {label}</button>
          : photo ? <button className="btn-ghost w-full" onClick={() => { setErr(""); setOpen(true); }}>Retake {label}</button>
          : <p className="text-center text-sm text-white/50">{label}</p>}
      </div>
    </div>
  );
}

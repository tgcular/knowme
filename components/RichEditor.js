"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { domToText, textToHtml, toSegments } from "@/lib/richtext";

const BTNS = [["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"]];
const isBlank = (t) => !toSegments(t).some((s) => s.text.trim());

export default function RichEditor({ initial, loaded, onChange }) {
  const ref = useRef(null);
  const done = useRef(false);
  const [on, setOn] = useState({});
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    if (loaded && !done.current && ref.current) {
      ref.current.innerHTML = textToHtml(initial);
      setEmpty(isBlank(initial));
      done.current = true;
    }
  }, [loaded, initial]);

  useEffect(() => {
    const h = () => {
      if (document.activeElement !== ref.current) return;
      setOn(Object.fromEntries(BTNS.map(([c]) => [c, document.queryCommandState(c)])));
    };
    document.addEventListener("selectionchange", h);
    return () => document.removeEventListener("selectionchange", h);
  }, []);

  const sync = () => { const t = domToText(ref.current); onChange(t); setEmpty(isBlank(t)); };
  const cmd = (c) => { ref.current.focus(); document.execCommand(c); sync(); };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {BTNS.map(([c, label]) => (
          <button key={c} type="button" aria-label={label} aria-pressed={!!on[c]}
            onMouseDown={(e) => e.preventDefault()} onClick={() => cmd(c)}
            className={`grid h-10 w-10 place-items-center rounded-xl transition ${on[c] ? "bg-iris text-white" : "bg-white/10 text-white/70"}`}>
            <Icon name={c} size={18} />
          </button>
        ))}
      </div>
      <div className="relative">
        {empty && <p className="pointer-events-none absolute left-0 top-0 text-white/35">How was your day?</p>}
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={sync}
          onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }}
          className="min-h-44 whitespace-pre-wrap break-words outline-none" />
      </div>
    </div>
  );
}

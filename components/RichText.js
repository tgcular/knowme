import { toSegments } from "@/lib/richtext";
export default function RichText({ text, className = "" }) {
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {toSegments(text).map((s, k) => (
        <span key={k} className={`${s.b ? "font-bold" : ""} ${s.i ? "italic" : ""} ${s.u ? "underline underline-offset-2" : ""}`}>{s.text}</span>
      ))}
    </p>
  );
}

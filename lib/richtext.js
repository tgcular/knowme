// Entries store simple tags: <b> <i> <u>. Everything else is escaped text, so nothing can inject HTML.
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const TAG = /(<\/?[biu]>)/;

export function toSegments(text = "") {
  const out = [];
  let f = { b: 0, i: 0, u: 0 };
  text.split(TAG).forEach((part) => {
    const m = part.match(/^<(\/?)([biu])>$/);
    if (m) f = { ...f, [m[2]]: m[1] ? 0 : 1 };
    else if (part) out.push({ text: unesc(part), ...f });
  });
  return out;
}
export const textToHtml = (text = "") =>
  text.split(TAG).map((p) => (/^<\/?[biu]>$/.test(p) ? p : esc(unesc(p)).replace(/\n/g, "<br>"))).join("");

export function domToText(root) {
  let out = "";
  const walk = (n) => n.childNodes.forEach((c) => {
    if (c.nodeType === 3) { out += esc(c.nodeValue); return; }
    const t = c.nodeName;
    if (t === "BR") { out += "\n"; return; }
    const tag = t === "B" || t === "STRONG" ? "b" : t === "I" || t === "EM" ? "i" : t === "U" ? "u" : null;
    if ((t === "DIV" || t === "P") && out && !out.endsWith("\n")) out += "\n";
    if (tag) out += `<${tag}>`;
    walk(c);
    if (tag) out += `</${tag}>`;
  });
  walk(root);
  return out;
}

export default function Avatar({ url, name = "", size = 40, className = "" }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return url
    ? <img src={url} alt="" style={{ width: size, height: size }} className={`shrink-0 rounded-full border-2 border-white/70 object-cover ${className}`} />
    : <span style={{ width: size, height: size, fontSize: size * 0.42 }} className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-iris to-blush font-bold ${className}`}>{initial}</span>;
}

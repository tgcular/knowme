"use client";
const OPTIONS = [
  ["private", "🔒 Private", "Only you"],
  ["friends", "👥 Selected friends", "Pick who can see it"],
  ["users", "🌐 All KnowMe users", "Anyone with an account"],
  ["link", "🔗 Anyone with the link", "No login needed"],
];
export default function VisibilityPicker({ visibility, setVisibility, shareIds, setShareIds, friends, token }) {
  const toggle = (id) => setShareIds(shareIds.includes(id) ? shareIds.filter((x) => x !== id) : [...shareIds, id]);
  const url = token && typeof location !== "undefined" ? `${location.origin}/s/${token}` : "";
  return (
    <div className="glass space-y-3 rounded-3xl p-4">
      <p className="font-semibold">Who can see this entry?</p>
      {OPTIONS.map(([v, label, hint]) => (
        <label key={v} className="flex cursor-pointer items-center gap-3">
          <input type="radio" name="vis" className="accent-iris" checked={visibility === v} onChange={() => setVisibility(v)} />
          <span>{label} <span className="text-sm text-white/50">{hint}</span></span>
        </label>
      ))}
      {visibility === "friends" && (friends.length === 0
        ? <p className="text-sm text-white/60">You have no friends yet. Add some on the Friends tab.</p>
        : <div className="space-y-2 border-t border-white/10 pt-3">
            {friends.map((f) => (
              <label key={f.id} className="flex items-center gap-3">
                <input type="checkbox" className="accent-iris" checked={shareIds.includes(f.id)} onChange={() => toggle(f.id)} />
                {f.display_name} <span className="text-sm text-white/50">@{f.username}</span>
              </label>
            ))}
          </div>)}
      {visibility === "link" && (
        <div className="space-y-2 border-t border-white/10 pt-3 text-sm">
          {url ? <><p className="break-all text-white/70">{url}</p>
            <button type="button" className="btn-ghost" onClick={() => navigator.clipboard.writeText(url)}>Copy link</button></>
            : <p className="text-white/60">Your link appears after you save. Switch to another option anytime to turn the link off.</p>}
        </div>
      )}
    </div>
  );
}

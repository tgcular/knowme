"use client";
import Icon from "./Icon";
const OPTIONS = [["private", "lock", "Private"], ["friends", "users", "Friends"], ["users", "globe", "Everyone"], ["link", "link", "Link"]];
const HINT = {
  private: "Only you can see this entry.",
  friends: "Only the friends you pick below.",
  users: "Everyone with a KnowMe account.",
  link: "Anyone who has the link, no login needed.",
};
export default function VisibilityPicker({ visibility, setVisibility, shareIds, setShareIds, friends, token }) {
  const toggle = (id) => setShareIds(shareIds.includes(id) ? shareIds.filter((x) => x !== id) : [...shareIds, id]);
  const url = token && typeof location !== "undefined" ? `${location.origin}/s/${token}` : "";
  return (
    <div className="glass space-y-3 rounded-3xl p-4">
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map(([v, icon, label]) => (
          <button key={v} type="button" onClick={() => setVisibility(v)}
            className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-xs transition ${visibility === v ? "bg-gradient-to-br from-iris to-blush font-semibold" : "bg-white/10 text-white/70"}`}>
            <Icon name={icon} size={20} />{label}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-white/60">{HINT[visibility]}</p>
      {visibility === "friends" && (friends.length === 0
        ? <p className="text-center text-sm text-white/60">You have no friends yet. Add some on the Friends tab.</p>
        : <div className="flex flex-wrap gap-2">
            {friends.map((f) => (
              <button key={f.id} type="button" onClick={() => toggle(f.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${shareIds.includes(f.id) ? "bg-iris" : "bg-white/10 text-white/70"}`}>
                {shareIds.includes(f.id) && <Icon name="check" size={14} />}{f.display_name}
              </button>
            ))}
          </div>)}
      {visibility === "link" && (
        <div className="space-y-2 text-center text-sm">
          {url ? <><p className="break-all text-white/70">{url}</p>
            <button type="button" className="btn-ghost inline-flex items-center gap-2 !py-2" onClick={() => navigator.clipboard.writeText(url)}><Icon name="link" size={16} />Copy link</button></>
            : <p className="text-white/60">Your link appears after you save. Pick another option anytime to turn it off.</p>}
        </div>
      )}
    </div>
  );
}

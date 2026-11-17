"use client";
import { useRouter } from "next/navigation";
import ZoomModal from "./ZoomModal";
import PhotoPair from "./PhotoPair";
import RichText from "./RichText";
import Icon from "./Icon";
import Avatar from "./Avatar";

const VIS = { private: ["lock", "Private"], friends: ["users", "Selected friends"], users: ["globe", "All KnowMe users"], link: ["link", "Anyone with the link"] };

export default function EntryViewer({ entry: e, rect, isOwner, onClose }) {
  const router = useRouter();
  const [icon, label] = VIS[e.visibility] || VIS.private;
  return (
    <ZoomModal rect={rect} onClose={onClose} z={50}>
      {(close) => (
        <div>
          <div className="relative">
            <PhotoPair front={e.front} back={e.back} aspect="aspect-[3/4]" />
            <button aria-label="Close" onClick={close} className="absolute left-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur">
              <Icon name="x" />
            </button>
            {isOwner && (
              <button aria-label="Edit entry" onClick={() => router.push(`/diary/${e.id}`)}
                className="btn absolute right-3 top-3 grid h-11 w-11 place-items-center !rounded-full !p-0 shadow-lg">
                <Icon name="pencil" size={20} />
              </button>
            )}
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold">{e.title || "Untitled"}</h2>
              <span className="text-3xl">{e.mood}</span>
            </div>
            <p className="text-sm text-white/60">{new Date(e.created_at).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</p>
            {e.location && <p className="flex items-center gap-1 text-sm italic text-white/60"><Icon name="pin" size={14} />{e.location}</p>}
            {!isOwner && (
              <div className="flex items-center gap-2 text-sm text-blush">
                <Avatar url={e.who?.avatar} name={e.who?.display_name || "?"} size={28} />by {e.who?.display_name || "KnowMe user"} {e.who?.username && `@${e.who.username}`}
              </div>
            )}
            {isOwner && (
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm text-white/70">
                <Icon name={icon} size={15} />{label}
              </span>
            )}
            {e.body && <RichText text={e.body} className="text-white/85" />}
          </div>
        </div>
      )}
    </ZoomModal>
  );
}

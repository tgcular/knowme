import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const metadata = { title: "KnowMe entry", robots: { index: false } };

export default async function SharedLink({ params }) {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const valid = /^[0-9a-f-]{36}$/i.test(params.token);
  const { data: e } = valid ? await admin.from("entries").select("*").eq("share_token", params.token).eq("visibility", "link").maybeSingle() : { data: null };
  if (!e) return <main className="p-6 text-white/70">This link isn't available. The owner may have turned it off.</main>;
  const { data: s } = await admin.storage.from("photos").createSignedUrls([e.front_path, e.back_path], 3600);
  const { data: p } = await admin.from("profiles").select("display_name").eq("id", e.user_id).single();
  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <p className="text-white/60">{p?.display_name} shared this on KnowMe</p>
      <div className="glass space-y-3 rounded-3xl p-4">
        <div className="flex justify-between text-sm text-white/60">
          <span>{new Date(e.created_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</span><span className="text-xl">{e.mood}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {s.map((x, i) => <img key={i} src={x.signedUrl} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />)}
        </div>
        {e.body && <p className="whitespace-pre-wrap text-white/80">{e.body}</p>}
      </div>
    </main>
  );
}

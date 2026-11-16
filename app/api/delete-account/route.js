import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { data, error } = await createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const uid = data.user.id;
  const { data: files } = await admin.storage.from("photos").list(uid, { limit: 1000 });
  if (files?.length) await admin.storage.from("photos").remove(files.map((f) => `${uid}/${f.name}`));
  const { error: delErr } = await admin.auth.admin.deleteUser(uid); // entries cascade
  if (delErr) return Response.json({ error: delErr.message }, { status: 500 });
  return Response.json({ ok: true });
}

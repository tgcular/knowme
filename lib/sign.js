import { supabase } from "@/lib/supabase";
// Signs many storage paths in chunks. Returns { path: signedUrl }.
export async function signMany(bucket, paths, ttl = 3600) {
  const out = {};
  for (let i = 0; i < paths.length; i += 100) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(paths.slice(i, i + 100), ttl);
    (data || []).forEach((x) => { if (x.signedUrl) out[x.path] = x.signedUrl; });
  }
  return out;
}

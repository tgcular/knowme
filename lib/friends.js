import { supabase } from "@/lib/supabase";
export async function loadFriends() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: rows } = await supabase.from("friendships").select("*").eq("status", "accepted");
  const ids = (rows || []).map((r) => (r.requester === user.id ? r.addressee : r.requester));
  if (!ids.length) return [];
  const { data } = await supabase.from("profiles").select("id,display_name,username").in("id", ids);
  return data || [];
}

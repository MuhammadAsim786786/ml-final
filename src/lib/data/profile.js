import "server-only";
import { createClient } from "@/lib/supabase/server";

// Real implementation: read the current authenticated user via the
// server-side Supabase client and return the profile row from `profiles`.
export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    createdAt: profile?.created_at ?? null,
  };
}

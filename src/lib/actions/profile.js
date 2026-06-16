"use server";

import { createClient } from "@/lib/supabase/server";

// Update the current user's profile (server-side).
export async function updateProfile(formData) {
  const getField = (fd, key) => {
    if (!fd) return "";
    if (typeof fd.get === "function") return fd.get(key) ?? "";
    return fd[key] ?? "";
  };

  const fullName = String(getField(formData, "fullName") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);
  if (error) return { error: error.message };

  return { success: true };
}

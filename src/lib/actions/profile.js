"use server";

// Mock mode: profile updates are a no-op.
export async function updateProfile() {
  return { success: true };
}

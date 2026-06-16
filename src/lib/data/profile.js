import "server-only";

// Mock mode — returns a hardcoded demo profile.
export async function getCurrentUserProfile() {
  return {
    id: "mock-user-id",
    email: "demo@dermascan.app",
    fullName: "Demo User",
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}

import { updateSession } from "@/lib/supabase/proxy";

// Proxy middleware — delegate to the Supabase session updater which refreshes
// the auth cookie and enforces route gating.
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

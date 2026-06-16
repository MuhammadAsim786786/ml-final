import { NextResponse } from "next/server";

// Mock mode: pass all requests through without auth checks.
// Switch back to the Supabase-backed version in lib/supabase/proxy.js
// once a Supabase project is configured.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

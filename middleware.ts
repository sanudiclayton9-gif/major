import { NextRequest, NextResponse } from "next/server";

/**
 * The admin session cookie holds an opaque SHA-256 token derived from the
 * admin password, never the password itself. This derivation must stay
 * byte-for-byte identical to the one in `app/api/admin/login/route.ts`.
 */
async function getAdminToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;

  const data = new TextEncoder().encode(`wear-chimsol:admin:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Length-safe, constant-time-ish comparison so a wrong cookie is not compared
 * with `===` against a secret. Returns false for empty or mismatched lengths.
 */
function tokensMatch(given: string, expected: string): boolean {
  if (!given || !expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i += 1) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never gate the login page or the login/logout API routes themselves.
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("admin_auth")?.value ?? "";
  const expected = await getAdminToken();
  const authed = Boolean(cookie && expected && tokensMatch(cookie, expected));

  if (pathname.startsWith("/api/admin")) {
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!authed) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

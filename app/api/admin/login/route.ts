import { NextRequest, NextResponse } from "next/server";

/**
 * The admin session cookie holds an opaque SHA-256 token derived from the
 * admin password, never the password itself. This derivation must stay
 * byte-for-byte identical to `getAdminToken()` in `middleware.ts`.
 */
async function getAdminToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`wear-chimsol:admin:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_auth", await getAdminToken(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

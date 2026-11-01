import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "shubh_session";

function secret() {
  return process.env.SESSION_SECRET || "dev-only-shubh-session-secret-not-for-production";
}

function b64url(bytes: ArrayBuffer) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function readRole(token: string | undefined) {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  if (b64url(mac) !== sig) return null;
  try {
    const json = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: string;
      exp?: number;
    };
    if (!json.exp || json.exp < Date.now()) return null;
    return json.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await readRole(request.cookies.get(COOKIE)?.value);
  const needsAuth =
    pathname.startsWith("/dashboard") || pathname.startsWith("/planner") || pathname.startsWith("/admin");
  if (needsAuth && !role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/planner") && role && role !== "planner" && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname.startsWith("/admin") && role && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/planner/:path*", "/admin/:path*"],
};

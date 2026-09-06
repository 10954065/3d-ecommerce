import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { randomUUID } from "crypto";
import { resolveTenantByHost } from "@/lib/tenant/resolve";
import { TENANT_HEADER } from "@/lib/tenant/context";

const GUEST_CART_COOKIE = "onion3d_guest_cart";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account");

  if (!req.auth && (isAdminRoute || isAccountRoute)) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminRoute && req.auth?.user.role !== "ADMIN" && req.auth?.user.role !== "STAFF") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Tenant resolution happens here (not per-query) so every downstream
  // Server Component/Action/Route Handler can trust `getTenantId()` without
  // re-resolving the host itself. Never trust a client-supplied tenant
  // header — `Headers.set` below overwrites any inbound value at this key.
  const host = req.headers.get("host") ?? "";
  const tenant = await resolveTenantByHost(host);
  if (!tenant) {
    return new NextResponse("Unknown storefront host.", { status: 404 });
  }

  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set(TENANT_HEADER, tenant.tenantId);
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });

  // Guest cart identity is assigned here (proxy can set cookies on every
  // request) so Server Components downstream only ever need to read it —
  // React Server Component rendering cannot itself mutate cookies.
  if (!req.auth && !req.cookies.get(GUEST_CART_COOKIE)) {
    response.cookies.set(GUEST_CART_COOKIE, randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

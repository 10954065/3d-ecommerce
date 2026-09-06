import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

const GUEST_CART_COOKIE = "onion3d_guest_cart";

export default auth((req) => {
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

  const response = NextResponse.next();

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

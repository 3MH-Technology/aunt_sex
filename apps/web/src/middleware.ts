import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    if (pathname.startsWith("/api/admin") && role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes
        const publicPaths = [
          "/auth/signin",
          "/api/auth",
          "/api/webhooks",
          "/api/videos",
          "/api/search",
          "/api/recommendations",
          "/",
          "/video",
          "/trending",
          "/new",
          "/top-rated",
          "/categories",
          "/channels",
          "/search",
        ];

        if (publicPaths.some((p) => pathname.startsWith(p))) return true;

        if (pathname.startsWith("/api/health")) return true;

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|default-avatar.svg|default-thumbnail.svg|hero-bg.svg|hero-logo.svg|uploads).*)",
  ],
};

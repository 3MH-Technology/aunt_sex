import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    const traceId = req.headers.get("x-trace-id") || crypto.randomUUID();

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);
    requestHeaders.set("x-trace-id", traceId);

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    if (pathname.startsWith("/api/admin") && role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    response.headers.set("x-trace-id", traceId);

    if (process.env.NODE_ENV === "development") {
      response.headers.set("Access-Control-Allow-Origin", "*");
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        const publicPaths = [
          "/auth/signin",
          "/api/auth",
          "/api/webhooks",
          "/api/videos",
          "/api/search",
          "/api/recommendations",
          "/api/health",
          "/api/metrics",
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
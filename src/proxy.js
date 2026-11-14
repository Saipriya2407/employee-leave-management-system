import { NextResponse } from "next/server";

const frontendUrl = (process.env.FRONTEND_URL || "").trim();

const allowedOrigins = new Set([
  "http://localhost:3000",
  ...(frontendUrl ? [frontendUrl] : []),
]);

const corsHeaders = {
  "Access-Control-Allow-Methods":
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

export function proxy(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = allowedOrigins.has(origin);

  if (request.method === "OPTIONS") {
    if (!allowed) {
      return new NextResponse(null, { status: 403 });
    }

    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  const response = NextResponse.next();

  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

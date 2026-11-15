
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

async function proxyRequest(request, context) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { success: false, message: "Backend URL is not configured" },
        { status: 500 }
      );
    }

    const { path } = await context.params;
    const search = new URL(request.url).search;
    const targetUrl = `${BACKEND_URL}/api/${path.join("/")}${search}`;

    const headers = new Headers();

    const cookie = request.headers.get("cookie");
    if (cookie) headers.set("cookie", cookie);

    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const authorization = request.headers.get("authorization");
    if (authorization) headers.set("authorization", authorization);

    const method = request.method;

    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body:
        method === "GET" || method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const responseContentType =
      backendResponse.headers.get("content-type");

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }

    const response = new NextResponse(
      method === "HEAD"
        ? null
        : await backendResponse.arrayBuffer(),
      {
        status: backendResponse.status,
        headers: responseHeaders,
      }
    );

    // Read cookies returned by the backend.
    const cookies =
      typeof backendResponse.headers.getSetCookie === "function"
        ? backendResponse.headers.getSetCookie()
        : [backendResponse.headers.get("set-cookie")].filter(Boolean);

    for (const cookieValue of cookies) {
      let updatedCookie = cookieValue.replace(
        /;\s*Domain=[^;]*/gi,
        ""
      );

      updatedCookie = updatedCookie.replace(
        /;\s*SameSite=None/gi,
        "; SameSite=Lax"
      );

      // Localhost uses HTTP, so Secure must be removed locally.
      if (new URL(request.url).protocol === "http:") {
        updatedCookie = updatedCookie.replace(
          /;\s*Secure/gi,
          ""
        );
      }

      response.headers.append("Set-Cookie", updatedCookie);
    }

    return response;
  } catch (error) {
    console.error("Backend proxy error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to connect to backend" },
      { status: 502 }
    );
  }
}

// export const runtime = "nodejs";

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;

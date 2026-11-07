import { successResponse } from "@/lib/response";

/**
 * POST /api/auth/logout
 * Clears the HttpOnly authentication cookie securely
 */
export async function POST() {
  const response = successResponse(null, "Logged out successfully.", 200);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = [
    "token=",
    "HttpOnly",
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
  ];

  if (isProduction) {
    cookieOptions.push("Secure");
  }

  response.headers.set("Set-Cookie", cookieOptions.join("; "));

  return response;
}


import {
  successResponse,
  methodNotAllowedResponse,
} from "@/lib/response";

export async function GET() {
  return methodNotAllowedResponse(
    ["POST"],
    "HTTP 405 Method Not Allowed: /api/auth/logout requires a POST request."
  );
}

export async function POST() {
  const response = successResponse(
    null,
    "Logged out successfully.",
    200
  );

  response.headers.set(
    "Set-Cookie",
    "token=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure"
  );

  return response;
}
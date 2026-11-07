import prisma from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { validateEmail } from "@/lib/validation";

/**
 * POST /api/auth/login
 * Authenticates user credentials, sets an HttpOnly cookie, and returns user details
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { email, password } = body;

    // 1. Validate email input
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return errorResponse("Invalid email address.", 400);
    }

    // 2. Validate password input
    if (!password || typeof password !== "string") {
      return errorResponse("Password is required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return errorResponse("Invalid email or password.", 401);
    }

    // 4. Compare passwords using bcryptjs
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return errorResponse("Invalid email or password.", 401);
    }

    // 5. Generate signed JWT token
    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    // 6. Build sanitized user object
    const sanitizedUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      department: user.department,
      role: user.role,
    };

    // 7. Prepare response and set HttpOnly Cookie
    const response = successResponse(
      { user: sanitizedUser, token },
      "Logged in successfully.",
      200
    );

    // Set secure HttpOnly cookie (7 days expiry)
    const isProduction = process.env.NODE_ENV === "production";
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const cookieOptions = [
      `token=${token}`,
      "HttpOnly",
      "Path=/",
      `Max-Age=${maxAge}`,
      "SameSite=Lax",
    ];

    if (isProduction) {
      cookieOptions.push("Secure");
    }

    response.headers.set("Set-Cookie", cookieOptions.join("; "));

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return errorResponse("Internal server error during login.", 500);
  }
}


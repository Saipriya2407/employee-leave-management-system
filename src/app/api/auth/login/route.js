// import prisma from "@/lib/prisma";
// import { comparePassword, signToken } from "@/lib/auth";
// import {
//   successResponse,
//   errorResponse,
//   methodNotAllowedResponse,
// } from "@/lib/response";
// import { validateEmail } from "@/lib/validation";

// export async function GET() {
//   return methodNotAllowedResponse(["POST"], "Login requires POST method.");
// }

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     const { email, password } = body;

//     if (!email || !password) {
//       return errorResponse("Email and password are required.", 400);
//     }

//     if (!validateEmail(email)) {
//       return errorResponse("Please enter a valid email address.", 400);
//     }

//     const user = await prisma.user.findUnique({
//       where: { email: email.toLowerCase().trim() },
//     });

//     if (!user) {
//       return errorResponse("Invalid email or password.", 401);
//     }

//     const isPasswordValid = await comparePassword(
//       password,
//       user.password
//     );

//     if (!isPasswordValid) {
//       return errorResponse("Invalid email or password.", 401);
//     }

//     const token = signToken({
//       id: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     const sanitizedUser = {
//       id: user.id,
//       fullName: user.fullName,
//       email: user.email,
//       department: user.department,
//       role: user.role,
//     };

//     const response = successResponse(
//       { user: sanitizedUser },
//       "Logged in successfully.",
//       200
//     );

//     const maxAge = 7 * 24 * 60 * 60;

//     response.headers.set(
//       "Set-Cookie",
//       `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=None; Secure`
//     );

//     return response;
//   } catch (error) {
//     console.error("Login error:", error);
//     return errorResponse("Unable to login. Please try again.", 500);
//   }
// }

import prisma from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  methodNotAllowedResponse,
} from "@/lib/response";
import { validateEmail } from "@/lib/validation";

export async function GET() {
  return methodNotAllowedResponse(["POST"], "Login requires POST method.");
}

export async function POST(request) {
  const totalStart = performance.now();

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required.", 400);
    }

    if (!validateEmail(email)) {
      return errorResponse("Please enter a valid email address.", 400);
    }

    // Measure database query time
    const dbStart = performance.now();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    console.log(
      "LOGIN DB TIME:",
      (performance.now() - dbStart).toFixed(2),
      "ms"
    );

    if (!user) {
      return errorResponse("Invalid email or password.", 401);
    }

    // Measure bcrypt password verification time
    const bcryptStart = performance.now();

    const isPasswordValid = await comparePassword(
      password,
      user.password
    );

    console.log(
      "LOGIN BCRYPT TIME:",
      (performance.now() - bcryptStart).toFixed(2),
      "ms"
    );

    if (!isPasswordValid) {
      return errorResponse("Invalid email or password.", 401);
    }

    // Measure JWT generation time
    const jwtStart = performance.now();

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    console.log(
      "LOGIN JWT TIME:",
      (performance.now() - jwtStart).toFixed(2),
      "ms"
    );

    const sanitizedUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      department: user.department,
      role: user.role,
    };

    const response = successResponse(
      { user: sanitizedUser },
      "Logged in successfully.",
      200
    );

    const maxAge = 7 * 24 * 60 * 60;

    response.headers.set(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=None; Secure`
    );

    console.log(
      "LOGIN TOTAL TIME:",
      (performance.now() - totalStart).toFixed(2),
      "ms"
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return errorResponse(
      "Unable to login. Please try again.",
      500
    );
  }
}

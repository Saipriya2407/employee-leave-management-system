import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_elms_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = "token";

/**
 * 1. Hash a plain text password using bcryptjs
 * @param {string} password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 2. Compare plain text password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password stored in DB
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 3. JWT generation helper
 * Encodes user ID, role, and email into a signed JWT token
 * @param {object} payload - { id, role, email }
 * @returns {string} Signed JWT token string
 */
export function signToken(payload) {
  const tokenPayload = {
    id: payload.id,
    role: payload.role,
    email: payload.email,
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 4. JWT verification helper
 * Verifies token signature and checks expiration
 * @param {string} token - Raw JWT token string
 * @returns {object|null} Decoded payload with { id, role, email } or null if invalid
 */
export function verifyToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 5. Read JWT from HttpOnly cookies & return authenticated user's ID and role
 * Works with Next.js App Router Request object or Next.js cookies()
 * @param {Request} [request] - Optional Next.js Request object
 * @returns {Promise<object|null>} Decoded user { id, role, email } or null
 */
export async function getAuthUser(request) {
  try {
    let token = null;

    // Check request.cookies (if Request object is provided in route handler)
    if (request?.cookies && typeof request.cookies.get === "function") {
      token = request.cookies.get(COOKIE_NAME)?.value;
    }

    // Fallback: Check Cookie header from standard Request
    if (!token && request?.headers) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const found = cookieHeader
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${COOKIE_NAME}=`));
        if (found) {
          token = found.split("=")[1];
        }
      }
    }

    // Fallback: Check Authorization header (Bearer token)
    if (!token && request?.headers) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    // Fallback: Use next/headers cookies() store if in Next.js Server Component context
    if (!token) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        token = cookieStore.get(COOKIE_NAME)?.value;
      } catch (e) {
        // Outside Next.js request context
      }
    }

    if (!token) return null;

    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

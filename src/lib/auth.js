
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = "token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return secret;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function signToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    return {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function getAuthUser(request) {
  try {
    let token = null;

    if (request?.cookies?.get) {
      token = request.cookies.get(COOKIE_NAME)?.value;
    }

    if (!token && request?.headers) {
      const cookieHeader = request.headers.get("cookie");

      if (cookieHeader) {
        const cookie = cookieHeader
          .split(";")
          .map((item) => item.trim())
          .find((item) => item.startsWith(`${COOKIE_NAME}=`));

        if (cookie) {
          token = decodeURIComponent(
            cookie.substring(COOKIE_NAME.length + 1)
          );
        }
      }
    }

    if (!token && request?.headers) {
      const authorization = request.headers.get("authorization");

      if (authorization?.startsWith("Bearer ")) {
        token = authorization.substring(7);
      }
    }

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Always confirm that the account still exists and its role is current.
    const { default: prisma } = await import("@/lib/prisma");

    return await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  } catch (error) {
    console.error("Authentication Error:", error);
    return null;
  }
}

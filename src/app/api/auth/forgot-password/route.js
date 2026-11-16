
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return errorResponse("Email is required.", 400);
    }

    const genericMessage =
      "If an account exists with this email, a password reset link will be sent.";

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Return the same response whether the account exists or not.
    if (!user) {
      return successResponse(null, genericMessage, 200);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    const appUrl = process.env.FRONTEND_URL;

    if (!appUrl) {
      throw new Error("FRONTEND_URL is not configured.");
    }

    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("token", rawToken);

    await sendPasswordResetEmail(user.email, resetUrl.toString());

    return successResponse(null, genericMessage, 200);
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return errorResponse(
      "Unable to process your password reset request. Please try again later.",
      500
    );
  }
}


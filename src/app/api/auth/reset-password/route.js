

import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    const token = body?.token;
    const password = body?.password;
    const confirmPassword = body?.confirmPassword;

    if (!token || !password || !confirmPassword) {
      return errorResponse(
        "Token, password and confirm password are required.",
        400
      );
    }

    if (password.length < 8) {
      return errorResponse(
        "Password must contain at least 8 characters.",
        400
      );
    }

    if (password !== confirmPassword) {
      return errorResponse("Passwords do not match.", 400);
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt <= new Date()
    ) {
      return errorResponse(
        "Invalid or expired password reset link.",
        400
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.passwordResetToken.updateMany({
        where: {
          id: resetRecord.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (updated.count !== 1) {
        throw new Error("RESET_TOKEN_INVALID");
      }

      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      });

      return true;
    });

    return successResponse(
      null,
      "Password reset successfully. Please log in with your new password.",
      200
    );

  } catch (error) {
    if (error.message === "RESET_TOKEN_INVALID") {
      return errorResponse(
        "Invalid or expired password reset link.",
        400
      );
    }

    console.error("Reset Password Error:", error);

    return errorResponse(
      "Unable to reset password. Please try again.",
      500
    );
  }
}

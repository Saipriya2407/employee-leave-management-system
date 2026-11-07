import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

/**
 * GET /api/auth/me
 * Retrieves current authenticated user's profile and leave balance
 */
export async function GET(request) {
  try {
    // 1. Guard route: verify user is logged in
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch full user record including leave balance
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
        leaveBalance: {
          select: {
            casualLeave: true,
            sickLeave: true,
            earnedLeave: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse("User profile not found.", 404);
    }

    return successResponse(user, "User profile retrieved successfully.", 200);
  } catch (error) {
    console.error("Auth Me Error:", error);
    return errorResponse("Internal server error fetching user profile.", 500);
  }
}


import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

/**
 * GET /api/leaves/balance
 * Retrieves the current authenticated employee's available leave balance
 *
 * Requirements:
 * 1. Verifies the employee JWT from HttpOnly cookie.
 * 2. Retrieves logged-in employee's leave balance from PostgreSQL.
 * 3. Returns casualLeave, sickLeave, and earnedLeave.
 * 4. Strictly prevents employees from accessing another employee's balance (403 Forbidden).
 * 5. Handles missing balance records gracefully by auto-provisioning the default quota.
 */
export async function GET(request) {
  try {
    // 1. Verify authenticated session
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");

    let targetUserId = auth.user.id;

    // 2. Enforce RBAC: Non-admin employees can NEVER access another user's balance
    if (queryUserId && queryUserId !== auth.user.id) {
      if (auth.user.role !== "ADMIN") {
        return errorResponse("Forbidden: You cannot access another employee's leave balance.", 403);
      }
      targetUserId = queryUserId;
    }

    // 3. Fetch leave balance from PostgreSQL
    let balance = await prisma.leaveBalance.findUnique({
      where: { userId: targetUserId },
      select: {
        id: true,
        userId: true,
        casualLeave: true,
        sickLeave: true,
        earnedLeave: true,
      },
    });

    // 4. Handle missing balance record: auto-provision default quota (12 Casual, 10 Sick, 15 Earned)
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          userId: targetUserId,
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 15,
        },
        select: {
          id: true,
          userId: true,
          casualLeave: true,
          sickLeave: true,
          earnedLeave: true,
        },
      });
    }

    return successResponse(
      balance,
      "Leave balance retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("Get Leave Balance Error:", error);
    return errorResponse("Internal server error retrieving leave balance.", 500);
  }
}

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

/**
 * GET /api/dashboard
 * Employee Dashboard Endpoint
 *
 * Requirements:
 * 1. Accessible by authenticated users (scoped strictly to auth.user.id).
 * 2. Total leave requests, approved, pending, and rejected counts.
 * 3. Available leave quota breakdown (casual, sick, earned, total).
 * 4. Recent leave applications (top 5).
 * 5. Uses efficient Prisma count queries without fetching unnecessary rows.
 */
export async function GET(request) {
  try {
    // 1. Guard route: verify authenticated session
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const userId = auth.user.id;

    // 2. Execute counts, balance lookup, and recent applications concurrently
    const [
      totalRequests,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      cancelledLeaves,
      balanceRecord,
      recentApplications,
    ] = await Promise.all([
      prisma.leaveApplication.count({ where: { userId } }),
      prisma.leaveApplication.count({ where: { userId, status: "APPROVED" } }),
      prisma.leaveApplication.count({ where: { userId, status: "PENDING" } }),
      prisma.leaveApplication.count({ where: { userId, status: "REJECTED" } }),
      prisma.leaveApplication.count({ where: { userId, status: "CANCELLED" } }),
      prisma.leaveBalance.findUnique({
        where: { userId },
        select: {
          casualLeave: true,
          sickLeave: true,
          earnedLeave: true,
        },
      }),
      prisma.leaveApplication.findMany({
        where: { userId },
        orderBy: { appliedAt: "desc" },
        take: 5,
        select: {
          id: true,
          leaveType: true,
          startDate: true,
          endDate: true,
          totalDays: true,
          reason: true,
          status: true,
          adminRemarks: true,
          appliedAt: true,
        },
      }),
    ]);

    // 3. Fallback defaults if balance has not yet been initialized
    const casual = balanceRecord?.casualLeave ?? 12;
    const sick = balanceRecord?.sickLeave ?? 10;
    const earned = balanceRecord?.earnedLeave ?? 15;
    const totalAvailable = casual + sick + earned;

    const dashboardData = {
      stats: {
        totalRequests,
        approved: approvedLeaves,
        pending: pendingLeaves,
        rejected: rejectedLeaves,
        cancelled: cancelledLeaves,
      },
      leaveBalance: {
        casualLeave: casual,
        sickLeave: sick,
        earnedLeave: earned,
        totalAvailable,
      },
      recentApplications,
    };

    return successResponse(
      dashboardData,
      "Employee dashboard statistics retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("Employee Dashboard Error:", error);
    return errorResponse("Internal server error retrieving employee dashboard.", 500);
  }
}


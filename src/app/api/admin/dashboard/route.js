import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

/**
 * GET /api/admin/dashboard
 * Administrator Dashboard Endpoint
 *
 * Requirements:
 * 1. Admin access only (verified via JWT & role).
 * 2. Organization-wide statistics:
 *    - Total employees
 *    - Total leave applications
 *    - Pending applications
 *    - Approved applications
 *    - Rejected applications
 *    - Cancelled applications
 * 3. Recent leave applications across the organization (top 5 with employee info).
 * 4. Department breakdown aggregations.
 * 5. Uses Prisma count and groupBy queries for efficiency.
 */
export async function GET(request) {
  try {
    // 1. Guard route: Admin privileges required
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch counts, recent applications, and department groupings concurrently
    const [
      totalEmployees,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      cancelledApplications,
      recentApplications,
      departmentGroups,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.leaveApplication.count(),
      prisma.leaveApplication.count({ where: { status: "PENDING" } }),
      prisma.leaveApplication.count({ where: { status: "APPROVED" } }),
      prisma.leaveApplication.count({ where: { status: "REJECTED" } }),
      prisma.leaveApplication.count({ where: { status: "CANCELLED" } }),
      prisma.leaveApplication.findMany({
        orderBy: { appliedAt: "desc" },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
            },
          },
        },
      }),
      prisma.user.groupBy({
        by: ["department"],
        _count: {
          id: true,
        },
        where: { role: "EMPLOYEE" },
      }),
    ]);

    const departmentBreakdown = departmentGroups.map((d) => ({
      department: d.department,
      employeeCount: d._count.id,
    }));

    const adminDashboardData = {
      stats: {
        totalEmployees,
        totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        cancelled: cancelledApplications,
      },
      departmentBreakdown,
      recentApplications,
    };

    return successResponse(
      adminDashboardData,
      "Admin dashboard statistics retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return errorResponse("Internal server error retrieving admin dashboard.", 500);
  }
}


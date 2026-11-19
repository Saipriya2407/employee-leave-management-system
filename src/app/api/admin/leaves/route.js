
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { VALID_LEAVE_STATUSES, validateDate } from "@/lib/validation";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId") ||
      searchParams.get("employeeId");
    const status = searchParams.get("status")?.toUpperCase();
    const leaveType = searchParams.get("leaveType")?.toUpperCase();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where = {};

    if (userId) where.userId = userId;

    if (status) {
      if (!VALID_LEAVE_STATUSES.includes(status)) {
        return errorResponse("Invalid leave status.", 400);
      }
      where.status = status;
    }

    if (leaveType) {
      where.leaveType = { code: leaveType };
    }

    if (startDate) {
      const check = validateDate(startDate, "Start date");
      if (!check.isValid) return errorResponse(check.error, 400);
      where.startDate = { gte: check.date };
    }

    if (endDate) {
      const check = validateDate(endDate, "End date");
      if (!check.isValid) return errorResponse(check.error, 400);
      where.endDate = {
        ...(where.endDate || {}),
        lte: check.date,
      };
    }

    const leaves = await prisma.leaveApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            role: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        allocations: {
          include: {
            entitlement: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return successResponse(
      leaves,
      `Retrieved ${leaves.length} leave application(s).`,
      200
    );
  } catch (error) {
    console.error("Admin Leaves Error:", error);
    return errorResponse("Unable to retrieve leave applications.", 500);
  }
}

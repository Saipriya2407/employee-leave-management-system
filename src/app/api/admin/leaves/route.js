import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { VALID_LEAVE_TYPES, VALID_LEAVE_STATUSES, validateDate } from "@/lib/validation";

/**
 * GET /api/admin/leaves
 * Admin endpoint to view and filter all employee leave applications
 *
 * Requirements:
 * 1. Admin access only (verified via JWT and role).
 * 2. Fetches all leave applications with employee details included.
 * 3. Supports filtering by employee (userId/employeeId), leaveType, status, and date range.
 * 4. Orders records chronologically (most recently applied first).
 */
export async function GET(request) {
  try {
    // 1. Guard route: Admin role required
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const userIdFilter = searchParams.get("userId") || searchParams.get("employeeId");
    const statusParam = searchParams.get("status")?.toUpperCase();
    const leaveTypeParam = searchParams.get("leaveType")?.toUpperCase();
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const where = {};

    // 2. Filter by specific employee
    if (userIdFilter) {
      where.userId = userIdFilter.trim();
    }

    // 3. Filter by leave status
    if (statusParam) {
      if (!VALID_LEAVE_STATUSES.includes(statusParam)) {
        return errorResponse(
          `Invalid status filter "${statusParam}". Allowed values: ${VALID_LEAVE_STATUSES.join(", ")}.`,
          400
        );
      }
      where.status = statusParam;
    }

    // 4. Filter by leave type
    if (leaveTypeParam) {
      if (!VALID_LEAVE_TYPES.includes(leaveTypeParam)) {
        return errorResponse(
          `Invalid leaveType filter "${leaveTypeParam}". Allowed values: ${VALID_LEAVE_TYPES.join(", ")}.`,
          400
        );
      }
      where.leaveType = leaveTypeParam;
    }

    // 5. Filter by Date range
    if (startDateParam) {
      const startValidation = validateDate(startDateParam, "Start date");
      if (!startValidation.isValid) {
        return errorResponse(startValidation.error, 400);
      }
      where.startDate = { gte: startValidation.date };
    }

    if (endDateParam) {
      const endValidation = validateDate(endDateParam, "End date");
      if (!endValidation.isValid) {
        return errorResponse(endValidation.error, 400);
      }
      where.endDate = { ...(where.endDate || {}), lte: endValidation.date };
    }

    // 6. Query PostgreSQL with full employee details included
    const leaves = await prisma.leaveApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
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
      },
    });

    return successResponse(
      leaves,
      `Retrieved ${leaves.length} employee leave application(s).`,
      200
    );
  } catch (error) {
    console.error("Admin List Leaves Error:", error);
    return errorResponse("Internal server error retrieving leave applications.", 500);
  }
}


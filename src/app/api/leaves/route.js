import prisma from "@/lib/prisma";
import { requireEmployee, requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import {
  validateLeaveType,
  validateDateRange,
  isPastDate,
  VALID_LEAVE_TYPES,
  VALID_LEAVE_STATUSES,
} from "@/lib/validation";

/**
 * Mapping from LeaveType enum to LeaveBalance column in PostgreSQL
 */
const LEAVE_BALANCE_FIELDS = {
  CASUAL: "casualLeave",
  SICK: "sickLeave",
  EARNED: "earnedLeave",
};

/**
 * POST /api/leaves
 * Submits a new leave application for the authenticated employee
 */
export async function POST(request) {
  try {
    // 1. Authenticate user and verify employee/admin role via JWT
    const auth = await requireEmployee(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { leaveType, startDate, endDate, reason } = body;

    // 2. Validate mandatory reason field
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return errorResponse("Reason is required and cannot be empty.", 400);
    }

    // 3. Validate leave type (CASUAL, SICK, EARNED)
    const leaveTypeCheck = validateLeaveType(leaveType);
    if (!leaveTypeCheck.isValid) {
      return errorResponse(leaveTypeCheck.error, 400);
    }
    const formattedLeaveType = leaveType.trim().toUpperCase();

    // 4. Validate date formats and date range (endDate >= startDate)
    const dateRangeCheck = validateDateRange(startDate, endDate, true);
    if (!dateRangeCheck.isValid) {
      return errorResponse(dateRangeCheck.error, 400);
    }

    const { startDate: parsedStart, endDate: parsedEnd, totalDays } = dateRangeCheck;

    // 5. Prevent past-date applications
    if (isPastDate(parsedStart)) {
      return errorResponse("Leave start date cannot be in the past.", 400);
    }

    // 6. Check for overlapping active (PENDING or APPROVED) leave requests
    const overlappingLeave = await prisma.leaveApplication.findFirst({
      where: {
        userId: auth.user.id,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: parsedEnd },
        endDate: { gte: parsedStart },
      },
    });

    if (overlappingLeave) {
      const formattedOverlapStart = overlappingLeave.startDate.toISOString().split("T")[0];
      const formattedOverlapEnd = overlappingLeave.endDate.toISOString().split("T")[0];
      return errorResponse(
        `Overlapping leave conflict: You already have an active leave application (${overlappingLeave.status}) from ${formattedOverlapStart} to ${formattedOverlapEnd}.`,
        409
      );
    }

    // 7. Verify employee's remaining leave balance in PostgreSQL
    const balanceField = LEAVE_BALANCE_FIELDS[formattedLeaveType];
    const userBalance = await prisma.leaveBalance.findUnique({
      where: { userId: auth.user.id },
    });

    if (!userBalance) {
      return errorResponse("Leave balance quota record not found for this account.", 404);
    }

    const availableDays = userBalance[balanceField] || 0;

    if (availableDays < totalDays) {
      return errorResponse(
        `Insufficient leave balance. You have ${availableDays} days available for ${formattedLeaveType} leave, but requested ${totalDays} day(s).`,
        400
      );
    }

    // 8. Save application with PENDING status using Prisma
    const newLeave = await prisma.leaveApplication.create({
      data: {
        userId: auth.user.id,
        leaveType: formattedLeaveType,
        startDate: parsedStart,
        endDate: parsedEnd,
        totalDays,
        reason: reason.trim(),
        status: "PENDING",
      },
      select: {
        id: true,
        userId: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        reason: true,
        status: true,
        adminRemarks: true,
        appliedAt: true,
      },
    });

    return successResponse(
      newLeave,
      `Leave application submitted successfully for ${totalDays} day(s). Initial status set to PENDING.`,
      201
    );
  } catch (error) {
    console.error("Apply Leave Error:", error);
    return errorResponse("Database or internal server error while applying for leave.", 500);
  }
}

/**
 * GET /api/leaves
 * Retrieves leave applications:
 * 1. For Employees: returns ONLY their own leave history.
 * 2. For Admins: returns all employee applications (with optional ?userId=... filter).
 * 3. Supports filtering by leaveType and status.
 * 4. Returns id, leaveType, startDate, endDate, totalDays, reason, status, adminRemarks, appliedAt.
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.toUpperCase();
    const leaveTypeParam = searchParams.get("leaveType")?.toUpperCase();
    const userIdFilter = searchParams.get("userId");

    const where = {};

    // 1. Employee restriction: logged-in employees ONLY see their own applications
    if (auth.user.role === "EMPLOYEE") {
      where.userId = auth.user.id;
    } else if (auth.user.role === "ADMIN" && userIdFilter) {
      where.userId = userIdFilter;
    }

    // 2. Filter by status (PENDING, APPROVED, REJECTED, CANCELLED)
    if (statusParam) {
      if (!VALID_LEAVE_STATUSES.includes(statusParam)) {
        return errorResponse(
          `Invalid status filter "${statusParam}". Allowed values: ${VALID_LEAVE_STATUSES.join(", ")}.`,
          400
        );
      }
      where.status = statusParam;
    }

    // 3. Filter by leaveType (CASUAL, SICK, EARNED)
    if (leaveTypeParam) {
      if (!VALID_LEAVE_TYPES.includes(leaveTypeParam)) {
        return errorResponse(
          `Invalid leaveType filter "${leaveTypeParam}". Allowed values: ${VALID_LEAVE_TYPES.join(", ")}.`,
          400
        );
      }
      where.leaveType = leaveTypeParam;
    }

    // 4. Query from PostgreSQL via Prisma with explicit field selection
    const leaves = await prisma.leaveApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
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
    });

    return successResponse(
      leaves,
      `Retrieved ${leaves.length} leave application(s).`,
      200
    );
  } catch (error) {
    console.error("List Leaves Error:", error);
    return errorResponse("Internal server error retrieving leave history.", 500);
  }
}

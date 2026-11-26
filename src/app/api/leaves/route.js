
import prisma from "@/lib/prisma";
import { requireEmployee, requireAuth } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
} from "@/lib/response";
import {
  validateDateRange,
  isPastDate,
} from "@/lib/validation";
import {
  splitRequestByQuarters,
  reserveQuarterlyAllocation,
} from "@/lib/quarterly-policy";

const VALID_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

// Synchronize current-quarter available balances
async function syncLeaveBalance(tx, userId) {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;

  const leaveTypes = await tx.leaveType.findMany({
    where: {
      isActive: true,
      code: {
        in: ["CASUAL", "SICK", "WFH"],
      },
    },
  });

  const summary = {
    casualLeave: 0,
    sickLeave: 0,
    workFromHome: 0,
  };

  for (const type of leaveTypes) {
    const entitlement =
      await tx.quarterlyEntitlement.findUnique({
        where: {
          userId_year_quarter_leaveTypeId: {
            userId,
            year,
            quarter,
            leaveTypeId: type.id,
          },
        },
      });

    const available = entitlement
      ? Math.max(
          0,
          entitlement.allocatedDays +
            entitlement.carryInDays -
            entitlement.usedDays -
            entitlement.reservedDays
        )
      : 0;

    if (type.code === "CASUAL") {
      summary.casualLeave = available;
    }

    if (type.code === "SICK") {
      summary.sickLeave = available;
    }

    if (type.code === "WFH") {
      summary.workFromHome = available;
    }
  }

  await tx.leaveBalance.upsert({
    where: { userId },
    update: summary,
    create: {
      userId,
      ...summary,
    },
  });
}

// POST: Apply for leave
export async function POST(request) {
  try {
    const auth = await requireEmployee(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { leaveType, startDate, endDate, reason } = body;

    if (!leaveType || typeof leaveType !== "string") {
      return errorResponse("Leave type is required.", 400);
    }

    if (
      !reason ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return errorResponse("Reason is required.", 400);
    }

    const dateCheck = validateDateRange(
      startDate,
      endDate,
      true
    );

    if (!dateCheck.isValid) {
      return errorResponse(dateCheck.error, 400);
    }

    const {
      startDate: start,
      endDate: end,
      totalDays,
    } = dateCheck;

    if (isPastDate(start)) {
      return errorResponse(
        "Leave start date cannot be in the past.",
        400
      );
    }

    const code = leaveType.trim().toUpperCase();

    const typeRecord = await prisma.leaveType.findFirst({
      where: {
        code,
        isActive: true,
        effectiveFrom: {
          lte: new Date(),
        },
      },
    });

    if (!typeRecord) {
      return errorResponse(
        "Selected leave type is invalid or inactive.",
        400
      );
    }

    const segments = splitRequestByQuarters(start, end);

    const overlappingLeave =
      await prisma.leaveApplication.findFirst({
        where: {
          userId: auth.user.id,
          status: {
            in: ["PENDING", "APPROVED"],
          },
          startDate: {
            lte: end,
          },
          endDate: {
            gte: start,
          },
        },
      });

    if (overlappingLeave) {
      return errorResponse(
        "You already have a pending or approved leave application overlapping these dates.",
        409
      );
    }

    // Create application, reserve entitlement and synchronize summary
    const newLeave = await prisma.$transaction(
      async (tx) => {
        const application = await tx.leaveApplication.create({
          data: {
            userId: auth.user.id,
            leaveTypeId: typeRecord.id,
            startDate: start,
            endDate: end,
            totalDays,
            reason: reason.trim(),
            status: "PENDING",
          },
          include: {
            leaveType: true,
          },
        });

        await reserveQuarterlyAllocation(
          tx,
          auth.user.id,
          typeRecord,
          segments,
          application.id
        );

        // Update leave_balances after reservation
        await syncLeaveBalance(tx, auth.user.id);

        return application;
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return successResponse(
      newLeave,
      `Leave application submitted for ${totalDays} day(s). Status: PENDING.`,
      201
    );

  } catch (error) {
    console.error("Apply Leave Error:", error);

    if (
      error.message?.startsWith("Insufficient") ||
      error.message?.includes("future-quarter") ||
      error.message?.includes("past quarter")
    ) {
      return errorResponse(error.message, 400);
    }

    if (error.code === "P2034") {
      return errorResponse(
        "Another leave request was processed at the same time. Please try again.",
        409
      );
    }

    return errorResponse(
      "Unable to submit leave application.",
      500
    );
  }
}

// GET: Retrieve leave applications
export async function GET(request) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams
      .get("status")
      ?.toUpperCase();

    const leaveType = searchParams
      .get("leaveType")
      ?.toUpperCase();

    const requestedUserId = searchParams.get("userId");

    const where = {};

    if (auth.user.role === "EMPLOYEE") {
      where.userId = auth.user.id;
    } else if (requestedUserId) {
      where.userId = requestedUserId;
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return errorResponse(
          "Invalid leave status filter.",
          400
        );
      }

      where.status = status;
    }

    if (leaveType) {
      where.leaveType = {
        is: {
          code: leaveType,
        },
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
            employeeCode: true,
            department: true,
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
      orderBy: {
        appliedAt: "desc",
      },
    });

    return successResponse(
      leaves,
      `Retrieved ${leaves.length} leave application(s).`,
      200
    );

  } catch (error) {
    console.error("List Leaves Error:", error);

    return errorResponse(
      "Unable to retrieve leave applications.",
      500
    );
  }
}

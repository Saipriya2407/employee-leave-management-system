import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { isValidUUID } from "@/lib/validation";

const LEAVE_BALANCE_FIELDS = {
  CASUAL: "casualLeave",
  SICK: "sickLeave",
  EARNED: "earnedLeave",
};

/**
 * GET /api/admin/leaves/[id]
 * Retrieves single application details for administrator inspection
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return errorResponse("Invalid leave application ID format. Must be a valid UUID.", 400);
    }

    const leave = await prisma.leaveApplication.findUnique({
      where: { id },
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

    if (!leave) {
      return errorResponse("Leave application not found.", 404);
    }

    return successResponse(leave, "Leave application retrieved successfully.", 200);
  } catch (error) {
    console.error("Admin Get Leave Error:", error);
    return errorResponse("Internal server error retrieving leave details.", 500);
  }
}

/**
 * PATCH /api/admin/leaves/[id]
 * Approves or Rejects an employee's leave application
 *
 * Requirements:
 * 1. Admin access only (verified via JWT & role).
 * 2. Validates application ID format (UUID).
 * 3. Status must be "APPROVED" or "REJECTED".
 * 4. Rejection strictly requires non-empty adminRemarks.
 * 5. Already processed applications (APPROVED, REJECTED, CANCELLED) cannot be updated again.
 * 6. Checks available balance before approval to prevent negative balances.
 * 7. Deducts the corresponding leave quota atomically using Prisma transactions.
 * 8. Returns HTTP 200 with updated details.
 */
export async function PATCH(request, { params }) {
  try {
    // 1. Guard route: Admin access only
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    // 2. Validate application ID format
    if (!isValidUUID(id)) {
      return errorResponse("Invalid leave application ID format. Must be a valid UUID.", 400);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { status, adminRemarks } = body;

    // 3. Validate status parameter
    if (!status || !["APPROVED", "REJECTED"].includes(status.toUpperCase())) {
      return errorResponse("Status must be either 'APPROVED' or 'REJECTED'.", 400);
    }

    const nextStatus = status.toUpperCase();

    // 4. Rejection requires admin remarks
    if (nextStatus === "REJECTED") {
      if (!adminRemarks || typeof adminRemarks !== "string" || !adminRemarks.trim()) {
        return errorResponse("Admin remarks are required when rejecting a leave application.", 400);
      }
    }

    // 5. Fetch target application from PostgreSQL
    const leave = await prisma.leaveApplication.findUnique({
      where: { id },
    });

    if (!leave) {
      return errorResponse("Leave application not found.", 404);
    }

    // 6. Ensure application is still PENDING (prevents processing already finalized requests)
    if (leave.status !== "PENDING") {
      return errorResponse(
        `Cannot process request. This leave application is already marked as ${leave.status}.`,
        400
      );
    }

    const balanceField = LEAVE_BALANCE_FIELDS[leave.leaveType];

    // 7. Atomic Prisma Transaction: performs balance check, deduction, and status update
    const updatedApplication = await prisma.$transaction(async (tx) => {
      if (nextStatus === "APPROVED") {
        // Fetch current leave balance
        const balance = await tx.leaveBalance.findUnique({
          where: { userId: leave.userId },
        });

        if (!balance || balance[balanceField] < leave.totalDays) {
          const available = balance ? balance[balanceField] : 0;
          throw new Error(
            `Insufficient quota: Employee only has ${available} remaining days for ${leave.leaveType} leave, but applied for ${leave.totalDays} day(s).`
          );
        }

        // Deduct approved days from employee's leave balance
        await tx.leaveBalance.update({
          where: { userId: leave.userId },
          data: {
            [balanceField]: {
              decrement: leave.totalDays,
            },
          },
        });
      }

      // Update the leave application status and adminRemarks
      return await tx.leaveApplication.update({
        where: { id },
        data: {
          status: nextStatus,
          adminRemarks: adminRemarks ? adminRemarks.trim() : null,
        },
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
    });

    return successResponse(
      updatedApplication,
      `Leave application has been ${nextStatus.toLowerCase()} successfully.`,
      200
    );
  } catch (error) {
    console.error("Admin Process Leave Error:", error);
    const isBusinessError = error.message.startsWith("Insufficient quota:");
    return errorResponse(
      isBusinessError ? error.message : "Internal server error processing leave application.",
      isBusinessError ? 400 : 500
    );
  }
}


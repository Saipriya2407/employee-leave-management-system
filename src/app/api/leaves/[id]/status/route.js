import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

const LEAVE_BALANCE_FIELDS = {
  CASUAL: "casualLeave",
  SICK: "sickLeave",
  EARNED: "earnedLeave",
};

/**
 * PATCH /api/leaves/[id]/status
 * Admin endpoint to Approve or Reject a leave application
 */
export async function PATCH(request, { params }) {
  try {
    // 1. Guard route: Admin access only
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { status, adminRemarks } = body;

    // 2. Validate requested status
    if (!status || !["APPROVED", "REJECTED"].includes(status.toUpperCase())) {
      return errorResponse("Status must be either 'APPROVED' or 'REJECTED'.", 400);
    }

    const nextStatus = status.toUpperCase();

    // 3. Find the target leave application
    const leave = await prisma.leaveApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!leave) {
      return errorResponse("Leave application not found.", 404);
    }

    // 4. Ensure application is still PENDING
    if (leave.status !== "PENDING") {
      return errorResponse(
        `Cannot update status. This application is already marked as ${leave.status}.`,
        400
      );
    }

    const balanceField = LEAVE_BALANCE_FIELDS[leave.leaveType];

    // 5. Handle Approval or Rejection inside a transaction
    const updatedApplication = await prisma.$transaction(async (tx) => {
      if (nextStatus === "APPROVED") {
        // Fetch current leave balance
        const balance = await tx.leaveBalance.findUnique({
          where: { userId: leave.userId },
        });

        if (!balance || balance[balanceField] < leave.totalDays) {
          const available = balance ? balance[balanceField] : 0;
          throw new Error(
            `Cannot approve: Employee only has ${available} remaining days for ${leave.leaveType} leave, but applied for ${leave.totalDays} days.`
          );
        }

        // Deduct days from employee balance
        await tx.leaveBalance.update({
          where: { userId: leave.userId },
          data: {
            [balanceField]: {
              decrement: leave.totalDays,
            },
          },
        });
      }

      // Update the leave status and admin remarks
      return await tx.leaveApplication.update({
        where: { id },
        data: {
          status: nextStatus,
          adminRemarks: adminRemarks ? adminRemarks.trim() : null,
        },
      });
    });

    return successResponse(
      updatedApplication,
      `Leave application has been ${nextStatus.toLowerCase()} successfully.`,
      200
    );
  } catch (error) {
    console.error("Update Leave Status Error:", error);
    const message = error.message.startsWith("Cannot approve:")
      ? error.message
      : "Internal server error updating leave status.";
    return errorResponse(message, 400);
  }
}


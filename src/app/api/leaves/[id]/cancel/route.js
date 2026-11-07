import prisma from "@/lib/prisma";
import { requireAuth, verifyOwnership } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { isValidUUID } from "@/lib/validation";

/**
 * PATCH /api/leaves/[id]/cancel
 * Cancels a leave application submitted by an employee
 *
 * Requirements:
 * 1. Verify JWT authentication.
 * 2. Validate application ID format.
 * 3. Enforce ownership: only the applicant (or an admin) can cancel.
 * 4. Cancellation allowed ONLY for PENDING applications.
 * 5. Applications already APPROVED, REJECTED, or CANCELLED cannot be cancelled.
 * 6. Updates status to CANCELLED and returns the updated application.
 */
export async function PATCH(request, { params }) {
  try {
    // 1. Verify JWT
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    // 2. Validate application ID format
    if (!isValidUUID(id)) {
      return errorResponse("Invalid leave application ID format. Must be a valid UUID.", 400);
    }

    // 3. Find the leave application in PostgreSQL
    const leave = await prisma.leaveApplication.findUnique({
      where: { id },
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

    if (!leave) {
      return errorResponse("Leave application not found.", 404);
    }

    // 4. Verify ownership (employee can only cancel their own)
    const ownerCheck = verifyOwnership(auth, leave.userId);
    if (!ownerCheck.authorized) {
      return ownerCheck.response;
    }

    // 5. Enforce cancellation rule: ONLY PENDING applications can be cancelled
    if (leave.status === "CANCELLED") {
      return errorResponse("This leave application is already cancelled.", 400);
    }

    if (leave.status === "APPROVED") {
      return errorResponse(
        "Cannot cancel a leave application that has already been approved. Please contact your administrator.",
        400
      );
    }

    if (leave.status === "REJECTED") {
      return errorResponse(
        "Cannot cancel a leave application that has already been rejected.",
        400
      );
    }

    if (leave.status !== "PENDING") {
      return errorResponse(
        `Cannot cancel an application with current status "${leave.status}". Only PENDING applications can be cancelled.`,
        400
      );
    }

    // 6. Update status to CANCELLED in PostgreSQL
    const updatedLeave = await prisma.leaveApplication.update({
      where: { id },
      data: { status: "CANCELLED" },
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
      updatedLeave,
      "Leave application has been cancelled successfully.",
      200
    );
  } catch (error) {
    console.error("Cancel Leave Error:", error);
    return errorResponse("Internal server error cancelling leave application.", 500);
  }
}


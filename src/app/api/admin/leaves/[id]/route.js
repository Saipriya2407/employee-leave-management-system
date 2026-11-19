
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
} from "@/lib/response";
import {
  approveQuarterlyAllocation,
  releaseQuarterlyAllocation,
} from "@/lib/quarterly-policy";

// GET: Retrieve one leave application
export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return errorResponse("Invalid leave application ID.", 400);
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
        leaveType: true,
        allocations: {
          include: {
            entitlement: true,
          },
        },
      },
    });

    if (!leave) {
      return errorResponse("Leave application not found.", 404);
    }

    return successResponse(
      leave,
      "Leave application retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("Admin Get Leave Error:", error);
    return errorResponse("Unable to retrieve leave details.", 500);
  }
}

// PATCH: Approve or reject a leave application
export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return errorResponse("Invalid leave application ID.", 400);
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body.status !== "string") {
      return errorResponse("Invalid request body or status.", 400);
    }

    const nextStatus = body.status.toUpperCase();
    const adminRemarks = body.adminRemarks;

    if (!["APPROVED", "REJECTED"].includes(nextStatus)) {
      return errorResponse(
        "Status must be APPROVED or REJECTED.",
        400
      );
    }

    if (
      nextStatus === "REJECTED" &&
      (!adminRemarks ||
        typeof adminRemarks !== "string" ||
        !adminRemarks.trim())
    ) {
      return errorResponse(
        "Admin remarks are required when rejecting a leave application.",
        400
      );
    }

    const updatedApplication = await prisma.$transaction(
      async (tx) => {
        const leave = await tx.leaveApplication.findUnique({
          where: { id },
          include: {
            leaveType: true,
            allocations: true,
          },
        });

        if (!leave) {
          throw new Error("Leave application not found.");
        }

        if (leave.status !== "PENDING") {
          throw new Error(
            `This application is already ${leave.status}.`
          );
        }

        if (!leave.leaveType) {
          throw new Error("Leave type information is missing.");
        }

        if (!leave.allocations || leave.allocations.length === 0) {
          throw new Error("No quarterly allocations found.");
        }

        // APPROVED: reserved days become used days.
        if (nextStatus === "APPROVED") {
          await approveQuarterlyAllocation(
            tx,
            leave.allocations
          );
        }

        // REJECTED: release reserved days.
        if (nextStatus === "REJECTED") {
          await releaseQuarterlyAllocation(
            tx,
            leave.allocations
          );
        }

        // Update only if the application is still pending.
        const result = await tx.leaveApplication.updateMany({
          where: {
            id,
            status: "PENDING",
          },
          data: {
            status: nextStatus,
            adminRemarks: adminRemarks?.trim() || null,
          },
        });

        if (result.count !== 1) {
          throw new Error(
            "This application has already been processed."
          );
        }

        return tx.leaveApplication.findUnique({
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
            leaveType: true,
            allocations: {
              include: {
                entitlement: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return successResponse(
      updatedApplication,
      `Leave application ${nextStatus.toLowerCase()} successfully.`,
      200
    );
  } catch (error) {
    console.error("Admin Process Leave Error:", error);

    if (error.code === "P2034") {
      return errorResponse(
        "Another request was processed at the same time. Please try again.",
        409
      );
    }

    const businessErrors = [
      "Leave application not found.",
      "This application is already",
      "Leave type information is missing.",
      "No quarterly allocations found.",
      "Could not approve allocation:",
      "Could not release allocation:",
      "This application has already been processed.",
    ];

    if (
      businessErrors.some((message) =>
        error.message?.startsWith(message)
      )
    ) {
      return errorResponse(error.message, 400);
    }

    return errorResponse(
      "Internal server error processing leave application.",
      500
    );
  }
}

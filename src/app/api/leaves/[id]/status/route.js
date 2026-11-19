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


export async function PATCH(request, { params }) {
  try {
    // Only Admin can approve or reject leave.
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!id) {
      return errorResponse("Leave application ID is required.", 400);
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const nextStatus =
      typeof body.status === "string"
        ? body.status.toUpperCase()
        : "";

    const adminRemarks =
      typeof body.adminRemarks === "string"
        ? body.adminRemarks.trim()
        : null;

    if (!["APPROVED", "REJECTED"].includes(nextStatus)) {
      return errorResponse(
        "Status must be APPROVED or REJECTED.",
        400
      );
    }

    // Update application and quarterly balances atomically.
    const updated = await prisma.$transaction(
      async (tx) => {
        const leave = await tx.leaveApplication.findUnique({
          where: { id },
          include: {
            allocations: true,
            leaveType: true,
          },
        });

        if (!leave) {
          throw new Error("NOT_FOUND");
        }

        if (leave.status !== "PENDING") {
          throw new Error("APPLICATION_ALREADY_PROCESSED");
        }

        if (!leave.allocations || leave.allocations.length === 0) {
          throw new Error("MISSING_RESERVATIONS");
        }

        if (nextStatus === "APPROVED") {
          // Convert reserved days into used days.
          await approveQuarterlyAllocation(
            tx,
            leave.allocations
          );
        } else {
          // Release reserved days after rejection.
          await releaseQuarterlyAllocation(
            tx,
            leave.allocations
          );
        }

        return tx.leaveApplication.update({
          where: { id },
          data: {
            status: nextStatus,
            adminRemarks,
          },
          include: {
            leaveType: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
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
      updated,
      `Leave application ${nextStatus.toLowerCase()} successfully.`,
      200
    );

  } catch (error) {
    console.error("Admin Leave Status Error:", error);

    if (error.message === "NOT_FOUND") {
      return errorResponse(
        "Leave application not found.",
        404
      );
    }

    if (error.message === "APPLICATION_ALREADY_PROCESSED") {
      return errorResponse(
        "This application has already been processed.",
        409
      );
    }

    if (error.message === "MISSING_RESERVATIONS") {
      return errorResponse(
        "Cannot process this application because its quarterly reservations are missing.",
        409
      );
    }

    if (error.code === "P2034") {
      return errorResponse(
        "Concurrent update detected. Please try again.",
        409
      );
    }

    return errorResponse(
      "Unable to update leave application.",
      500
    );
  }
}
import prisma from "@/lib/prisma";
import { requireAuth, verifyOwnership } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
} from "@/lib/response";
import {
  releaseQuarterlyAllocation,
} from "@/lib/quarterly-policy";


export async function PATCH(request, { params }) {
  try {
    // Verify authentication
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    if (!id) {
      return errorResponse(
        "Leave application ID is required.",
        400
      );
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // Find leave application
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

        // Verify ownership or Admin permission
        const ownerCheck = verifyOwnership(auth, leave.userId);

        if (!ownerCheck.authorized) {
          throw new Error("FORBIDDEN");
        }

        // Only pending applications can be cancelled
        if (leave.status !== "PENDING") {
          throw new Error("ONLY_PENDING_CAN_BE_CANCELLED");
        }

        // Check quarterly reservations
        if (
          !leave.allocations ||
          leave.allocations.length === 0
        ) {
          throw new Error("MISSING_RESERVATIONS");
        }

        // Release reserved leave days
        await releaseQuarterlyAllocation(
          tx,
          leave.allocations
        );

        // Update application status
        return tx.leaveApplication.update({
          where: { id },
          data: {
            status: "CANCELLED",
          },
          include: {
            leaveType: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return successResponse(
      updated,
      "Leave application cancelled and reserved days released.",
      200
    );

  } catch (error) {
    console.error("Cancel Leave Error:", error);

    if (error.message === "NOT_FOUND") {
      return errorResponse(
        "Leave application not found.",
        404
      );
    }

    if (error.message === "FORBIDDEN") {
      return errorResponse(
        "You cannot cancel another employee's application.",
        403
      );
    }

    if (error.message === "ONLY_PENDING_CAN_BE_CANCELLED") {
      return errorResponse(
        "Only pending applications can be cancelled.",
        400
      );
    }

    if (error.message === "MISSING_RESERVATIONS") {
      return errorResponse(
        "Quarterly reservations are missing for this application.",
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
      "Unable to cancel leave application.",
      500
    );
  }
}
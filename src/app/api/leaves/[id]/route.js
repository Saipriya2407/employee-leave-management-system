import prisma from "@/lib/prisma";
import { requireAuth, verifyOwnership } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { isValidUUID } from "@/lib/validation";

/**
 * GET /api/leaves/[id]
 * Retrieves details for a specific leave application
 *
 * Requirements:
 * 1. Validates that [id] is a valid UUID.
 * 2. Fetches leave details from PostgreSQL via Prisma.
 * 3. Enforces ownership: employees can ONLY view their own application (returns 403 otherwise).
 * 4. Returns exact leave fields.
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    // 1. Validate application ID format
    if (!isValidUUID(id)) {
      return errorResponse("Invalid leave application ID format. Must be a valid UUID.", 400);
    }

    // 2. Fetch application from PostgreSQL
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

    // 3. Verify ownership: employees can only view their own records (admins can view any)
    const ownerCheck = verifyOwnership(auth, leave.userId);
    if (!ownerCheck.authorized) {
      return ownerCheck.response;
    }

    return successResponse(leave, "Leave details retrieved successfully.", 200);
  } catch (error) {
    console.error("Get Leave Error:", error);
    return errorResponse("Internal server error retrieving leave details.", 500);
  }
}

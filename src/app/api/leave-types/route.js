
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
} from "@/lib/response";

// GET: Retrieve active leave types
export async function GET(request) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        isActive: true,
        effectiveFrom: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        annualQuota: true,
        quarterlyQuota: true,
        carryForwardAllowed: true,
        isActive: true,
        effectiveFrom: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return successResponse(
      { leaveTypes },
      "Leave types retrieved successfully.",
      200
    );

  } catch (error) {
    console.error("Get Leave Types Error:", error);

    return errorResponse(
      "Unable to retrieve leave types.",
      500
    );
  }
}

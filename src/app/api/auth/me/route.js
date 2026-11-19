import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";


export async function GET(request) {
  try {
    // Verify logged-in user
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse("User profile not found.", 404);
    }

    // Get current year and quarter
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    // Fetch current-quarter leave balances
    const leaveBalances = await prisma.quarterlyEntitlement.findMany({
      where: {
        userId: user.id,
        year,
        quarter,
      },
      include: {
        leaveType: true,
      },
      orderBy: {
        leaveType: {
          name: "asc",
        },
      },
    });

    return successResponse(
      {
        user,
        leaveBalances,
        currentPeriod: {
          year,
          quarter,
        },
      },
      "User profile retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("Auth Me Error:", error);

    return errorResponse(
      "Unable to fetch user profile.",
      500
    );
  }
}

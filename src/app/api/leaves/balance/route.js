import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
} from "@/lib/response";
import {
  getQuarterFromDate,
  getOrCreateQuarterlyEntitlement,
  calculateAvailableBalance,
} from "@/lib/quarterly-policy";


export async function GET(request) {
  try {
    // Verify login
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    let userId = auth.user.id;

    // Only Admin can view another employee's balance
    if (requestedUserId && requestedUserId !== auth.user.id) {
      if (auth.user.role !== "ADMIN") {
        return errorResponse(
          "You cannot access another employee's leave balance.",
          403
        );
      }

      userId = requestedUserId;
    }

    // Verify employee exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (!user) {
      return errorResponse("Employee not found.", 404);
    }

    // Get current quarter
    const { year, quarter } = getQuarterFromDate(new Date());

    // Get active leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        isActive: true,
        effectiveFrom: {
          lte: new Date(),
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Retrieve or create quarterly entitlements
    const balances = await prisma.$transaction(
      async (tx) => {
        const result = [];

        for (const leaveType of leaveTypes) {
          const entitlement =
            await getOrCreateQuarterlyEntitlement(
              tx,
              userId,
              leaveType,
              year,
              quarter
            );

          result.push({
            leaveTypeId: leaveType.id,
            name: leaveType.name,
            code: leaveType.code,
            annualQuota: leaveType.annualQuota,
            quarterlyQuota: leaveType.quarterlyQuota,
            carryForwardAllowed:
              leaveType.carryForwardAllowed,
            year,
            quarter,
            ...calculateAvailableBalance(entitlement),
          });
        }

        return result;
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return successResponse(
      {
        user,
        year,
        quarter,
        balances,
      },
      "Quarterly leave balances retrieved successfully.",
      200
    );

  } catch (error) {
    console.error("Get Leave Balance Error:", error);

    if (error.code === "P2034") {
      return errorResponse(
        "Concurrent update detected. Please try again.",
        409
      );
    }

    return errorResponse(
      "Unable to retrieve leave balances.",
      500
    );
  }
}
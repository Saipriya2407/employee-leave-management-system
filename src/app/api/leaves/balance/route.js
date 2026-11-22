

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

async function runWithRetry(operation, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code !== "P2034" || attempt === maxAttempts) {
        throw error;
      }

      console.warn(`Balance transaction conflict. Retry ${attempt}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
  }
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    let userId = auth.user.id;

    if (requestedUserId && requestedUserId !== auth.user.id) {
      if (auth.user.role !== "ADMIN") {
        return errorResponse(
          "You cannot access another employee's leave balance.",
          403
        );
      }

      userId = requestedUserId;
    }

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

    const { year, quarter } = getQuarterFromDate(new Date());

    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        isActive: true,
        code: {
          in: ["CASUAL", "SICK", "WFH"],
        },
        effectiveFrom: {
          lte: new Date(),
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const balances = await runWithRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const result = [];

          const summary = {
            casualLeave: 0,
            sickLeave: 0,
            workFromHome: 0,
          };

          for (const leaveType of leaveTypes) {
            const entitlement =
              await getOrCreateQuarterlyEntitlement(
                tx,
                userId,
                leaveType,
                year,
                quarter
              );

            const calculated =
              calculateAvailableBalance(entitlement);

            result.push({
              leaveTypeId: leaveType.id,
              name: leaveType.name,
              code: leaveType.code,
              annualQuota: leaveType.annualQuota,
              quarterlyQuota: leaveType.quarterlyQuota,
              carryForwardAllowed: leaveType.carryForwardAllowed,
              year,
              quarter,
              ...calculated,
            });

            if (leaveType.code === "CASUAL") {
              summary.casualLeave = calculated.available;
            }

            if (leaveType.code === "SICK") {
              summary.sickLeave = calculated.available;
            }

            if (leaveType.code === "WFH") {
              summary.workFromHome = calculated.available;
            }
          }

          await tx.leaveBalance.upsert({
            where: { userId },
            update: {
              casualLeave: summary.casualLeave,
              sickLeave: summary.sickLeave,
              workFromHome: summary.workFromHome,
            },
            create: {
              userId,
              casualLeave: summary.casualLeave,
              sickLeave: summary.sickLeave,
              workFromHome: summary.workFromHome,
            },
          });

          return result;
        },
        {
          isolationLevel: "Serializable",
          maxWait: 10000,
          timeout: 20000,
        }
      )
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
        "Unable to update leave balances because of simultaneous requests. Please try again.",
        409
      );
    }

    return errorResponse(
      "Unable to retrieve leave balances.",
      500
    );
  }
}

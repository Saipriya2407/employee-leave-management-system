// import prisma from "@/lib/prisma";
// import { requireAuth } from "@/lib/permissions";
// import { successResponse, errorResponse } from "@/lib/response";
// import { getOrCreateQuarterlyEntitlement } from "@/lib/quarterly-policy";

// export async function GET(request) {
//   try {
//     const auth = await requireAuth(request);
//     if (!auth.authorized) return auth.response;

//     const userId = auth.user.id;
//     const now = new Date();
//     const year = now.getFullYear();
//     const quarter = Math.floor(now.getMonth() / 3) + 1;

//     const [
//       totalRequests,
//       approved,
//       pending,
//       rejected,
//       cancelled,
//       leaveTypes,
//       recentApplications,
//     ] = await Promise.all([
//       prisma.leaveApplication.count({ where: { userId } }),
//       prisma.leaveApplication.count({ where: { userId, status: "APPROVED" } }),
//       prisma.leaveApplication.count({ where: { userId, status: "PENDING" } }),
//       prisma.leaveApplication.count({ where: { userId, status: "REJECTED" } }),
//       prisma.leaveApplication.count({ where: { userId, status: "CANCELLED" } }),

//       prisma.leaveType.findMany({
//         where: {
//           isActive: true,
//           code: { not: "EARNED" },
//         },
//         orderBy: { name: "asc" },
//       }),

//       prisma.leaveApplication.findMany({
//         where: { userId },
//         orderBy: { appliedAt: "desc" },
//         take: 5,
//         include: { leaveType: true },
//       }),
//     ]);

//     const leaveBalance = {};

//     for (const type of leaveTypes) {
//       const entitlement = await getOrCreateQuarterlyEntitlement(
//         prisma,
//         userId,
//         type,
//         year,
//         quarter
//       );

//       leaveBalance[type.code] = {
//         name: type.name,
//         allocated: entitlement.allocatedDays + entitlement.carryInDays,
//         used: entitlement.usedDays,
//         reserved: entitlement.reservedDays,
//         available:
//           entitlement.allocatedDays +
//           entitlement.carryInDays -
//           entitlement.usedDays -
//           entitlement.reservedDays,
//       };
//     }

//     return successResponse(
//       {
//         stats: {
//           totalRequests,
//           approved,
//           pending,
//           rejected,
//           cancelled,
//         },
//         leaveBalance,
//         recentApplications,
//       },
//       "Employee dashboard statistics retrieved successfully.",
//       200
//     );
//   } catch (error) {
//     console.error("Employee Dashboard Error:", error);
//     return errorResponse(
//       "Internal server error retrieving employee dashboard.",
//       500
//     );
//   }
// }

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { getOrCreateQuarterlyEntitlement } from "@/lib/quarterly-policy";

async function runWithRetry(operation, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code !== "P2034" || attempt === maxAttempts) {
        throw error;
      }

      console.warn(`Dashboard transaction conflict. Retry ${attempt}/${maxAttempts}`);
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

    const userId = auth.user.id;
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    const [
      totalRequests,
      approved,
      pending,
      rejected,
      cancelled,
      leaveTypes,
      recentApplications,
    ] = await Promise.all([
      prisma.leaveApplication.count({
        where: { userId },
      }),
      prisma.leaveApplication.count({
        where: { userId, status: "APPROVED" },
      }),
      prisma.leaveApplication.count({
        where: { userId, status: "PENDING" },
      }),
      prisma.leaveApplication.count({
        where: { userId, status: "REJECTED" },
      }),
      prisma.leaveApplication.count({
        where: { userId, status: "CANCELLED" },
      }),
      prisma.leaveType.findMany({
        where: {
          isActive: true,
          code: {
            in: ["CASUAL", "SICK", "WFH"],
          },
          effectiveFrom: {
            lte: now,
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.leaveApplication.findMany({
        where: { userId },
        orderBy: { appliedAt: "desc" },
        take: 5,
        include: { leaveType: true },
      }),
    ]);

    const leaveBalance = await runWithRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const result = {};

          for (const type of leaveTypes) {
            const entitlement =
              await getOrCreateQuarterlyEntitlement(
                tx,
                userId,
                type,
                year,
                quarter
              );

            result[type.code] = {
              name: type.name,
              allocated:
                entitlement.allocatedDays +
                entitlement.carryInDays,
              used: entitlement.usedDays,
              reserved: entitlement.reservedDays,
              available:
                entitlement.allocatedDays +
                entitlement.carryInDays -
                entitlement.usedDays -
                entitlement.reservedDays,
            };
          }

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
        stats: {
          totalRequests,
          approved,
          pending,
          rejected,
          cancelled,
        },
        leaveBalance,
        recentApplications,
      },
      "Employee dashboard statistics retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("Employee Dashboard Error:", error);

    if (error.code === "P2034") {
      return errorResponse(
        "Unable to update dashboard balances because of simultaneous requests. Please try again.",
        409
      );
    }

    return errorResponse(
      "Internal server error retrieving employee dashboard.",
      500
    );
  }
}

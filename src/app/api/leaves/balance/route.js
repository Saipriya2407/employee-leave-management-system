

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
} from "@/lib/response";
import { getQuarterFromDate } from "@/lib/quarterly-policy";

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

    const now = new Date();
    const { year, quarter } = getQuarterFromDate(now);

    const [user, leaveTypes] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
        },
      }),

      prisma.leaveType.findMany({
        where: {
          isActive: true,
          code: { in: ["CASUAL", "SICK", "WFH"] },
          effectiveFrom: { lte: now },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    if (!user) {
      return errorResponse("Employee not found.", 404);
    }

    const leaveTypeIds = leaveTypes.map((type) => type.id);

    const records =
      leaveTypeIds.length > 0
        ? await prisma.quarterlyEntitlement.findMany({
            where: {
              userId,
              year,
              quarter: { lte: quarter },
              leaveTypeId: { in: leaveTypeIds },
            },
            select: {
              leaveTypeId: true,
              quarter: true,
              allocatedDays: true,
              usedDays: true,
              reservedDays: true,
            },
          })
        : [];

    const recordMap = new Map();

    for (const record of records) {
      recordMap.set(
        `${record.leaveTypeId}_${record.quarter}`,
        record
      );
    }

    const balances = leaveTypes.map((type) => {
      let carryInDays = 0;
      let current = null;

      for (let q = 1; q <= quarter; q++) {
        const record = recordMap.get(`${type.id}_${q}`);

        const allocatedDays =
          record?.allocatedDays ?? type.quarterlyQuota;

        const usedDays = record?.usedDays ?? 0;
        const reservedDays = record?.reservedDays ?? 0;

        if (q === quarter) {
          current = {
            allocatedDays,
            usedDays,
            reservedDays,
          };
        }

        if (type.carryForwardAllowed && q < quarter) {
          carryInDays = Math.max(
            0,
            allocatedDays +
              carryInDays -
              usedDays -
              reservedDays
          );
        } else if (!type.carryForwardAllowed) {
          carryInDays = 0;
        }
      }

      const allocated = current?.allocatedDays ?? type.quarterlyQuota;
      const used = current?.usedDays ?? 0;
      const reserved = current?.reservedDays ?? 0;
      const effectiveCarryIn = type.carryForwardAllowed
        ? carryInDays
        : 0;

      const available = Math.max(
        0,
        allocated + effectiveCarryIn - used - reserved
      );

      return {
        leaveTypeId: type.id,
        name: type.name,
        code: type.code,
        annualQuota: type.annualQuota,
        quarterlyQuota: type.quarterlyQuota,
        carryForwardAllowed: type.carryForwardAllowed,
        year,
        quarter,
        allocated,
        carryIn: effectiveCarryIn,
        used,
        reserved,
        available,
      };
    });

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

    return errorResponse(
      "Unable to retrieve leave balances.",
      500
    );
  }
}


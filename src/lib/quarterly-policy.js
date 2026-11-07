import prisma from "./prisma.js";

/**
 * Quarterly Leave & WFH Policy Engine
 *
 * Rules:
 * - Casual Leave: 3 days/quarter. Unused expires quarterly. No carry-forward. No borrowing.
 * - Sick Leave: 3 days/quarter. Unused carries forward between quarters of the SAME year.
 *               Expires December 31. No carry-forward to the next year.
 * - WFH: 3 days/quarter. Unused expires quarterly. No carry-forward. Separate model.
 * - Cross-Quarter: Requests spanning quarter boundaries are split and validated independently.
 * - Reservations: PENDING requests reserve quota; APPROVED requests count as used.
 *                 REJECTED/CANCELLED requests release reserved quota.
 */

/**
 * 1. Calculate Calendar Quarter (1 to 4) and Year from any Date
 * Q1: Jan (0) - Mar (2)
 * Q2: Apr (3) - Jun (5)
 * Q3: Jul (6) - Sep (8)
 * Q4: Oct (9) - Dec (11)
 * @param {Date|string} date
 * @returns {{ year: number, quarter: number }}
 */
export function getQuarterFromDate(date) {
  const d = new Date(date);
  const month = d.getMonth(); // 0 - 11
  const year = d.getFullYear();
  const quarter = Math.floor(month / 3) + 1;
  return { year, quarter };
}

/**
 * 2. Get the Start and End Date boundaries for a specific Year & Quarter
 * @param {number} year
 * @param {number} quarter (1 to 4)
 * @returns {{ start: Date, end: Date }}
 */
export function getQuarterDateBoundaries(year, quarter) {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;

  const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
  // Last millisecond of the quarter
  const end = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * 3. Split a date range into per-quarter allocations
 * Handles cross-quarter requests by counting how many days fall in each (year, quarter).
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {boolean} [includeWeekends=true]
 * @returns {Array<{ year: number, quarter: number, allocatedDays: number, start: Date, end: Date }>}
 */
export function splitRequestByQuarters(startDate, endDate, includeWeekends = true) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end < start) {
    return [];
  }

  const quarterMap = new Map(); // key: "YYYY-Q"

  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 is Sun, 6 is Sat
    const isWorkingDay = includeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6);

    if (isWorkingDay) {
      const { year, quarter } = getQuarterFromDate(cur);
      const key = `${year}-${quarter}`;

      if (!quarterMap.has(key)) {
        quarterMap.set(key, {
          year,
          quarter,
          allocatedDays: 0,
          start: new Date(cur),
          end: new Date(cur),
        });
      }

      const item = quarterMap.get(key);
      item.allocatedDays += 1;
      item.end = new Date(cur); // expands end date for this quarter's segment
    }

    cur.setDate(cur.getDate() + 1);
  }

  return Array.from(quarterMap.values());
}

/**
 * 4. Get or initialize QuarterlyEntitlement for an employee.
 * Automatically synchronizes Sick Leave carry-in from earlier quarters of the SAME year.
 * @param {object} tx - Prisma Client or Transaction
 * @param {string} userId
 * @param {number} year
 * @param {number} quarter
 * @returns {Promise<object>} QuarterlyEntitlement record
 */
export async function getOrCreateQuarterlyEntitlement(tx, userId, year, quarter) {
  // Ensure earlier quarters of the same year are created and carry-forward is calculated
  for (let q = 1; q <= quarter; q++) {
    let entitlement = await tx.quarterlyEntitlement.findUnique({
      where: {
        userId_year_quarter: {
          userId,
          year,
          quarter: q,
        },
      },
    });

    if (!entitlement) {
      let carryIn = 0;

      // If Q > 1, carry forward unused sick leave from Q - 1
      if (q > 1) {
        const prevQ = await tx.quarterlyEntitlement.findUnique({
          where: {
            userId_year_quarter: {
              userId,
              year,
              quarter: q - 1,
            },
          },
        });

        if (prevQ) {
          const availableInPrev =
            prevQ.sickAllocated + prevQ.sickCarryIn - prevQ.sickUsed - prevQ.sickReserved;
          carryIn = Math.max(0, availableInPrev);

          // Update previous quarter's carry-out
          await tx.quarterlyEntitlement.update({
            where: { id: prevQ.id },
            data: { sickCarryOut: carryIn },
          });
        }
      }

      entitlement = await tx.quarterlyEntitlement.create({
        data: {
          userId,
          year,
          quarter: q,
          casualAllocated: 3,
          sickAllocated: 3,
          wfhAllocated: 3,
          sickCarryIn: carryIn,
          sickCarryOut: 0,
          casualUsed: 0,
          sickUsed: 0,
          wfhUsed: 0,
          casualReserved: 0,
          sickReserved: 0,
          wfhReserved: 0,
        },
      });
    }

    if (q === quarter) {
      return entitlement;
    }
  }
}

/**
 * 5. Calculate available days for a given entitlement and request type
 * @param {object} entitlement
 * @param {"CASUAL"|"SICK"|"WFH"} type
 * @returns {{ available: number, allocated: number, used: number, reserved: number, carryIn: number }}
 */
export function calculateAvailableBalance(entitlement, type) {
  const upperType = type.toUpperCase();

  if (upperType === "CASUAL") {
    const available =
      entitlement.casualAllocated - entitlement.casualUsed - entitlement.casualReserved;
    return {
      available: Math.max(0, available),
      allocated: entitlement.casualAllocated,
      used: entitlement.casualUsed,
      reserved: entitlement.casualReserved,
      carryIn: 0,
    };
  }

  if (upperType === "WFH") {
    const available =
      entitlement.wfhAllocated - entitlement.wfhUsed - entitlement.wfhReserved;
    return {
      available: Math.max(0, available),
      allocated: entitlement.wfhAllocated,
      used: entitlement.wfhUsed,
      reserved: entitlement.wfhReserved,
      carryIn: 0,
    };
  }

  if (upperType === "SICK") {
    const totalEntitled = entitlement.sickAllocated + entitlement.sickCarryIn;
    const available = totalEntitled - entitlement.sickUsed - entitlement.sickReserved;
    return {
      available: Math.max(0, available),
      allocated: entitlement.sickAllocated,
      used: entitlement.sickUsed,
      reserved: entitlement.sickReserved,
      carryIn: entitlement.sickCarryIn,
    };
  }

  throw new Error(`Unsupported leave/request type: ${type}`);
}

/**
 * 6. Reserve entitlement for pending requests (Casual, Sick, or WFH)
 * Validates each quarter segment independently.
 * Throws error if quota is insufficient or if borrowing from future quarters.
 * @param {object} tx - Prisma transaction
 * @param {string} userId
 * @param {Array<object>} splitAllocations - Output from splitRequestByQuarters
 * @param {"CASUAL"|"SICK"|"WFH"} type
 * @param {string} requestId - LeaveApplication.id or WFHRequest.id
 * @param {boolean} [isWFH=false]
 */
export async function reserveQuarterlyAllocation(
  tx,
  userId,
  splitAllocations,
  type,
  requestId,
  isWFH = false
) {
  const now = new Date();
  const currentQ = getQuarterFromDate(now);

  for (const segment of splitAllocations) {
    const { year, quarter, allocatedDays } = segment;

    // Rule: Cannot borrow from future quarters
    if (year > currentQ.year || (year === currentQ.year && quarter > currentQ.quarter)) {
      throw new Error(
        `Borrowing forbidden: You cannot apply for ${type} in a future quarter (Q${quarter} ${year}) using future allocations.`
      );
    }

    const entitlement = await getOrCreateQuarterlyEntitlement(tx, userId, year, quarter);
    const balanceInfo = calculateAvailableBalance(entitlement, type);

    if (balanceInfo.available < allocatedDays) {
      throw new Error(
        `Insufficient ${type} balance for Q${quarter} ${year}. Available: ${balanceInfo.available} day(s), Requested: ${allocatedDays} day(s).`
      );
    }

    // Determine column to increment for reservation
    const reserveField =
      type === "CASUAL"
        ? "casualReserved"
        : type === "SICK"
        ? "sickReserved"
        : "wfhReserved";

    // 1. Increment reserved days on QuarterlyEntitlement
    await tx.quarterlyEntitlement.update({
      where: { id: entitlement.id },
      data: {
        [reserveField]: { increment: allocatedDays },
      },
    });

    // 2. Create child Allocation record
    if (isWFH) {
      await tx.wFHRequestAllocation.create({
        data: {
          wfhRequestId: requestId,
          quarterlyEntitlementId: entitlement.id,
          year,
          quarter,
          allocatedDays,
          status: "PENDING",
        },
      });
    } else {
      await tx.leaveRequestAllocation.create({
        data: {
          leaveApplicationId: requestId,
          quarterlyEntitlementId: entitlement.id,
          year,
          quarter,
          allocatedDays,
          status: "PENDING",
        },
      });
    }
  }
}

/**
 * 7. Release reservations upon rejection or cancellation
 * @param {object} tx
 * @param {Array<object>} allocations - Child allocation records
 * @param {"CASUAL"|"SICK"|"WFH"} type
 * @param {boolean} [isWFH=false]
 */
export async function releaseQuarterlyAllocation(tx, allocations, type, isWFH = false) {
  const reserveField =
    type === "CASUAL"
      ? "casualReserved"
      : type === "SICK"
      ? "sickReserved"
      : "wfhReserved";

  for (const alloc of allocations) {
    await tx.quarterlyEntitlement.update({
      where: { id: alloc.quarterlyEntitlementId },
      data: {
        [reserveField]: { decrement: alloc.allocatedDays },
      },
    });

    if (isWFH) {
      await tx.wFHRequestAllocation.update({
        where: { id: alloc.id },
        data: { status: "REJECTED" },
      });
    } else {
      await tx.leaveRequestAllocation.update({
        where: { id: alloc.id },
        data: { status: "REJECTED" },
      });
    }
  }
}

/**
 * 8. Convert reservation into used deduction upon admin approval
 * Deducts from reserved and increments used atomically.
 * @param {object} tx
 * @param {Array<object>} allocations
 * @param {"CASUAL"|"SICK"|"WFH"} type
 * @param {boolean} [isWFH=false]
 */
export async function approveQuarterlyAllocation(tx, allocations, type, isWFH = false) {
  const reserveField =
    type === "CASUAL"
      ? "casualReserved"
      : type === "SICK"
      ? "sickReserved"
      : "wfhReserved";

  const usedField =
    type === "CASUAL"
      ? "casualUsed"
      : type === "SICK"
      ? "sickUsed"
      : "wfhUsed";

  for (const alloc of allocations) {
    await tx.quarterlyEntitlement.update({
      where: { id: alloc.quarterlyEntitlementId },
      data: {
        [reserveField]: { decrement: alloc.allocatedDays },
        [usedField]: { increment: alloc.allocatedDays },
      },
    });

    if (isWFH) {
      await tx.wFHRequestAllocation.update({
        where: { id: alloc.id },
        data: { status: "APPROVED" },
      });
    } else {
      await tx.leaveRequestAllocation.update({
        where: { id: alloc.id },
        data: { status: "APPROVED" },
      });
    }
  }
}


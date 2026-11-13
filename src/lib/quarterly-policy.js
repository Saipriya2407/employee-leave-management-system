
/**
 * Quarterly leave policy for the dynamic LeaveType schema.
 *
 * Casual: 3 days per quarter, no carry-forward.
 * Sick:   3 days per quarter, carry-forward within the same year.
 * WFH:    3 days per quarter, no carry-forward.
 *
 * All requests reserve entitlement while PENDING.
 * APPROVED: reserved -> used.
 * REJECTED/CANCELLED: reserved -> released.
 */

export function getQuarterFromDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }

  return {
    year: date.getFullYear(),
    quarter: Math.floor(date.getMonth() / 3) + 1,
  };
}

/**
 * Counts calendar days inclusively and splits them by quarter.
 * This must match the totalDays calculation used by the leave API.
 */
export function splitRequestByQuarters(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    throw new Error("Invalid leave date range.");
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const segments = new Map();
  const current = new Date(start);

  while (current <= end) {
    const { year, quarter } = getQuarterFromDate(current);
    const key = `${year}-${quarter}`;

    if (!segments.has(key)) {
      segments.set(key, {
        year,
        quarter,
        allocatedDays: 0,
      });
    }

    segments.get(key).allocatedDays += 1;
    current.setDate(current.getDate() + 1);
  }

  return Array.from(segments.values());
}

function getAvailable(entitlement) {
  return Math.max(
    0,
    entitlement.allocatedDays +
      entitlement.carryInDays -
      entitlement.usedDays -
      entitlement.reservedDays
  );
}

/**
 * Creates missing quarterly records and synchronizes carry-forward.
 * The composite unique key comes from the uploaded Prisma schema.
 */
export async function getOrCreateQuarterlyEntitlement(
  tx,
  userId,
  leaveType,
  year,
  quarter
) {
  if (!userId || !leaveType?.id) {
    throw new Error("Employee and leave type are required.");
  }

  if (!Number.isInteger(year) || !Number.isInteger(quarter) ||
      quarter < 1 || quarter > 4) {
    throw new Error("Invalid year or quarter.");
  }

  let target = null;

  for (let q = 1; q <= quarter; q += 1) {
    let entitlement = await tx.quarterlyEntitlement.findUnique({
      where: {
        userId_year_quarter_leaveTypeId: {
          userId,
          year,
          quarter: q,
          leaveTypeId: leaveType.id,
        },
      },
    });

    if (!entitlement) {
      entitlement = await tx.quarterlyEntitlement.create({
        data: {
          userId,
          leaveTypeId: leaveType.id,
          year,
          quarter: q,
          allocatedDays: leaveType.quarterlyQuota,
          usedDays: 0,
          reservedDays: 0,
          carryInDays: 0,
          carryOutDays: 0,
        },
      });
    }

    if (leaveType.carryForwardAllowed && q > 1) {
      const previous = await tx.quarterlyEntitlement.findUnique({
        where: {
          userId_year_quarter_leaveTypeId: {
            userId,
            year,
            quarter: q - 1,
            leaveTypeId: leaveType.id,
          },
        },
      });

      const carry = previous ? getAvailable(previous) : 0;

      entitlement = await tx.quarterlyEntitlement.update({
        where: { id: entitlement.id },
        data: { carryInDays: carry },
      });

      if (previous) {
        await tx.quarterlyEntitlement.update({
          where: { id: previous.id },
          data: { carryOutDays: carry },
        });
      }
    } else if (entitlement.carryInDays !== 0) {
      entitlement = await tx.quarterlyEntitlement.update({
        where: { id: entitlement.id },
        data: { carryInDays: 0, carryOutDays: 0 },
      });
    }

    target = entitlement;
  }

  return target;
}

/**
 * Reserve entitlement for a new PENDING application.
 * Call this inside the same transaction that creates the application.
 */
export async function reserveQuarterlyAllocation(
  tx,
  userId,
  leaveType,
  splitAllocations,
  leaveApplicationId
) {
  if (!splitAllocations.length) {
    throw new Error("No leave days were found in the selected date range.");
  }

  const now = new Date();
  const currentPeriod = getQuarterFromDate(now);

  for (const segment of splitAllocations) {
    const { year, quarter, allocatedDays } = segment;

    if (
      year > currentPeriod.year ||
      (year === currentPeriod.year && quarter > currentPeriod.quarter)
    ) {
      throw new Error(
        `You cannot use future-quarter ${leaveType.name} allocation.`
      );
    }

    if (year < currentPeriod.year ||
        (year === currentPeriod.year && quarter < currentPeriod.quarter)) {
      throw new Error("Leave cannot be applied for a past quarter.");
    }

    const entitlement = await getOrCreateQuarterlyEntitlement(
      tx,
      userId,
      leaveType,
      year,
      quarter
    );

    const available = getAvailable(entitlement);

    if (available < allocatedDays) {
      throw new Error(
        `Insufficient ${leaveType.name} balance in Q${quarter} ${year}. ` +
        `Available: ${available}; requested: ${allocatedDays}.`
      );
    }

    await tx.quarterlyEntitlement.update({
      where: { id: entitlement.id },
      data: {
        reservedDays: { increment: allocatedDays },
      },
    });

    await tx.leaveRequestAllocation.create({
      data: {
        leaveApplicationId,
        quarterlyEntitlementId: entitlement.id,
        allocatedDays,
      },
    });
  }
}

/**
 * Convert all pending reservations into used days on approval.
 */
export async function approveQuarterlyAllocation(tx, allocations) {
  for (const allocation of allocations) {
    const result = await tx.quarterlyEntitlement.updateMany({
      where: {
        id: allocation.quarterlyEntitlementId,
        reservedDays: { gte: allocation.allocatedDays },
      },
      data: {
        reservedDays: { decrement: allocation.allocatedDays },
        usedDays: { increment: allocation.allocatedDays },
      },
    });

    if (result.count !== 1) {
      throw new Error("Could not approve allocation: reservation is inconsistent.");
    }
  }
}

/**
 * Release reservations on rejection or cancellation.
 */
export async function releaseQuarterlyAllocation(tx, allocations) {
  for (const allocation of allocations) {
    const result = await tx.quarterlyEntitlement.updateMany({
      where: {
        id: allocation.quarterlyEntitlementId,
        reservedDays: { gte: allocation.allocatedDays },
      },
      data: {
        reservedDays: { decrement: allocation.allocatedDays },
      },
    });

    if (result.count !== 1) {
      throw new Error("Could not release allocation: reservation is inconsistent.");
    }
  }
}

/**
 * Returns a balance summary for one quarterly entitlement.
 */
export function calculateAvailableBalance(entitlement) {
  return {
    allocated: entitlement.allocatedDays,
    carryIn: entitlement.carryInDays,
    used: entitlement.usedDays,
    reserved: entitlement.reservedDays,
    available: getAvailable(entitlement),
  };
}

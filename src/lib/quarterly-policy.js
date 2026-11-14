/**
 * Quarterly Leave Management Policy
 *
 * CASUAL: 3 days per quarter, no carry-forward.
 * SICK:   3 days per quarter, carry-forward within the same year.
 * WFH:    3 days per quarter, no carry-forward.
 *
 * PENDING: Reserved days.
 * APPROVED: Reserved days become used days.
 * REJECTED/CANCELLED: Reserved days are released.
 *
 * Unused balances expire on December 31.
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
 * Split leave dates into quarterly segments.
 * Both start and end dates are included.
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

    segments.get(key).allocatedDays++;

    current.setDate(current.getDate() + 1);
  }

  return Array.from(segments.values());
}

/**
 * Calculate available balance.
 */
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
 * Get or create quarterly entitlement.
 *
 * Carry-forward is calculated only from the
 * previous quarter of the same calendar year.
 *
 * Therefore, Q4 unused balances never move
 * into the next year's Q1.
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

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(quarter) ||
    quarter < 1 ||
    quarter > 4
  ) {
    throw new Error("Invalid year or quarter.");
  }

  let target = null;

  for (let q = 1; q <= quarter; q++) {
    const entitlement =
      await tx.quarterlyEntitlement.upsert({
        where: {
          userId_year_quarter_leaveTypeId: {
            userId,
            year,
            quarter: q,
            leaveTypeId: leaveType.id,
          },
        },
        update: {},
        create: {
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

    let carryInDays = 0;

    if (leaveType.carryForwardAllowed && q > 1) {
      const previous =
        await tx.quarterlyEntitlement.findUnique({
          where: {
            userId_year_quarter_leaveTypeId: {
              userId,
              year,
              quarter: q - 1,
              leaveTypeId: leaveType.id,
            },
          },
        });

      if (previous) {
        carryInDays = getAvailable(previous);

        await tx.quarterlyEntitlement.update({
          where: {
            id: previous.id,
          },
          data: {
            carryOutDays: carryInDays,
          },
        });
      }
    }

    const updated =
      await tx.quarterlyEntitlement.update({
        where: {
          id: entitlement.id,
        },
        data: {
          carryInDays,
        },
      });

    target = updated;
  }

  return target;
}

/**
 * Reserve days for a pending application.
 *
 * Only current-quarter allocations are allowed.
 */
export async function reserveQuarterlyAllocation(
  tx,
  userId,
  leaveType,
  splitAllocations,
  leaveApplicationId
) {
  if (
    !Array.isArray(splitAllocations) ||
    splitAllocations.length === 0
  ) {
    throw new Error("No leave days found.");
  }

  const currentPeriod = getQuarterFromDate(new Date());

  for (const segment of splitAllocations) {
    const { year, quarter, allocatedDays } = segment;

    if (
      !Number.isInteger(allocatedDays) ||
      allocatedDays <= 0
    ) {
      throw new Error("Invalid quarterly allocation.");
    }

    if (
      year > currentPeriod.year ||
      (year === currentPeriod.year &&
        quarter > currentPeriod.quarter)
    ) {
      throw new Error(
        `You cannot use future-quarter ${leaveType.name} allocation.`
      );
    }

    if (
      year < currentPeriod.year ||
      (year === currentPeriod.year &&
        quarter < currentPeriod.quarter)
    ) {
      throw new Error(
        "Leave cannot be applied for a past quarter."
      );
    }

    const entitlement =
      await getOrCreateQuarterlyEntitlement(
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
      where: {
        id: entitlement.id,
      },
      data: {
        reservedDays: {
          increment: allocatedDays,
        },
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
 * Approve pending allocations.
 * Reserved days become used days.
 */
export async function approveQuarterlyAllocation(
  tx,
  allocations
) {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    throw new Error("No quarterly allocations found.");
  }

  for (const allocation of allocations) {
    const result =
      await tx.quarterlyEntitlement.updateMany({
        where: {
          id: allocation.quarterlyEntitlementId,
          reservedDays: {
            gte: allocation.allocatedDays,
          },
        },
        data: {
          reservedDays: {
            decrement: allocation.allocatedDays,
          },
          usedDays: {
            increment: allocation.allocatedDays,
          },
        },
      });

    if (result.count !== 1) {
      throw new Error(
        "Could not approve allocation: reservation is inconsistent."
      );
    }
  }
}

/**
 * Reject or cancel pending allocations.
 * Reserved days are released.
 */
export async function releaseQuarterlyAllocation(
  tx,
  allocations
) {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    throw new Error("No quarterly allocations found.");
  }

  for (const allocation of allocations) {
    const result =
      await tx.quarterlyEntitlement.updateMany({
        where: {
          id: allocation.quarterlyEntitlementId,
          reservedDays: {
            gte: allocation.allocatedDays,
          },
        },
        data: {
          reservedDays: {
            decrement: allocation.allocatedDays,
          },
        },
      });

    if (result.count !== 1) {
      throw new Error(
        "Could not release allocation: reservation is inconsistent."
      );
    }
  }
}

/**
 * Return balance details.
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
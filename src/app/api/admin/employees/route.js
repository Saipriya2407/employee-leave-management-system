
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const role = searchParams.get("role");

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10)
    );

    const skip = (page - 1) * limit;
    const where = {};

    if (department?.trim()) {
      where.department = {
        equals: department.trim(),
        mode: "insensitive",
      };
    }

    where.role = role?.trim()
      ? role.trim().toUpperCase()
      : "EMPLOYEE";

    if (search?.trim()) {
      const term = search.trim();

      where.OR = [
        { fullName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    const [totalEmployees, employees, leaveTypes] = await Promise.all([
      prisma.user.count({ where }),

      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          email: true,
          department: true,
          role: true,
          createdAt: true,
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

    const employeeIds = employees.map((employee) => employee.id);
    const leaveTypeIds = leaveTypes.map((type) => type.id);

    const entitlements =
      employeeIds.length && leaveTypeIds.length
        ? await prisma.quarterlyEntitlement.findMany({
            where: {
              userId: { in: employeeIds },
              leaveTypeId: { in: leaveTypeIds },
              year,
              quarter: { lte: quarter },
            },
            select: {
              userId: true,
              leaveTypeId: true,
              quarter: true,
              allocatedDays: true,
              carryInDays: true,
              usedDays: true,
              reservedDays: true,
            },
          })
        : [];

    const entitlementMap = new Map();

    for (const record of entitlements) {
      entitlementMap.set(
        `${record.userId}_${record.leaveTypeId}_${record.quarter}`,
        record
      );
    }

    const employeesWithBalances = employees.map((employee) => {
      const leaveBalance = {};

      for (const type of leaveTypes) {
        let carryIn = 0;
        let current = null;

        for (let q = 1; q <= quarter; q++) {
          const key = `${employee.id}_${type.id}_${q}`;
          const record = entitlementMap.get(key);

          const allocated = record?.allocatedDays ?? type.quarterlyQuota;
          const used = record?.usedDays ?? 0;
          const reserved = record?.reservedDays ?? 0;

          if (q === quarter) {
            current = { allocated, used, reserved };
          }

          if (type.carryForwardAllowed && q < quarter) {
            carryIn = Math.max(
              0,
              allocated + carryIn - used - reserved
            );
          } else if (!type.carryForwardAllowed) {
            carryIn = 0;
          }
        }

        const allocated = current?.allocated ?? type.quarterlyQuota;
        const used = current?.used ?? 0;
        const reserved = current?.reserved ?? 0;
        const effectiveCarryIn = type.carryForwardAllowed ? carryIn : 0;

        leaveBalance[type.code] = {
          name: type.name,
          allocated,
          carryIn: effectiveCarryIn,
          used,
          reserved,
          available: Math.max(
            0,
            allocated + effectiveCarryIn - used - reserved
          ),
        };
      }

      return { ...employee, leaveBalance };
    });

    const totalPages = Math.ceil(totalEmployees / limit) || 1;

    return successResponse(
      {
        employees: employeesWithBalances,
        currentPeriod: { year, quarter },
        pagination: {
          total: totalEmployees,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      employees.length === 0
        ? "No employees found matching the criteria."
        : `Retrieved ${employees.length} employee(s).`,
      200
    );
  } catch (error) {
    console.error("Admin List Employees Error:", error);

    return errorResponse(
      "Internal server error retrieving employees list.",
      500
    );
  }
}


import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { getOrCreateQuarterlyEntitlement } from "@/lib/quarterly-policy";

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
      Math.max(
        1,
        parseInt(searchParams.get("limit") || "10", 10) || 10
      )
    );

    const skip = (page - 1) * limit;
    const where = {};

    if (department?.trim()) {
      where.department = {
        equals: department.trim(),
        mode: "insensitive",
      };
    }

    if (role?.trim()) {
      where.role = role.trim().toUpperCase();
    } else {
      where.role = "EMPLOYEE";
    }

    if (search?.trim()) {
      const trimmedSearch = search.trim();

      where.OR = [
        {
          fullName: {
            contains: trimmedSearch,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: trimmedSearch,
            mode: "insensitive",
          },
        },
      ];
    }

    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    const result = await prisma.$transaction(
      async (tx) => {
        const [totalEmployees, employees, leaveTypes] =
          await Promise.all([
            tx.user.count({ where }),

            tx.user.findMany({
              where,
              skip,
              take: limit,
              orderBy: {
                createdAt: "desc",
              },
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

            tx.leaveType.findMany({
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
          ]);

        const employeesWithBalances = [];

        for (const employee of employees) {
          const leaveBalance = {};

          for (const type of leaveTypes) {
            const entitlement =
              await getOrCreateQuarterlyEntitlement(
                tx,
                employee.id,
                type,
                year,
                quarter
              );

            const available =
              entitlement.allocatedDays +
              entitlement.carryInDays -
              entitlement.usedDays -
              entitlement.reservedDays;

            leaveBalance[type.code] = {
              name: type.name,
              allocated: entitlement.allocatedDays,
              carryIn: entitlement.carryInDays,
              used: entitlement.usedDays,
              reserved: entitlement.reservedDays,
              available: Math.max(0, available),
            };
          }

          employeesWithBalances.push({
            ...employee,
            leaveBalance,
          });
        }

        return {
          totalEmployees,
          employees: employeesWithBalances,
        };
      },
      {
        maxWait: 10000,
        timeout: 60000,
      }
    );

    const totalPages =
      Math.ceil(result.totalEmployees / limit) || 1;

    return successResponse(
      {
        employees: result.employees,
        currentPeriod: {
          year,
          quarter,
        },
        pagination: {
          total: result.totalEmployees,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      result.employees.length === 0
        ? "No employees found matching the criteria."
        : `Retrieved ${result.employees.length} employee(s).`,
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

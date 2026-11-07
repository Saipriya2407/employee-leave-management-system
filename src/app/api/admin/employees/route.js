import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

/**
 * GET /api/admin/employees
 * Administrator endpoint to list, search, and paginate registered employees
 *
 * Requirements:
 * 1. Admin access only (verified via JWT & role).
 * 2. Fetches employees from PostgreSQL via Prisma.
 * 3. Returns id, fullName, email, department, role, createdAt, and leaveBalance quota.
 * 4. Strictly excludes password and password hash.
 * 5. Supports case-insensitive searching across fullName and email.
 * 6. Supports filtering by department and role.
 * 7. Supports pagination with configurable page and limit.
 * 8. Gracefully handles empty employee lists.
 */
export async function GET(request) {
  try {
    // 1. Guard route: Admin role required
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const role = searchParams.get("role");

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));
    const skip = (page - 1) * limit;

    const where = {};

    // 2. Department filter (case-insensitive)
    if (department && department.trim()) {
      where.department = {
        equals: department.trim(),
        mode: "insensitive",
      };
    }

    // 3. Role filter (EMPLOYEE or ADMIN)
    if (role && role.trim()) {
      where.role = role.trim().toUpperCase();
    }

    // 4. Search query (matches either fullName or email)
    if (search && search.trim()) {
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

    // 5. Query total count and paginated list concurrently
    const [totalEmployees, employees] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          role: true,
          createdAt: true,
          leaveBalance: {
            select: {
              casualLeave: true,
              sickLeave: true,
              earnedLeave: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalEmployees / limit) || 1;

    const message =
      employees.length === 0
        ? "No employees found matching the criteria."
        : `Retrieved ${employees.length} employee(s).`;

    return successResponse(
      {
        employees,
        pagination: {
          total: totalEmployees,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      message,
      200
    );
  } catch (error) {
    console.error("Admin List Employees Error:", error);
    return errorResponse("Internal server error retrieving employees list.", 500);
  }
}



import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { validateEmail, validatePassword } from "@/lib/validation";

const DEFAULT_LEAVE_TYPES = [
  {
    name: "Casual Leave",
    code: "CASUAL",
    annualQuota: 12,
    quarterlyQuota: 3,
    carryForwardAllowed: false,
  },
  {
    name: "Sick Leave",
    code: "SICK",
    annualQuota: 12,
    quarterlyQuota: 3,
    carryForwardAllowed: true,
  },
  {
    name: "Work From Home",
    code: "WFH",
    annualQuota: 12,
    quarterlyQuota: 3,
    carryForwardAllowed: false,
  },
];

// Prepare employee/Admin code counters.
async function prepareRoleCounter(tx, role) {
  await tx.employeeCodeCounter.upsert({
    where: { role },
    update: {},
    create: { role, value: 0 },
  });

  const existingCodes = await tx.user.findMany({
    where: {
      role,
      employeeCode: { not: null },
    },
    select: { employeeCode: true },
  });

  let maxNumber = 0;
  const prefix = role === "ADMIN" ? "ADM" : "EMP";

  for (const item of existingCodes) {
    const match = item.employeeCode?.match(
      new RegExp(`^${prefix}(\\d+)$`)
    );

    if (match) {
      maxNumber = Math.max(maxNumber, Number(match[1]));
    }
  }

  const counter = await tx.employeeCodeCounter.findUnique({
    where: { role },
  });

  if (counter.value < maxNumber) {
    await tx.employeeCodeCounter.update({
      where: { role },
      data: { value: maxNumber },
    });
  }

  const usersWithoutCodes = await tx.user.findMany({
    where: {
      role,
      employeeCode: null,
    },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  for (const user of usersWithoutCodes) {
    const updatedCounter = await tx.employeeCodeCounter.update({
      where: { role },
      data: { value: { increment: 1 } },
    });

    const employeeCode =
      `${prefix}${String(updatedCounter.value).padStart(3, "0")}`;

    await tx.user.update({
      where: { id: user.id },
      data: { employeeCode },
    });
  }
}

// Generate the next employee/Admin code.
async function generateEmployeeCode(tx, role) {
  const updatedCounter = await tx.employeeCodeCounter.update({
    where: { role },
    data: { value: { increment: 1 } },
  });

  const prefix = role === "ADMIN" ? "ADM" : "EMP";

  return `${prefix}${String(updatedCounter.value).padStart(3, "0")}`;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { fullName, email, password, department } = body;

    const requestedRole = String(
      body.role || "EMPLOYEE"
    ).trim().toUpperCase();

    // Validate role.
    if (!["EMPLOYEE", "ADMIN"].includes(requestedRole)) {
      return errorResponse("Invalid role.", 400);
    }

    // Validate name.
    if (typeof fullName !== "string" || !fullName.trim()) {
      return errorResponse("Full name is required.", 400);
    }

    // Validate email.
    const emailCheck = validateEmail(email);

    if (!emailCheck.isValid) {
      return errorResponse(emailCheck.error, 400);
    }

    // Validate password.
    const passwordCheck = validatePassword(password, 6);

    if (!passwordCheck.isValid) {
      return errorResponse(passwordCheck.error, 400);
    }

    // Validate department.
    if (typeof department !== "string" || !department.trim()) {
      return errorResponse("Department is required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(
      async (tx) => {
        // Check whether this email already belongs to a user.
        const existingUser = await tx.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          throw new Error("EMAIL_ALREADY_EXISTS");
        }

        // ==========================================
        // ADMIN REGISTRATION
        // ==========================================
        if (requestedRole === "ADMIN") {
          const adminExists = await tx.user.findFirst({
            where: { role: "ADMIN" },
            select: { id: true },
          });

          // FIRST ADMIN: Register immediately.
          if (!adminExists) {
            if (
              !process.env.ADMIN_REGISTRATION_CODE ||
              body.adminCode !== process.env.ADMIN_REGISTRATION_CODE
            ) {
              throw new Error("INVALID_ADMIN_CODE");
            }

            for (const type of DEFAULT_LEAVE_TYPES) {
              await tx.leaveType.upsert({
                where: { code: type.code },
                update: {},
                create: type,
              });
            }

            await prepareRoleCounter(tx, "EMPLOYEE");
            await prepareRoleCounter(tx, "ADMIN");

            const employeeCode = await generateEmployeeCode(
              tx,
              "ADMIN"
            );

            const admin = await tx.user.create({
              data: {
                employeeCode,
                fullName: fullName.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                department: department.trim(),
                role: "ADMIN",
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
            });

            return {
              type: "FIRST_ADMIN",
              user: admin,
            };
          }

          // ADDITIONAL ADMIN: Create a pending request.
          const existingRequest =
            await tx.adminRegistrationRequest.findUnique({
              where: { email: normalizedEmail },
            });

          if (existingRequest) {
            throw new Error("ADMIN_REQUEST_ALREADY_EXISTS");
          }

          const adminRequest =
            await tx.adminRegistrationRequest.create({
              data: {
                fullName: fullName.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                department: department.trim(),
                status: "PENDING",
              },
              select: {
                id: true,
                fullName: true,
                email: true,
                department: true,
                status: true,
                createdAt: true,
              },
            });

          return {
            type: "ADMIN_REQUEST",
            request: adminRequest,
          };
        }

        // ==========================================
        // EMPLOYEE REGISTRATION
        // ==========================================

        for (const type of DEFAULT_LEAVE_TYPES) {
          await tx.leaveType.upsert({
            where: { code: type.code },
            update: {},
            create: type,
          });
        }

        await prepareRoleCounter(tx, "EMPLOYEE");
        await prepareRoleCounter(tx, "ADMIN");

        const employeeCode = await generateEmployeeCode(
          tx,
          "EMPLOYEE"
        );

        const user = await tx.user.create({
          data: {
            employeeCode,
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            department: department.trim(),
            role: "EMPLOYEE",
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
        });

        return {
          type: "EMPLOYEE",
          user,
        };
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 20000,
      }
    );

    // Return appropriate response.
    if (result.type === "ADMIN_REQUEST") {
      return successResponse(
        result.request,
        "Admin registration request submitted successfully. Please wait for approval from an existing Admin.",
        201
      );
    }

    if (result.type === "FIRST_ADMIN") {
      return successResponse(
        result.user,
        "First Admin registered successfully.",
        201
      );
    }

    return successResponse(
      result.user,
      "Employee registered successfully.",
      201
    );

  } catch (error) {
    console.error("Register Error:", error);

    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return errorResponse(
        "An account with this email already exists.",
        409
      );
    }

    if (error.message === "INVALID_ADMIN_CODE") {
      return errorResponse(
        "Invalid Admin registration code.",
        403
      );
    }

    if (error.message === "ADMIN_REQUEST_ALREADY_EXISTS") {
      return errorResponse(
        "An Admin registration request with this email already exists.",
        409
      );
    }

    if (error.code === "P2002") {
      return errorResponse(
        "An account, registration request, or employee code already exists.",
        409
      );
    }

    if (error.code === "P2034") {
      return errorResponse(
        "Registration conflict. Please try again.",
        409
      );
    }

    return errorResponse("Unable to register user.", 500);
  }
}

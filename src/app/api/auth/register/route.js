
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/permissions";
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

// Create the counter and assign codes to existing users without codes.
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

  for (const item of existingCodes) {
    const prefix = role === "ADMIN" ? "ADM" : "EMP";
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

    const prefix = role === "ADMIN" ? "ADM" : "EMP";
    const employeeCode =
      `${prefix}${String(updatedCounter.value).padStart(3, "0")}`;

    await tx.user.update({
      where: { id: user.id },
      data: { employeeCode },
    });
  }
}

// Generate the next code for a new user.
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
    const requestedRole = body.role || "EMPLOYEE";

    if (!["EMPLOYEE", "ADMIN"].includes(requestedRole)) {
      return errorResponse("Invalid role.", 400);
    }

    if (typeof fullName !== "string" || !fullName.trim()) {
      return errorResponse("Full name is required.", 400);
    }

    const emailCheck = validateEmail(email);

    if (!emailCheck.isValid) {
      return errorResponse(emailCheck.error, 400);
    }

    const passwordCheck = validatePassword(password, 6);

    if (!passwordCheck.isValid) {
      return errorResponse(passwordCheck.error, 400);
    }

    if (typeof department !== "string" || !department.trim()) {
      return errorResponse("Department is required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse(
        "An account with this email already exists.",
        409
      );
    }

    // Admin registration rules.
    if (requestedRole === "ADMIN") {
      const adminExists = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (!adminExists) {
        const secretCode = body.adminCode;

        if (
          !process.env.ADMIN_REGISTRATION_CODE ||
          secretCode !== process.env.ADMIN_REGISTRATION_CODE
        ) {
          return errorResponse(
            "Invalid Admin registration code.",
            403
          );
        }
      } else {
        const auth = await requireAuth(request);

        if (!auth.authorized || auth.user.role !== "ADMIN") {
          return errorResponse(
            "Only an existing Admin can register another Admin.",
            403
          );
        }
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(
      async (tx) => {
        // Create default leave types if they do not exist.
        for (const type of DEFAULT_LEAVE_TYPES) {
          await tx.leaveType.upsert({
            where: { code: type.code },
            update: {},
            create: type,
          });
        }

        // Assign codes to existing users in both roles.
        await prepareRoleCounter(tx, "EMPLOYEE");
        await prepareRoleCounter(tx, "ADMIN");

        // Generate the new user's code.
        const employeeCode = await generateEmployeeCode(
          tx,
          requestedRole
        );

        return tx.user.create({
          data: {
            employeeCode,
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            department: department.trim(),
            role: requestedRole,
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
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return successResponse(
      user,
      `${requestedRole} registered successfully.`,
      201
    );
  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === "P2002") {
      return errorResponse(
        "An account or employee code already exists. Please try again.",
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

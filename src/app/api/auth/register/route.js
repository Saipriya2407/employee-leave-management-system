import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { validateEmail, validatePassword, VALID_ROLES } from "@/lib/validation";

/**
 * POST /api/auth/register
 * Registers a new Employee or Admin and automatically initializes their leave balance
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { fullName, email, password, department, role } = body;

    // 1. Validate Full Name
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return errorResponse("Full name is required.", 400);
    }

    // 2. Validate Email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return errorResponse(emailValidation.error, 400);
    }
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Validate Password
    const passwordValidation = validatePassword(password, 6);
    if (!passwordValidation.isValid) {
      return errorResponse(passwordValidation.error, 400);
    }

    // 4. Validate Department
    if (!department || typeof department !== "string" || !department.trim()) {
      return errorResponse("Department is required.", 400);
    }

    // 5. Validate Role (defaults to EMPLOYEE)
    let assignedRole = "EMPLOYEE";
    if (role) {
      const upperRole = role.toString().trim().toUpperCase();
      if (!VALID_ROLES.includes(upperRole)) {
        return errorResponse(
          `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}.`,
          400
        );
      }
      assignedRole = upperRole;
    }

    // 6. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse("An account with this email already exists.", 409);
    }

    // 7. Hash password securely
    const hashedPassword = await hashPassword(password);

    // 8. Create User and their default Leave Balance inside a database transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          department: department.trim(),
          role: assignedRole,
        },
      });

      // Automatically allocate initial annual leave quota (12 Casual, 10 Sick, 15 Earned)
      await tx.leaveBalance.create({
        data: {
          userId: user.id,
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 15,
        },
      });

      return user;
    });

    // 9. Return sanitized user data (exclude password)
    const sanitizedUser = {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      department: newUser.department,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return successResponse(
      sanitizedUser,
      "User registered successfully with initial leave balance.",
      201
    );
  } catch (error) {
    console.error("Register Error:", error);
    return errorResponse("Internal server error during registration.", 500);
  }
}


import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { comparePassword, hashPassword } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { validateEmail, validatePassword } from "@/lib/validation";

/**
 * GET /api/profile
 * Retrieves the current authenticated employee's profile using their verified JWT.
 * Guarantees that employees can only view their own profile.
 */
export async function GET(request) {
  try {
    // 1. Guard route: verify JWT from HttpOnly cookie
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Query PostgreSQL strictly using the verified JWT user ID (never trust frontend parameters)
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
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
    });

    if (!user) {
      return errorResponse("Employee profile not found.", 404);
    }

    return successResponse(user, "Employee profile retrieved successfully.", 200);
  } catch (error) {
    console.error("Get Profile Error:", error);
    return errorResponse("Internal server error retrieving employee profile.", 500);
  }
}

/**
 * PUT /api/profile
 * Updates the current authenticated employee's profile details.
 * Allows updating fullName, department, email (with uniqueness check), and password (with current password verification).
 * Prevents modifying role (RBAC privilege escalation defense).
 */
export async function PUT(request) {
  try {
    // 1. Guard route: verify JWT from HttpOnly cookie
    const auth = await requireAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const { fullName, email, department, currentPassword, newPassword } = body;

    // 2. Fetch existing user record to check current state
    const existingUser = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!existingUser) {
      return errorResponse("Employee profile not found.", 404);
    }

    const updateData = {};

    // 3. Validate and update Full Name
    if (fullName !== undefined) {
      if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
        return errorResponse("Full name cannot be empty.", 400);
      }
      updateData.fullName = fullName.trim();
    }

    // 4. Validate and update Department
    if (department !== undefined) {
      if (!department || typeof department !== "string" || !department.trim()) {
        return errorResponse("Department cannot be empty.", 400);
      }
      updateData.department = department.trim();
    }

    // 5. Validate and update Email
    if (email !== undefined) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.isValid) {
        return errorResponse(emailCheck.error, 400);
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailInUse = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (emailInUse) {
          return errorResponse("This email address is already in use by another account.", 409);
        }
        updateData.email = normalizedEmail;
      }
    }

    // 6. Handle Password Update (requires current password verification)
    if (newPassword) {
      if (!currentPassword || typeof currentPassword !== "string") {
        return errorResponse("Current password is required to set a new password.", 400);
      }

      const isCurrentValid = await comparePassword(currentPassword, existingUser.password);
      if (!isCurrentValid) {
        return errorResponse("Current password is incorrect.", 401);
      }

      const passCheck = validatePassword(newPassword, 6);
      if (!passCheck.isValid) {
        return errorResponse(passCheck.error, 400);
      }

      updateData.password = await hashPassword(newPassword);
    }

    // 7. Ensure at least one valid field was supplied
    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid profile fields provided for update.", 400);
    }

    // 8. Update PostgreSQL record through Prisma (excluding password in return selection)
    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateData,
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
    });

    return successResponse(updatedUser, "Employee profile updated successfully.", 200);
  } catch (error) {
    console.error("Update Profile Error:", error);
    return errorResponse("Internal server error updating employee profile.", 500);
  }
}


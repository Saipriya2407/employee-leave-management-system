
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

// PATCH /api/admin/admin-registration-requests/[id]
// Approve or reject an Admin registration request.

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    if (auth.user.role !== "ADMIN") {
      return errorResponse("Admin access required.", 403);
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    const status = String(body.status || "").toUpperCase();
    const adminRemarks =
      typeof body.adminRemarks === "string"
        ? body.adminRemarks.trim()
        : null;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse(
        "Status must be APPROVED or REJECTED.",
        400
      );
    }

    if (status === "REJECTED" && !adminRemarks) {
      return errorResponse(
        "Please provide a reason for rejection.",
        400
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const registrationRequest =
          await tx.adminRegistrationRequest.findUnique({
            where: { id },
          });

        if (!registrationRequest) {
          throw new Error("REQUEST_NOT_FOUND");
        }

        if (registrationRequest.status !== "PENDING") {
          throw new Error("REQUEST_ALREADY_REVIEWED");
        }

        // Reject the request without creating an Admin account.
        if (status === "REJECTED") {
          const updatedRequest =
            await tx.adminRegistrationRequest.update({
              where: { id },
              data: {
                status: "REJECTED",
                reviewedById: auth.user.id,
                reviewedAt: new Date(),
                adminRemarks,
              },
              select: {
                id: true,
                fullName: true,
                email: true,
                department: true,
                status: true,
                adminRemarks: true,
                reviewedAt: true,
              },
            });

          return {
            status: "REJECTED",
            request: updatedRequest,
          };
        }

        // Ensure the email has not already been registered.
        const existingUser = await tx.user.findUnique({
          where: {
            email: registrationRequest.email,
          },
        });

        if (existingUser) {
          throw new Error("EMAIL_ALREADY_EXISTS");
        }

        // Prepare the Admin employee-code counter.
        await tx.employeeCodeCounter.upsert({
          where: { role: "ADMIN" },
          update: {},
          create: { role: "ADMIN", value: 0 },
        });

        const existingAdmins = await tx.user.findMany({
          where: {
            role: "ADMIN",
            employeeCode: { not: null },
          },
          select: {
            employeeCode: true,
          },
        });

        let maxNumber = 0;

        for (const admin of existingAdmins) {
          const match = admin.employeeCode?.match(/^ADM(\d+)$/);

          if (match) {
            maxNumber = Math.max(
              maxNumber,
              Number(match[1])
            );
          }
        }

        let counter = await tx.employeeCodeCounter.findUnique({
          where: { role: "ADMIN" },
        });

        if (counter.value < maxNumber) {
          counter = await tx.employeeCodeCounter.update({
            where: { role: "ADMIN" },
            data: { value: maxNumber },
          });
        }

        // Assign codes to existing Admins without codes.
        const adminsWithoutCodes = await tx.user.findMany({
          where: {
            role: "ADMIN",
            employeeCode: null,
          },
          select: { id: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });

        for (const admin of adminsWithoutCodes) {
          const updatedCounter =
            await tx.employeeCodeCounter.update({
              where: { role: "ADMIN" },
              data: { value: { increment: 1 } },
            });

          await tx.user.update({
            where: { id: admin.id },
            data: {
              employeeCode:
                `ADM${String(updatedCounter.value).padStart(3, "0")}`,
            },
          });
        }

        // Generate the new Admin code.
        const updatedCounter =
          await tx.employeeCodeCounter.update({
            where: { role: "ADMIN" },
            data: { value: { increment: 1 } },
          });

        const employeeCode =
          `ADM${String(updatedCounter.value).padStart(3, "0")}`;

        // Create the actual Admin account.
        const newAdmin = await tx.user.create({
          data: {
            employeeCode,
            fullName: registrationRequest.fullName,
            email: registrationRequest.email,
            password: registrationRequest.password,
            department: registrationRequest.department,
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

        // Mark the request as approved.
        const updatedRequest =
          await tx.adminRegistrationRequest.update({
            where: { id },
            data: {
              status: "APPROVED",
              reviewedById: auth.user.id,
              reviewedAt: new Date(),
              adminRemarks,
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
              status: true,
              reviewedAt: true,
            },
          });

        return {
          status: "APPROVED",
          user: newAdmin,
          request: updatedRequest,
        };
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return successResponse(
      result,
      status === "APPROVED"
        ? "Admin registration approved successfully."
        : "Admin registration rejected successfully.",
      200
    );

  } catch (error) {
    console.error("Admin Registration Review Error:", error);

    if (error.message === "REQUEST_NOT_FOUND") {
      return errorResponse("Registration request not found.", 404);
    }

    if (error.message === "REQUEST_ALREADY_REVIEWED") {
      return errorResponse(
        "This registration request has already been reviewed.",
        409
      );
    }

    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return errorResponse(
        "An account with this email already exists.",
        409
      );
    }

    if (error.code === "P2002" || error.code === "P2034") {
      return errorResponse(
        "Registration conflict. Please refresh and try again.",
        409
      );
    }

    return errorResponse(
      "Unable to review Admin registration request.",
      500
    );
  }
}

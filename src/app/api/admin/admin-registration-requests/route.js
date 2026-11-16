
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";

// GET /api/admin/admin-registration-requests
// Fetch pending Admin registration requests.
export async function GET(request) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    if (auth.user.role !== "ADMIN") {
      return errorResponse("Admin access required.", 403);
    }

    const requests = await prisma.adminRegistrationRequest.findMany({
      where: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return successResponse(
      requests,
      "Admin registration requests retrieved successfully.",
      200
    );
  } catch (error) {
    console.error("Fetch Admin Requests Error:", error);

    return errorResponse(
      "Unable to fetch Admin registration requests.",
      500
    );
  }
}

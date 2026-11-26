
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authorized) {
      return auth.response;
    }

    // Fetch all holidays, same as Admin API
    const holidays = await prisma.publicHoliday.findMany({
      orderBy: {
        date: "asc",
      },
    });

    return Response.json({
      success: true,
      holidays,
    });
  } catch (error) {
    console.error("Employee holidays error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to fetch holidays",
      },
      { status: 500 }
    );
  }
}

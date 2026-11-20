
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAuth } from "@/lib/permissions";

// // GET: Employees view upcoming public holidays
// export async function GET(request) {
//   try {
//     const auth = await requireAuth(request);
//     if (!auth.authorized) return auth.response;

//     const today = new Date();
//     today.setUTCHours(0, 0, 0, 0);

//     const holidays = await prisma.publicHoliday.findMany({
//       where: {
//         date: {
//           gte: today,
//         },
//       },
//       orderBy: {
//         date: "asc",
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       holidays,
//     });
//   } catch (error) {
//     console.error("Fetch employee holidays error:", error);

//     return NextResponse.json(
//       { success: false, message: "Failed to fetch public holidays" },
//       { status: 500 }
//     );
//   }
// }

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.response;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const holidays = await prisma.publicHoliday.findMany({
      where: {
        date: { gte: today },
      },
      orderBy: { date: "asc" },
    });

    return Response.json({ success: true, holidays });
  } catch (error) {
    console.error("Employee holidays error:", error);
    return Response.json(
      { success: false, message: "Unable to fetch holidays" },
      { status: 500 }
    );
  }
}

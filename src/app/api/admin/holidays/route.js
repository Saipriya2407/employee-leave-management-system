
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAdmin } from "@/lib/permissions";

// // GET: Admin views all public holidays
// export async function GET(request) {
//   try {
//     const auth = await requireAdmin(request);
//     if (!auth.authorized) return auth.response;

//     const holidays = await prisma.publicHoliday.findMany({
//       orderBy: { date: "asc" },
//     });

//     return NextResponse.json({
//       success: true,
//       holidays,
//     });
//   } catch (error) {
//     console.error("Fetch holidays error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to fetch holidays" },
//       { status: 500 }
//     );
//   }
// }

// // POST: Admin adds a public holiday
// export async function POST(request) {
//   try {
//     const auth = await requireAdmin(request);
//     if (!auth.authorized) return auth.response;

//     const { name, date, description } = await request.json();

//     if (!name?.trim() || !date) {
//       return NextResponse.json(
//         { success: false, message: "Holiday name and date are required" },
//         { status: 400 }
//       );
//     }

//     const parsedDate = new Date(`${date}T00:00:00.000Z`);

//     if (Number.isNaN(parsedDate.getTime())) {
//       return NextResponse.json(
//         { success: false, message: "Invalid holiday date" },
//         { status: 400 }
//       );
//     }

//     const holiday = await prisma.publicHoliday.create({
//       data: {
//         name: name.trim(),
//         date: parsedDate,
//         description: description?.trim() || null,
//       },
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Public holiday added successfully",
//         holiday,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Create holiday error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to add public holiday" },
//       { status: 500 }
//     );
//   }
// }

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const holidays = await prisma.publicHoliday.findMany({
      orderBy: { date: "asc" },
    });

    return Response.json({ success: true, holidays });
  } catch (error) {
    console.error("Fetch holidays error:", error);
    return Response.json(
      { success: false, message: "Unable to fetch holidays" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { name, date, description } = await request.json();

    if (!name?.trim() || !date) {
      return Response.json(
        { success: false, message: "Holiday name and date are required" },
        { status: 400 }
      );
    }

    const holidayDate = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(holidayDate.getTime())) {
      return Response.json(
        { success: false, message: "Invalid holiday date" },
        { status: 400 }
      );
    }

    const holiday = await prisma.publicHoliday.create({
      data: {
        name: name.trim(),
        date: holidayDate,
        description: description?.trim() || null,
      },
    });

    return Response.json(
      { success: true, message: "Holiday created successfully", holiday },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create holiday error:", error);
    return Response.json(
      { success: false, message: "Unable to create holiday" },
      { status: 500 }
    );
  }
}

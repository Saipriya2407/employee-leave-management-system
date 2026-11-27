
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAdmin } from "@/lib/permissions";

// // PATCH: Update a public holiday
// export async function PATCH(request, { params }) {
//   try {
//     const auth = await requireAdmin(request);
//     if (!auth.authorized) return auth.response;

//     const { id } = await params;
//     const { name, date, description } = await request.json();

//     const data = {};

//     if (name !== undefined) {
//       if (!name.trim()) {
//         return NextResponse.json(
//           { success: false, message: "Holiday name cannot be empty" },
//           { status: 400 }
//         );
//       }
//       data.name = name.trim();
//     }

//     if (date !== undefined) {
//       const parsedDate = new Date(`${date}T00:00:00.000Z`);

//       if (Number.isNaN(parsedDate.getTime())) {
//         return NextResponse.json(
//           { success: false, message: "Invalid holiday date" },
//           { status: 400 }
//         );
//       }

//       data.date = parsedDate;
//     }

//     if (description !== undefined) {
//       data.description = description?.trim() || null;
//     }

//     const holiday = await prisma.publicHoliday.update({
//       where: { id },
//       data,
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Holiday updated successfully",
//       holiday,
//     });
//   } catch (error) {
//     console.error("Update holiday error:", error);

//     return NextResponse.json(
//       { success: false, message: "Failed to update holiday" },
//       { status: 500 }
//     );
//   }
// }

// // DELETE: Remove a public holiday
// export async function DELETE(request, { params }) {
//   try {
//     const auth = await requireAdmin(request);
//     if (!auth.authorized) return auth.response;

//     const { id } = await params;

//     await prisma.publicHoliday.delete({
//       where: { id },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Holiday deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete holiday error:", error);

//     return NextResponse.json(
//       { success: false, message: "Failed to delete holiday" },
//       { status: 500 }
//     );
//   }
// }

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { name, date, description } = await request.json();

    const data = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return Response.json(
          { success: false, message: "Holiday name cannot be empty" },
          { status: 400 }
        );
      }
      data.name = name.trim();
    }

    if (date !== undefined) {
      const holidayDate = new Date(`${date}T00:00:00.000Z`);

      if (Number.isNaN(holidayDate.getTime())) {
        return Response.json(
          { success: false, message: "Invalid holiday date" },
          { status: 400 }
        );
      }

      data.date = holidayDate;
    }

    if (description !== undefined) {
      data.description = description?.trim() || null;
    }

    const holiday = await prisma.publicHoliday.update({
      where: { id },
      data,
    });

    return Response.json({
      success: true,
      message: "Holiday updated successfully",
      holiday,
    });
  } catch (error) {
    console.error("Update holiday error:", error);
    return Response.json(
      { success: false, message: "Unable to update holiday" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    await prisma.publicHoliday.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    console.error("Delete holiday error:", error);
    return Response.json(
      { success: false, message: "Unable to delete holiday" },
      { status: 500 }
    );
  }
}

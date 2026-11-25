
// "use client";

// import { useEffect, useState } from "react";

// export default function AdminHolidaysPage() {
//   const [holidays, setHolidays] = useState([]);
//   const [name, setName] = useState("");
//   const [date, setDate] = useState("");
//   const [description, setDescription] = useState("");
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState("");

//   const API = "/api/backend/admin/holidays";

//   async function handleResponse(response) {
//     const contentType = response.headers.get("content-type") || "";

//     if (!contentType.includes("application/json")) {
//       throw new Error(
//         "Backend returned an invalid response. Check whether the holiday API is deployed on Render."
//       );
//     }

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || "Request failed");
//     }

//     return data;
//   }

//   async function fetchHolidays() {
//     try {
//       setLoading(true);

//       const response = await fetch(API, {
//         method: "GET",
//         credentials: "include",
//         cache: "no-store",
//       });

//       const data = await handleResponse(response);
//       setHolidays(data.holidays || []);
//     } catch (error) {
//       setMessage(error.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchHolidays();
//   }, []);

//   function resetForm() {
//     setName("");
//     setDate("");
//     setDescription("");
//     setEditingId(null);
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setMessage("");

//     try {
//       const url = editingId ? `${API}/${editingId}` : API;

//       const response = await fetch(url, {
//         method: editingId ? "PATCH" : "POST",
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name,
//           date,
//           description,
//         }),
//       });

//       const data = await handleResponse(response);

//       setMessage(data.message || "Holiday saved successfully");
//       resetForm();
//       await fetchHolidays();
//     } catch (error) {
//       setMessage(error.message);
//     }
//   }

//   function handleEdit(holiday) {
//     setEditingId(holiday.id);
//     setName(holiday.name);

//     const holidayDate = new Date(holiday.date);

//     setDate(
//       `${holidayDate.getUTCFullYear()}-${String(
//         holidayDate.getUTCMonth() + 1
//       ).padStart(2, "0")}-${String(
//         holidayDate.getUTCDate()
//       ).padStart(2, "0")}`
//     );

//     setDescription(holiday.description || "");

//     document.querySelector("main")?.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   }

//   async function handleDelete(id) {
//     if (!window.confirm("Are you sure you want to delete this holiday?")) {
//       return;
//     }

//     try {
//       const response = await fetch(`${API}/${id}`, {
//         method: "DELETE",
//         credentials: "include",
//       });

//       const data = await handleResponse(response);

//       setMessage(data.message || "Holiday deleted successfully");
//       await fetchHolidays();
//     } catch (error) {
//       setMessage(error.message);
//     }
//   }

//   function formatDate(value) {
//     return new Date(value).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       timeZone: "UTC",
//     });
//   }

//   return (
//     <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
//       <div className="mx-auto max-w-5xl">
//         {/* Back Button */}
//         <button
//           type="button"
//           onClick={() => (window.location.href = "/admin/dashboard")}
//           className="mb-5 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
//         >
//           <span>←</span>
//           Back to Dashboard
//         </button>

//         <h1 className="mb-2 text-3xl font-bold text-gray-800">
//           Leave Creation
//         </h1>

//         <p className="mb-6 text-gray-600">
//           Create and manage public holidays for all employees.
//         </p>

//         {message && (
//           <div className="mb-4 rounded-lg bg-blue-50 p-3 text-blue-700">
//             {message}
//           </div>
//         )}

//         {/* Add / Edit Holiday */}
//         <div className="mb-8 rounded-xl bg-white p-6 shadow">
//           <h2 className="mb-5 text-xl font-semibold text-gray-800">
//             {editingId ? "Edit Public Holiday" : "Create Public Holiday"}
//           </h2>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="mb-1 block font-medium text-gray-700">
//                 Holiday Name
//               </label>

//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="Example: Diwali"
//                 required
//                 className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block font-medium text-gray-700">
//                 Holiday Date
//               </label>

//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 required
//                 className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block font-medium text-gray-700">
//                 Description
//               </label>

//               <textarea
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 placeholder="Optional description"
//                 rows="3"
//                 className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
//               />
//             </div>

//             <div className="flex flex-wrap gap-3">
//               <button
//                 type="submit"
//                 className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
//               >
//                 {editingId ? "Update Holiday" : "Create Holiday"}
//               </button>

//               {editingId && (
//                 <button
//                   type="button"
//                   onClick={resetForm}
//                   className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700"
//                 >
//                   Cancel
//                 </button>
//               )}
//             </div>
//           </form>
//         </div>

//         {/* Holiday List */}
//         <div className="rounded-xl bg-white p-6 shadow">
//           <h2 className="mb-5 text-xl font-semibold text-gray-800">
//             All Public Holidays
//           </h2>

//           {loading ? (
//             <p className="text-gray-600">Loading holidays...</p>
//           ) : holidays.length === 0 ? (
//             <p className="text-gray-600">
//               No public holidays added yet.
//             </p>
//           ) : (
//             <div className="space-y-4">
//               {holidays.map((holiday) => (
//                 <div
//                   key={holiday.id}
//                   className="flex flex-col justify-between gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center"
//                 >
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800">
//                       {holiday.name}
//                     </h3>

//                     <p className="text-sm text-blue-600">
//                       {formatDate(holiday.date)}
//                     </p>

//                     {holiday.description && (
//                       <p className="mt-1 text-sm text-gray-600">
//                         {holiday.description}
//                       </p>
//                     )}
//                   </div>

//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => handleEdit(holiday)}
//                       className="rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
//                     >
//                       Edit
//                     </button>

//                     <button
//                       onClick={() => handleDelete(holiday.id)}
//                       className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API = "/api/backend/admin/holidays";

  async function handleResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error(
        "Backend returned an invalid response. Check whether the holiday API is deployed on Render."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function fetchHolidays() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await handleResponse(response);
      setHolidays(data.holidays || []);
    } catch (err) {
      setError(err.message || "Unable to load holidays.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHolidays();
  }, []);

  function resetForm() {
    setName("");
    setDate("");
    setDescription("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      setSaving(true);

      const url = editingId ? `${API}/${editingId}` : API;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          date,
          description,
        }),
      });

      const data = await handleResponse(response);

      setMessage(
        data.message ||
          (editingId
            ? "Holiday updated successfully."
            : "Holiday created successfully.")
      );

      resetForm();
      await fetchHolidays();
    } catch (err) {
      setError(err.message || "Unable to save holiday.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(holiday) {
    setEditingId(holiday.id);
    setName(holiday.name);

    const holidayDate = new Date(holiday.date);

    setDate(
      `${holidayDate.getUTCFullYear()}-${String(
        holidayDate.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(
        holidayDate.getUTCDate()
      ).padStart(2, "0")}`
    );

    setDescription(holiday.description || "");
    setMessage("");
    setError("");

    document.querySelector("main")?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await handleResponse(response);

      setMessage(data.message || "Holiday deleted successfully.");
      await fetchHolidays();
    } catch (err) {
      setError(err.message || "Unable to delete holiday.");
    }
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return (
    <div className="min-h-full bg-gray-100">
      <main className="min-w-0 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">

          {/* Page Header - Same style as Leave Applications */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Leave Creation
              </h1>

              <p className="mt-2 text-gray-500">
                Create and manage public holidays for all employees.
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center font-semibold text-white transition hover:bg-blue-800"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Holiday Form */}
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 border-b border-gray-100 pb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Public Holiday" : "Create Public Holiday"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {editingId
                  ? "Update the selected holiday details."
                  : "Add a public holiday to the employee calendar."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Holiday Name */}
              <div>
                <label
                  htmlFor="holidayName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Holiday Name
                </label>

                <input
                  id="holidayName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: Diwali"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Holiday Date */}
              <div>
                <label
                  htmlFor="holidayDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Holiday Date
                </label>

                <input
                  id="holidayDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="holidayDescription"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="holidayDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter an optional description..."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Holiday"
                      : "Create Holiday"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* All Public Holidays */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 md:p-6">
              <h2 className="text-lg font-bold text-gray-900">
                All Public Holidays
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {holidays.length} holidays added
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Loading holidays...
              </div>
            ) : holidays.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mb-3 text-4xl">📅</div>

                <p className="font-semibold text-gray-700">
                  No public holidays added yet.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Create your first public holiday using the form above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex flex-col justify-between gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center md:px-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                        📅
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {holiday.name}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-blue-700">
                          {formatDate(holiday.date)}
                        </p>

                        {holiday.description && (
                          <p className="mt-2 text-sm text-gray-500">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 sm:shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(holiday)}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(holiday.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="mt-8 border-t border-gray-200 py-5 text-center text-sm text-gray-500">
            Employee Leave Management System © 2026
          </footer>

        </div>
      </main>
    </div>
  );
}

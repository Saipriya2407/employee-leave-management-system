// "use client";

// import { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import BackButton from "@/components/BackButton";

// export default function ApplyLeavePage() {
//   const [leaveTypes, setLeaveTypes] = useState([]);
//   const [balances, setBalances] = useState([]);

//   const [form, setForm] = useState({
//     leaveType: "",
//     startDate: "",
//     endDate: "",
//     reason: "",
//   });

//   const [todayString, setTodayString] = useState("");
//   const [currentQuarter, setCurrentQuarter] = useState(0);

//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);

//   const [message, setMessage] = useState("");
//   const [success, setSuccess] = useState(false);

//   useEffect(() => {
//     const today = new Date();

//     const dateString = [
//       today.getFullYear(),
//       String(today.getMonth() + 1).padStart(2, "0"),
//       String(today.getDate()).padStart(2, "0"),
//     ].join("-");

//     setTodayString(dateString);
//     setCurrentQuarter(Math.floor(today.getMonth() / 3) + 1);

//     async function fetchLeaveData() {
//       try {
//         setLoading(true);
//         setMessage("");

//         const response = await fetch("/api/backend/leave-types", {
//           method: "GET",
//           credentials: "include",
//         });

//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(data.message || "Unable to load leave types.");
//         }

//         const types = Array.isArray(data.data?.leaveTypes)
//           ? data.data.leaveTypes
//           : Array.isArray(data.leaveTypes)
//             ? data.leaveTypes
//             : Array.isArray(data.data)
//               ? data.data
//               : [];

//         setLeaveTypes(
//           types.filter(
//             (type) => type.isActive !== false && type.active !== false
//           )
//         );

//         const balanceResponse = await fetch(
//           "/api/backend/leaves/balance",
//           {
//             method: "GET",
//             credentials: "include",
//           }
//         );

//         const balanceData = await balanceResponse.json();

//         if (!balanceResponse.ok) {
//           throw new Error(
//             balanceData.message || "Unable to load leave balance."
//           );
//         }

//         const employeeBalances = Array.isArray(
//           balanceData.data?.balances
//         )
//           ? balanceData.data.balances
//           : Array.isArray(balanceData.balances)
//             ? balanceData.balances
//             : [];

//         setBalances(employeeBalances);
//       } catch (error) {
//         console.error("Leave data error:", error);
//         setMessage(error.message || "Unable to load leave data.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchLeaveData();
//   }, []);

//   const selectedLeaveType = useMemo(() => {
//     return (
//       leaveTypes.find(
//         (type) => String(type.id) === String(form.leaveType)
//       ) || null
//     );
//   }, [leaveTypes, form.leaveType]);

//   const selectedBalance = useMemo(() => {
//     if (!selectedLeaveType) return null;

//     return (
//       balances.find(
//         (balance) =>
//           String(balance.code || "").trim().toUpperCase() ===
//           String(selectedLeaveType.code || "").trim().toUpperCase()
//       ) || null
//     );
//   }, [balances, selectedLeaveType]);

//   const totalDays = useMemo(() => {
//     if (!form.startDate || !form.endDate) return 0;

//     const start = new Date(`${form.startDate}T00:00:00`);
//     const end = new Date(`${form.endDate}T00:00:00`);

//     if (end < start) return 0;

//     return (
//       Math.round(
//         (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
//       ) + 1
//     );
//   }, [form.startDate, form.endDate]);

//   const availableBalance = selectedBalance
//     ? Number(
//         selectedBalance.available ??
//           selectedBalance.remaining ??
//           selectedBalance.balance ??
//           0
//       )
//     : 0;

//   function handleChange(event) {
//     const { name, value } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));

//     setMessage("");
//     setSuccess(false);
//   }

//   async function refreshBalances() {
//     const response = await fetch("/api/backend/leaves/balance", {
//       method: "GET",
//       credentials: "include",
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(
//         data.message || "Unable to refresh leave balance."
//       );
//     }

//     const employeeBalances = Array.isArray(data.data?.balances)
//       ? data.data.balances
//       : Array.isArray(data.balances)
//         ? data.balances
//         : [];

//     setBalances(employeeBalances);
//   }

//   async function handleSubmit(event) {
//     event.preventDefault();

//     setMessage("");
//     setSuccess(false);

//     if (!form.leaveType) {
//       setMessage("Please select a leave type.");
//       return;
//     }

//     if (!form.startDate || !form.endDate) {
//       setMessage("Please select both dates.");
//       return;
//     }

//     if (form.startDate < todayString) {
//       setMessage("Start date cannot be in the past.");
//       return;
//     }

//     if (form.endDate < form.startDate) {
//       setMessage("End date cannot be before start date.");
//       return;
//     }

//     if (form.reason.trim().length < 5) {
//       setMessage("Please enter a reason of at least 5 characters.");
//       return;
//     }

//     if (!selectedLeaveType) {
//       setMessage("Selected leave type is unavailable.");
//       return;
//     }

//     if (!selectedBalance) {
//       setMessage("Leave balance is unavailable. Please refresh the page.");
//       return;
//     }

//     if (totalDays > availableBalance) {
//       setMessage(
//         `You have only ${availableBalance} days available for this leave type.`
//       );
//       return;
//     }

//     const leaveCode = String(
//       selectedLeaveType.code || ""
//     ).trim().toUpperCase();

//     const isQuarterlyLeave = [
//       "CASUAL",
//       "CL",
//       "CASUAL_LEAVE",
//       "WFH",
//       "WORK_FROM_HOME",
//     ].includes(leaveCode);

//     if (isQuarterlyLeave) {
//       const startQuarter =
//         Math.floor(
//           new Date(`${form.startDate}T00:00:00`).getMonth() / 3
//         ) + 1;

//       const endQuarter =
//         Math.floor(
//           new Date(`${form.endDate}T00:00:00`).getMonth() / 3
//         ) + 1;

//       if (
//         startQuarter !== currentQuarter ||
//         endQuarter !== currentQuarter
//       ) {
//         setMessage(
//           `You can apply for this leave only within the current quarter (Q${currentQuarter}).`
//         );
//         return;
//       }
//     }

//     try {
//       setSubmitting(true);

//       const response = await fetch("/api/backend/leaves", {
//         method: "POST",
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           leaveType: selectedLeaveType.code,
//           startDate: form.startDate,
//           endDate: form.endDate,
//           reason: form.reason.trim(),
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Leave application failed.");
//       }

//       setSuccess(true);
//       setMessage("Leave application submitted successfully!");

//       setForm({
//         leaveType: "",
//         startDate: "",
//         endDate: "",
//         reason: "",
//       });

//       await refreshBalances();
//     } catch (error) {
//       console.error("Apply leave error:", error);
//       setMessage(error.message || "Unable to connect to server.");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   async function handleLogout() {
//     try {
//       await fetch("/api/backend/auth/logout", {
//         method: "POST",
//         credentials: "include",
//       });
//     } catch (error) {
//       console.error("Logout request failed:", error);
//     } finally {
//       window.location.href = "/login";
//     }
//   }

//   return (
//     <main className="min-h-screen bg-slate-50 text-slate-900">
//       <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
//         <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center lg:px-8">
//           <Link href="/employee/dashboard" className="flex items-center gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-lg font-bold text-white">
//               E
//             </div>

//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-slate-900">
//                 ELMS
//               </h1>
//               <p className="text-xs text-slate-500">Employee Portal</p>
//             </div>
//           </Link>

//           <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
//             <Link
//               href="/employee/dashboard"
//               className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
//             >
//               Dashboard
//             </Link>

//             <Link
//               href="/employee/apply-leave"
//               className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800"
//             >
//               Apply Leave
//             </Link>

//             <Link
//               href="/employee/leave-history"
//               className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
//             >
//               Leave History
//             </Link>

//             <Link
//               href="/employee/profile"
//               className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
//             >
//               Profile
//             </Link>

//             <button
//               type="button"
//               onClick={handleLogout}
//               className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
//             >
//               Logout
//             </button>
//           </nav>
//         </div>
//       </header>

//       <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
//         <div className="mb-8 flex items-center gap-3">
//           <BackButton fallback="/employee/dashboard" />

//           <div>
//             <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
//               Employee Services
//             </p>

//             <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
//               Apply for Leave
//             </h2>

//             <p className="mt-2 text-slate-500">
//               Submit your leave request and track its approval status.
//             </p>
//           </div>
//         </div>

//         <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
//           <div className="border-b border-blue-100 bg-blue-50/70 px-6 py-5">
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">
//                 📋
//               </div>

//               <div>
//                 <h3 className="font-bold text-slate-900">Leave Policy</h3>
//                 <p className="text-sm text-slate-600">
//                   Understand your quarterly leave allocation.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="p-6">
//             <p className="mb-5 text-sm leading-6 text-slate-600">
//               Casual Leave and Work From Home are allocated quarterly.
//               Unused Sick Leave can carry forward within the current
//               calendar year.
//             </p>

//             <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
//               <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Current Quarter
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-blue-800">
//                   {currentQuarter ? `Q${currentQuarter}` : "--"}
//                 </p>
//               </div>

//               <div className="rounded-xl border border-slate-200 p-4">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Casual Leave
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
//                 <p className="text-xs text-slate-500">Days / Quarter</p>
//               </div>

//               <div className="rounded-xl border border-slate-200 p-4">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Sick Leave
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
//                 <p className="text-xs text-slate-500">Days / Quarter</p>
//               </div>

//               <div className="rounded-xl border border-slate-200 p-4">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Work From Home
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
//                 <p className="text-xs text-slate-500">Days / Quarter</p>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//           <div className="border-b border-slate-100 px-6 py-5 md:px-8">
//             <h3 className="text-xl font-bold text-slate-900">
//               Leave Application Form
//             </h3>
//             <p className="mt-1 text-sm text-slate-500">
//               Complete the details below to submit your request.
//             </p>
//           </div>

//           <div className="p-6 md:p-8">
//             {loading && (
//               <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
//                 <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
//                 Loading leave types and balances...
//               </div>
//             )}

//             {message && (
//               <div
//                 role="alert"
//                 className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${
//                   success
//                     ? "border-green-200 bg-green-50 text-green-800"
//                     : "border-red-200 bg-red-50 text-red-800"
//                 }`}
//               >
//                 <span className="text-lg">{success ? "✓" : "!"}</span>
//                 <p>{message}</p>
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-7">
//               <div>
//                 <label
//                   htmlFor="leaveType"
//                   className="mb-2 block text-sm font-semibold text-slate-700"
//                 >
//                   Leave Type <span className="text-red-500">*</span>
//                 </label>

//                 <select
//                   id="leaveType"
//                   name="leaveType"
//                   value={form.leaveType}
//                   onChange={handleChange}
//                   required
//                   disabled={loading}
//                   className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
//                 >
//                   <option value="">Select Leave Type</option>

//                   {leaveTypes.map((type) => (
//                     <option key={type.id} value={type.id}>
//                       {String(type.name || "").trim()}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {selectedLeaveType && (
//                 <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
//                   <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
//                     <div>
//                       <p className="text-sm font-semibold text-blue-900">
//                         Available Leave Balance
//                       </p>
//                       <p className="mt-1 text-xs text-blue-700">
//                         {selectedLeaveType.name} · Current Quarter Q{currentQuarter}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-white px-5 py-3 text-center shadow-sm">
//                       <p className="text-2xl font-bold text-blue-800">
//                         {selectedBalance ? `${availableBalance}` : "--"}
//                       </p>
//                       <p className="text-xs font-medium text-slate-500">
//                         Days Available
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <div>
//                   <label
//                     htmlFor="startDate"
//                     className="mb-2 block text-sm font-semibold text-slate-700"
//                   >
//                     Start Date <span className="text-red-500">*</span>
//                   </label>

//                   <input
//                     id="startDate"
//                     type="date"
//                     name="startDate"
//                     value={form.startDate}
//                     min={todayString}
//                     onChange={handleChange}
//                     required
//                     className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
//                   />
//                 </div>

//                 <div>
//                   <label
//                     htmlFor="endDate"
//                     className="mb-2 block text-sm font-semibold text-slate-700"
//                   >
//                     End Date <span className="text-red-500">*</span>
//                   </label>

//                   <input
//                     id="endDate"
//                     type="date"
//                     name="endDate"
//                     value={form.endDate}
//                     min={form.startDate || todayString}
//                     onChange={handleChange}
//                     required
//                     className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
//                   />
//                 </div>
//               </div>

//               <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
//                 <div>
//                   <p className="text-sm font-semibold text-slate-700">
//                     Total Leave Days
//                   </p>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Calculated automatically from the selected dates.
//                   </p>
//                 </div>

//                 <div className="rounded-lg bg-white px-5 py-3 text-center shadow-sm">
//                   <p className="text-2xl font-bold text-blue-800">
//                     {totalDays}
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     {totalDays === 1 ? "Day" : "Days"}
//                   </p>
//                 </div>
//               </div>

//               <div>
//                 <label
//                   htmlFor="reason"
//                   className="mb-2 block text-sm font-semibold text-slate-700"
//                 >
//                   Reason for Leave <span className="text-red-500">*</span>
//                 </label>

//                 <textarea
//                   id="reason"
//                   name="reason"
//                   value={form.reason}
//                   onChange={handleChange}
//                   required
//                   minLength={5}
//                   rows={4}
//                   placeholder="Explain why you are requesting leave..."
//                   className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
//                 />

//                 <p className="mt-2 text-xs text-slate-500">
//                   Please provide at least 5 characters.
//                 </p>
//               </div>

//               <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
//                 <Link
//                   href="/employee/dashboard"
//                   className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//                 >
//                   Cancel
//                 </Link>

//                 <button
//                   type="submit"
//                   disabled={loading || submitting || !todayString}
//                   className="rounded-xl bg-blue-800 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {submitting
//                     ? "Submitting..."
//                     : "Submit Leave Application"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </section>

//         <footer className="py-7 text-center text-sm text-slate-500">
//           © 2026 Employee Leave Management System
//         </footer>
//       </div>
//     </main>
//   );
// }
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function ApplyLeavePage() {
  const hasFetchedLeaveDataRef = useRef(false);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);

  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [todayString, setTodayString] = useState("");
  const [currentQuarter, setCurrentQuarter] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch leave data only once on initial page load
  useEffect(() => {
    if (hasFetchedLeaveDataRef.current) return;
    hasFetchedLeaveDataRef.current = true;

    const today = new Date();

    const dateString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    setTodayString(dateString);
    setCurrentQuarter(Math.floor(today.getMonth() / 3) + 1);

    async function fetchLeaveData() {
      try {
        setLoading(true);
        setMessage("");

        // Fetch leave types and balances simultaneously
        const [response, balanceResponse] = await Promise.all([
          fetch("/api/backend/leave-types", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),

          fetch("/api/backend/leaves/balance", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const [data, balanceData] = await Promise.all([
          response.json(),
          balanceResponse.json(),
        ]);

        if (!response.ok) {
          throw new Error(data.message || "Unable to load leave types.");
        }

        if (!balanceResponse.ok) {
          throw new Error(
            balanceData.message || "Unable to load leave balance."
          );
        }

        const types = Array.isArray(data.data?.leaveTypes)
          ? data.data.leaveTypes
          : Array.isArray(data.leaveTypes)
            ? data.leaveTypes
            : Array.isArray(data.data)
              ? data.data
              : [];

        setLeaveTypes(
          types.filter(
            (type) => type.isActive !== false && type.active !== false
          )
        );

        const employeeBalances = Array.isArray(
          balanceData.data?.balances
        )
          ? balanceData.data.balances
          : Array.isArray(balanceData.balances)
            ? balanceData.balances
            : [];

        setBalances(employeeBalances);
      } catch (error) {
        console.error("Leave data error:", error);
        setMessage(error.message || "Unable to load leave data.");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaveData();
  }, []);

  const selectedLeaveType = useMemo(() => {
    return (
      leaveTypes.find(
        (type) => String(type.id) === String(form.leaveType)
      ) || null
    );
  }, [leaveTypes, form.leaveType]);

  const selectedBalance = useMemo(() => {
    if (!selectedLeaveType) return null;

    return (
      balances.find(
        (balance) =>
          String(balance.code || "").trim().toUpperCase() ===
          String(selectedLeaveType.code || "").trim().toUpperCase()
      ) || null
    );
  }, [balances, selectedLeaveType]);

  const totalDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;

    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);

    if (end < start) return 0;

    return (
      Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  }, [form.startDate, form.endDate]);

  const availableBalance = selectedBalance
    ? Number(
        selectedBalance.available ??
          selectedBalance.remaining ??
          selectedBalance.balance ??
          0
      )
    : 0;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setSuccess(false);
  }

  // Refresh balance after successful leave application
  async function refreshBalances() {
    const response = await fetch("/api/backend/leaves/balance", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to refresh leave balance."
      );
    }

    const employeeBalances = Array.isArray(data.data?.balances)
      ? data.data.balances
      : Array.isArray(data.balances)
        ? data.balances
        : [];

    setBalances(employeeBalances);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!form.leaveType) {
      setMessage("Please select a leave type.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setMessage("Please select both dates.");
      return;
    }

    if (form.startDate < todayString) {
      setMessage("Start date cannot be in the past.");
      return;
    }

    if (form.endDate < form.startDate) {
      setMessage("End date cannot be before start date.");
      return;
    }

    if (form.reason.trim().length < 5) {
      setMessage("Please enter a reason of at least 5 characters.");
      return;
    }

    if (!selectedLeaveType) {
      setMessage("Selected leave type is unavailable.");
      return;
    }

    if (!selectedBalance) {
      setMessage("Leave balance is unavailable. Please refresh the page.");
      return;
    }

    if (totalDays > availableBalance) {
      setMessage(
        `You have only ${availableBalance} days available for this leave type.`
      );
      return;
    }

    const leaveCode = String(
      selectedLeaveType.code || ""
    ).trim().toUpperCase();

    const isQuarterlyLeave = [
      "CASUAL",
      "CL",
      "CASUAL_LEAVE",
      "WFH",
      "WORK_FROM_HOME",
    ].includes(leaveCode);

    if (isQuarterlyLeave) {
      const startQuarter =
        Math.floor(
          new Date(`${form.startDate}T00:00:00`).getMonth() / 3
        ) + 1;

      const endQuarter =
        Math.floor(
          new Date(`${form.endDate}T00:00:00`).getMonth() / 3
        ) + 1;

      if (
        startQuarter !== currentQuarter ||
        endQuarter !== currentQuarter
      ) {
        setMessage(
          `You can apply for this leave only within the current quarter (Q${currentQuarter}).`
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/backend/leaves", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveType: selectedLeaveType.code,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Leave application failed.");
      }

      setSuccess(true);
      setMessage("Leave application submitted successfully!");

      setForm({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      await refreshBalances();
    } catch (error) {
      console.error("Apply leave error:", error);
      setMessage(error.message || "Unable to connect to server.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/backend/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center lg:px-8">
          <Link href="/employee/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-lg font-bold text-white">
              E
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                ELMS
              </h1>
              <p className="text-xs text-slate-500">Employee Portal</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link
              href="/employee/dashboard"
              className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
            >
              Dashboard
            </Link>

            <Link
              href="/employee/apply-leave"
              className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800"
            >
              Apply Leave
            </Link>

            <Link
              href="/employee/leave-history"
              className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
            >
              Leave History
            </Link>

            <Link
              href="/employee/profile"
              className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
            >
              Profile
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-8 flex items-center gap-3">
          <BackButton fallback="/employee/dashboard" />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Employee Services
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Apply for Leave
            </h2>

            <p className="mt-2 text-slate-500">
              Submit your leave request and track its approval status.
            </p>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-blue-100 bg-blue-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">
                📋
              </div>

              <div>
                <h3 className="font-bold text-slate-900">Leave Policy</h3>
                <p className="text-sm text-slate-600">
                  Understand your quarterly leave allocation.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="mb-5 text-sm leading-6 text-slate-600">
              Casual Leave and Work From Home are allocated quarterly.
              Unused Sick Leave can carry forward within the current
              calendar year.
            </p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Current Quarter
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-800">
                  {currentQuarter ? `Q${currentQuarter}` : "--"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Casual Leave
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
                <p className="text-xs text-slate-500">Days / Quarter</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sick Leave
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
                <p className="text-xs text-slate-500">Days / Quarter</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Work From Home
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
                <p className="text-xs text-slate-500">Days / Quarter</p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 md:px-8">
            <h3 className="text-xl font-bold text-slate-900">
              Leave Application Form
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Complete the details below to submit your request.
            </p>
          </div>

          <div className="p-6 md:p-8">
            {loading && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                Loading leave types and balances...
              </div>
            )}

            {message && (
              <div
                role="alert"
                className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${
                  success
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <span className="text-lg">{success ? "✓" : "!"}</span>
                <p>{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label
                  htmlFor="leaveType"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Leave Type <span className="text-red-500">*</span>
                </label>

                <select
                  id="leaveType"
                  name="leaveType"
                  value={form.leaveType}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">Select Leave Type</option>

                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {String(type.name || "").trim()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLeaveType && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Available Leave Balance
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        {selectedLeaveType.name} · Current Quarter Q{currentQuarter}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-5 py-3 text-center shadow-sm">
                      <p className="text-2xl font-bold text-blue-800">
                        {selectedBalance ? `${availableBalance}` : "--"}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Days Available
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="startDate"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Start Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    min={todayString}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    End Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    min={form.startDate || todayString}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Total Leave Days
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Calculated automatically from the selected dates.
                  </p>
                </div>

                <div className="rounded-lg bg-white px-5 py-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-blue-800">
                    {totalDays}
                  </p>
                  <p className="text-xs text-slate-500">
                    {totalDays === 1 ? "Day" : "Days"}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Reason for Leave <span className="text-red-500">*</span>
                </label>

                <textarea
                  id="reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                  minLength={5}
                  rows={4}
                  placeholder="Explain why you are requesting leave..."
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Please provide at least 5 characters.
                </p>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                <Link
                  href="/employee/dashboard"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading || submitting || !todayString}
                  className="rounded-xl bg-blue-800 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Leave Application"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <footer className="py-7 text-center text-sm text-slate-500">
          © 2026 Employee Leave Management System
        </footer>
      </div>
    </main>
  );
}
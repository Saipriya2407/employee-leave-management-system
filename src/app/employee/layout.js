
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { usePathname } from "next/navigation";
// import Link from "next/link";

// const employeeMenu = [
//   {
//     name: "Dashboard",
//     href: "/employee/dashboard",
//     icon: "📊",
//   },
//   {
//     name: "Apply Leave",
//     href: "/employee/apply-leave",
//     icon: "📝",
//   },
//   {
//     name: "Leave History",
//     href: "/employee/leave-history",
//     icon: "📋",
//   },
//   {
//     name: "Profile",
//     href: "/employee/profile",
//     icon: "👤",
//   },
// ];

// // Format holiday dates consistently using UTC
// function getHolidayKey(value) {
//   if (!value) return "";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) return "";

//   return date.toISOString().slice(0, 10);
// }

// export default function EmployeeLayout({ children }) {
//   const pathname = usePathname();

//   const [holidays, setHolidays] = useState([]);
//   const [currentMonth, setCurrentMonth] = useState(null);
//   const [today, setToday] = useState(null);

//   // Fetch holidays
//   useEffect(() => {
//     const now = new Date();

//     setToday(now);
//     setCurrentMonth(now);

//     async function fetchHolidays() {
//       try {
//         const response = await fetch("/api/holidays", {
//           method: "GET",
//           credentials: "include",
//           cache: "no-store",
//         });

//         // Read response only once
//         const data = await response.json();

//         console.log("Employee holiday API response:", data);

//         if (!response.ok || !data.success) {
//           console.error("Holiday API error:", data.message);
//           setHolidays([]);
//           return;
//         }

//         setHolidays(
//           Array.isArray(data.holidays) ? data.holidays : []
//         );
//       } catch (error) {
//         console.error("Unable to load calendar holidays:", error);
//         setHolidays([]);
//       }
//     }

//     fetchHolidays();
//   }, []);

//   // Generate calendar days
//   const calendarDays = useMemo(() => {
//     if (!currentMonth) return [];

//     const year = currentMonth.getFullYear();
//     const month = currentMonth.getMonth();

//     const firstDay = new Date(year, month, 1).getDay();
//     const totalDays = new Date(year, month + 1, 0).getDate();

//     const days = [];

//     for (let i = 0; i < firstDay; i++) {
//       days.push(null);
//     }

//     for (let day = 1; day <= totalDays; day++) {
//       days.push(day);
//     }

//     return days;
//   }, [currentMonth]);

//   // Create holiday map
//   const holidayMap = useMemo(() => {
//     const map = {};

//     holidays.forEach((holiday) => {
//       const key = getHolidayKey(holiday.date);

//       if (key) {
//         map[key] = [...(map[key] || []), holiday.name];
//       }
//     });

//     return map;
//   }, [holidays]);

//   // Change calendar month
//   function changeMonth(amount) {
//     setCurrentMonth((previous) => {
//       if (!previous) return new Date();

//       return new Date(
//         previous.getFullYear(),
//         previous.getMonth() + amount,
//         1
//       );
//     });
//   }

//   const isCurrentMonth =
//     today !== null &&
//     currentMonth !== null &&
//     today.getFullYear() === currentMonth.getFullYear() &&
//     today.getMonth() === currentMonth.getMonth();

//   const monthLabel = currentMonth
//     ? currentMonth.toLocaleDateString("en-IN", {
//         month: "long",
//         year: "numeric",
//       })
//     : "Loading...";

//   // Logout
//   async function handleLogout() {
//     try {
//       await fetch("/api/backend/auth/logout", {
//         method: "POST",
//         credentials: "include",
//       });
//     } catch (error) {
//       console.error("Logout failed:", error);
//     } finally {
//       window.location.href = "/login";
//     }
//   }

//   return (
//     <div className="h-screen overflow-hidden bg-gray-100">

//       {/* Desktop Sidebar */}
//       <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-blue-950 text-white md:flex">

//         {/* Logo */}
//         <div className="border-b border-blue-900 p-6">
//           <Link href="/employee/dashboard">
//             <h1 className="text-2xl font-bold">ELMS</h1>
//             <p className="mt-1 text-sm text-blue-200">
//               Employee Portal
//             </p>
//           </Link>
//         </div>

//         {/* Navigation and Calendar */}
//         <div className="flex-1 space-y-5 overflow-y-auto p-4">

//           {/* Navigation */}
//           <nav className="space-y-2">
//             {employeeMenu.map((item) => {
//               const active = pathname === item.href;

//               return (
//                 <Link
//                   key={item.href}
//                   href={item.href}
//                   className={`block rounded-lg px-4 py-3 transition ${
//                     active
//                       ? "bg-blue-700 font-semibold text-white"
//                       : "text-blue-100 hover:bg-blue-900"
//                   }`}
//                 >
//                   {item.icon} {item.name}
//                 </Link>
//               );
//             })}
//           </nav>

//           {/* Monthly Holiday Calendar */}
//           <div className="rounded-xl bg-white p-3 text-gray-800 shadow">

//             {/* Month Navigation */}
//             <div className="mb-3 flex items-center justify-between">
//               <button
//                 type="button"
//                 onClick={() => changeMonth(-1)}
//                 className="rounded-md px-2 py-1 text-lg text-blue-900 hover:bg-blue-100"
//                 aria-label="Previous month"
//               >
//                 ‹
//               </button>

//               <h2 className="text-sm font-bold">
//                 {monthLabel}
//               </h2>

//               <button
//                 type="button"
//                 onClick={() => changeMonth(1)}
//                 className="rounded-md px-2 py-1 text-lg text-blue-900 hover:bg-blue-100"
//                 aria-label="Next month"
//               >
//                 ›
//               </button>
//             </div>

//             {/* Week Days */}
//             <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
//               {["S", "M", "T", "W", "T", "F", "S"].map(
//                 (day, index) => (
//                   <div key={index} className="py-1">
//                     {day}
//                   </div>
//                 )
//               )}
//             </div>

//             {/* Calendar Dates */}
//             <div className="grid grid-cols-7 gap-y-1 text-center">
//               {calendarDays.map((day, index) => {
//                 if (day === null) {
//                   return <div key={`empty-${index}`} />;
//                 }

//                 const key = [
//                   currentMonth.getFullYear(),
//                   String(currentMonth.getMonth() + 1).padStart(2, "0"),
//                   String(day).padStart(2, "0"),
//                 ].join("-");

//                 const dayHolidays = holidayMap[key] || [];
//                 const isHoliday = dayHolidays.length > 0;

//                 const isToday =
//                   today !== null &&
//                   isCurrentMonth &&
//                   today.getDate() === day;

//                 return (
//                   <div
//                     key={key}
//                     title={dayHolidays.join(", ")}
//                     className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs ${
//                       isToday
//                         ? "bg-blue-700 font-bold text-white"
//                         : isHoliday
//                           ? "bg-red-100 font-bold text-red-700"
//                           : "text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     {day}

//                     {isHoliday && (
//                       <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-red-600" />
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             {/* Calendar Legend */}
//             <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-600">
//               <span className="flex items-center gap-1">
//                 <span className="h-2 w-2 rounded-full bg-blue-700" />
//                 Today
//               </span>

//               <span className="flex items-center gap-1">
//                 <span className="h-2 w-2 rounded-full bg-red-600" />
//                 Holiday
//               </span>
//             </div>

//             {/* Holidays This Month */}
//             <div className="mt-3 border-t border-gray-200 pt-2">
//               <p className="mb-2 text-xs font-bold text-gray-700">
//                 Holidays this month
//               </p>

//               {!currentMonth ? (
//                 <p className="text-xs text-gray-500">
//                   Loading calendar...
//                 </p>
//               ) : holidays.filter((holiday) => {
//                   const key = getHolidayKey(holiday.date);

//                   return key.startsWith(
//                     `${currentMonth.getFullYear()}-${String(
//                       currentMonth.getMonth() + 1
//                     ).padStart(2, "0")}-`
//                   );
//                 }).length === 0 ? (
//                 <p className="text-xs text-gray-500">
//                   No holidays this month.
//                 </p>
//               ) : (
//                 <div className="max-h-24 space-y-2 overflow-y-auto">
//                   {holidays
//                     .filter((holiday) => {
//                       const key = getHolidayKey(holiday.date);

//                       return key.startsWith(
//                         `${currentMonth.getFullYear()}-${String(
//                           currentMonth.getMonth() + 1
//                         ).padStart(2, "0")}-`
//                       );
//                     })
//                     .map((holiday) => (
//                       <div key={holiday.id} className="text-xs">
//                         <p className="font-medium text-gray-800">
//                           {holiday.name}
//                         </p>

//                         <p className="text-gray-500">
//                           {new Date(holiday.date).toLocaleDateString(
//                             "en-IN",
//                             {
//                               day: "2-digit",
//                               month: "short",
//                               timeZone: "UTC",
//                             }
//                           )}
//                         </p>
//                       </div>
//                     ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Logout */}
//         <div className="border-t border-blue-900 p-4">
//           <button
//             onClick={handleLogout}
//             className="w-full rounded-lg px-4 py-3 text-left hover:bg-red-700"
//           >
//             🚪 Logout
//           </button>
//         </div>
//       </aside>

//       {/* Mobile Navigation */}
//       <div className="border-b bg-blue-950 p-3 text-white md:hidden">
//         <div className="mb-3 text-lg font-bold">
//           ELMS Employee
//         </div>

//         <nav className="flex gap-2 overflow-x-auto">
//           {employeeMenu.map((item) => (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
//                 pathname === item.href
//                   ? "bg-blue-700"
//                   : "bg-blue-900"
//               }`}
//             >
//               {item.icon} {item.name}
//             </Link>
//           ))}

//           <button
//             onClick={handleLogout}
//             className="shrink-0 rounded-lg bg-red-700 px-3 py-2 text-sm"
//           >
//             Logout
//           </button>
//         </nav>
//       </div>

//       {/* Independently Scrolling Page Content */}
//       <main className="h-[calc(100dvh-80px)] overflow-y-auto md:ml-64 md:h-dvh">
//         {children}
//       </main>
//     </div>
//   );
// }
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const employeeMenu = [
  {
    name: "Dashboard",
    href: "/employee/dashboard",
    icon: "📊",
  },
  {
    name: "Apply Leave",
    href: "/employee/apply-leave",
    icon: "📝",
  },
  {
    name: "Leave History",
    href: "/employee/leave-history",
    icon: "📋",
  },
  {
    name: "Profile",
    href: "/employee/profile",
    icon: "👤",
  },
];

function getHolidayKey(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export default function EmployeeLayout({ children }) {
  const pathname = usePathname();

  const hasFetchedHolidaysRef = useRef(false);

  const [holidays, setHolidays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [today, setToday] = useState(null);

  // Fetch holidays only once
  useEffect(() => {
    if (hasFetchedHolidaysRef.current) return;

    hasFetchedHolidaysRef.current = true;

    const now = new Date();

    setToday(now);
    setCurrentMonth(now);

    async function fetchHolidays() {
      try {
        const response = await fetch("/api/holidays", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        console.log("Employee holiday API response:", data);

        if (!response.ok || !data.success) {
          console.error("Holiday API error:", data.message);
          setHolidays([]);
          return;
        }

        setHolidays(
          Array.isArray(data.holidays) ? data.holidays : []
        );
      } catch (error) {
        console.error("Unable to load calendar holidays:", error);
        setHolidays([]);
      }
    }

    fetchHolidays();
  }, []);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    if (!currentMonth) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  }, [currentMonth]);

  // Create holiday map
  const holidayMap = useMemo(() => {
    const map = {};

    holidays.forEach((holiday) => {
      const key = getHolidayKey(holiday.date);

      if (key) {
        map[key] = [...(map[key] || []), holiday.name];
      }
    });

    return map;
  }, [holidays]);

  // Change calendar month
  function changeMonth(amount) {
    setCurrentMonth((previous) => {
      if (!previous) return new Date();

      return new Date(
        previous.getFullYear(),
        previous.getMonth() + amount,
        1
      );
    });
  }

  const isCurrentMonth =
    today !== null &&
    currentMonth !== null &&
    today.getFullYear() === currentMonth.getFullYear() &&
    today.getMonth() === currentMonth.getMonth();

  const monthLabel = currentMonth
    ? currentMonth.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Loading...";

  // Logout
  async function handleLogout() {
    try {
      await fetch("/api/backend/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-100">

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-blue-950 text-white md:flex">

        {/* Logo */}
        <div className="border-b border-blue-900 p-6">
          <Link href="/employee/dashboard">
            <h1 className="text-2xl font-bold">ELMS</h1>
            <p className="mt-1 text-sm text-blue-200">
              Employee Portal
            </p>
          </Link>
        </div>

        {/* Navigation and Calendar */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4">

          {/* Navigation */}
          <nav className="space-y-2">
            {employeeMenu.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-4 py-3 transition ${
                    active
                      ? "bg-blue-700 font-semibold text-white"
                      : "text-blue-100 hover:bg-blue-900"
                  }`}
                >
                  {item.icon} {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Monthly Holiday Calendar */}
          <div className="rounded-xl bg-white p-3 text-gray-800 shadow">

            {/* Month Navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="rounded-md px-2 py-1 text-lg text-blue-900 hover:bg-blue-100"
                aria-label="Previous month"
              >
                ‹
              </button>

              <h2 className="text-sm font-bold">
                {monthLabel}
              </h2>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="rounded-md px-2 py-1 text-lg text-blue-900 hover:bg-blue-100"
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            {/* Week Days */}
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
              {["S", "M", "T", "W", "T", "F", "S"].map(
                (day, index) => (
                  <div key={index} className="py-1">
                    {day}
                  </div>
                )
              )}
            </div>

            {/* Calendar Dates */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const key = [
                  currentMonth.getFullYear(),
                  String(currentMonth.getMonth() + 1).padStart(2, "0"),
                  String(day).padStart(2, "0"),
                ].join("-");

                const dayHolidays = holidayMap[key] || [];
                const isHoliday = dayHolidays.length > 0;

                const isToday =
                  today !== null &&
                  isCurrentMonth &&
                  today.getDate() === day;

                return (
                  <div
                    key={key}
                    title={dayHolidays.join(", ")}
                    className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-blue-700 font-bold text-white"
                        : isHoliday
                          ? "bg-red-100 font-bold text-red-700"
                          : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {day}

                    {isHoliday && (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-red-600" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-600">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-700" />
                Today
              </span>

              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-600" />
                Holiday
              </span>
            </div>

            {/* Holidays This Month */}
            <div className="mt-3 border-t border-gray-200 pt-2">
              <p className="mb-2 text-xs font-bold text-gray-700">
                Holidays this month
              </p>

              {!currentMonth ? (
                <p className="text-xs text-gray-500">
                  Loading calendar...
                </p>
              ) : holidays.filter((holiday) => {
                  const key = getHolidayKey(holiday.date);

                  return key.startsWith(
                    `${currentMonth.getFullYear()}-${String(
                      currentMonth.getMonth() + 1
                    ).padStart(2, "0")}-`
                  );
                }).length === 0 ? (
                <p className="text-xs text-gray-500">
                  No holidays this month.
                </p>
              ) : (
                <div className="max-h-24 space-y-2 overflow-y-auto">
                  {holidays
                    .filter((holiday) => {
                      const key = getHolidayKey(holiday.date);

                      return key.startsWith(
                        `${currentMonth.getFullYear()}-${String(
                          currentMonth.getMonth() + 1
                        ).padStart(2, "0")}-`
                      );
                    })
                    .map((holiday) => (
                      <div key={holiday.id} className="text-xs">
                        <p className="font-medium text-gray-800">
                          {holiday.name}
                        </p>

                        <p className="text-gray-500">
                          {new Date(holiday.date).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              timeZone: "UTC",
                            }
                          )}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-blue-900 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-4 py-3 text-left hover:bg-red-700"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="border-b bg-blue-950 p-3 text-white md:hidden">
        <div className="mb-3 text-lg font-bold">
          ELMS Employee
        </div>

        <nav className="flex gap-2 overflow-x-auto">
          {employeeMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
                pathname === item.href
                  ? "bg-blue-700"
                  : "bg-blue-900"
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="shrink-0 rounded-lg bg-red-700 px-3 py-2 text-sm"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Independently Scrolling Page Content */}
      <main className="h-[calc(100dvh-80px)] overflow-y-auto md:ml-64 md:h-dvh">
        {children}
      </main>
    </div>
  );
}
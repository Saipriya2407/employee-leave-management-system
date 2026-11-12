
// "use client";

// import Link from "next/link";
// import { useState } from "react";

// export default function AdminEmployeesPage() {
//   const [search, setSearch] = useState("");
//   const [department, setDepartment] = useState("All");

//   // Sample employees for frontend design
//   const employees = [
//     {
//       id: "EMP001",
//       name: "Manikanta Reddy",
//       email: "manikanta@example.com",
//       department: "IT",
//       role: "Employee",
//     },
//     {
//       id: "EMP002",
//       name: "Kishore Kumar",
//       email: "kishore@example.com",
//       department: "HR",
//       role: "Employee",
//     },
//     {
//       id: "EMP003",
//       name: "Tharanya",
//       email: "tharanya@example.com",
//       department: "Finance",
//       role: "Employee",
//     },
//     {
//       id: "EMP004",
//       name: "Rahul Sharma",
//       email: "rahul@example.com",
//       department: "IT",
//       role: "Employee",
//     },
//     {
//       id: "EMP005",
//       name: "Priya",
//       email: "priya@example.com",
//       department: "Marketing",
//       role: "Employee",
//     },
//   ];

//   const filteredEmployees = employees.filter((employee) => {
//     const matchesSearch =
//       employee.name.toLowerCase().includes(search.toLowerCase()) ||
//       employee.email.toLowerCase().includes(search.toLowerCase()) ||
//       employee.id.toLowerCase().includes(search.toLowerCase());

//     const matchesDepartment =
//       department === "All" || employee.department === department;

//     return matchesSearch && matchesDepartment;
//   });

//   return (
//     <div className="min-h-screen bg-gray-100">

//       {/* Sidebar */}
//       <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-blue-950 text-white md:block">

//         <div className="border-b border-blue-900 p-6">

//           <h1 className="text-2xl font-bold">
//             ELMS
//           </h1>

//           <p className="mt-1 text-sm text-blue-200">
//             Admin Portal
//           </p>

//         </div>

//         <nav className="space-y-2 p-4">

//           <Link
//             href="/admin/dashboard"
//             className="block rounded-lg px-4 py-3 hover:bg-blue-900"
//           >
//             📊 Dashboard
//           </Link>

//           <Link
//             href="/admin/employees"
//             className="block rounded-lg bg-blue-700 px-4 py-3"
//           >
//             👥 Employees
//           </Link>

//           <Link
//             href="/admin/leave-applications"
//             className="block rounded-lg px-4 py-3 hover:bg-blue-900"
//           >
//             📋 Leave Applications
//           </Link>

//         </nav>

//         <div className="absolute bottom-0 w-full border-t border-blue-900 p-4">

//           <button
//             onClick={() => {
//               window.location.href = "/login";
//             }}
//             className="w-full rounded-lg px-4 py-3 text-left hover:bg-red-700"
//           >
//             🚪 Logout
//           </button>

//         </div>

//       </aside>

//       {/* Main Content */}
//       <main className="md:ml-64">

//         {/* Header */}
//         <header className="flex flex-col justify-between gap-4 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center">

//           <div>

//             <h2 className="text-2xl font-bold text-gray-900">
//               Employee Management
//             </h2>

//             <p className="mt-1 text-sm text-gray-500">
//               View and manage registered employees.
//             </p>

//           </div>

//           <Link
//             href="/admin/dashboard"
//             className="rounded-lg bg-blue-700 px-5 py-2.5 text-center font-semibold text-white hover:bg-blue-800"
//           >
//             ← Back to Dashboard
//           </Link>

//         </header>

//         {/* Content */}
//         <div className="space-y-6 p-6">

//           {/* Employee Summary */}
//           <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">

//             <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

//               <p className="text-sm text-gray-500">
//                 Total Employees
//               </p>

//               <h3 className="mt-2 text-3xl font-bold text-gray-900">
//                 {employees.length}
//               </h3>

//             </div>

//             <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

//               <p className="text-sm text-gray-500">
//                 Departments
//               </p>

//               <h3 className="mt-2 text-3xl font-bold text-gray-900">
//                 {new Set(employees.map((e) => e.department)).size}
//               </h3>

//             </div>

//             <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

//               <p className="text-sm text-gray-500">
//                 Employees Displayed
//               </p>

//               <h3 className="mt-2 text-3xl font-bold text-gray-900">
//                 {filteredEmployees.length}
//               </h3>

//             </div>

//           </section>

//           {/* Employee Table */}
//           <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

//             <div className="border-b p-5">

//               <h2 className="text-xl font-bold text-gray-900">
//                 All Employees
//               </h2>

//               <p className="mt-1 text-sm text-gray-500">
//                 Search employees or filter by department.
//               </p>

//               {/* Search and Filter */}
//               <div className="mt-5 flex flex-col gap-4 sm:flex-row">

//                 <input
//                   type="text"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search name, email or employee ID"
//                   className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 sm:flex-1"
//                 />

//                 <select
//                   value={department}
//                   onChange={(e) => setDepartment(e.target.value)}
//                   className="rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600"
//                 >

//                   <option value="All">
//                     All Departments
//                   </option>

//                   <option value="IT">
//                     IT
//                   </option>

//                   <option value="HR">
//                     Human Resources
//                   </option>

//                   <option value="Finance">
//                     Finance
//                   </option>

//                   <option value="Marketing">
//                     Marketing
//                   </option>

//                 </select>

//               </div>

//             </div>

//             {/* Table */}
//             <div className="overflow-x-auto">

//               <table className="w-full text-left">

//                 <thead className="bg-gray-50 text-sm text-gray-600">

//                   <tr>

//                     <th className="px-5 py-4">
//                       Employee ID
//                     </th>

//                     <th className="px-5 py-4">
//                       Employee
//                     </th>

//                     <th className="px-5 py-4">
//                       Email
//                     </th>

//                     <th className="px-5 py-4">
//                       Department
//                     </th>

//                     <th className="px-5 py-4">
//                       Role
//                     </th>

//                   </tr>

//                 </thead>

//                 <tbody>

//                   {filteredEmployees.length > 0 ? (

//                     filteredEmployees.map((employee) => (

//                       <tr
//                         key={employee.id}
//                         className="border-t hover:bg-gray-50"
//                       >

//                         <td className="whitespace-nowrap px-5 py-4 font-medium text-blue-700">
//                           {employee.id}
//                         </td>

//                         <td className="whitespace-nowrap px-5 py-4">

//                           <div className="flex items-center gap-3">

//                             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

//                               {employee.name.charAt(0)}

//                             </div>

//                             <span className="font-medium text-gray-900">
//                               {employee.name}
//                             </span>

//                           </div>

//                         </td>

//                         <td className="whitespace-nowrap px-5 py-4 text-gray-600">
//                           {employee.email}
//                         </td>

//                         <td className="whitespace-nowrap px-5 py-4 text-gray-600">
//                           {employee.department}
//                         </td>

//                         <td className="whitespace-nowrap px-5 py-4">

//                           <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
//                             {employee.role}
//                           </span>

//                         </td>

//                       </tr>

//                     ))

//                   ) : (

//                     <tr>

//                       <td
//                         colSpan={5}
//                         className="px-5 py-10 text-center text-gray-500"
//                       >
//                         No employees found.
//                       </td>

//                     </tr>

//                   )}

//                 </tbody>

//               </table>

//             </div>

//             {/* Footer */}
//             <div className="border-t px-5 py-4 text-sm text-gray-500">

//               Showing {filteredEmployees.length} of {employees.length} employees

//             </div>

//           </section>

//           {/* Page Footer */}
//           <footer className="py-4 text-center text-sm text-gray-500">

//             Employee Leave Management System © 2026

//           </footer>

//         </div>

//       </main>

//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch actual employees from the backend
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please login as admin.");
        }

        const response = await fetch("/api/admin/employees", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to fetch employees."
          );
        }

        // Backend should return: { employees: [...] }
        setEmployees(
          Array.isArray(data.employees) ? data.employees : []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  // Search and department filtering
  const filteredEmployees = employees.filter((employee) => {
    const name = employee.fullName || employee.name || "";
    const email = employee.email || "";
    const employeeId =
      employee.employeeId || employee.id || "";

    const searchText = search.toLowerCase();

    const matchesSearch =
      name.toLowerCase().includes(searchText) ||
      email.toLowerCase().includes(searchText) ||
      String(employeeId).toLowerCase().includes(searchText);

    const matchesDepartment =
      department === "All" ||
      employee.department === department;

    return matchesSearch && matchesDepartment;
  });

  // Get departments from actual employee data
  const departments = [
    "All",
    ...new Set(
      employees
        .map((employee) => employee.department)
        .filter(Boolean)
    ),
  ];

  return (
    <div className="min-h-screen bg-gray-100 md:flex">

      {/* Sidebar */}
      <aside className="w-full bg-gray-900 text-white md:min-h-screen md:w-64">
        <div className="border-b border-gray-700 p-6">
          <h1 className="text-2xl font-bold">
            ELMS Admin
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Employee Leave Management
          </p>
        </div>

        <nav className="space-y-2 p-4">
          <Link
            href="/admin/dashboard"
            className="block rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/employees"
            className="block rounded-lg bg-blue-600 px-4 py-3 font-medium text-white"
          >
            Employees
          </Link>

          <Link
            href="/admin/leave-applications"
            className="block rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            Leave Applications
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Employees
            </h2>

            <p className="mt-2 text-gray-500">
              View and manage registered employees.
            </p>
          </div>

          <div className="rounded-lg bg-white px-5 py-3 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Employees
            </p>

            <p className="text-2xl font-bold text-blue-600">
              {employees.length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search Employees
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email or employee ID"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Department
              </label>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="border-b p-5">
            <h3 className="text-lg font-semibold text-gray-800">
              Registered Employees
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredEmployees.length} employees
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-10 text-center">
              <p className="text-gray-500">
                Loading employees...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-8 text-center">
              <p className="font-medium text-red-600">
                {error}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Please check your login and backend API.
              </p>
            </div>
          )}

          {/* Empty Data */}
          {!loading &&
            !error &&
            filteredEmployees.length === 0 && (
              <div className="p-10 text-center">
                <p className="font-medium text-gray-700">
                  No employees found.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Employees registered in the system will appear here.
                </p>
              </div>
            )}

          {/* Employee Data */}
          {!loading &&
            !error &&
            filteredEmployees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">

                  <thead className="bg-gray-50 text-sm text-gray-600">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Role</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {filteredEmployees.map((employee, index) => {
                      const name =
                        employee.fullName ||
                        employee.name ||
                        "Unknown";

                      const email = employee.email || "N/A";

                      const employeeId =
                        employee.employeeId ||
                        employee.id ||
                        "N/A";

                      const employeeDepartment =
                        employee.department || "N/A";

                      const role =
                        employee.role || "EMPLOYEE";

                      return (
                        <tr
                          key={employee.id || employee.employeeId || index}
                          className="hover:bg-gray-50"
                        >
                          {/* Employee Name and Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                                {name.charAt(0).toUpperCase()}
                              </div>

                              <div>
                                <p className="font-medium text-gray-800">
                                  {name}
                                </p>

                                <p className="text-sm text-gray-500">
                                  {email}
                                </p>
                              </div>

                            </div>
                          </td>

                          {/* Employee ID */}
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {employeeId}
                          </td>

                          {/* Department */}
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                              {employeeDepartment}
                            </span>
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                role.toUpperCase() === "ADMIN"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {role}
                            </span>
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>
                </table>
              </div>
            )}

        </div>

      </main>
    </div>
  );
}

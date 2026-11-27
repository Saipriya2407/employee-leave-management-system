"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/backend/admin/employees?page=${currentPage}&limit=10`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch employees"
          );
        }

        const result = data.data;

        const employeeList = Array.isArray(result?.employees)
          ? result.employees
          : Array.isArray(result)
            ? result
            : Array.isArray(data)
              ? data
              : [];

        setEmployees(employeeList);

        const pagination = result?.pagination;

        setTotalEmployees(
          pagination?.total ?? employeeList.length
        );

        setTotalPages(
          pagination?.totalPages ?? 1
        );
      } catch (err) {
        console.error("Fetch employees error:", err);
        setError(err.message || "Unable to load employees.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [currentPage]);

  const departments = useMemo(() => {
    return [
      "All",
      ...new Set(
        employees
          .map((employee) => employee.department)
          .filter(Boolean)
      ),
    ];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const name =
        employee.fullName ||
        employee.name ||
        "";

      const email = employee.email || "";

      const employeeCode =
        employee.employeeCode ||
        employee.employeeId ||
        employee.id ||
        "";

      const department = employee.department || "";

      const searchText = search.toLowerCase();

      const matchesSearch = [
        name,
        email,
        employeeCode,
      ].some((value) =>
        String(value).toLowerCase().includes(searchText)
      );

      const matchesDepartment =
        departmentFilter === "All" ||
        department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, departmentFilter]);

  function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <BackButton fallback="/admin/dashboard" />

            <h1 className="text-3xl font-bold text-gray-800">
              Employees
            </h1>
          </div>

          <p className="mt-1 ml-11 text-gray-500">
            View and manage all registered employees.
          </p>
        </div>

        {/* Total Employees */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Employees
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-900">
            {loading ? "..." : totalEmployees}
          </p>
        </div>

        {/* Search and Department Filter */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:flex-row">
          <input
            type="text"
            placeholder="Search by name, email or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-500 sm:min-w-52"
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department === "All"
                  ? "All Departments"
                  : department}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Employee List
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredEmployees.length} employees on page{" "}
              {currentPage}
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading employees...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-600">
              {error}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No employees found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Employee
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Employee ID
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Department
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Role
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((employee, index) => {
                    const name =
                      employee.fullName ||
                      employee.name ||
                      "N/A";

                    const employeeCode =
                      employee.employeeCode ||
                      employee.employeeId ||
                      employee.id ||
                      "N/A";

                    return (
                      <tr
                        key={employee.id || employeeCode || index}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-800">
                            {name}
                          </div>

                          <div className="text-sm text-gray-500">
                            {employee.email || "N/A"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          {employeeCode}
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          {employee.department || "N/A"}
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          {employee.role || "EMPLOYEE"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold ${
                      currentPage === page
                        ? "bg-blue-900 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

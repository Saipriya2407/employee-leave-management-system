
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function AdminLeaveApplications() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch leave applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/backend/leaves", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      console.log("Admin Leave API Response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch leave applications."
        );
      }

      const result = data.data ?? data;

      const leaves = Array.isArray(result)
        ? result
        : Array.isArray(result.leaves)
        ? result.leaves
        : Array.isArray(result.applications)
        ? result.applications
        : [];

      setApplications(leaves);
    } catch (err) {
      console.error("Fetch leave applications error:", err);
      setError(err.message || "Unable to load leave applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Employee name
  function getEmployeeName(application) {
    return (
      application.user?.fullName ||
      application.employee?.fullName ||
      application.employee?.name ||
      application.employeeName ||
      application.fullName ||
      "Name unavailable"
    );
  }

  // Employee email
  function getEmployeeEmail(application) {
    return (
      application.user?.email ||
      application.employee?.email ||
      application.email ||
      "Email unavailable"
    );
  }

  // Employee department
  function getDepartment(application) {
    return (
      application.user?.department ||
      application.employee?.department ||
      application.department ||
      "N/A"
    );
  }

  // Employee code
  function getEmployeeCode(application) {
    return (
      application.user?.employeeCode ||
      application.employee?.employeeCode ||
      "N/A"
    );
  }

  // Leave type
  function getLeaveType(application) {
    return (
      application.leaveType?.name ||
      application.leaveTypeName ||
      (typeof application.leaveType === "string"
        ? application.leaveType
        : null) ||
      application.type ||
      "N/A"
    );
  }

  // Date formatting
  function formatDate(date) {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Leave dates
  function getLeaveDates(application) {
    const start = application.startDate || application.fromDate;
    const end = application.endDate || application.toDate;

    if (!start || !end) return "N/A";

    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  // Leave days
  function getLeaveDays(application) {
    if (application.totalDays !== undefined) {
      return application.totalDays;
    }

    if (application.days !== undefined) {
      return application.days;
    }

    const start = application.startDate || application.fromDate;
    const end = application.endDate || application.toDate;

    if (start && end) {
      const difference =
        Math.round(
          (new Date(end).getTime() - new Date(start).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      return difference > 0 ? difference : 0;
    }

    return "N/A";
  }

  // Status styling
  function getStatusClass(status) {
    const currentStatus = String(status || "").toUpperCase();

    if (currentStatus === "APPROVED") {
      return "bg-green-100 text-green-700";
    }

    if (currentStatus === "REJECTED") {
      return "bg-red-100 text-red-700";
    }

    if (
      currentStatus === "CANCELLED" ||
      currentStatus === "CANCELED"
    ) {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  // Approve or reject leave application
  async function updateLeaveStatus(application, newStatus) {
    const leaveId = application.id || application.leaveId;

    if (!leaveId) {
      setError("Leave application ID is missing.");
      return;
    }

    let adminRemarks = "";

    if (newStatus === "REJECTED") {
      const enteredRemarks = window.prompt(
        "Enter the reason for rejecting this leave application:"
      );

      if (enteredRemarks === null) return;

      adminRemarks = enteredRemarks.trim();

      if (!adminRemarks) {
        alert("Admin remarks are required.");
        return;
      }
    } else {
      if (
        !window.confirm(
          "Are you sure you want to approve this leave application?"
        )
      ) {
        return;
      }
    }

    try {
      setUpdatingId(leaveId);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/backend/admin/leaves/${encodeURIComponent(leaveId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            ...(newStatus === "REJECTED"
              ? { adminRemarks }
              : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update leave status."
        );
      }

      setMessage(
        newStatus === "APPROVED"
          ? "Leave application approved successfully."
          : "Leave application rejected successfully."
      );

      await fetchApplications();
    } catch (err) {
      console.error("Update leave error:", err);
      setError(err.message || "Unable to update leave status.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Search and filter
  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const employeeName = getEmployeeName(application);
      const employeeEmail = getEmployeeEmail(application);
      const employeeDepartment = getDepartment(application);
      const employeeCode = getEmployeeCode(application);
      const leaveType = getLeaveType(application);

      const searchText = search.toLowerCase();

      const matchesSearch =
        employeeName.toLowerCase().includes(searchText) ||
        employeeEmail.toLowerCase().includes(searchText) ||
        employeeDepartment.toLowerCase().includes(searchText) ||
        employeeCode.toLowerCase().includes(searchText) ||
        leaveType.toLowerCase().includes(searchText);

      const currentStatus = String(
        application.status || "PENDING"
      ).toUpperCase();

      const matchesStatus =
        statusFilter === "All" || currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const pendingCount = applications.filter(
    (item) =>
      String(item.status || "PENDING").toUpperCase() === "PENDING"
  ).length;

  const approvedCount = applications.filter(
    (item) =>
      String(item.status || "").toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = applications.filter(
    (item) =>
      String(item.status || "").toUpperCase() === "REJECTED"
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      {/* Sidebar */}
      <aside className="w-full bg-blue-950 text-white md:min-h-screen md:w-64">
        <div className="border-b border-blue-900 p-6">
          <h1 className="text-2xl font-bold">ELMS</h1>
          <p className="mt-1 text-sm text-blue-200">Admin Portal</p>
        </div>

        <nav className="space-y-2 p-4">
          <Link
            href="/admin/dashboard"
            className="block rounded-lg px-4 py-3 hover:bg-blue-900"
          >
            📊 Dashboard
          </Link>

          <Link
            href="/admin/employees"
            className="block rounded-lg px-4 py-3 hover:bg-blue-900"
          >
            👥 Employees
          </Link>

          <Link
            href="/admin/leave-applications"
            className="block rounded-lg bg-blue-700 px-4 py-3"
          >
            📋 Leave Applications
          </Link>
        </nav>

        <div className="border-t border-blue-900 p-4 md:mt-10">
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="w-full rounded-lg px-4 py-3 text-left hover:bg-red-700"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Leave Applications
            </h2>
            <p className="mt-2 text-gray-500">
              View, approve, or reject employee leave requests.
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-center font-semibold text-white hover:bg-blue-800"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Applications</p>
            <h3 className="mt-2 text-3xl font-bold text-blue-700">
              {loading ? "..." : applications.length}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <h3 className="mt-2 text-3xl font-bold text-yellow-600">
              {loading ? "..." : pendingCount}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Approved</p>
            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {loading ? "..." : approvedCount}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Rejected</p>
            <h3 className="mt-2 text-3xl font-bold text-red-600">
              {loading ? "..." : rejectedCount}
            </h3>
          </div>
        </div>

        {/* Success message */}
        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">{error}</p>
            <button
              onClick={fetchApplications}
              className="mt-2 text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search Applications
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee, email or leave type"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Application Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
              >
                <option value="All">All Applications</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b p-5">
            <h3 className="text-lg font-bold text-gray-900">
              Employee Leave Requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredApplications.length} applications
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-gray-50 text-sm text-gray-600">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Employee ID</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Leave Type</th>
                  <th className="px-5 py-4">Dates</th>
                  <th className="px-5 py-4">Days</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      Loading leave applications...
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  filteredApplications.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <div className="text-3xl">📭</div>
                        <p className="mt-3 font-medium text-gray-700">
                          No leave applications found
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Applications submitted by employees will appear here.
                        </p>
                      </td>
                    </tr>
                  )}

                {!loading &&
                  !error &&
                  filteredApplications.map((application, index) => {
                    const applicationId =
                      application.id || application.leaveId || index;

                    const status = String(
                      application.status || "PENDING"
                    ).toUpperCase();

                    const isUpdating =
                      String(updatingId) === String(applicationId);

                    return (
                      <tr
                        key={applicationId}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {getEmployeeName(application)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {getEmployeeEmail(application)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getEmployeeCode(application)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getDepartment(application)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getLeaveType(application)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {getLeaveDates(application)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getLeaveDays(application)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {status === "PENDING" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  updateLeaveStatus(application, "APPROVED")
                                }
                                disabled={isUpdating}
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {isUpdating ? "Updating..." : "Approve"}
                              </button>

                              <button
                                onClick={() =>
                                  updateLeaveStatus(application, "REJECTED")
                                }
                                disabled={isUpdating}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {isUpdating ? "Updating..." : "Reject"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              No action
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-8 border-t border-gray-200 py-5 text-center text-sm text-gray-500">
          Employee Leave Management System © 2026
        </footer>
      </main>
    </div>
  );
}

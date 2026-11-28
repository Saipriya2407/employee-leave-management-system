"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const router = useRouter();

  const [adminName, setAdminName] = useState("Admin");
  const [adminCode, setAdminCode] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");

  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adminRequests, setAdminRequests] = useState([]);
  const [adminRequestsLoading, setAdminRequestsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");

  // Fetch logged-in Admin profile
  useEffect(() => {
    async function fetchAdminProfile() {
      try {
        const response = await fetch("/api/backend/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch Admin profile.");
        }

        const profile = data.data?.user ?? data.user;

        if (profile) {
          setAdminName(profile.fullName || "Admin");
          setAdminCode(profile.employeeCode || "Not assigned");
          setAdminDepartment(profile.department || "Not assigned");
        }
      } catch (error) {
        console.error("Admin profile error:", error);
      }
    }

    fetchAdminProfile();
  }, []);

  // Fetch dashboard statistics and recent applications
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [employeesResponse, leavesResponse] = await Promise.all([
          fetch("/api/backend/admin/employees", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/backend/leaves", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const employeesData = await employeesResponse.json();
        const leavesData = await leavesResponse.json();

        if (!employeesResponse.ok) {
          throw new Error(
            employeesData.message || "Unable to fetch employees."
          );
        }

        if (!leavesResponse.ok) {
          throw new Error(
            leavesData.message || "Unable to fetch leave applications."
          );
        }

        const employeeResult = employeesData.data ?? employeesData;
        const leaveResult = leavesData.data ?? leavesData;

        const employees = Array.isArray(employeeResult)
          ? employeeResult
          : employeeResult.employees || [];

        const applications = Array.isArray(leaveResult)
          ? leaveResult
          : leaveResult.leaves || leaveResult.applications || [];

        setStats({
          totalEmployees: employees.length,
          pendingLeaves: applications.filter(
            (leave) => String(leave.status).toUpperCase() === "PENDING"
          ).length,
          approvedLeaves: applications.filter(
            (leave) => String(leave.status).toUpperCase() === "APPROVED"
          ).length,
          rejectedLeaves: applications.filter(
            (leave) => String(leave.status).toUpperCase() === "REJECTED"
          ).length,
        });

        const latestApplications = [...applications]
          .sort((a, b) => {
            const dateA = new Date(
              a.createdAt || a.appliedAt || 0
            ).getTime();

            const dateB = new Date(
              b.createdAt || b.appliedAt || 0
            ).getTime();

            return dateB - dateA;
          })
          .slice(0, 5);

        setRecentApplications(latestApplications);
      } catch (err) {
        console.error("Admin dashboard error:", err);
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Fetch Admin registration requests
  async function fetchAdminRequests() {
    try {
      setAdminRequestsLoading(true);
      setRequestMessage("");

      const response = await fetch(
        "/api/backend/admin/admin-registration-requests",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch Admin requests.");
      }

      const result = data.data ?? data;

      setAdminRequests(
        Array.isArray(result) ? result : result.requests || []
      );
    } catch (error) {
      console.error("Admin requests error:", error);
      setRequestMessage(error.message);
    } finally {
      setAdminRequestsLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminRequests();
  }, []);

  // Approve or reject Admin registration request
  async function handleAdminRequest(id, status) {
    let adminRemarks = "";

    if (status === "REJECTED") {
      adminRemarks = window.prompt(
        "Enter the reason for rejecting this Admin request:"
      );

      if (adminRemarks === null) return;

      if (!adminRemarks.trim()) {
        alert("Rejection reason is required.");
        return;
      }
    }

    if (
      !window.confirm(
        `Are you sure you want to ${status.toLowerCase()} this Admin request?`
      )
    ) {
      return;
    }

    try {
      setReviewingId(id);
      setRequestMessage("");

      const response = await fetch(
        `/api/backend/admin/admin-registration-requests/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, adminRemarks }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update Admin request.");
      }

      setRequestMessage(
        status === "APPROVED"
          ? "Admin registration approved successfully."
          : "Admin registration rejected successfully."
      );

      await fetchAdminRequests();
    } catch (error) {
      console.error("Admin request update error:", error);
      setRequestMessage(error.message);
    } finally {
      setReviewingId(null);
    }
  }

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      description: "Registered employees",
      icon: "👥",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      description: "Awaiting approval",
      icon: "⏳",
    },
    {
      title: "Approved Leaves",
      value: stats.approvedLeaves,
      description: "Approved applications",
      icon: "✅",
    },
    {
      title: "Rejected Leaves",
      value: stats.rejectedLeaves,
      description: "Rejected applications",
      icon: "❌",
    },
  ];

  function getStatusClass(status) {
    const currentStatus = String(status || "").toUpperCase();

    if (currentStatus === "APPROVED") {
      return "bg-green-100 text-green-700";
    }

    if (currentStatus === "REJECTED") {
      return "bg-red-100 text-red-700";
    }

    if (["CANCELLED", "CANCELED"].includes(currentStatus)) {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  function getEmployeeName(application) {
    return (
      application.employee?.fullName ||
      application.employee?.name ||
      application.user?.fullName ||
      application.employeeName ||
      application.fullName ||
      "Employee"
    );
  }

  function getDepartment(application) {
    return (
      application.employee?.department ||
      application.user?.department ||
      application.department ||
      "N/A"
    );
  }

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

  function getLeaveDays(application) {
    if (application.totalDays !== undefined) {
      return application.totalDays;
    }

    if (application.days !== undefined) {
      return application.days;
    }

    if (application.startDate && application.endDate) {
      const start = new Date(application.startDate);
      const end = new Date(application.endDate);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return "N/A";
      }

      const difference =
        Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

      return difference > 0 ? difference : 0;
    }

    return "N/A";
  }

  return (
    <div className="min-h-full bg-gray-100">
      <main>
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              title="Go Back"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl text-gray-600 transition hover:bg-gray-100 hover:text-blue-700"
            >
              ←
            </button>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage employees and leave applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="font-semibold text-gray-800">
                {adminName}
              </p>

              <p className="text-xs text-gray-500">
                Admin Account
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-8 p-6">
          {/* Welcome Section */}
          <section className="rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white">
            <p className="text-sm font-medium text-blue-100">
              ADMIN DASHBOARD
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Welcome, {adminName}!
            </h2>

            <p className="mt-2 text-blue-100">
              Manage employees, monitor leave applications and oversee leave operations.
            </p>

            <div className="mt-5 flex flex-wrap gap-5 text-sm">
              <span>
                Admin ID: {adminCode || "Loading..."}
              </span>

              <span>
                Department: {adminDepartment || "Loading..."}
              </span>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-700">
                Unable to load dashboard
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Please check your login and try again.
              </p>
            </div>
          )}

          {/* Statistics */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              Overview
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>

                    <span className="text-2xl">
                      {stat.icon}
                    </span>
                  </div>

                  <h3 className="mt-4 text-3xl font-bold text-gray-900">
                    {loading ? "..." : stat.value}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Manage Employees */}
              <Link
                href="/admin/employees"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
              >
                <div className="text-3xl">👥</div>

                <h3 className="mt-4 font-bold text-gray-900">
                  Manage Employees
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  View actual registered employee details and departments.
                </p>

                <p className="mt-4 font-semibold text-blue-700">
                  View Employees →
                </p>
              </Link>

              {/* Manage Leave Applications */}
              <Link
                href="/admin/leave-applications"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
              >
                <div className="text-3xl">📋</div>

                <h3 className="mt-4 font-bold text-gray-900">
                  Manage Leave Applications
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Review actual employee leave requests and manage approvals.
                </p>

                <p className="mt-4 font-semibold text-blue-700">
                  View Applications →
                </p>
              </Link>

              {/* Leave Creation */}
              <Link
                href="/admin/holidays"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
              >
                <div className="text-3xl">➕</div>

                <h3 className="mt-4 font-bold text-gray-900">
                  Leave Creation
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Create and manage public holidays for all employees.
                </p>

                <p className="mt-4 font-semibold text-blue-700">
                  Manage Holidays →
                </p>
              </Link>

              {/* Calendar */}
              <Link
                href="/admin/calendar"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
              >
                <div className="text-3xl">📅</div>

                <h3 className="mt-4 font-bold text-gray-900">
                  Calendar
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  View public holidays in the monthly calendar.
                </p>

                <p className="mt-4 font-semibold text-blue-700">
                  View Calendar →
                </p>
              </Link>
            </div>
          </section>

          {/* Admin Registration Requests */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Admin Registration Requests
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review and approve new administrator registrations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                  {adminRequests.length} Pending
                </span>

                <button
                  onClick={fetchAdminRequests}
                  disabled={adminRequestsLoading}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {requestMessage && (
              <div className="m-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                {requestMessage}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="px-5 py-4">Applicant</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Request Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {adminRequestsLoading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-gray-500"
                      >
                        Loading Admin requests...
                      </td>
                    </tr>
                  )}

                  {!adminRequestsLoading &&
                    adminRequests.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-gray-500"
                        >
                          No pending Admin registration requests.
                        </td>
                      </tr>
                    )}

                  {!adminRequestsLoading &&
                    adminRequests.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {item.fullName}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.email}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.department}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("en-IN")
                            : "-"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleAdminRequest(item.id, "APPROVED")
                              }
                              disabled={reviewingId === item.id}
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {reviewingId === item.id
                                ? "Processing..."
                                : "Approve"}
                            </button>

                            <button
                              onClick={() =>
                                handleAdminRequest(item.id, "REJECTED")
                              }
                              disabled={reviewingId === item.id}
                              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Leave Applications */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Leave Applications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest employee leave requests.
                </p>
              </div>

              <Link
                href="/admin/leave-applications"
                className="font-semibold text-blue-700 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Leave Type</th>
                    <th className="px-5 py-4">Days</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-gray-500"
                      >
                        Loading leave applications...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    recentApplications.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center"
                        >
                          <div className="text-3xl">📭</div>

                          <p className="mt-3 font-medium text-gray-700">
                            No leave applications available
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Applications will appear here after employees submit them.
                          </p>
                        </td>
                      </tr>
                    )}

                  {!loading &&
                    !error &&
                    recentApplications.map((application, index) => {
                      const status = application.status || "PENDING";

                      return (
                        <tr
                          key={
                            application.id ||
                            application.leaveId ||
                            index
                          }
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                            {getEmployeeName(application)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                            {getDepartment(application)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                            {getLeaveType(application)}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {getLeaveDays(application)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="py-4 text-center text-sm text-gray-500">
            Employee Leave Management System © 2026
          </footer>
        </div>
      </main>
    </div>
  );
}
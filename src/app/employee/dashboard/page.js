
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EmployeeDashboard() {
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [currentQuarter, setCurrentQuarter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!API_URL) {
        throw new Error("Backend API URL is not configured.");
      }

      // Fetch logged-in user's profile
      const profileResponse = await fetch("/api/backend/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok || !profileData.success) {
        throw new Error(
          profileData.message || "Unable to fetch employee profile."
        );
      }

      const employeeData = profileData.data?.user;

      if (!employeeData) {
        throw new Error("Employee information not found.");
      }

      // Role-based redirection
      const userRole = String(employeeData.role || "").toUpperCase();

      if (userRole === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }

      if (userRole !== "EMPLOYEE") {
        router.replace("/login");
        return;
      }

      setEmployee(employeeData);

      // Fetch leave balances
      const balanceResponse = await fetch(
        "/api/backend/leaves/balance",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const balanceData = await balanceResponse.json();

      if (!balanceResponse.ok || !balanceData.success) {
        throw new Error(
          balanceData.message || "Unable to fetch leave balances."
        );
      }

      const balanceResult = balanceData.data;

      setBalances(
        Array.isArray(balanceResult?.balances)
          ? balanceResult.balances
          : []
      );

      setCurrentYear(balanceResult?.year ?? null);
      setCurrentQuarter(balanceResult?.quarter ?? null);

      // Fetch leave history
      const historyResponse = await fetch("/api/backend/leaves", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const historyData = await historyResponse.json();

      if (!historyResponse.ok || !historyData.success) {
        throw new Error(
          historyData.message || "Unable to fetch leave history."
        );
      }

      setRequests(
        Array.isArray(historyData.data)
          ? historyData.data
          : []
      );

    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Date formatting
  function formatDate(date) {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getLeaveName(leave) {
    return (
      leave.name ||
      leave.leaveType?.name ||
      leave.leaveTypeName ||
      leave.type ||
      "Leave"
    );
  }

  function getAvailable(leave) {
    return Number(
      leave.availableDays ??
      leave.available ??
      leave.remaining ??
      leave.balance ??
      0
    );
  }

  function getAnnualTotal(leave) {
    return Number(
      leave.annualQuota ??
      leave.annualAllocation ??
      leave.annualTotal ??
      leave.total ??
      0
    );
  }

  function getUsed(leave) {
    return Number(leave.usedDays ?? leave.used ?? 0);
  }

  function getQuarterAllocation(leave) {
    return Number(
      leave.quarterlyQuota ??
      leave.quarterAllocation ??
      leave.currentQuarterAllocation ??
      leave.quarterlyAllocation ??
      0
    );
  }

  function getCarryForward(leave) {
    return Number(
      leave.carryForwardDays ??
      leave.carryForward ??
      leave.carriedForward ??
      leave.carryInDays ??
      leave.carryIn ??
      0
    );
  }

  function getStatusClass(status) {
    const normalizedStatus = String(
      status || "PENDING"
    ).toUpperCase();

    if (normalizedStatus === "APPROVED") {
      return "bg-green-100 text-green-700";
    }

    if (normalizedStatus === "REJECTED") {
      return "bg-red-100 text-red-700";
    }

    if (normalizedStatus === "CANCELLED") {
      return "bg-gray-100 text-gray-600";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  const totalApplications = requests.length;

  const pendingApplications = requests.filter(
    (request) =>
      String(request.status).toUpperCase() === "PENDING"
  ).length;

  const approvedApplications = requests.filter(
    (request) =>
      String(request.status).toUpperCase() === "APPROVED"
  ).length;

  const rejectedApplications = requests.filter(
    (request) =>
      String(request.status).toUpperCase() === "REJECTED"
  ).length;

  // Loading
  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center bg-gray-100 px-5 py-10">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700" />

          <h2 className="text-xl font-bold">
            Loading Dashboard...
          </h2>

          <p className="mt-2 text-base text-gray-500">
            Fetching your profile and leave information.
          </p>
        </div>
      </main>
    );
  }

  // Error
  if (error) {
    return (
      <main className="flex min-h-full items-center justify-center bg-gray-100 px-5 py-10">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-700">
            Unable to load dashboard
          </h2>

          <p className="mt-3 text-base text-gray-600">
            {error}
          </p>

          <button
            onClick={fetchDashboardData}
            className="mt-6 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Try Again
          </button>

          <Link
            href="/login"
            className="mt-4 block text-base font-medium text-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  if (!employee) {
    return (
      <main className="flex min-h-full items-center justify-center bg-gray-100 px-5 py-10">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold">
            Employee information not found
          </h2>

          <Link
            href="/login"
            className="mt-4 inline-block text-base text-blue-700"
          >
            Login Again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8 p-6">

        {/* Dashboard Heading */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            title="Go Back"
            aria-label="Go Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl text-gray-600 transition hover:bg-gray-200 hover:text-blue-700"
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Dashboard
            </h1>

            <p className="mt-1 text-base text-gray-500">
              Manage your leave applications and personal information.
            </p>
          </div>
        </div>

        {/* Welcome Section */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white">
          <p className="text-sm font-medium text-blue-100">
            EMPLOYEE DASHBOARD
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Welcome, {employee.fullName || employee.name || "Employee"}!
          </h2>

          <p className="mt-2 text-base text-blue-100">
            Manage your leave applications and check your available balance.
          </p>

          <div className="mt-5 flex flex-wrap gap-5 text-base">
            <span>
              Employee ID: {employee.employeeCode || "Not assigned"}
            </span>

            <span>
              Department: {employee.department || "-"}
            </span>
          </div>
        </section>

        {/* Current Quarter */}
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-blue-900">
                Current Leave Period
              </h2>

              <p className="mt-1 text-base text-blue-800">
                Your quarterly leave allocation and available balance.
              </p>
            </div>

            <div className="rounded-lg bg-white px-5 py-3">
              <p className="text-sm font-medium text-gray-500">
                Current Quarter
              </p>

              <p className="text-2xl font-bold text-blue-700">
                {currentQuarter && currentYear
                  ? `Q${currentQuarter} - ${currentYear}`
                  : "Not available"}
              </p>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section>
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            My Leave Applications
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-base font-medium text-gray-500">
                Total Applications
              </p>

              <p className="mt-4 text-3xl font-bold text-gray-900">
                {totalApplications}
              </p>

              <p className="mt-2 text-base text-gray-500">
                All applications
              </p>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm">
              <p className="text-base font-medium text-gray-500">
                Pending Leaves
              </p>

              <p className="mt-4 text-3xl font-bold text-yellow-600">
                {pendingApplications}
              </p>

              <p className="mt-2 text-base text-gray-500">
                Awaiting approval
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
              <p className="text-base font-medium text-gray-500">
                Approved Leaves
              </p>

              <p className="mt-4 text-3xl font-bold text-green-600">
                {approvedApplications}
              </p>

              <p className="mt-2 text-base text-gray-500">
                Approved applications
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-base font-medium text-gray-500">
                Rejected Leaves
              </p>

              <p className="mt-4 text-3xl font-bold text-red-600">
                {rejectedApplications}
              </p>

              <p className="mt-2 text-base text-gray-500">
                Rejected applications
              </p>
            </div>
          </div>
        </section>

        {/* Leave Balances */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              My Leave Balance
            </h2>

            <p className="mt-1 text-base text-gray-500">
              Annual allocation, current quarter, used leaves and carry-forward.
            </p>
          </div>

          {balances.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {balances.map((leave, index) => {
                const total = getAnnualTotal(leave);
                const used = getUsed(leave);
                const available = getAvailable(leave);
                const quarterAllocation = getQuarterAllocation(leave);
                const carryForward = getCarryForward(leave);

                const progress =
                  total > 0
                    ? Math.min((used / total) * 100, 100)
                    : 0;

                const isSickLeave =
                  String(
                    leave.code || leave.leaveType?.code || ""
                  ).toUpperCase() === "SICK";

                return (
                  <div
                    key={
                      leave.leaveTypeId ||
                      leave.id ||
                      leave.code ||
                      index
                    }
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          {getLeaveName(leave)}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Annual allocation: {total} days
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                        Q{currentQuarter}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-base text-gray-500">
                        Available Balance
                      </p>

                      <p className="mt-1 text-3xl font-bold text-blue-700">
                        {available}
                        <span className="ml-1 text-base font-medium text-gray-500">
                          days
                        </span>
                      </p>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-sm text-gray-500">
                        <span>Annual usage</span>
                        <span>
                          {used} / {total} days
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-sm text-gray-500">
                          Current Quarter
                        </p>

                        <p className="mt-1 text-base font-bold">
                          {quarterAllocation} days
                        </p>
                      </div>

                      {isSickLeave ? (
                        <div className="rounded-lg bg-green-50 p-3">
                          <p className="text-sm text-green-700">
                            Sick Leave Carry Forward
                          </p>

                          <p className="mt-1 text-base font-bold text-green-800">
                            {carryForward} days
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-sm text-gray-500">
                            Carry Forward
                          </p>

                          <p className="mt-1 text-base font-bold text-gray-700">
                            Not applicable
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <h3 className="text-base font-semibold">
                No leave balances available
              </h3>

              <p className="mt-2 text-base text-gray-500">
                Your leave balance will appear here once it is available.
              </p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Link
              href="/employee/apply-leave"
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <div className="text-3xl">📝</div>

              <h3 className="mt-4 text-base font-bold text-blue-800">
                Apply Leave
              </h3>

              <p className="mt-2 text-base text-gray-500">
                Submit a new leave application.
              </p>
            </Link>

            <Link
              href="/employee/leave-history"
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <div className="text-3xl">📋</div>

              <h3 className="mt-4 text-base font-bold text-blue-800">
                My Leave History
              </h3>

              <p className="mt-2 text-base text-gray-500">
                View your applications and their status.
              </p>
            </Link>

            <Link
              href="/employee/profile"
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <div className="text-3xl">👤</div>

              <h3 className="mt-4 text-base font-bold text-blue-800">
                My Profile
              </h3>

              <p className="mt-2 text-base text-gray-500">
                View your employee information.
              </p>
            </Link>
          </div>
        </section>

        {/* Recent Leave Requests */}
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Leave Requests
              </h2>

              <p className="mt-1 text-base text-gray-500">
                Your latest leave applications.
              </p>
            </div>

            <Link
              href="/employee/leave-history"
              className="text-base font-semibold text-blue-700 hover:underline"
            >
              View All →
            </Link>
          </div>

          {requests.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[650px] text-left text-base">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Leave Type
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Start Date
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Days
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.slice(0, 5).map((request, index) => (
                    <tr
                      key={request.id || index}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium">
                        {getLeaveName(request)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(request.startDate)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {request.totalDays ?? 0}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {request.status || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-base font-semibold">
                No leave applications yet
              </h3>

              <p className="mt-2 text-base text-gray-500">
                Your submitted leave requests will appear here.
              </p>

              <Link
                href="/employee/apply-leave"
                className="mt-4 inline-block rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white hover:bg-blue-800"
              >
                Apply for Leave
              </Link>
            </div>
          )}
        </section>
      </div>

      <footer className="border-t border-gray-200 bg-white px-5 py-5 text-center text-base text-gray-500">
        Employee Leave Management System © 2026
      </footer>
    </main>
  );
}


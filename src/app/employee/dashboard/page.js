
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;

  // Fetch all employee dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch logged-in employee profile
      const profileResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message || "Unable to fetch employee profile."
        );
      }

      const employeeData =
        profileData.employee ||
        profileData.user ||
        profileData;

      setEmployee(employeeData);

      // 2. Fetch employee leave balances
      const balanceResponse = await fetch(
        "/api/leaves/balance",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const balanceData = await balanceResponse.json();

      if (!balanceResponse.ok) {
        throw new Error(
          balanceData.message || "Unable to fetch leave balances."
        );
      }

      const employeeBalances =
        balanceData.balances ||
        balanceData.leaveBalances ||
        balanceData.leaves ||
        [];

      setBalances(
        Array.isArray(employeeBalances)
          ? employeeBalances
          : []
      );

      // 3. Fetch employee leave history
      const historyResponse = await fetch(
        "/api/leaves",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const historyData = await historyResponse.json();

      if (!historyResponse.ok) {
        throw new Error(
          historyData.message || "Unable to fetch leave history."
        );
      }

      const employeeRequests =
        historyData.leaves ||
        historyData.requests ||
        historyData.applications ||
        [];

      setRequests(
        Array.isArray(employeeRequests)
          ? employeeRequests
          : []
      );

    } catch (err) {
      setError(
        err.message || "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Logout
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.location.href = "/login";
    }
  }

  // Format date
  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Normalize leave type
  function getLeaveName(leave) {
    return (
      leave.name ||
      leave.leaveType?.name ||
      leave.leaveTypeName ||
      leave.leaveType ||
      leave.type ||
      "Leave"
    );
  }

  // Get available balance
  function getAvailable(leave) {
    return Number(
      leave.available ??
      leave.remaining ??
      leave.balance ??
      0
    );
  }

  // Get total annual allocation
  function getAnnualTotal(leave) {
    return Number(
      leave.annualAllocation ??
      leave.annualTotal ??
      leave.total ??
      0
    );
  }

  // Get used leave
  function getUsed(leave) {
    return Number(
      leave.used ??
      leave.usedDays ??
      0
    );
  }

  // Get current quarter allocation
  function getQuarterAllocation(leave) {
    const quarterAllocations =
      leave.quarterAllocations ||
      leave.quarters ||
      {};

    const quarterValue =
      quarterAllocations[`Q${currentQuarter}`] ??
      quarterAllocations[currentQuarter] ??
      leave.currentQuarterAllocation ??
      leave.quarterlyAllocation ??
      0;

    if (typeof quarterValue === "object") {
      return Number(
        quarterValue.allocated ??
        quarterValue.total ??
        quarterValue.allocation ??
        0
      );
    }

    return Number(quarterValue);
  }

  // Get carry forward
  function getCarryForward(leave) {
    return Number(
      leave.carryForward ??
      leave.carriedForward ??
      leave.carryForwardDays ??
      0
    );
  }

  // Get status class
  function getStatusClass(status) {
    const normalizedStatus = String(status || "PENDING").toUpperCase();

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

  // Dashboard statistics
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
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-5">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700" />

          <h2 className="text-xl font-bold">
            Loading Dashboard...
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fetching your profile and leave information.
          </p>
        </div>
      </main>
    );
  }

  // Error
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-5">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-700">
            Unable to load dashboard
          </h2>

          <p className="mt-3 text-gray-600">
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
            className="mt-4 block text-sm font-medium text-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  // Employee missing
  if (!employee) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-5">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold">
            Employee information not found
          </h2>

          <Link
            href="/login"
            className="mt-4 inline-block text-blue-700"
          >
            Login Again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center">

          <div>
            <Link
              href="/employee/dashboard"
              className="text-2xl font-bold text-blue-800"
            >
              ELMS
            </Link>

            <p className="text-sm text-gray-500">
              Employee Leave Management System
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">

            <Link
              href="/employee/dashboard"
              className="text-blue-700"
            >
              Dashboard
            </Link>

            <Link
              href="/employee/apply-leave"
              className="hover:text-blue-700"
            >
              Apply Leave
            </Link>

            <Link
              href="/employee/leave-history"
              className="hover:text-blue-700"
            >
              Leave History
            </Link>

            <Link
              href="/employee/profile"
              className="hover:text-blue-700"
            >
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Logout
            </button>

          </nav>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">

        {/* Welcome */}
        <section className="mb-8 rounded-2xl bg-blue-800 p-6 text-white sm:p-8">

          <p className="text-sm font-medium text-blue-100">
            EMPLOYEE DASHBOARD
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome, {employee.fullName || employee.name || "Employee"}!
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            Manage your leave applications and check your available balance.
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-sm">

            <span>
              Employee ID: {employee.employeeId || employee.id || "-"}
            </span>

            <span>
              Department: {employee.department || "-"}
            </span>

          </div>

        </section>

        {/* Current Quarter */}
        <section className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>
              <h2 className="text-lg font-bold text-blue-900">
                Current Leave Period
              </h2>

              <p className="mt-1 text-sm text-blue-800">
                Your quarterly leave allocation and available balance.
              </p>
            </div>

            <div className="rounded-lg bg-white px-5 py-3">

              <p className="text-xs font-medium text-gray-500">
                Current Quarter
              </p>

              <p className="text-2xl font-bold text-blue-700">
                Q{currentQuarter} - {currentYear}
              </p>

            </div>

          </div>

        </section>

        {/* Statistics */}
        <section className="mb-10">

          <h2 className="mb-5 text-xl font-bold">
            My Leave Applications
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Applications
              </p>

              <p className="mt-2 text-3xl font-bold">
                {totalApplications}
              </p>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Pending
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {pendingApplications}
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Approved
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {approvedApplications}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Rejected
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {rejectedApplications}
              </p>
            </div>

          </div>

        </section>

        {/* Leave Balances */}
        <section className="mb-10">

          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>
              <h2 className="text-xl font-bold">
                My Leave Balance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Annual allocation, current quarter, used leaves and carry-forward.
              </p>
            </div>

            <Link
              href="/employee/apply-leave"
              className="rounded-lg bg-blue-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
            >
              Apply for Leave
            </Link>

          </div>

          {balances.length > 0 ? (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {balances.map((leave, index) => {

                const total = getAnnualTotal(leave);
                const used = getUsed(leave);
                const available = getAvailable(leave);

                const quarterAllocation =
                  getQuarterAllocation(leave);

                const carryForward =
                  getCarryForward(leave);

                const progress =
                  total > 0
                    ? Math.min((used / total) * 100, 100)
                    : 0;

                return (

                  <div
                    key={
                      leave.id ||
                      leave.leaveTypeId ||
                      leave.code ||
                      index
                    }
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <h3 className="font-bold">
                          {getLeaveName(leave)}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Annual allocation: {total} days
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Q{currentQuarter}
                      </span>

                    </div>

                    <div className="mt-5">

                      <p className="text-sm text-gray-500">
                        Available Balance
                      </p>

                      <p className="mt-1 text-3xl font-bold text-blue-700">
                        {available}
                        <span className="ml-1 text-sm font-medium text-gray-500">
                          days
                        </span>
                      </p>

                    </div>

                    <div className="mt-5">

                      <div className="mb-2 flex justify-between text-xs text-gray-500">

                        <span>
                          Annual usage
                        </span>

                        <span>
                          {used} / {total} days
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Current Quarter
                        </p>

                        <p className="mt-1 font-bold">
                          {quarterAllocation} days
                        </p>

                      </div>

                      <div className="rounded-lg bg-green-50 p-3">

                        <p className="text-xs text-green-700">
                          Sick Leave Carry Forward
                        </p>

                        <p className="mt-1 font-bold text-green-800">
                          {carryForward} days
                        </p>

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          ) : (

            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">

              <h3 className="font-semibold">
                No leave balances available
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Your leave balance will appear here once it is available.
              </p>

            </div>

          )}

        </section>

        {/* Quick Actions */}
        <section className="mb-10">

          <h2 className="mb-5 text-xl font-bold">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <Link
              href="/employee/apply-leave"
              className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
            >

              <h3 className="font-bold text-blue-800">
                Apply Leave
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Submit a new leave application.
              </p>

            </Link>

            <Link
              href="/employee/leave-history"
              className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
            >

              <h3 className="font-bold text-blue-800">
                My Leave History
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View your applications and their status.
              </p>

            </Link>

            <Link
              href="/employee/profile"
              className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
            >

              <h3 className="font-bold text-blue-800">
                My Profile
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View your employee information.
              </p>

            </Link>

          </div>

        </section>

        {/* Recent Leave Requests */}
        <section className="mb-10">

          <div className="mb-5 flex items-center justify-between gap-3">

            <div>
              <h2 className="text-xl font-bold">
                Recent Leave Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest leave applications.
              </p>
            </div>

            <Link
              href="/employee/leave-history"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              View All
            </Link>

          </div>

          {requests.length > 0 ? (

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">

              <table className="w-full min-w-[650px] text-left text-sm">

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
                      className="border-b border-gray-100 last:border-0"
                    >

                      <td className="px-5 py-4 font-medium">
                        {getLeaveName(request)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(
                          request.startDate ||
                          request.fromDate ||
                          request.from_date
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {request.days ??
                          request.totalDays ??
                          request.numberOfDays ??
                          0}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
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

            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">

              <h3 className="font-semibold">
                No leave applications yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Your submitted leave requests will appear here.
              </p>

              <Link
                href="/employee/apply-leave"
                className="mt-4 inline-block rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Apply for Leave
              </Link>

            </div>

          )}

        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-5 py-5 text-center text-sm text-gray-500">

        Employee Leave Management System

      </footer>

    </main>
  );
}

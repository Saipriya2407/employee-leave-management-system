
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LeaveHistoryPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch actual leave applications from backend
  async function fetchLeaves() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/leaves", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      console.log("Leave History API:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch leave history"
        );
      }

      const leaveData = Array.isArray(data)
        ? data
        : data.leaves || data.requests || data.applications || [];

      setLeaves(leaveData);
    } catch (err) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Cancel pending leave application
  async function cancelLeave(id) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave application?"
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");
      setCancellingId(id);

      const response = await fetch(`/api/leaves/${id}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to cancel leave"
        );
      }

      // Refresh actual leave history from backend
      await fetchLeaves();

      setMessage("Leave application cancelled successfully.");
    } catch (err) {
      setError(err.message || "Unable to cancel leave");
    } finally {
      setCancellingId(null);
    }
  }

  // Format date safely
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

  // Display leave status
  function getStatusStyle(status) {
    const normalizedStatus = String(status || "").toUpperCase();

    if (normalizedStatus === "APPROVED") {
      return "bg-green-100 text-green-700";
    }

    if (normalizedStatus === "REJECTED") {
      return "bg-red-100 text-red-700";
    }

    if (
      normalizedStatus === "CANCELLED" ||
      normalizedStatus === "CANCELED"
    ) {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  // Get leave type name
  function getLeaveType(leave) {
    return (
      leave.leaveType?.name ||
      leave.leaveType?.leaveTypeName ||
      leave.leaveTypeName ||
      leave.leaveType ||
      leave.type ||
      "Leave"
    );
  }

  // Get number of leave days
  function getLeaveDays(leave) {
    if (leave.days != null) return leave.days;
    if (leave.numberOfDays != null) return leave.numberOfDays;
    if (leave.totalDays != null) return leave.totalDays;

    if (leave.startDate && leave.endDate) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return "-";
      }

      const difference =
        Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

      return difference > 0 ? difference : "-";
    }

    return "-";
  }

  const totalApplications = leaves.length;

  const pendingApplications = leaves.filter(
    (leave) => String(leave.status).toUpperCase() === "PENDING"
  ).length;

  const approvedApplications = leaves.filter(
    (leave) => String(leave.status).toUpperCase() === "APPROVED"
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <Link
            href="/employee/dashboard"
            className="text-2xl font-bold text-blue-800"
          >
            ELMS
          </Link>

          <Link
            href="/employee/dashboard"
            className="rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-100"
          >
            ← Dashboard
          </Link>

        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-5 py-10">

        {/* Page heading */}
        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Employee Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            My Leave History
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            View your leave applications, check approval status,
            and cancel pending requests.
          </p>

        </div>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {loading ? "..." : totalApplications}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-yellow-700">
              Pending Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-800">
              {loading ? "..." : pendingApplications}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-green-700">
              Approved Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-green-800">
              {loading ? "..." : approvedApplications}
            </p>
          </div>

        </div>

        {/* Success message */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}

            <button
              onClick={fetchLeaves}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Leave history table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Leave Applications
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your submitted leave requests and their current status.
              </p>
            </div>

            <Link
              href="/employee/apply-leave"
              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              + Apply for Leave
            </Link>

          </div>

          {/* Loading */}
          {loading ? (
            <div className="p-12 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

              <p className="mt-4 text-sm text-gray-500">
                Loading your leave history...
              </p>

            </div>
          ) : leaves.length === 0 ? (

            /* Empty state */
            <div className="px-5 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                📄
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                No leave applications yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Your leave applications will appear here after you
                submit your first request.
              </p>

              <Link
                href="/employee/apply-leave"
                className="mt-6 inline-flex rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Apply for Leave
              </Link>

            </div>
          ) : (

            /* Applications table */
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left">

                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">

                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Leave Type
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Start Date
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      End Date
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Days
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {leaves.map((leave) => {

                    const status = String(
                      leave.status || "PENDING"
                    ).toUpperCase();

                    const canCancel = status === "PENDING";

                    return (
                      <tr
                        key={leave.id}
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-6 py-5">

                          <p className="font-semibold text-gray-900">
                            {getLeaveType(leave)}
                          </p>

                          {leave.reason && (
                            <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                              {leave.reason}
                            </p>
                          )}

                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">
                          {formatDate(leave.startDate || leave.fromDate)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">
                          {formatDate(leave.endDate || leave.toDate)}
                        </td>

                        <td className="px-6 py-5 text-sm font-medium text-gray-700">
                          {getLeaveDays(leave)}
                        </td>

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(status)}`}
                          >
                            {status}
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          {canCancel ? (

                            <button
                              onClick={() => cancelLeave(leave.id)}
                              disabled={cancellingId === leave.id}
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {cancellingId === leave.id
                                ? "Cancelling..."
                                : "Cancel"}
                            </button>

                          ) : (

                            <span className="text-sm text-gray-400">
                              —
                            </span>

                          )}

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* Bottom information */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">

          <p className="text-sm font-semibold text-blue-900">
            Leave application information
          </p>

          <p className="mt-1 text-sm text-blue-800">
            Pending applications can be cancelled. Approved,
            rejected, or cancelled applications remain in your
            history for reference.
          </p>

        </div>

      </section>

    </main>
  );
}


"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function LeaveHistoryPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/backend/leaves", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch leave history.");
      }

      const result = data.data ?? data;

      const leaveData = Array.isArray(result)
        ? result
        : Array.isArray(result.leaves)
          ? result.leaves
          : Array.isArray(result.requests)
            ? result.requests
            : Array.isArray(result.applications)
              ? result.applications
              : [];

      setLeaves(leaveData);
    } catch (err) {
      console.error("Leave history error:", err);
      setError(err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const totalPages = Math.ceil(leaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentLeaves = leaves.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function openCancelModal(leave) {
    setSelectedLeave(leave);
    setMessage("");
    setError("");
  }

  function closeCancelModal() {
    if (cancellingId !== null) return;
    setSelectedLeave(null);
  }

  async function cancelLeave() {
    if (!selectedLeave) return;

    const id = selectedLeave.id;

    try {
      setMessage("");
      setError("");
      setCancellingId(id);

      const response = await fetch(
        `/api/backend/leaves/${encodeURIComponent(id)}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to cancel leave.");
      }

      setSelectedLeave(null);
      setMessage("Leave application cancelled successfully.");

      await fetchLeaves();
    } catch (err) {
      setError(err.message || "Unable to cancel leave.");
    } finally {
      setCancellingId(null);
    }
  }

  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

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

    return "bg-amber-100 text-amber-700";
  }

  function getLeaveType(leave) {
    return (
      leave.leaveType?.name ||
      leave.leaveTypeName ||
      (typeof leave.leaveType === "string"
        ? leave.leaveType
        : null) ||
      leave.type ||
      "Leave"
    );
  }

  function getLeaveDays(leave) {
    if (leave.totalDays != null) return leave.totalDays;
    if (leave.days != null) return leave.days;
    if (leave.numberOfDays != null) return leave.numberOfDays;

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
    (leave) => String(leave.status || "").toUpperCase() === "PENDING"
  ).length;

  const approvedApplications = leaves.filter(
    (leave) => String(leave.status || "").toUpperCase() === "APPROVED"
  ).length;

  const rejectedApplications = leaves.filter(
    (leave) => String(leave.status || "").toUpperCase() === "REJECTED"
  ).length;

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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center lg:px-8">
          <Link
            href="/employee/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-lg font-bold text-white">
              E
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                ELMS
              </h1>
              <p className="text-xs text-slate-500">
                Employee Portal
              </p>
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
              className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
            >
              Apply Leave
            </Link>

            <Link
              href="/employee/leave-history"
              className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800"
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
        {/* Page Heading with Back Button */}
        <div className="mb-8 flex items-center gap-3">
          <BackButton fallback="/employee/dashboard" />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Employee Services
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              My Leave History
            </h2>

            <p className="mt-2 text-slate-500">
              View your leave applications and track their approval status.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total Applications
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">
                📋
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {loading ? "..." : totalApplications}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              All submitted requests
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Pending
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg">
                ⏳
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-amber-600">
              {loading ? "..." : pendingApplications}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Awaiting approval
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Approved
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-lg">
                ✓
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-green-600">
              {loading ? "..." : approvedApplications}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Approved requests
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Rejected
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg">
                ✕
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-red-600">
              {loading ? "..." : rejectedApplications}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Rejected requests
            </p>
          </div>
        </section>

        {/* Success Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            ✓ {message}
          </div>
        )}

        {/* Error Message */}
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

        {/* Leave History */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Leave Applications
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Your submitted requests and their current status.
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
              {loading ? "Loading..." : `${totalApplications} Requests`}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
              <p className="mt-4 text-sm text-slate-500">
                Loading your leave history...
              </p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                📄
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No leave applications yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Your leave applications will appear here after you submit
                your first request.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Leave Type</th>
                    <th className="px-6 py-4 font-semibold">Start Date</th>
                    <th className="px-6 py-4 font-semibold">End Date</th>
                    <th className="px-6 py-4 font-semibold">Days</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {currentLeaves.map((leave) => {
                    const status = String(
                      leave.status || "PENDING"
                    ).toUpperCase();

                    const canCancel = status === "PENDING";

                    return (
                      <tr
                        key={leave.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {getLeaveType(leave)}
                          </p>

                          {leave.reason && (
                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {leave.reason}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                          {formatDate(leave.startDate || leave.fromDate)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                          {formatDate(leave.endDate || leave.toDate)}
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold text-slate-700">
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
                              onClick={() => openCancelModal(leave)}
                              disabled={cancellingId === leave.id}
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400">
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

          {/* Pagination */}
          {!loading && leaves.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-5 sm:flex-row">
              <p className="text-sm text-slate-500">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, leaves.length)} of{" "}
                {leaves.length} applications
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => page - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold ${
                      currentPage === page
                        ? "bg-blue-800 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Information */}
        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>

            <div>
              <h3 className="text-sm font-bold text-blue-900">
                Leave Application Information
              </h3>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                Pending applications can be cancelled. Approved, rejected,
                or cancelled applications remain in your history for
                future reference.
              </p>
            </div>
          </div>
        </section>

        <footer className="py-7 text-center text-sm text-slate-500">
          © 2026 Employee Leave Management System
        </footer>
      </div>

      {/* Cancellation Modal */}
      {selectedLeave && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeCancelModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
              !
            </div>

            <h2
              id="cancel-title"
              className="text-xl font-bold text-slate-900"
            >
              Cancel Leave Application?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Are you sure you want to cancel your{" "}
              <strong>{getLeaveType(selectedLeave)}</strong> application?
              This action will update its status.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancellingId !== null}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Application
              </button>

              <button
                type="button"
                onClick={cancelLeave}
                disabled={cancellingId !== null}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancellingId !== null
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

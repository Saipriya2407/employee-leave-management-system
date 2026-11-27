
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";

const ITEMS_PER_PAGE = 10;

export default function AdminLeaveApplications() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");

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

  function getEmployeeEmail(application) {
    return (
      application.user?.email ||
      application.employee?.email ||
      application.email ||
      "Email unavailable"
    );
  }

  function getDepartment(application) {
    return (
      application.user?.department ||
      application.employee?.department ||
      application.department ||
      "N/A"
    );
  }

  function getEmployeeCode(application) {
    return (
      application.user?.employeeCode ||
      application.employee?.employeeCode ||
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

  function getLeaveDates(application) {
    const start = application.startDate || application.fromDate;
    const end = application.endDate || application.toDate;

    if (!start || !end) return "N/A";

    return `${formatDate(start)} - ${formatDate(end)}`;
  }

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

  function openStatusModal(application, newStatus) {
    setSelectedApplication(application);
    setSelectedStatus(newStatus);
    setAdminRemarks("");
    setError("");
    setMessage("");
    setShowModal(true);
  }

  function closeStatusModal() {
    if (updatingId !== null) return;

    setShowModal(false);
    setSelectedApplication(null);
    setSelectedStatus("");
    setAdminRemarks("");
  }

  // Approve or reject leave application
  async function updateLeaveStatus() {
    if (!selectedApplication || !selectedStatus) return;

    const leaveId =
      selectedApplication.id || selectedApplication.leaveId;

    if (!leaveId) {
      setError("Leave application ID is missing.");
      return;
    }

    if (
      selectedStatus === "REJECTED" &&
      !adminRemarks.trim()
    ) {
      setError("Please enter a reason for rejecting this application.");
      return;
    }

    try {
      setUpdatingId(leaveId);
      setError("");

      const response = await fetch(
        `/api/backend/admin/leaves/${encodeURIComponent(leaveId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
            ...(selectedStatus === "REJECTED"
              ? { adminRemarks: adminRemarks.trim() }
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
        selectedStatus === "APPROVED"
          ? "Leave application approved successfully."
          : "Leave application rejected successfully."
      );

      setShowModal(false);
      setSelectedApplication(null);
      setSelectedStatus("");
      setAdminRemarks("");

      await fetchApplications();
    } catch (err) {
      console.error("Update leave error:", err);
      setError(err.message || "Unable to update leave status.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Search and status filtering
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

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / ITEMS_PER_PAGE)
  );

  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredApplications.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredApplications, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const startItem =
    filteredApplications.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredApplications.length
  );

  return (
    <div className="min-h-full bg-gray-100">
      <main className="min-w-0 p-4 md:p-8">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <BackButton fallback="/admin/dashboard" />

            <h2 className="text-3xl font-bold text-gray-900">
              Leave Applications
            </h2>
          </div>

          <p className="mt-2 ml-11 text-gray-500">
            View, approve, or reject employee leave requests.
          </p>
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
        {error && !showModal && (
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
              Showing {startItem}-{endItem} of{" "}
              {filteredApplications.length} applications
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
                  paginatedApplications.map((application, index) => {
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
                                  openStatusModal(application, "APPROVED")
                                }
                                disabled={isUpdating}
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  openStatusModal(application, "REJECTED")
                                }
                                disabled={isUpdating}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading &&
            !error &&
            filteredApplications.length > ITEMS_PER_PAGE && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
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
                      onClick={() => setCurrentPage(page)}
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
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </div>

        <footer className="mt-8 border-t border-gray-200 py-5 text-center text-sm text-gray-500">
          Employee Leave Management System © 2026
        </footer>
      </main>

      {/* Custom Approval / Rejection Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeStatusModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2
              id="leave-modal-title"
              className="text-xl font-bold text-gray-900"
            >
              {selectedStatus === "APPROVED"
                ? "Approve Leave Application"
                : "Reject Leave Application"}
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {selectedStatus === "APPROVED"
                ? "Are you sure you want to approve this leave application?"
                : "Please provide a reason for rejecting this leave application."}
            </p>

            {selectedStatus === "REJECTED" && (
              <div className="mt-5">
                <label
                  htmlFor="adminRemarks"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Rejection Reason
                </label>

                <textarea
                  id="adminRemarks"
                  value={adminRemarks}
                  onChange={(e) => {
                    setAdminRemarks(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter the reason for rejection..."
                  rows={4}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            {error && showModal && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeStatusModal}
                disabled={updatingId !== null}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateLeaveStatus}
                disabled={
                  updatingId !== null ||
                  (selectedStatus === "REJECTED" &&
                    !adminRemarks.trim())
                }
                className={`rounded-lg px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedStatus === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updatingId !== null
                  ? "Updating..."
                  : selectedStatus === "APPROVED"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

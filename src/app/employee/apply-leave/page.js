
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function ApplyLeavePage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);

  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Get current date
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Current quarter
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;

  // Load leave types and balances
  useEffect(() => {
    async function fetchLeaveData() {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch("/api/leave-types", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load leave types."
          );
        }

        const types = Array.isArray(data.leaveTypes)
          ? data.leaveTypes
          : Array.isArray(data.leave_types)
          ? data.leave_types
          : [];

        setLeaveTypes(types.filter((type) => type.active !== false));

        // Load employee leave balance
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
            balanceData.message ||
              "Unable to load leave balance."
          );
        }

        const employeeBalances = Array.isArray(
          balanceData.balances
        )
          ? balanceData.balances
          : Array.isArray(balanceData.leaveBalances)
          ? balanceData.leaveBalances
          : [];

        setBalances(employeeBalances);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaveData();
  }, []);

  // Selected leave type
  const selectedLeaveType = useMemo(() => {
    return leaveTypes.find(
      (type) =>
        String(type.id) === String(form.leaveType) ||
        String(type.code) === String(form.leaveType)
    );
  }, [leaveTypes, form.leaveType]);

  // Find balance for selected leave type
  const selectedBalance = useMemo(() => {
    if (!selectedLeaveType) {
      return null;
    }

    return balances.find(
      (balance) =>
        String(balance.leaveTypeId) ===
          String(selectedLeaveType.id) ||
        String(balance.leaveType?.id) ===
          String(selectedLeaveType.id) ||
        String(balance.leaveType) ===
          String(selectedLeaveType.code)
    );
  }, [balances, selectedLeaveType]);

  // Calculate leave days
  const totalDays = useMemo(() => {
    if (!form.startDate || !form.endDate) {
      return 0;
    }

    const start = new Date(
      `${form.startDate}T00:00:00`
    );

    const end = new Date(
      `${form.endDate}T00:00:00`
    );

    if (end < start) {
      return 0;
    }

    // Inclusive calendar days
    return (
      Math.round(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  }, [form.startDate, form.endDate]);

  // Available balance
  const availableBalance = selectedBalance
    ? Number(
        selectedBalance.available ??
          selectedBalance.remaining ??
          selectedBalance.balance ??
          0
      )
    : 0;

  // Form changes
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setSuccess(false);
  }

  // Submit application
  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    // Required leave type
    if (!form.leaveType) {
      setMessage("Please select a leave type.");
      return;
    }

    // Required dates
    if (!form.startDate || !form.endDate) {
      setMessage("Please select both dates.");
      return;
    }

    // Prevent past dates
    if (form.startDate < todayString) {
      setMessage("Start date cannot be in the past.");
      return;
    }

    // Validate date range
    if (form.endDate < form.startDate) {
      setMessage("End date cannot be before start date.");
      return;
    }

    // Validate reason
    if (form.reason.trim().length < 5) {
      setMessage("Please enter a reason of at least 5 characters.");
      return;
    }

    // Validate selected type
    if (!selectedLeaveType) {
      setMessage("Selected leave type is unavailable.");
      return;
    }

    // Validate balance
    if (!selectedBalance) {
      setMessage(
        "Leave balance is unavailable. Please refresh the page."
      );
      return;
    }

    if (totalDays > availableBalance) {
      setMessage(
        `You have only ${availableBalance} days available for this leave type.`
      );
      return;
    }

    // Validate current quarter for standard leave types
    const leaveCode = String(
      selectedLeaveType.code ||
        selectedLeaveType.name ||
        ""
    ).toUpperCase();

    const isQuarterlyLeave = [
      "CASUAL",
      "CASUAL_LEAVE",
      "CL",
      "WFH",
      "WORK_FROM_HOME",
    ].includes(leaveCode);

    if (isQuarterlyLeave) {
      const startQuarter =
        Math.floor(
          new Date(
            `${form.startDate}T00:00:00`
          ).getMonth() / 3
        ) + 1;

      const endQuarter =
        Math.floor(
          new Date(
            `${form.endDate}T00:00:00`
          ).getMonth() / 3
        ) + 1;

      if (
        startQuarter !== currentQuarter ||
        endQuarter !== currentQuarter
      ) {
        setMessage(
          `You can apply for this leave only within the current quarter (Q${currentQuarter}).`
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/leaves", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveTypeId: selectedLeaveType.id,
          startDate: form.startDate,
          endDate: form.endDate,
          days: totalDays,
          reason: form.reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Leave application failed."
        );
      }

      setSuccess(true);
      setMessage(
        "Leave application submitted successfully!"
      );

      setForm({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      // Refresh balance after submission
      const balanceResponse = await fetch(
        "/api/leaves/balance",
        {
          credentials: "include",
        }
      );

      const balanceData = await balanceResponse.json();

      if (balanceResponse.ok) {
        setBalances(
          Array.isArray(balanceData.balances)
            ? balanceData.balances
            : Array.isArray(balanceData.leaveBalances)
            ? balanceData.leaveBalances
            : []
        );
      }
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to server."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center">

          <div>
            <Link
              href="/employee/dashboard"
              className="text-2xl font-bold text-blue-800"
            >
              ELMS
            </Link>

            <p className="text-sm text-gray-600">
              Employee Leave Management System
            </p>
          </div>

          <nav className="flex flex-wrap gap-4 text-sm font-semibold">

            <Link
              href="/employee/dashboard"
              className="hover:text-blue-700"
            >
              Dashboard
            </Link>

            <Link
              href="/employee/apply-leave"
              className="text-blue-700"
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

          </nav>

        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Employee Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Apply for Leave
          </h1>

          <p className="mt-2 text-gray-600">
            Submit your leave request for admin approval.
          </p>

        </div>

        {/* Quarterly policy */}
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

          <h2 className="font-bold text-blue-900">
            Leave Policy
          </h2>

          <p className="mt-2 text-sm text-blue-800">
            Casual Leave and WFH are allocated quarterly.
            Unused Sick Leave can carry forward within the
            current calendar year.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">
                Current Quarter
              </p>

              <p className="mt-1 font-bold text-blue-700">
                Q{currentQuarter}
              </p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">
                Casual Leave
              </p>

              <p className="mt-1 font-bold">
                12 / Year
              </p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">
                Sick Leave
              </p>

              <p className="mt-1 font-bold">
                12 / Year
              </p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">
                WFH
              </p>

              <p className="mt-1 font-bold">
                12 / Year
              </p>
            </div>

          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="mb-6 rounded-lg bg-white p-4 text-gray-600">
            Loading leave types and balances...
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >

          {/* Leave Type */}
          <div>

            <label
              htmlFor="leaveType"
              className="mb-2 block font-semibold"
            >
              Leave Type
            </label>

            <select
              id="leaveType"
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >

              <option value="">
                Select Leave Type
              </option>

              {leaveTypes.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.name}
                </option>
              ))}

            </select>

          </div>

          {/* Balance */}
          {selectedLeaveType && (

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

              <p className="text-sm font-medium text-gray-600">
                Available Balance
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-700">
                {selectedBalance
                  ? `${availableBalance} days`
                  : "Balance unavailable"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Current quarter: Q{currentQuarter}
              </p>

            </div>

          )}

          {/* Start Date */}
          <div>

            <label
              htmlFor="startDate"
              className="mb-2 block font-semibold"
            >
              Start Date
            </label>

            <input
              id="startDate"
              type="date"
              name="startDate"
              value={form.startDate}
              min={todayString}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* End Date */}
          <div>

            <label
              htmlFor="endDate"
              className="mb-2 block font-semibold"
            >
              End Date
            </label>

            <input
              id="endDate"
              type="date"
              name="endDate"
              value={form.endDate}
              min={form.startDate || todayString}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* Days */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

            <p className="text-sm font-medium text-gray-600">
              Total Leave Days
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {totalDays} {totalDays === 1 ? "day" : "days"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Calculated using inclusive calendar days.
            </p>

          </div>

          {/* Reason */}
          <div>

            <label
              htmlFor="reason"
              className="mb-2 block font-semibold"
            >
              Reason
            </label>

            <textarea
              id="reason"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              minLength={5}
              rows={4}
              placeholder="Enter your reason for leave..."
              className="w-full resize-y rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* Message */}
          {message && (

            <div
              role="alert"
              className={`rounded-lg p-4 text-sm ${
                success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>

          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/employee/dashboard"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || submitting}
              className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Leave Application"}
            </button>

          </div>

        </form>

      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-5 py-5 text-center text-sm text-gray-500">
        © 2026 Employee Leave Management System
      </footer>

    </main>
  );
}

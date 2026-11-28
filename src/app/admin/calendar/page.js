
"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";

const API = "/api/backend/admin/holidays";

function getHolidayKey(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export default function AdminCalendarPage() {
  const [holidays, setHolidays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initialize current date after component mounts
  useEffect(() => {
    const now = new Date();

    setCurrentMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );

    setToday(now);
  }, []);

  // Fetch public holidays
  useEffect(() => {
    async function fetchHolidays() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error("Invalid response from holiday API.");
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load holidays.");
        }

        const result = data.data ?? data;

        setHolidays(
          Array.isArray(result)
            ? result
            : result.holidays || []
        );
      } catch (err) {
        console.error("Calendar holidays error:", err);
        setError(err.message || "Unable to load holidays.");
      } finally {
        setLoading(false);
      }
    }

    fetchHolidays();
  }, []);

  // Safe year and month values
  const year = currentMonth
    ? currentMonth.getFullYear()
    : 0;

  const month = currentMonth
    ? currentMonth.getMonth()
    : 0;

  // Generate calendar dates
  const calendarDays = useMemo(() => {
    if (!currentMonth) return [];

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  }, [currentMonth, year, month]);

  // Group holidays by date
  const holidayMap = useMemo(() => {
    const map = {};

    holidays.forEach((holiday) => {
      const key = getHolidayKey(holiday.date);

      if (key) {
        map[key] = [...(map[key] || []), holiday];
      }
    });

    return map;
  }, [holidays]);

  // Get holidays for selected month
  const monthHolidays = useMemo(() => {
    if (!currentMonth) return [];

    return holidays
      .filter((holiday) => {
        const key = getHolidayKey(holiday.date);

        return key.startsWith(
          `${year}-${String(month + 1).padStart(2, "0")}-`
        );
      })
      .sort((a, b) =>
        getHolidayKey(a.date).localeCompare(getHolidayKey(b.date))
      );
  }, [holidays, currentMonth, year, month]);

  // Previous and next month
  function changeMonth(amount) {
    if (!currentMonth) return;

    setCurrentMonth(
      new Date(year, month + amount, 1)
    );
  }

  // Return to current month
  function goToToday() {
    if (!today) return;

    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
  }

  // Format holiday date
  function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  // Wait until current date is initialized
  if (!currentMonth || !today) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    );
  }

  const monthLabel = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-full bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <BackButton fallback="/admin/dashboard" />

            <h1 className="text-3xl font-bold text-gray-900">
              Calendar
            </h1>
          </div>

          <p className="mt-2 ml-11 text-gray-500">
            View public holidays throughout the year.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Calendar */}
        <div className="rounded-2xl bg-white p-5 shadow-sm md:p-8">

          {/* Month Navigation */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">

              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border text-2xl text-blue-800 hover:bg-blue-50"
                aria-label="Previous month"
              >
                ‹
              </button>

              <h2 className="min-w-44 text-center text-xl font-bold text-gray-900 md:text-2xl">
                {monthLabel}
              </h2>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border text-2xl text-blue-800 hover:bg-blue-50"
                aria-label="Next month"
              >
                ›
              </button>

            </div>

            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800"
            >
              Today
            </button>
          </div>

          {/* Weekdays */}
          <div className="mb-2 grid grid-cols-7 rounded-lg bg-gray-50 text-center text-sm font-semibold text-gray-600">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <div key={day} className="py-3">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Dates */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-20 rounded-lg bg-gray-50/50 md:min-h-28"
                  />
                );
              }

              const key = [
                year,
                String(month + 1).padStart(2, "0"),
                String(day).padStart(2, "0"),
              ].join("-");

              const dayHolidays = holidayMap[key] || [];

              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

              return (
                <div
                  key={key}
                  className={`min-h-20 rounded-lg border p-1.5 md:min-h-28 md:p-3 ${
                    dayHolidays.length
                      ? "border-red-200 bg-red-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div
                    className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold md:h-8 md:w-8 ${
                      isToday
                        ? "bg-blue-700 text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>

                  <div className="space-y-1">
                    {dayHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        title={holiday.name}
                        className="truncate rounded-md bg-red-100 px-1 py-1 text-[10px] font-semibold text-red-700 md:px-2 md:text-xs"
                      >
                        {holiday.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-5 border-t pt-5 text-sm text-gray-600">

            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-700" />
              Today
            </span>

            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              Public Holiday
            </span>

          </div>
        </div>

        {/* Holidays This Month */}
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm md:p-8">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Holidays in {monthLabel}
            </h2>

            <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              {monthHolidays.length} Holidays
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Loading holidays...
            </p>
          ) : monthHolidays.length === 0 ? (
            <p className="rounded-lg bg-gray-50 py-8 text-center text-gray-500">
              No holidays this month.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {monthHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50 p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <span className="text-lg font-bold">
                      {new Date(holiday.date).getUTCDate()}
                    </span>

                    <span className="text-[10px] font-semibold uppercase">
                      {new Date(holiday.date).toLocaleDateString("en-IN", {
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900">
                      {holiday.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {formatDate(holiday.date)}
                    </p>

                    {holiday.description && (
                      <p className="mt-2 text-sm text-gray-500">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

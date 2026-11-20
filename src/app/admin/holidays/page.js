
"use client";

import { useEffect, useState } from "react";

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Requests go through the Next.js proxy to the Render backend
  const API = "/api/backend/admin/holidays";

  async function handleResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error(
        "Backend returned an invalid response. Check whether the holiday API is deployed on Render."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function fetchHolidays() {
    try {
      setLoading(true);

      const response = await fetch(API, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await handleResponse(response);
      setHolidays(data.holidays || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHolidays();
  }, []);

  function resetForm() {
    setName("");
    setDate("");
    setDescription("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const url = editingId ? `${API}/${editingId}` : API;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          date,
          description,
        }),
      });

      const data = await handleResponse(response);

      setMessage(data.message || "Holiday saved successfully");
      resetForm();
      await fetchHolidays();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleEdit(holiday) {
    setEditingId(holiday.id);
    setName(holiday.name);

    const holidayDate = new Date(holiday.date);

    setDate(
      `${holidayDate.getUTCFullYear()}-${String(
        holidayDate.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(
        holidayDate.getUTCDate()
      ).padStart(2, "0")}`
    );

    setDescription(holiday.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await handleResponse(response);

      setMessage(data.message || "Holiday deleted successfully");
      await fetchHolidays();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">

        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          Leave Creation
        </h1>

        <p className="mb-6 text-gray-600">
          Create and manage public holidays for all employees.
        </p>

        {message && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3 text-blue-700">
            {message}
          </div>
        )}

        {/* Add / Edit Holiday */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            {editingId ? "Edit Public Holiday" : "Create Public Holiday"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Holiday Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Diwali"
                required
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Holiday Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows="3"
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
              >
                {editingId ? "Update Holiday" : "Create Holiday"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Holiday List */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            All Public Holidays
          </h2>

          {loading ? (
            <p className="text-gray-600">Loading holidays...</p>
          ) : holidays.length === 0 ? (
            <p className="text-gray-600">
              No public holidays added yet.
            </p>
          ) : (
            <div className="space-y-4">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex flex-col justify-between gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {holiday.name}
                    </h3>

                    <p className="text-sm text-blue-600">
                      {formatDate(holiday.date)}
                    </p>

                    {holiday.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {holiday.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
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


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function EmployeeProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function fetchProfile() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/backend/auth/me", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      console.log("Employee Profile API:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch profile"
        );
      }

const profileUser = data.data?.user || data.user || data.employee;

if (!profileUser) {
  throw new Error("Employee details were not returned by the server.");
}

setUser(profileUser);
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  // Display profile information
  function getValue(...values) {
    return (
      values.find(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
      ) || "Not available"
    );
  }

  // Profile details
  const profileDetails = user
    ? [
        {
          label: "Full Name",
          value: getValue(
            user.fullName,
            user.full_name,
            user.name
          ),
          icon: "👤",
        },
        {
          label: "Email Address",
          value: getValue(user.email),
          icon: "✉️",
        },
        {
          label: "Employee ID",
          value: getValue(
            user.employeeId,
            user.employee_id,
            user.id
          ),
          icon: "🆔",
        },
        {
          label: "Department",
         value: getValue(
         user.employeeCode,
         user.employeeId,
         user.employee_id
),
        
          icon: "🏢",
        },
        {
          label: "Role",
          value: getValue(user.role, "EMPLOYEE"),
          icon: "🔐",
        },
      ]
    : [];

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

      {/* Profile */}
      <section className="mx-auto max-w-4xl px-5 py-10">

        {/* Heading */}
        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Employee Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-3 text-gray-600">
            View your registered employee account information.
          </p>

        </div>

        {/* Profile card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Profile banner */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-8 text-white sm:px-8">

            <div className="flex items-center gap-5">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl">
                👤
              </div>

              <div>

                <h2 className="text-xl font-bold sm:text-2xl">
                  {loading
                    ? "Loading profile..."
                    : user
                    ? getValue(
                        user.fullName,
                        user.full_name,
                        user.name
                      )
                    : "Employee Profile"}
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  Your registered account details
                </p>

              </div>

            </div>

          </div>

          {/* Profile content */}
          <div className="p-6 sm:p-8">

            {/* Loading */}
            {loading ? (

              <div className="py-12 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

                <p className="mt-4 text-sm text-gray-500">
                  Loading employee profile...
                </p>

              </div>

            ) : message ? (

              /* Error */
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                <p className="font-semibold text-red-700">
                  Unable to load profile
                </p>

                <p className="mt-2 text-sm text-red-600">
                  {message}
                </p>

                <button
                  onClick={fetchProfile}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>

              </div>

            ) : user ? (

              /* Actual profile information */
              <div>

                <div className="mb-6">

                  <h3 className="text-lg font-bold text-gray-900">
                    Personal & Account Information
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Information retrieved from your registered account.
                  </p>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {profileDetails.map((detail) => (

                    <div
                      key={detail.label}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
                          {detail.icon}
                        </div>

                        <div className="min-w-0">

                          <p className="text-sm text-gray-500">
                            {detail.label}
                          </p>

                          <p className="mt-1 break-words font-semibold text-gray-900">
                            {detail.value}
                          </p>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-6">

                  <Link
                    href="/employee/dashboard"
                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Back to Dashboard
                  </Link>

                  <Link
                    href="/employee/leave-history"
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    View Leave History
                  </Link>

                </div>

              </div>

            ) : (

              <div className="py-10 text-center">

                <p className="font-semibold text-gray-800">
                  Profile not found
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  No employee profile information was returned.
                </p>

                <button
                  onClick={fetchProfile}
                  className="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Refresh Profile
                </button>

              </div>

            )}

          </div>

        </div>

        {/* Information */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">

          <p className="text-sm font-semibold text-blue-900">
            Profile information
          </p>

          <p className="mt-1 text-sm text-blue-800">
            Your profile details are loaded from your registered
            employee account. If any information is incorrect,
            contact your administrator.
          </p>

        </div>

      </section>

    </main>
  );
}

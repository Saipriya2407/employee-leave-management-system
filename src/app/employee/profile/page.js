
"use client";

import BackButton from "@/components/BackButton";
import { useEffect, useRef, useState } from "react";
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
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch profile.");
      }

      const profileUser =
        data.data?.user || data.user || data.employee;

      if (!profileUser) {
        throw new Error(
          "Employee details were not returned by the server."
        );
      }

      setUser(profileUser);
    } catch (error) {
      console.error("Profile error:", error);
      setMessage(error.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }
const hasFetchedProfile = useRef(false);
  useEffect(() => {
  if (hasFetchedProfile.current) return;

  hasFetchedProfile.current = true;
  fetchProfile();
}, []);

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
            user.employeeCode,
            user.employeeId,
            user.employee_id
          ),
          icon: "🆔",
        },
        {
          label: "Department",
          value: getValue(user.department),
          icon: "🏢",
        },
        {
          label: "Role",
          value: getValue(user.role, "EMPLOYEE"),
          icon: "🔐",
        },
      ]
    : [];

  const employeeName = user
    ? getValue(user.fullName, user.full_name, user.name)
    : "Employee Profile";

  const initials =
    employeeName !== "Employee Profile" &&
    employeeName !== "Not available"
      ? employeeName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join("")
      : "E";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
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
              className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-blue-800"
            >
              Leave History
            </Link>

            <Link
              href="/employee/profile"
              className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800"
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
              My Profile
            </h2>

            <p className="mt-2 text-slate-500">
              View your registered employee account information.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Profile Banner */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 px-6 py-9 text-white sm:px-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-white/15 text-3xl font-bold shadow-lg">
                {loading ? "..." : initials}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-100">
                  Employee Account
                </p>

                <h3 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                  {loading ? "Loading profile..." : employeeName}
                </h3>

                <p className="mt-2 text-sm text-blue-100">
                  {user
                    ? getValue(user.email)
                    : "Your registered account details"}
                </p>
              </div>

              <div className="sm:ml-auto">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Employee Portal
                </span>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 sm:p-9">
            {loading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
                <p className="mt-4 text-sm text-slate-500">
                  Loading employee profile...
                </p>
              </div>
            ) : message ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <h3 className="font-bold text-red-800">
                  Unable to Load Profile
                </h3>

                <p className="mt-2 text-sm text-red-700">
                  {message}
                </p>

                <button
                  onClick={fetchProfile}
                  className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : user ? (
              <>
                {/* Profile Details */}
                <div className="mb-7">
                  <h3 className="text-xl font-bold text-slate-900">
                    Personal & Account Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your registered employee account details.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {profileDetails.map((detail) => (
                    <div
                      key={detail.label}
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition duration-200 hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-2xl shadow-sm">
                          {detail.icon}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-500">
                            {detail.label}
                          </p>

                          <p className="mt-1 break-words text-base font-semibold text-slate-900">
                            {detail.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Employee Services */}
                <div className="mt-9 border-t border-slate-100 pt-8">
                  <h3 className="text-lg font-bold text-slate-900">
                    Employee Services
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Quickly access your employee services.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Link
                      href="/employee/apply-leave"
                      className="group flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-5 transition hover:border-blue-400 hover:bg-blue-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-800 text-2xl text-white shadow-sm">
                          +
                        </div>

                        <div>
                          <h4 className="font-bold text-blue-950">
                            Apply for Leave
                          </h4>

                          <p className="mt-1 text-sm text-blue-700">
                            Submit a new leave request.
                          </p>
                        </div>
                      </div>

                      <span className="text-xl font-semibold text-blue-800 transition group-hover:translate-x-1">
                        →
                      </span>
                    </Link>

                    <Link
                      href="/employee/leave-history"
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                          📋
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900">
                            My Leave History
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            View your previous applications.
                          </p>
                        </div>
                      </div>

                      <span className="text-xl font-semibold text-slate-500 transition group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <h3 className="font-bold text-slate-900">
                  Profile Not Found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  No employee profile information was returned.
                </p>

                <button
                  onClick={fetchProfile}
                  className="mt-5 rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
                >
                  Refresh Profile
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Information */}
        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>

            <div>
              <h3 className="text-sm font-bold text-blue-950">
                Profile Information
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Your profile details are retrieved from your registered
                employee account. If any information is incorrect,
                please contact your administrator.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-7 text-center text-sm text-slate-500">
          © 2026 Employee Leave Management System
        </footer>
      </div>
    </main>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";

export default function EmployeeRegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          department: form.department,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }

      setMessage("Employee registered successfully!");

      setForm({
        fullName: "",
        email: "",
        department: "",
        password: "",
        confirmPassword: "",
      });
    } catch {
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
  "mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-2xl font-bold text-white">
              E
            </div>

            <div>
              <h1 className="text-xl font-bold text-blue-900">
                ELMS
              </h1>

              <p className="text-xs text-gray-500">
                Employee Leave Management System
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/" className="text-gray-700 hover:text-blue-700">
              Home
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-blue-700 px-5 py-2 text-blue-700 hover:bg-blue-50"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-7xl gap-6 px-6 py-4">
          <Link href="/" className="hover:text-blue-200">
            Home
          </Link>

          <span>|</span>

          <span className="font-semibold">
            Employee Registration
          </span>
        </div>
      </nav>

      {/* Registration */}
      <section className="px-4 py-12">

        <div className="mx-auto max-w-3xl">

          <div className="mb-8 text-center">
            <p className="font-bold uppercase tracking-widest text-blue-700">
              Employee Portal
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Create Your Account
            </h2>

            <p className="mt-4 text-gray-500">
              Register to access your employee leave management dashboard.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10"
          >

            <h3 className="text-xl font-bold text-gray-900">
              Employee Registration
            </h3>

            <p className="mt-2 text-gray-500">
              Please provide your details below.
            </p>

            <hr className="my-6" />

            {/* Full Name */}
            <div className="mb-5">
              <label className="font-medium text-gray-700">
                Full Name
              </label>

              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={inputClass}
                required
              />
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="font-medium text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className={inputClass}
                required
              />
            </div>

            {/* Department */}
            <div className="mb-5">
              <label className="font-medium text-gray-700">
                Department
              </label>

              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create password"
                className={inputClass}
                minLength={8}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="font-medium text-gray-700">
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className={inputClass}
                minLength={8}
                required
              />
            </div>

            {/* Message */}
            {message && (
              <p className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                {message}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Create Employee Account"}
            </button>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 hover:underline"
              >
                Login
              </Link>
            </p>

          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
        © 2026 Employee Leave Management System
      </footer>

    </main>
  );
}

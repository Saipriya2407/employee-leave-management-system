
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!API_URL) {
      setMessage("API URL is missing. Check your .env.local file.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password.");
        return;
      }

      setSuccess(true);
      setMessage("Login successful!");

      const user = data.user || data.data?.user;

      if (user?.role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (user?.role === "EMPLOYEE") {
        window.location.href = "/employee/dashboard";
      } else {
        setMessage("Login response does not contain a valid user role.");
        setSuccess(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-black caret-black placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

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

          <Link
            href="/"
            className="font-medium text-gray-700 hover:text-blue-700"
          >
            Home
          </Link>

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
            Login
          </span>
        </div>
      </nav>

      {/* Login Section */}
      <section className="px-4 py-12">

        <div className="mx-auto max-w-3xl">

          {/* Heading */}
          <div className="mb-8 text-center">

            <p className="font-bold uppercase tracking-widest text-blue-700">
              Welcome Back
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Login to ELMS
            </h2>

            <p className="mt-4 text-gray-500">
              Access your employee leave management dashboard.
            </p>

          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10"
          >

            <h3 className="text-xl font-bold text-gray-900">
              Login
            </h3>

            <p className="mt-2 text-gray-500">
              Enter your account details below.
            </p>

            <hr className="my-6" />

            {/* Email */}
            <div className="mb-5">

              <label
                htmlFor="email"
                className="font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className={inputClass}
                autoComplete="email"
                required
              />

            </div>

            {/* Password */}
            <div className="mb-6">

              <label
                htmlFor="password"
                className="font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={inputClass}
                autoComplete="current-password"
                required
              />

              {/* Show Password */}
              <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">

                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) =>
                    setShowPassword(e.target.checked)
                  }
                  className="h-4 w-4"
                />

                Show Password

              </label>

            </div>

            {/* Message */}
            {message && (
              <p
                className={`mb-5 rounded-lg p-3 text-sm ${
                  success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Single Registration Link */}
            <div className="mt-6 text-center text-sm text-gray-500">

              Don't have an account?{" "}

              <Link
                href="/registration"
                className="font-semibold text-blue-700 hover:underline"
              >
                Register Here
              </Link>

            </div>

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

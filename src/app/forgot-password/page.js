
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    try {
      setLoading(true);

      const response = await fetch(
        "/api/backend/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to process request.");
        return;
      }

      setSuccess(true);
      setMessage(
        data.message ||
        "If an account exists with this email, a reset link will be sent."
      );
    } catch (error) {
      console.error("Forgot Password Error:", error);
      setMessage("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-700 text-2xl font-bold text-white">
            E
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Forgot Password?
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Enter your registered email address. We'll send you a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            className="font-medium text-gray-700"
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            autoComplete="email"
            required
          />

          {message && (
            <p
              className={`mt-4 rounded-lg p-3 text-sm ${
                success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Back to Login
          </Link>
        </div>

      </div>
    </main>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
  });

  const [message, setMessage] = useState("");

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
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        department: form.department,
      }),
    });

    const data = await response.json();
    setMessage(data.message);
  } catch (error) {
    setMessage("Unable to connect to backend");
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-center text-blue-600">
          Create Account
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Employee Leave Management System
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3 text-black"
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
           className="w-full rounded-lg border p-3 text-black"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3 text-black"
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3 text-black"
          />

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3 text-black"
          >
            <option value="">Select Department</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
          </select>

          {message && (
            <p className="text-center text-sm text-blue-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
          >
            Register
          </button>

        </form>

        <p className="mt-5 text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

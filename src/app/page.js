
"use client";

import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [showFeatures, setShowFeatures] = useState(false);

  const handleExploreFeatures = () => {
    setShowFeatures(true);

    setTimeout(() => {
      document.getElementById("features")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-2xl font-bold text-white">
              E
            </div>

            <div>
              <h1 className="text-xl font-bold text-blue-900">
                ELMS
              </h1>

              <p className="text-sm text-black">
                Employee Leave Management System
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-5">
            <Link
              href="/"
              className="font-medium text-gray-700 hover:text-blue-700"
            >
              Home
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-blue-700 px-5 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[650px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-5 py-16 text-white">

        {/* Background Decoration */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400 opacity-10 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl" />

        {/* Main Content */}
        <div className="relative z-10 mx-auto max-w-5xl text-center">

          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-4xl font-bold shadow-lg backdrop-blur-sm">
              E
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Employee Leave
            <br />
            Management System
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            Manage employee leave, work-from-home requests and leave
            balances with a simple and efficient management system.
          </p>

          {/* Registration Buttons */}
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

            {/* Employee Registration */}
           <Link href="/employee/registration"
              className="rounded-xl bg-white px-8 py-4 text-center font-semibold text-blue-800 shadow-lg transition hover:-translate-y-1 hover:bg-blue-50"
            >
              Employee Registration
            </Link>

            {/* Admin Registration */}
           <Link href="/admin/registration"
              className="rounded-xl border border-white/50 bg-white/10 px-8 py-4 text-center font-semibold text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/20"
            >
              Admin Registration
            </Link>

          </div>

          {/* Explore Features Button */}
          <div className="mt-16">
            <button
              type="button"
              onClick={handleExploreFeatures}
              className="inline-flex flex-col items-center text-white transition hover:text-blue-200"
            >
              <span className="text-base font-medium">
                Explore Features
              </span>

              <span className="mt-3 animate-bounce text-3xl">
                ↓
              </span>
            </button>
          </div>

        </div>
      </section>

      {/* Features Section */}
      {showFeatures && (
        <section
          id="features"
          className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 sm:px-8"
        >

          {/* Heading */}
          <div className="mb-12 text-center">

            <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
              Our Services
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need
            </h2>

            <p className="mt-4 text-gray-500">
              A simple platform for managing employee leave and attendance requests.
            </p>

          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* Employee Management */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                👥
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Employee Management
              </h3>

              <p className="mt-3 leading-7 text-gray-500">
                Manage employee registration and maintain employee information
                in one place.
              </p>

            </div>

            {/* Leave Management */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-2xl">
                📅
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Leave Management
              </h3>

              <p className="mt-3 leading-7 text-gray-500">
                Apply for leave, track leave applications and manage
                leave balances.
              </p>

            </div>

            {/* Work From Home */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                💻
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Work From Home
              </h3>

              <p className="mt-3 leading-7 text-gray-500">
                Submit work-from-home requests and check their approval status.
              </p>

            </div>

          </div>

        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-gray-500 sm:flex-row">

          <p>
            © 2026 Employee Leave Management System
          </p>

          <p>
            Employee Management | Leave Management | WFH Management
          </p>

        </div>

      </footer>

    </main>
  );
}
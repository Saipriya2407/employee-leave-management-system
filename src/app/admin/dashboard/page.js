
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  });

  const [recentApplications, setRecentApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch actual dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please login as admin.");
        }

        // Fetch employees and leave applications
        const [employeesResponse, leavesResponse] =
          await Promise.all([
            fetch("/api/admin/employees", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            fetch("/api/admin/leaves", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        const employeesData = await employeesResponse.json();
        const leavesData = await leavesResponse.json();

        if (!employeesResponse.ok) {
          throw new Error(
            employeesData.message ||
              "Unable to fetch employees."
          );
        }

        if (!leavesResponse.ok) {
          throw new Error(
            leavesData.message ||
              "Unable to fetch leave applications."
          );
        }

        // Actual employee records from backend
        const employees = Array.isArray(employeesData.employees)
          ? employeesData.employees
          : [];

        // Actual leave applications from backend
        const applications = Array.isArray(leavesData.leaves)
          ? leavesData.leaves
          : Array.isArray(leavesData.applications)
          ? leavesData.applications
          : [];

        // Calculate dashboard statistics
        const pending = applications.filter(
          (leave) =>
            String(leave.status).toUpperCase() === "PENDING"
        ).length;

        const approved = applications.filter(
          (leave) =>
            String(leave.status).toUpperCase() === "APPROVED"
        ).length;

        const rejected = applications.filter(
          (leave) =>
            String(leave.status).toUpperCase() === "REJECTED"
        ).length;

        setStats({
          totalEmployees: employees.length,
          pendingLeaves: pending,
          approvedLeaves: approved,
          rejectedLeaves: rejected,
        });

        // Show latest leave applications
        const latestApplications = [...applications]
          .sort((a, b) => {
            const dateA = new Date(
              a.createdAt || a.appliedAt || 0
            ).getTime();

            const dateB = new Date(
              b.createdAt || b.appliedAt || 0
            ).getTime();

            return dateB - dateA;
          })
          .slice(0, 5);

        setRecentApplications(latestApplications);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Dashboard statistics
  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      description: "Registered employees",
      icon: "👥",
      color: "blue",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      description: "Awaiting approval",
      icon: "⏳",
      color: "yellow",
    },
    {
      title: "Approved Leaves",
      value: stats.approvedLeaves,
      description: "Approved applications",
      icon: "✅",
      color: "green",
    },
    {
      title: "Rejected Leaves",
      value: stats.rejectedLeaves,
      description: "Rejected applications",
      icon: "❌",
      color: "red",
    },
  ];

  // Sidebar navigation
  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: "📊",
      key: "dashboard",
    },
    {
      name: "Employees",
      href: "/admin/employees",
      icon: "👥",
      key: "employees",
    },
    {
      name: "Leave Applications",
      href: "/admin/leave-applications",
      icon: "📋",
      key: "leaves",
    },
  ];

  // Status colors
  function getStatusClass(status) {
    const currentStatus = String(status || "").toUpperCase();

    if (currentStatus === "APPROVED") {
      return "bg-green-100 text-green-700";
    }

    if (currentStatus === "REJECTED") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  // Employee name from leave application
  function getEmployeeName(application) {
    return (
      application.employee?.fullName ||
      application.employee?.name ||
      application.employeeName ||
      application.fullName ||
      "Employee"
    );
  }

  // Employee department
  function getDepartment(application) {
    return (
      application.employee?.department ||
      application.department ||
      "N/A"
    );
  }

  // Leave type
  function getLeaveType(application) {
    return (
      application.leaveType ||
      application.type ||
      "N/A"
    );
  }

  // Calculate leave days
  function getLeaveDays(application) {
    if (application.days !== undefined) {
      return application.days;
    }

    if (application.totalDays !== undefined) {
      return application.totalDays;
    }

    if (application.startDate && application.endDate) {
      const start = new Date(application.startDate);
      const end = new Date(application.endDate);

      const difference =
        Math.round(
          (end.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      return difference > 0 ? difference : 0;
    }

    return "N/A";
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-blue-950 text-white md:block">

        <div className="border-b border-blue-900 p-6">
          <h1 className="text-2xl font-bold">
            ELMS
          </h1>

          <p className="mt-1 text-sm text-blue-200">
            Admin Portal
          </p>
        </div>

        <nav className="space-y-2 p-4">

          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setActiveMenu(item.key)}
              className={`block rounded-lg px-4 py-3 ${
                activeMenu === item.key
                  ? "bg-blue-700"
                  : "hover:bg-blue-900"
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}

        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 w-full border-t border-blue-900 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-4 py-3 text-left hover:bg-red-700"
          >
            🚪 Logout
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <main className="md:ml-64">

        {/* Header */}
        <header className="flex flex-col justify-between gap-4 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage employees and leave applications.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              A
            </div>

            <div>
              <p className="font-semibold text-gray-800">
                Administrator
              </p>

              <p className="text-xs text-gray-500">
                Admin Account
              </p>
            </div>

          </div>

        </header>

        {/* Dashboard Content */}
        <div className="space-y-8 p-6">

          {/* Welcome */}
          <section className="rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white">

            <h2 className="text-2xl font-bold">
              Welcome, Admin!
            </h2>

            <p className="mt-2 text-blue-100">
              Here is an overview of your Employee Leave Management System.
            </p>

          </section>

          {/* Mobile Navigation */}
          <div className="grid grid-cols-2 gap-3 md:hidden">

            {menuItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setActiveMenu(item.key)}
                className="rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-blue-50"
              >
                {item.icon} {item.name}
              </Link>
            ))}

          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-700">
                Unable to load dashboard
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

            <p className="mt-2 text-sm text-gray-600">
                   Please check your login and try again.
            </p>
            </div>
          )}

          {/* Statistics */}
          <section>

            <h2 className="mb-5 text-xl font-bold text-gray-900">
              Overview
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

              {statCards.map((stat) => (

                <div
                  key={stat.title}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >

                  <div className="flex items-center justify-between">

                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>

                    <span className="text-2xl">
                      {stat.icon}
                    </span>

                  </div>

                  <h3 className="mt-4 text-3xl font-bold text-gray-900">
                    {loading ? "..." : stat.value}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {stat.description}
                  </p>

                </div>

              ))}

            </div>

          </section>

          {/* Quick Actions */}
          <section>

            <h2 className="mb-5 text-xl font-bold text-gray-900">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Manage Employees */}
              <Link
                href="/admin/employees"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
              >

                <div className="text-3xl">
                  👥
                </div>

                <h3 className="mt-4 font-bold text-gray-900">
                  Manage Employees
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  View actual registered employee details and departments.
                </p>

                <p className="mt-4 font-semibold text-blue-700">
                  View Employees →
                </p>

              </Link>

              {/* Leave Applications */}
              <Link
                href="/admin/leave-applications"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
              >

                <div className="text-3xl">
                  📋
                </div>

                <h3 className="mt-4 font-bold text-gray-900">
                  Manage Leave Applications
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Review actual employee leave requests and manage approvals.
                </p>

                <p className="mt-4 font-semibold text-blue-700">
                  View Applications →
                </p>

              </Link>

            </div>

          </section>

          {/* Recent Applications */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Leave Applications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest employee leave requests.
                </p>
              </div>

              <Link
                href="/admin/leave-applications"
                className="font-semibold text-blue-700 hover:underline"
              >
                View All →
              </Link>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px] text-left">

                <thead className="bg-gray-50 text-sm text-gray-600">

                  <tr>
                    <th className="px-5 py-4">
                      Employee
                    </th>

                    <th className="px-5 py-4">
                      Department
                    </th>

                    <th className="px-5 py-4">
                      Leave Type
                    </th>

                    <th className="px-5 py-4">
                      Days
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {/* Loading */}
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-gray-500"
                      >
                        Loading leave applications...
                      </td>
                    </tr>
                  )}

                  {/* Empty */}
                  {!loading &&
                    !error &&
                    recentApplications.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center"
                        >
                          <div className="text-3xl">
                            📭
                          </div>

                          <p className="mt-3 font-medium text-gray-700">
                            No leave applications available
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Applications will appear here after employees submit them.
                          </p>
                        </td>
                      </tr>
                    )}

                  {/* Actual Applications */}
                  {!loading &&
                    !error &&
                    recentApplications.map((application, index) => {

                      const status =
                        application.status || "Pending";

                      return (
                        <tr
                          key={
                            application.id ||
                            application.leaveId ||
                            index
                          }
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                            {getEmployeeName(application)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                            {getDepartment(application)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                            {getLeaveType(application)}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {getLeaveDays(application)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>

                          </td>

                        </tr>
                      );
                    })}

                </tbody>

              </table>

            </div>

          </section>

          {/* Footer */}
          <footer className="py-4 text-center text-sm text-gray-500">
            Employee Leave Management System © 2026
          </footer>

        </div>

      </main>

    </div>
  );
}

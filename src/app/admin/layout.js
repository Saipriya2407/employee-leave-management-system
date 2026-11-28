
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { name: "Employees", href: "/admin/employees", icon: "👥" },
  {
    name: "Leave Applications",
    href: "/admin/leave-applications",
    icon: "📋",
  },
  { name: "Leave Creation", href: "/admin/holidays", icon: "➕" },
  { name: "Calendar", href: "/admin/calendar", icon: "📅" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-blue-950 text-white md:flex">
        <div className="border-b border-blue-900 p-6">
          <h1 className="text-2xl font-bold">ELMS</h1>
          <p className="mt-1 text-sm text-blue-200">Admin Portal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-4 py-3 transition ${
                    active
                      ? "bg-blue-700 font-semibold text-white"
                      : "text-blue-100 hover:bg-blue-900"
                  }`}
                >
                  {item.icon} {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="border-t border-blue-900 p-4">
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-lg px-4 py-3 text-left hover:bg-red-700"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="border-b bg-blue-950 p-3 text-white md:hidden">
        <div className="mb-3 text-lg font-bold">ELMS Admin</div>

        <nav className="flex gap-2 overflow-x-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
                pathname === item.href ? "bg-blue-700" : "bg-blue-900"
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}

          <button
            onClick={() => (window.location.href = "/login")}
            className="shrink-0 rounded-lg bg-red-700 px-3 py-2 text-sm"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Page Content */}
      <main className="h-[calc(100dvh-80px)] overflow-y-auto md:ml-64 md:h-dvh">
        {children}
      </main>
    </div>
  );
}

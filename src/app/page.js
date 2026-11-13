"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("auth");
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [responseLog, setResponseLog] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "jane.employee@company.com",
    password: "Password@123",
  });

  const [registerForm, setRegisterForm] = useState({
    fullName: "Jane Employee",
    email: "jane.employee@company.com",
    password: "Password@123",
    department: "Engineering",
    role: "EMPLOYEE",
  });

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "Personal family event",
  });

  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 2);
    const end = new Date(today);
    end.setDate(today.getDate() + 4);

    setLeaveForm((prev) => ({
      ...prev,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    }));
  }, []);

  const [cancelId, setCancelId] = useState("");

  const executeApiCall = async (endpoint, method = "GET", body = null, useAuth = false) => {
    setLoading(true);
    setResponseLog(null);
    const headers = { "Content-Type": "application/json" };
    if (useAuth && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const requestDetails = {
      endpoint,
      method,
      headers,
      body: body ? JSON.stringify(body, null, 2) : null,
      timestamp: new Date().toLocaleTimeString(),
    };

    try {
      const res = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Non-JSON response returned", status: res.status };
      }

      setResponseLog({
        request: requestDetails,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data,
      });

      // Automatically store token on successful login
      if (res.ok && data?.data?.token) {
        setToken(data.data.token);
        setCurrentUser(data.data.user);
      }
      return data;
    } catch (err) {
      setResponseLog({
        request: requestDetails,
        status: 500,
        statusText: "Client Fetch Error",
        ok: false,
        data: { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    executeApiCall("/api/auth/login", "POST", loginForm);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    executeApiCall("/api/auth/register", "POST", registerForm);
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    executeApiCall("/api/leaves", "POST", leaveForm, true);
  };

  const handleFetchMe = () => executeApiCall("/api/auth/me", "GET", null, true);
  const handleFetchEmployeeDashboard = () => executeApiCall("/api/dashboard", "GET", null, true);
  const handleFetchAdminDashboard = () => executeApiCall("/api/admin/dashboard", "GET", null, true);
  const handleFetchBalances = () => executeApiCall("/api/leaves/balance", "GET", null, true);
  const handleFetchLeaves = () => executeApiCall("/api/leaves", "GET", null, true);
  const handleCancelLeave = (e) => {
    e.preventDefault();
    if (!cancelId) return alert("Please enter a valid Leave ID");
    executeApiCall(`/api/leaves/${cancelId}/cancel`, "PATCH", null, true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-700 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Employee Leave Management System (ELMS)
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Next.js 16 REST API Server &amp; Interactive Portal
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>
                  <strong>{currentUser.fullName}</strong> ({currentUser.role})
                </span>
                <button
                  onClick={() => {
                    setToken("");
                    setCurrentUser(null);
                    executeApiCall("/api/auth/logout", "POST");
                  }}
                  className="ml-2 text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-amber-400">
                Not Authenticated
              </span>
            )}
          </div>
        </header>

        {/* HTTP 405 Explainer Banner */}
        <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 text-sm text-amber-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="font-semibold text-amber-100">
                Why does browser navigation show &ldquo;HTTP ERROR 405 Method Not Allowed&rdquo;?
              </strong>
              <p className="mt-1 text-xs text-amber-300/90 leading-relaxed">
                When you paste an API URL (like <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-100">/api/auth/login</code>)
                into your browser&apos;s address bar, the browser performs a <strong>GET</strong> request.
                However, authentication and action endpoints require <strong>POST</strong> (or <strong>PATCH</strong>) with a JSON payload.
                Use the interactive tester below or an API client like Postman (see <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-100">postman_collection.json</code>).
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-700 pb-2">
          {[
            { id: "auth", label: "🔑 Authentication" },
            { id: "dashboard", label: "📊 Dashboards" },
            { id: "leaves", label: "📝 Leave Applications" },
            { id: "routes", label: "📖 All API Routes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab 1: Auth & User Actions */}
        {activeTab === "auth" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Login Card */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center justify-between">
                <span>Login (POST /api/auth/login)</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">POST</span>
              </h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Login & Save Token"}
                </button>
              </form>
            </div>

            {/* Register Card */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center justify-between">
                <span>Register (POST /api/auth/register)</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">POST</span>
              </h2>
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                    <select
                      value={registerForm.role}
                      onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
                    <input
                      type="text"
                      value={registerForm.department}
                      onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading ? "Registering..." : "Register User"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Dashboards */}
        {activeTab === "dashboard" && (
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-5">
            <h2 className="text-lg font-semibold text-white">Dashboard Endpoints</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={handleFetchEmployeeDashboard}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl text-left border border-indigo-500/30 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Employee Dashboard</span>
                  <span className="text-xs bg-indigo-900 px-2 py-0.5 rounded font-mono">GET</span>
                </div>
                <p className="text-xs text-indigo-200">
                  /api/dashboard &bull; Requires EMPLOYEE or ADMIN token
                </p>
              </button>

              <button
                onClick={handleFetchAdminDashboard}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl text-left border border-purple-500/30 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Admin Dashboard</span>
                  <span className="text-xs bg-purple-900 px-2 py-0.5 rounded font-mono">GET</span>
                </div>
                <p className="text-xs text-purple-200">
                  /api/admin/dashboard &bull; Requires ADMIN role
                </p>
              </button>

              <button
                onClick={handleFetchMe}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl text-left border border-emerald-500/30 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Current Profile</span>
                  <span className="text-xs bg-emerald-900 px-2 py-0.5 rounded font-mono">GET</span>
                </div>
                <p className="text-xs text-emerald-200">
                  /api/auth/me &bull; Returns current authenticated user
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Leaves */}
        {activeTab === "leaves" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Apply Leave Form */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center justify-between">
                <span>Apply for Leave (POST /api/leaves)</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">POST</span>
              </h2>
              <form onSubmit={handleApplyLeave} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CASUAL">Casual Leave (CASUAL)</option>
                    <option value="SICK">Sick Leave (SICK)</option>
                    <option value="EARNED">Earned Leave (EARNED)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Reason</label>
                  <input
                    type="text"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  Submit Leave Request
                </button>
              </form>
            </div>

            {/* Quick Actions & Cancel */}
            <div className="space-y-6">
              <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
                <h2 className="text-lg font-semibold text-white">Leave Queries</h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleFetchBalances}
                    disabled={loading}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition"
                  >
                    View Balances (GET /api/leaves/balance)
                  </button>
                  <button
                    onClick={handleFetchLeaves}
                    disabled={loading}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition"
                  >
                    My Leaves (GET /api/leaves)
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center justify-between">
                  <span>Cancel Leave (PATCH /api/leaves/[id]/cancel)</span>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">PATCH</span>
                </h2>
                <form onSubmit={handleCancelLeave} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Leave UUID..."
                    value={cancelId}
                    onChange={(e) => setCancelId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Route Directory */}
        {activeTab === "routes" && (
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">System REST API Endpoints</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Endpoint</th>
                    <th className="py-2.5 px-3">Access</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">POST</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/auth/register</td>
                    <td className="py-2.5 px-3 text-slate-400">Public</td>
                    <td className="py-2.5 px-3">Register new employee or admin</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">POST</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/auth/login</td>
                    <td className="py-2.5 px-3 text-slate-400">Public</td>
                    <td className="py-2.5 px-3">Authenticate user &amp; set cookie / return JWT</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">GET</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/auth/me</td>
                    <td className="py-2.5 px-3 text-slate-400">Auth User</td>
                    <td className="py-2.5 px-3">Fetch current session profile</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">POST</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/auth/logout</td>
                    <td className="py-2.5 px-3 text-slate-400">Public</td>
                    <td className="py-2.5 px-3">Clear authentication session</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">GET</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/dashboard</td>
                    <td className="py-2.5 px-3 text-slate-400">Employee</td>
                    <td className="py-2.5 px-3">Employee statistics, leave quotas, recent requests</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">GET</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/admin/dashboard</td>
                    <td className="py-2.5 px-3 text-purple-400 font-medium">Admin Only</td>
                    <td className="py-2.5 px-3">Org-wide metrics, departments, pending requests</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">POST</span> / <span className="bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">GET</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/leaves</td>
                    <td className="py-2.5 px-3 text-slate-400">Employee</td>
                    <td className="py-2.5 px-3">Apply for leave or list user leave requests</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">GET</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/leaves/balance</td>
                    <td className="py-2.5 px-3 text-slate-400">Employee</td>
                    <td className="py-2.5 px-3">Get remaining Casual, Sick, and Earned leave balances</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">PATCH</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/leaves/[id]/cancel</td>
                    <td className="py-2.5 px-3 text-slate-400">Applicant</td>
                    <td className="py-2.5 px-3">Cancel a pending leave application</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">PATCH</span></td>
                    <td className="py-2.5 px-3 font-mono text-white">/api/leaves/[id]/status</td>
                    <td className="py-2.5 px-3 text-purple-400 font-medium">Admin Only</td>
                    <td className="py-2.5 px-3">Approve or reject a leave application with atomic quota balance update</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live HTTP Response Console */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Live HTTP Request / Response Inspector
            </span>
            {responseLog && (
              <span
                className={`px-2 py-0.5 rounded font-semibold ${
                  responseLog.ok ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                }`}
              >
                HTTP {responseLog.status} {responseLog.statusText}
              </span>
            )}
          </div>
          <div className="p-4 max-h-80 overflow-y-auto space-y-3">
            {responseLog ? (
              <>
                <div className="text-slate-400">
                  <span className="text-indigo-400 font-bold">{responseLog.request.method}</span>{" "}
                  <span className="text-white">{responseLog.request.endpoint}</span>
                  <span className="text-slate-500 ml-2">({responseLog.request.timestamp})</span>
                </div>
                <pre className="text-slate-200 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(responseLog.data, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-slate-600 italic">
                Click any button or submit a form above to view real-time request and response payloads here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

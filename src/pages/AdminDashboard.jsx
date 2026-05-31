import React, { useState, useEffect } from "react";
import { Users, LogIn, AlertTriangle, Shield } from "lucide-react";
import RequireFeature from "../components/RequireFeature";

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState("7d"); // 7d, 30d, 90d
  const [stats, setStats] = useState({
    totalUsers: 1250,
    activeToday: 342,
    newSignups: 45,
    failedLogins: 23,
    securityAlerts: 5,
  });

  // Sample data for charts
  const loginTrend = [
    { date: "Mon", successful: 120, failed: 8 },
    { date: "Tue", successful: 145, failed: 12 },
    { date: "Wed", successful: 98, failed: 5 },
    { date: "Thu", successful: 210, failed: 18 },
    { date: "Fri", successful: 187, failed: 14 },
    { date: "Sat", successful: 102, failed: 6 },
    { date: "Sun", successful: 156, failed: 10 },
  ];

  const authMethods = [
    { name: "Email/Password", value: 890 },
    { name: "Google OAuth", value: 210 },
    { name: "GitHub OAuth", value: 95 },
    { name: "Microsoft OAuth", value: 55 },
  ];

  const signupTrend = [
    { date: "Week 1", signups: 156 },
    { date: "Week 2", signups: 198 },
    { date: "Week 3", signups: 176 },
    { date: "Week 4", signups: 245 },
  ];

  const twoFAUsage = [
    { name: "Disabled", value: 980, color: "#6B7280" },
    { name: "Authenticator App", value: 165, color: "#FBBF24" },
    { name: "SMS", value: 82, color: "#10B981" },
    { name: "Email", value: 23, color: "#3B82F6" },
  ];

  const recentSecurityEvents = [
    { id: 1, user: "user@example.com", event: "2FA Enabled", timestamp: "2 hours ago", severity: "info" },
    { id: 2, user: "hacker123@test.com", event: "5 Failed Login Attempts", timestamp: "4 hours ago", severity: "warning" },
    { id: 3, user: "admin@example.com", event: "Password Changed", timestamp: "1 day ago", severity: "info" },
    { id: 4, user: "unknown_ip", event: "Rate Limit Triggered", timestamp: "1 day ago", severity: "critical" },
    { id: 5, user: "user456@example.com", event: "Email Changed", timestamp: "2 days ago", severity: "info" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Monitor authentication, security, and user analytics</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2 mb-8">
          {["7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded font-semibold transition ${
                dateRange === range
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Last {range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">Total Users</h3>
              <Users size={20} className="text-yellow-400" />
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-green-400 mt-2">↑ 12% this month</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">Active Today</h3>
              <LogIn size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold">{stats.activeToday}</p>
            <p className="text-xs text-gray-400 mt-2">27% of total users</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">New Signups</h3>
              <Users size={20} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{stats.newSignups}</p>
            <p className="text-xs text-green-400 mt-2">↑ 8% today</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">Failed Logins</h3>
              <AlertTriangle size={20} className="text-orange-400" />
            </div>
            <p className="text-3xl font-bold">{stats.failedLogins}</p>
            <p className="text-xs text-gray-400 mt-2">Rate limited: 8</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">Security Alerts</h3>
              <Shield size={20} className="text-red-400" />
            </div>
            <p className="text-3xl font-bold">{stats.securityAlerts}</p>
            <p className="text-xs text-red-400 mt-2">1 requires action</p>
          </div>
        </div>

        {/* Charts Grid */}
        <RequireFeature feature="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Login Trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">Login Trend</h2>
            <div className="space-y-3">
              {loginTrend.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm font-semibold">{day.date}</span>
                  <div className="flex gap-4 flex-1 ml-4">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ width: `${day.successful * 0.3}px` }}
                        className="h-6 bg-green-500 rounded"
                      ></div>
                      <span className="text-green-400 text-sm">{day.successful}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        style={{ width: `${day.failed * 3}px` }}
                        className="h-6 bg-red-500 rounded"
                      ></div>
                      <span className="text-red-400 text-sm">{day.failed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RequireFeature>

          {/* Auth Methods Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">Authentication Methods</h2>
            <div className="space-y-4">
              {authMethods.map((method) => {
                const percentage = ((method.value / 1250) * 100).toFixed(1);
                return (
                  <div key={method.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 text-sm">{method.name}</span>
                      <span className="text-yellow-400 font-semibold">{method.value} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-3 rounded-full bg-yellow-400"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signup Trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">Signup Trend</h2>
            <div className="space-y-3">
              {signupTrend.map((week) => (
                <div key={week.date} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm font-semibold">{week.date}</span>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    <div
                      style={{ width: `${week.signups * 0.3}px` }}
                      className="h-6 bg-yellow-400 rounded"
                    ></div>
                    <span className="text-yellow-400 text-sm">{week.signups}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2FA Adoption */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">2FA Adoption</h2>
            <div className="space-y-3">
              {twoFAUsage.map((item) => {
                const percentage = ((item.value / 1250) * 100).toFixed(1);
                return (
                  <div key={item.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">{item.name}</span>
                      <span className="text-sm font-semibold">{item.value} users ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                        className="h-2 rounded-full"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">Recent Security Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-gray-400">Event</th>
                  <th className="text-left py-3 px-4 text-gray-400">Timestamp</th>
                  <th className="text-left py-3 px-4 text-gray-400">Severity</th>
                </tr>
              </thead>
              <tbody>
                {recentSecurityEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-300">{event.user}</td>
                    <td className="py-3 px-4 text-gray-300">{event.event}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{event.timestamp}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          event.severity === "critical"
                            ? "bg-red-600 text-white"
                            : event.severity === "warning"
                            ? "bg-orange-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {event.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

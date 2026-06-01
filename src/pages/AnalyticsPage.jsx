import React from "react";
import { useLicense } from "../context/LicenseContext";
import { useNavigate } from "react-router-dom";

export default function AnalyticsPage() {
  const { hasFeature } = useLicense();
  const navigate = useNavigate();

  if (!hasFeature('analytics')) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-3xl border border-yellow-600 bg-yellow-500/10 p-6 text-yellow-100">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="mt-3 text-gray-200">Analytics dashboards require the analytics feature. Upgrade to view reports and charts.</p>
          <div className="mt-4">
            <button onClick={() => navigate('/license')} className="inline-flex items-center rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold">View membership options</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white">Analytics</h1>
      <p className="mt-2 text-gray-400">Key metrics and charts. Below is an accessible table view of sample metrics for screen readers and quick verification.</p>

      <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <h2 className="text-lg font-semibold text-white">Overview metrics</h2>
        <table className="w-full mt-4" role="table">
          <thead>
            <tr>
              <th className="text-left text-gray-400 p-2">Metric</th>
              <th className="text-left text-gray-400 p-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2 text-white">Active Workflows</td><td className="p-2 text-gray-300">12</td></tr>
            <tr><td className="p-2 text-white">Completed Today</td><td className="p-2 text-gray-300">5</td></tr>
            <tr><td className="p-2 text-white">Avg Approval Time</td><td className="p-2 text-gray-300">2.4h</td></tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLicense } from "../context/LicenseContext";

export default function CRM() {
  const { hasFeature } = useLicense();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", status: "new" });

  if (!hasFeature("webhooks") && !hasFeature("analytics") && !hasFeature("files_vault")) {
    // minimal gating heuristic: if none of these features are available, show upgrade
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-3xl border border-yellow-600 bg-yellow-500/10 p-6 text-yellow-100">
          <h1 className="text-2xl font-semibold">CRM & ERP</h1>
          <p className="mt-3 text-gray-200">CRM functionality is available on upgraded plans. Upgrade to access lead and customer workflows.</p>
          <div className="mt-4">
            <button onClick={() => navigate('/license')} className="inline-flex items-center rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold">View membership options</button>
          </div>
        </div>
      </div>
    );
  }

  function createLead(e) {
    e.preventDefault();
    const id = Date.now();
    setLeads((s) => [{ id, ...form }, ...s]);
    setForm({ name: "", email: "", status: "new" });
  }

  function removeLead(id) {
    setLeads((s) => s.filter((l) => l.id !== id));
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white">CRM & ERP</h1>
      <p className="mt-2 text-gray-400">Create and manage leads. This is a small, accessible demo of Create / View / Delete workflows.</p>

      <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <h2 className="text-lg font-semibold text-white">Create lead</h2>
        <form onSubmit={createLead} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col">
            <span className="text-sm text-gray-300">Name</span>
            <input aria-label="Lead name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-300">Email</span>
            <input aria-label="Lead email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="w-full inline-flex items-center justify-center rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold">Create</button>
          </div>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-white">Leads</h2>
        <div className="mt-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
          {leads.length === 0 && <p className="text-gray-400">No leads created yet.</p>}
          <ul className="space-y-3">
            {leads.map((l) => (
              <li key={l.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                <div>
                  <div className="text-white font-semibold">{l.name || '—'}</div>
                  <div className="text-sm text-gray-400">{l.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard?.writeText(l.email)} className="text-sm text-gray-300 underline">Copy email</button>
                  <button onClick={() => removeLead(l.id)} className="text-sm text-red-400">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

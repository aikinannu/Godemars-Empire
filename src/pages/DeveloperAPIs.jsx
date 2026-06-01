import React, { useState } from "react";
import { useLicense } from "../context/LicenseContext";
import { useNavigate } from "react-router-dom";

function generateKey() {
  return 'pk_' + Math.random().toString(36).slice(2, 22);
}

export default function DeveloperAPIs() {
  const { hasFeature } = useLicense();
  const navigate = useNavigate();
  const [keys, setKeys] = useState([]);

  if (!hasFeature('private_api') && !hasFeature('analytics')) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-3xl border border-yellow-600 bg-yellow-500/10 p-6 text-yellow-100">
          <h1 className="text-2xl font-semibold">Developer APIs</h1>
          <p className="mt-3 text-gray-200">API access is gated. Upgrade to generate API keys and access developer features.</p>
          <div className="mt-4">
            <button onClick={() => navigate('/license')} className="inline-flex items-center rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold">View membership options</button>
          </div>
        </div>
      </div>
    );
  }

  function createKey() {
    const k = generateKey();
    setKeys((s) => [{ id: Date.now(), key: k, createdAt: new Date().toISOString() }, ...s]);
  }

  function revoke(id) {
    setKeys((s) => s.filter((x) => x.id !== id));
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white">Developer APIs</h1>
      <p className="mt-2 text-gray-400">Manage API keys for integrations and automation. Keys are stored in-memory for the demo.</p>

      <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <h2 className="text-lg font-semibold text-white">API Keys</h2>
        <p className="text-gray-400 mt-2">Create and revoke keys. Keep keys secret.</p>
        <div className="mt-4 flex gap-3">
          <button onClick={createKey} className="inline-flex items-center rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold">Generate key</button>
        </div>

        <div className="mt-4">
          {keys.length === 0 && <p className="text-gray-400">No keys issued yet.</p>}
          <ul className="mt-2 space-y-2">
            {keys.map((k) => (
              <li key={k.id} className="bg-gray-900/60 p-3 rounded flex items-center justify-between">
                <div className="truncate">
                  <div className="text-white font-mono text-sm">{k.key}</div>
                  <div className="text-xs text-gray-400">{new Date(k.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => navigator.clipboard?.writeText(k.key)} className="text-sm text-gray-300 underline">Copy</button>
                  <button onClick={() => revoke(k.id)} className="text-sm text-red-400">Revoke</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

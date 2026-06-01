import React, { useRef, useState } from "react";
import { useLicense } from "../context/LicenseContext";
import { useNavigate } from "react-router-dom";

export default function FilesVault() {
  const { hasFeature } = useLicense();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");

  if (!hasFeature("files_vault")) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-3xl border border-yellow-600 bg-yellow-500/10 p-6 text-yellow-100">
          <h1 className="text-2xl font-semibold">Files Vault</h1>
          <p className="mt-3 text-gray-200">Secure file storage and sharing is available on higher tiers. Upgrade to access Files Vault.</p>
          <div className="mt-4">
            <button
              onClick={() => navigate('/license')}
              className="inline-flex items-center rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold"
            >
              View membership options
            </button>
          </div>
        </div>
      </div>
    );
  }

  function onSelect(e) {
    const chosen = Array.from(e.target.files || []);
    if (!chosen.length) return;
    const mapped = chosen.map((f) => ({ id: `${Date.now()}-${f.name}`, name: f.name, size: f.size, url: URL.createObjectURL(f) }));
    setFiles((s) => [...mapped, ...s]);
    setStatus(`${chosen.length} file(s) added`);
    // reset
    if (inputRef.current) inputRef.current.value = null;
  }

  function handleDelete(id) {
    setFiles((s) => s.filter((f) => f.id !== id));
    setStatus('File removed');
  }

  function handleShare(id) {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    const url = `${window.location.origin}/files-vault/share/${encodeURIComponent(f.name)}`;
    try {
      navigator.clipboard.writeText(url);
      setStatus('Share link copied to clipboard');
    } catch (e) {
      setStatus('Copy not available in this environment');
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white">Files Vault</h1>
      <p className="mt-2 text-gray-400">Upload, view, share and manage files. All actions here are simulated (client-side) for demo purposes.</p>

      <section aria-labelledby="upload-heading" className="mt-6 rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <h2 id="upload-heading" className="text-lg font-semibold text-white">Upload files</h2>
        <p className="mt-2 text-gray-400">Accessible file input and status reporting.</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="inline-flex items-center px-4 py-2 bg-gray-800/60 rounded cursor-pointer">
            <span className="text-sm text-gray-200">Choose files</span>
            <input
              ref={inputRef}
              aria-label="Choose files to upload"
              onChange={onSelect}
              type="file"
              multiple
              className="sr-only"
            />
          </label>
          <div aria-live="polite" className="text-sm text-gray-300">{status}</div>
        </div>
      </section>

      <section aria-labelledby="files-heading" className="mt-6">
        <h2 id="files-heading" className="text-lg font-semibold text-white">Stored files</h2>
        <p className="mt-1 text-gray-400">Files stored in this session (in-memory).</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr>
                <th className="text-sm text-gray-400 p-2">Name</th>
                <th className="text-sm text-gray-400 p-2">Size</th>
                <th className="text-sm text-gray-400 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-gray-400">No files uploaded yet.</td></tr>
              )}
              {files.map((f) => (
                <tr key={f.id}>
                  <td className="p-2 text-white">{f.name}</td>
                  <td className="p-2 text-gray-300">{(f.size/1024).toFixed(1)} KB</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-yellow-300 underline">View</a>
                      <button onClick={() => handleShare(f.id)} className="text-sm text-gray-300 underline">Share</button>
                      <button onClick={() => handleDelete(f.id)} className="text-sm text-red-400">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

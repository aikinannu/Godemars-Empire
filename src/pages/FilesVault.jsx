import React, { useRef, useState, useEffect } from "react";
import { useLicense } from "../context/LicenseContext";
import { useNavigate } from "react-router-dom";

export default function FilesVault() {
  const { hasFeature } = useLicense();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null);

  const STORAGE_KEY = "files_vault_files";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setFiles(parsed || []);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

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

  async function onSelect(e) {
    const chosen = Array.from(e.target.files || []);
    if (!chosen.length) return;

    const readFile = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        // only read as dataURL for smaller files
        if (file.size <= 1_000_000) reader.readAsDataURL(file);
        else resolve(null);
      });

    const mapped = await Promise.all(
      chosen.map(async (f) => {
        const dataUrl = await readFile(f);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          size: f.size,
          type: f.type,
          dataUrl: dataUrl,
          createdAt: new Date().toISOString(),
        };
      })
    );

    setFiles((s) => {
      const next = [...mapped, ...s];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {}
      return next;
    });

    setStatus(`${mapped.length} file(s) added`);
    if (inputRef.current) inputRef.current.value = null;
  }

  function handleDelete(id) {
    setFiles((s) => {
      const next = s.filter((f) => f.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {}
      return next;
    });
    setStatus('File removed');
  }

  function handleShare(id) {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    const url = `${window.location.origin}/files-vault/share/${encodeURIComponent(f.id)}`;
    try {
      navigator.clipboard.writeText(url);
      setStatus('Share link copied to clipboard');
    } catch (e) {
      setStatus('Copy not available in this environment');
    }
  }

  function openPreview(id) {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    setPreview(f);
  }

  function closePreview() {
    setPreview(null);
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
          <p className="mt-1 text-gray-400">Files persisted to localStorage for this browser (demo only).</p>

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
                        <button onClick={() => openPreview(f.id)} className="text-sm text-yellow-300 underline">View</button>
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
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closePreview} />
          <div className="relative z-10 max-w-3xl w-full mx-4 rounded-xl bg-gray-900 p-6 border border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{preview.name}</h3>
                <div className="text-sm text-gray-400">{(preview.size/1024).toFixed(1)} KB • {preview.type || 'unknown'}</div>
              </div>
              <div className="flex items-center gap-2">
                {preview.dataUrl && (
                  <a href={preview.dataUrl} download={preview.name} className="text-sm text-gray-300 underline">Download</a>
                )}
                <button onClick={closePreview} className="text-sm text-yellow-300">Close</button>
              </div>
            </div>

            <div className="mt-4">
              {preview.dataUrl && preview.type && preview.type.startsWith('image/') ? (
                <img src={preview.dataUrl} alt={preview.name} className="max-h-[60vh] w-auto mx-auto rounded" />
              ) : preview.dataUrl ? (
                <div className="text-sm text-gray-300">Preview available for download.</div>
              ) : (
                <div className="text-sm text-gray-400">Preview not available offline for this file.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const STORAGE_KEY = "files_vault_files";

export default function FilesVaultShare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) || [];
      const foundById = parsed.find((f) => String(f.id) === String(id));
      const decoded = decodeURIComponent(id || '');
      const foundByName = parsed.find((f) => f.name === decoded);
      setFile(foundById || foundByName || null);
    } catch (e) {
      setFile(null);
    }
  }, [id]);

  if (!file) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6">
          <h1 className="text-2xl font-semibold text-white">File not found</h1>
          <p className="mt-2 text-gray-400">The shared file could not be located. It may have been removed or is not available in this browser.</p>
          <div className="mt-4">
            <button onClick={() => navigate('/files-vault')} className="rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold">Back to Files Vault</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6">
        <h1 className="text-2xl font-semibold text-white">{file.name}</h1>
        <div className="text-sm text-gray-400 mt-1">{(file.size/1024).toFixed(1)} KB</div>
        <div className="mt-4">
          {file.dataUrl ? (
            file.type && file.type.startsWith('image/') ? (
              <img src={file.dataUrl} alt={file.name} className="max-w-full rounded" />
            ) : (
              <div className="text-gray-300">Preview not available. Use download below.</div>
            )
          ) : (
            <div className="text-gray-400">Preview not available for this file.</div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {file.dataUrl && (
            <a href={file.dataUrl} download={file.name} className="rounded-2xl bg-yellow-500 px-4 py-2 text-black font-semibold">Download</a>
          )}
          <button onClick={() => navigate('/files-vault')} className="rounded-2xl border border-gray-700 px-4 py-2 text-white">Back</button>
        </div>
      </div>
    </main>
  );
}

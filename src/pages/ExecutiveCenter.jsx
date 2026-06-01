import React, { useEffect, useMemo, useState } from 'react';
import { useLicense } from '../context/LicenseContext';
import RequireFeature from '../components/RequireFeature';

const STORAGE_KEY = 'files_vault_files';
const ACTIVITY_KEY = 'files_vault_activity';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length-1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExecutiveCenter() {
  const { hasFeature } = useLicense();
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    try {
      const rawF = localStorage.getItem(STORAGE_KEY);
      const rawA = localStorage.getItem(ACTIVITY_KEY);
      setFiles(rawF ? JSON.parse(rawF) : []);
      setActivities(rawA ? JSON.parse(rawA) : []);
    } catch (e) {
      setFiles([]);
      setActivities([]);
    }
  }, []);

  const totalFiles = files.length;
  const filesShared = activities.filter((a) => a.type === 'shared').length;
  const activeUsers = new Set(activities.map((a) => a.user).filter(Boolean)).size || 0;
  const recentUploads = [...files].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5);
  const storageUsed = files.reduce((s,f) => s + (f.size || 0), 0);

  const timeline = useMemo(() => {
    const combined = [];
    // include activity entries
    (activities || []).forEach((a) => combined.push({ ...a }));
    // ensure uploads present for files not in activities
    (files || []).forEach((f) => {
      if (!activities.find((a) => a.fileId === f.id && a.type === 'uploaded')) {
        combined.push({ id: `synthetic-${f.id}`, type: 'uploaded', fileId: f.id, fileName: f.name, user: 'unknown', timestamp: f.createdAt });
      }
    });
    // add a couple of synthetic events for demo feel
    combined.push({ id: 'synth-license', type: 'license-upgrade', user: 'system', timestamp: new Date(Date.now()-3600*1000).toISOString(), details: 'License upgraded to Pro' });
    combined.push({ id: 'synth-signup', type: 'signup', user: 'new.user@example.com', timestamp: new Date(Date.now()-7200*1000).toISOString(), details: 'New account created' });
    return combined.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,20);
  }, [activities, files]);

  function exportActivityCSV() {
    const header = ['id','type','fileId','fileName','user','timestamp'];
    const rows = (activities || []).map((r) => header.map((h) => (r[h] !== undefined ? String(r[h]).replace(/"/g, '""') : '')).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    downloadCSV('executive-activity.csv', csv);
  }

  function exportSummaryCSV() {
    const rows = [
      ['metric','value'],
      ['Total Files', totalFiles],
      ['Files Shared', filesShared],
      ['Active Users', activeUsers],
      ['Storage Used', formatBytes(storageUsed)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadCSV('executive-summary.csv', csv);
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white">Executive Center</h1>
      <p className="mt-2 text-gray-400">Leadership metrics, activity timeline and exports.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400">Total Files</div>
          <div className="text-2xl font-bold text-white">{totalFiles}</div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400">Files Shared</div>
          <div className="text-2xl font-bold text-white">{filesShared}</div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400">Active Users</div>
          <div className="text-2xl font-bold text-white">{activeUsers}</div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400">Recent Uploads</div>
          <div className="text-2xl font-bold text-white">{recentUploads.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400">Storage Used</div>
          <div className="text-2xl font-bold text-white">{formatBytes(storageUsed)}</div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Activity Timeline</h2>
        <RequireFeature feature="analytics">
          <div className="flex gap-2">
            <button onClick={exportActivityCSV} className="rounded-2xl bg-yellow-500 px-3 py-2 text-black font-semibold">Export Activity</button>
            <button onClick={exportSummaryCSV} className="rounded-2xl border border-gray-700 px-3 py-2 text-white">Export Summary</button>
          </div>
        </RequireFeature>
      </div>

      <div className="mt-4 space-y-2">
        {timeline.map((t) => (
          <div key={t.id} className="rounded-lg border border-gray-700 p-3 bg-gray-900/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-300 font-medium">{t.type.replace('-', ' ')}</div>
                <div className="text-xs text-gray-500">{t.fileName || t.details || ''}</div>
              </div>
              <div className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-xs text-gray-400">By: {t.user}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

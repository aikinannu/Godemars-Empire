import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { NAV_ITEMS } from "../config/navigation";
import { hasTierAccess, normalizeTier, formatTierLabel } from "../utils/tierUtils";
import FEATURE_MATRIX from "../config/feature-matrix.json";
import { useLicense } from "../context/LicenseContext";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Zap, Users, Lock, ChevronRight } from "lucide-react";

const DashboardPage = () => {
  const { membershipTier } = useAuth();
  const currentTier = normalizeTier(membershipTier);
  const navigate = useNavigate();
  const { hasFeature } = useLicense();
  const [recentFiles, setRecentFiles] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('files_vault_files');
      if (raw) {
        const parsed = JSON.parse(raw) || [];
        setRecentFiles(parsed.slice(0, 4));
      }
    } catch (e) {}
  }, []);

  const stats = [
    {
      label: "Active Workflows",
      value: "12",
      icon: Zap,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Pending Approvals",
      value: "4",
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Users",
      value: "248",
      icon: Users,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const tierColors = {
    basic: "from-blue-500 to-blue-600",
    standard: "from-purple-500 to-purple-600",
    premium: "from-yellow-500 to-orange-500",
  };
  const tierBg = {
    basic: "bg-blue-500/10",
    standard: "bg-purple-500/10",
    premium: "bg-yellow-500/10",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-8">
      {/* Hero Header */}
      <div className="rounded-3xl border border-gray-700 bg-gradient-to-br from-gray-900 via-gray-950 to-black p-8 shadow-xl">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-white mb-3">Welcome to Your Dashboard</h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Monitor workflows, manage approvals, and access all GD workflow modules in one central hub.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
              <span className="text-sm font-semibold text-yellow-200">
                Your tier: <span className="text-yellow-300 font-bold ml-1">{formatTierLabel(currentTier)}</span>
              </span>
            </div>
            <div className="inline-flex items-center rounded-full border border-gray-600 bg-gray-800 px-4 py-2">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              <span className="text-sm text-gray-300">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="group relative rounded-2xl border border-gray-700 bg-gray-900/50 p-6 hover:border-gray-600 transition duration-300 overflow-hidden"
            >
              <div className={"absolute inset-0 bg-gradient-to-br " + stat.color + " opacity-0 group-hover:opacity-5 transition duration-300"}></div>
              <div className="relative">
                <div className={"w-12 h-12 rounded-xl " + stat.bgColor + " flex items-center justify-center mb-4"}>
                  <Icon className={"bg-gradient-to-br " + stat.color + " bg-clip-text text-transparent"} size={24} />
                </div>
                <p className="text-sm uppercase tracking-[0.15em] text-gray-500 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Create Workflow", action: () => {} },
            { label: "Review Approvals", action: () => {} },
            { label: "View Reports", action: () => {} },
            { label: "Settings", action: () => {} },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-200 transition duration-200 group"
            >
              <span>{btn.label}</span>
              <ChevronRight size={16} className="text-gray-500 group-hover:text-yellow-400 transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Files (integrates Files Vault) */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Recent Files</h2>
        <p className="text-sm text-gray-400 mb-4">Quick access to files uploaded in the Files Vault.</p>
        <div>
          {recentFiles.length === 0 && <div className="text-gray-400">No recent files.</div>}
          <ul className="space-y-2">
            {recentFiles.map((f) => (
              <li key={f.id} className="flex items-center justify-between bg-gray-800/40 p-3 rounded">
                <div>
                  <div className="text-sm text-white font-medium">{f.name}</div>
                  <div className="text-xs text-gray-400">{(f.size/1024).toFixed(1)} KB</div>
                </div>
                <div className="flex gap-2 items-center">
                  {hasFeature('files_vault') ? (
                    <>
                      <button onClick={() => navigate(`/files-vault/share/${encodeURIComponent(f.id)}`)} className="text-sm text-yellow-300 underline">Open</button>
                      <button onClick={() => navigate('/files-vault')} className="text-sm text-gray-300 underline">Manage</button>
                    </>
                  ) : (
                    <button onClick={(e) => { e.preventDefault(); navigate('/license'); }} className="text-sm text-yellow-300 underline">Upgrade</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Workflow Modules Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">GD Workflow Modules</h2>
          <p className="text-gray-400">Access all features based on your membership tier</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_ITEMS.filter((item) => item.slug !== "/dashboard").map((item) => {
            const required = FEATURE_MATRIX[item.slug]?.features || [];
            const featureLocked = required.length ? required.some((f) => !hasFeature(f)) : false;
            const unlocked = required.length ? !featureLocked : hasTierAccess(currentTier, item.access);

            return (
              <button
                key={item.slug}
                onClick={() => navigate(item.slug)}
                disabled={!unlocked}
                className={
                  unlocked
                    ? "group relative rounded-2xl border p-6 transition duration-300 overflow-hidden text-left border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900 cursor-pointer"
                    : "group relative rounded-2xl border p-6 transition duration-300 overflow-hidden text-left border-gray-800 bg-gray-950/50 cursor-not-allowed opacity-75"
                }
              >
                {/* Gradient background on hover */}
                {unlocked && (
                  <div className={"absolute inset-0 bg-gradient-to-br " + tierColors[item.access] + " opacity-0 group-hover:opacity-5 transition duration-300"}></div>
                )}

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={"w-10 h-10 rounded-lg " + tierBg[item.access] + " flex items-center justify-center flex-shrink-0"}>
                      {item.access === "premium" && <span className="text-lg">👑</span>}
                      {item.access === "standard" && <span className="text-lg">⭐</span>}
                      {item.access === "basic" && <span className="text-lg">✓</span>}
                    </div>
                    <span className={
                      unlocked
                        ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-widest bg-gradient-to-r " + tierColors[item.access] + " bg-clip-text text-transparent border border-gray-700"
                        : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-widest bg-gray-800 border border-gray-700 text-gray-400"
                    }>
                      {item.access}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-300 transition">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Footer */}
                  {!unlocked && (
                    <div className="inline-flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-300 uppercase tracking-[0.1em]">
                        <Lock size={12} />
                        Upgrade to access
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate('/license');
                        }}
                        className="text-xs text-yellow-300 underline"
                      >
                        Upgrade
                      </button>
                    </div>
                  )}
                  {unlocked && (
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-yellow-300 transition">
                      Explore <ChevronRight size={12} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import React from "react";
import { useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../config/navigation";
import { formatTierLabel, hasTierAccess, normalizeTier } from "../utils/tierUtils";
import FEATURE_MATRIX from "../config/feature-matrix.json";
import { useLicense } from "../context/LicenseContext";
import { useAuth } from "../context/AuthContext";

const FeaturePage = ({ featureSlug }) => {
  const { membershipTier } = useAuth();
  const currentTier = normalizeTier(membershipTier);
  const navigate = useNavigate();
  const feature = NAV_ITEMS.find((item) => item.slug === featureSlug);

  const { hasFeature } = useLicense();

  if (!feature) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-white">
        <h1 className="text-3xl font-semibold">Feature not found</h1>
        <p className="mt-3 text-gray-400">The requested workflow feature is unavailable.</p>
      </div>
    );
  }

  const requiredFeatures = FEATURE_MATRIX[featureSlug]?.features || [];
  const unlocked = requiredFeatures.length ? requiredFeatures.every((f) => hasFeature(f)) : hasTierAccess(currentTier, feature.access);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-400/80">Workflow module</p>
            <h1 className="mt-2 text-4xl font-bold text-white">{feature.title}</h1>
            <p className="mt-3 max-w-3xl text-gray-400">{feature.description}</p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Access level</p>
            <p className="text-lg font-semibold text-white">{formatTierLabel(feature.access)}</p>
            {!unlocked && (
              <span className="inline-flex rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-yellow-300">
                Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {unlocked ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Your workflow status</h2>
            <p className="mt-3 text-gray-400">This area will show GD workflow progress, approvals, and actionable items for this module.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-gray-900/80 p-4 text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Active flows</p>
                <p className="mt-3 text-3xl font-semibold">8</p>
              </div>
              <div className="rounded-3xl bg-gray-900/80 p-4 text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Pending tasks</p>
                <p className="mt-3 text-3xl font-semibold">2</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Launch a new workflow</h2>
            <p className="mt-3 text-gray-400">Start a new process, assign a team, or execute the next step in your GD workflow.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 inline-flex items-center justify-center rounded-3xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400"
            >
              Open workflow command center
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-yellow-600 bg-yellow-500/10 p-6 text-yellow-100">
          <h2 className="text-xl font-semibold">Upgrade required</h2>
          <p className="mt-3 text-gray-200">This feature requires a {formatTierLabel(feature.access)} membership. Upgrade to unlock the full GD workflow experience for this module.</p>
          <button
            onClick={() => navigate("/profile")}
            className="mt-6 inline-flex items-center justify-center rounded-3xl border border-yellow-500 bg-yellow-500/15 px-5 py-3 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20"
          >
            View membership options
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturePage;

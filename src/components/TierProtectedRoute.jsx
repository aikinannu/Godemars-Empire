import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasTierAccess } from "../utils/tierUtils";

export default function TierProtectedRoute({ children, requiredTier = "basic", fallbackPath = "/dashboard" }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 border-4 border-yellow-600 border-t-yellow-400 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentTier = user?.membershipTier || user?.plan || user?.tier || "basic";
  if (!hasTierAccess(currentTier, requiredTier)) {
    return <Navigate to={fallbackPath} replace state={{ from: window.location.pathname, requiredTier }} />;
  }

  return children;
}

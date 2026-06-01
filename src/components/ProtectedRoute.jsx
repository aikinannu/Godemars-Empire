import React from "react";
import { Navigate } from "react-router-dom";
import { useLicense } from "../context/LicenseContext";

export default function ProtectedRoute({ children }) {
  const { license, loading } = useLicense();

  if (loading) return <div className="p-6 text-white">Checking license…</div>;

  if (!license) {
    return <Navigate to="/license" replace />;
  }

  return children;
}

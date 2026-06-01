import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../config/navigation";
import { Lock } from "lucide-react";
import FEATURE_MATRIX from "../config/feature-matrix.json";
import { useAuth } from "../context/AuthContext";
import { useLicense } from "../context/LicenseContext";

const LeftSidebar = () => {
  const { logout, hasAccess } = useAuth();
  const { hasFeature } = useLicense();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:block w-64 bg-gray-900 border-r border-gray-800 text-gray-200 py-4 overflow-auto max-h-[calc(100vh-64px)]">
      <nav className="px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const required = FEATURE_MATRIX[item.slug]?.features || [];
          const featureLocked = required.length ? required.some((f) => !hasFeature(f)) : false;
          const locked = !hasAccess(item.access) || featureLocked;
          return (
            <Link
              key={item.slug}
              to={item.slug}
              className={`block px-3 py-2 rounded text-sm transition ${locked ? "text-gray-500 hover:text-gray-300" : "text-gray-200 hover:bg-gray-800 hover:text-yellow-400"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{item.title}</span>
                {locked && (
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-yellow-300">
                      <Lock size={12} />
                      <span>{item.access}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate('/license');
                      }}
                      className="text-[11px] text-yellow-300 underline"
                    >
                      Upgrade
                    </button>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 mt-4 pt-4 px-2 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full text-left px-2 py-2 rounded hover:bg-gray-800 hover:text-red-400 text-sm text-gray-300 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;

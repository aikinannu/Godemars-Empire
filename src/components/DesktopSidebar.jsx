import React from "react";
import { useLocation, Link } from "react-router-dom";
import { LogOut, Settings, HelpCircle, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLicense } from "../context/LicenseContext";
import { NAV_ITEMS } from "../config/navigation";
import FEATURE_MATRIX from "../config/feature-matrix.json";
import { useNavigate } from "react-router-dom";

export default function DesktopSidebar({ className = "" }) {
  const { logout } = useAuth();
  const { hasFeature } = useLicense();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (itemSlug) => pathname === itemSlug || pathname.startsWith(itemSlug);

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={`hidden lg:block ${className}`}
    >
      <div className="sticky top-20 w-64 bg-gray-900/40 border border-gray-800 rounded-lg p-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1 pb-4 border-b border-gray-800">
          {NAV_ITEMS.map((item) => {
            const required = FEATURE_MATRIX[item.slug]?.features || [];
            const missingFeature = required.length ? required.some((f) => !hasFeature(f)) : false;
            const locked = item.access === 'premium' && missingFeature;

            return (
              <Link
                key={item.slug}
                to={item.slug}
                title={item.description}
                className={`block px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                  isActive(item.slug)
                    ? "bg-yellow-400/10 border-l-4 border-yellow-400 text-yellow-400"
                    : locked
                    ? "text-gray-500 hover:bg-gray-800 hover:text-yellow-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{item.title}</span>
                  {locked && (
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-yellow-300">
                        <Lock size={12} />
                        <span className="sr-only">Locked</span>
                        <span>Premium</span>
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
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 space-y-2">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
              isActive("/settings")
                ? "bg-yellow-400/10 text-yellow-400"
                : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>

          <button
            title="Help & Support"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition text-sm"
          >
            <HelpCircle size={18} />
            <span>Help</span>
          </button>

          <button
            onClick={handleLogout}
            title="Sign out of your account"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/20 transition text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

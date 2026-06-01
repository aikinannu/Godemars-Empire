import React from "react";
import { X, LogOut, Settings, HelpCircle, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { NAV_ITEMS, slugify } from "../config/navigation";
import FEATURE_MATRIX from "../config/feature-matrix.json";
import { useLicense } from "../context/LicenseContext";

const SideDrawer = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const { hasFeature } = useLicense();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer (on top of overlay) */}
      <div className="fixed inset-0 bg-gray-950/95 z-50 md:hidden overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-yellow-400">Menu</h2>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 focus:outline-none transition"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-3">
          {NAV_ITEMS.map((item) => {
            const required = FEATURE_MATRIX[item.slug]?.features || [];
            const featureLocked = required.length ? required.some((f) => !hasFeature(f)) : false;
            const locked = item.access === 'premium' && featureLocked;
            return (
              <Link
                key={item.slug}
                to={item.slug}
                onClick={onClose}
                className={`block px-3 py-2 rounded ${locked ? 'text-gray-500' : 'text-gray-300 hover:bg-gray-800 hover:text-yellow-400'} transition`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.title}</span>
                  {locked && (
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-yellow-300">
                        <Lock size={12} />
                        <span>Premium</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate('/license');
                          onClose();
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

        <div className="border-t border-gray-800 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-yellow-400 rounded transition">
            <Settings size={18} />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-yellow-400 rounded transition">
            <HelpCircle size={18} />
            Help
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default SideDrawer;

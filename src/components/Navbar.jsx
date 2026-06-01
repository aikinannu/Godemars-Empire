import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, MessageCircle, Menu as MenuIcon, UserCircle } from "lucide-react";
import logo from "../assets/logo.png";
import { useUI } from "../context/UIContext";
import { useAuth } from "../context/AuthContext";
import LogoDropdown from "./LogoDropdown";

const Navbar = ({ onSearchClick }) => {
  // mobile inline menu removed — we use global SideDrawer for mobile navigation

  const ui = useUI();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuClick = () => {
    // open the shared SideDrawer
    try {
      ui.openDrawer();
    } catch (e) {
      // ignore if UIProvider not present
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const allowedHeaderPaths = [
    "/",
    "/about",
    "/purpose",
    "/careers",
    "/vision",
    "/team",
    "/contact",
    "/license",
    "/domains",
  ];

  const routeTitles = {
    "/dashboard": "Dashboard",
    "/profile": "Profile",
    "/premium": "Premium",
    "/feed": "Feed",
    "/settings": "Settings",
    "/analytics": "Analytics",
    "/billing": "Billing",
    "/developer-apis": "Developer APIs",
    "/integrations": "Integrations",
  };

  const currentPath = (location.pathname || "").toLowerCase().replace(/\/+$/g, "") || "/";
  const showFullHeader = !isAuthenticated || allowedHeaderPaths.includes(currentPath);
  const pageTitle = routeTitles[currentPath] || (currentPath === "/" ? "Home" : currentPath.replace("/", "").split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "));

  return (
    <nav className={`w-full bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white shadow-lg sticky top-0 z-50`}>
      <div className={`max-w-7xl mx-auto px-5 ${showFullHeader ? "py-2" : "py-1"} flex justify-between items-center`}>
        {/* Brand / Logo */}
        {isAuthenticated ? (
          <LogoDropdown />
        ) : (
          <Link 
            to="/homefeed" 
            className="flex items-center gap-2 text-yellow-400 hover:text-white transition duration-300"
          >
            <img src={logo} alt="Godemar's Empire" className={`rounded-full ${showFullHeader ? "w-9 h-9" : "w-7 h-7"}`} />
            {showFullHeader && <span className="font-extrabold tracking-wide text-lg">Godemar's Empire</span>}
          </Link>
        )}

        <div className="hidden md:flex items-center gap-4">
          {showFullHeader ? (
            <>
              <Link to="/homefeed" className="hover:text-yellow-400 transition text-sm">Home</Link>
              <Link to="/about" className="hover:text-yellow-400 transition text-sm">About</Link>
              <Link to="/purpose" className="hover:text-yellow-400 transition text-sm">Purpose</Link>
              <Link to="/careers" className="hover:text-yellow-400 transition text-sm">Careers</Link>
              <Link to="/vision" className="hover:text-yellow-400 transition text-sm">Vision</Link>
              <Link to="/license" className="hover:text-yellow-400 transition text-sm">License</Link>
              <Link to="/premium" className="hover:text-yellow-400 transition text-sm">Premium</Link>
              <Link to="/contact" className="hover:text-yellow-400 transition text-sm">Contact</Link>
              <div className="border-l border-gray-600 pl-6 flex space-x-3">
                <Link to="/login" className="px-3 py-2 bg-gray-700 hover:bg-yellow-600 rounded transition text-sm">Login</Link>
                <Link to="/signup" className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition text-sm">Sign Up</Link>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 flex justify-center">
                <span className="text-sm md:text-base font-semibold uppercase tracking-wide text-white/90">
                  {pageTitle}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onSearchClick}
                  className="text-yellow-400 p-2 rounded-md hover:bg-white/10 focus:outline-none"
                  aria-label="Open search"
                >
                  <Search size={20} />
                </button>
                <button
                  type="button"
                  className="text-yellow-400 p-2 rounded-md hover:bg-white/10 focus:outline-none"
                  aria-label="Open messages"
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  type="button"
                  className="text-yellow-400 p-2 rounded-md hover:bg-white/10 focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="text-yellow-400 p-2 rounded-full bg-white/5 hover:bg-white/10 focus:outline-none"
                  aria-label="Open profile"
                >
                  <UserCircle size={22} />
                </button>
              </div>
            </>
          )}
        </div>

        {showFullHeader ? null : (
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onSearchClick}
              className="text-yellow-400 p-2 rounded-md hover:bg-white/10 focus:outline-none"
              aria-label="Open search"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              className="text-yellow-400 p-2 rounded-md hover:bg-white/10 focus:outline-none"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
            <button
              className="text-yellow-400 text-2xl focus:outline-none"
              onClick={handleMenuClick}
              aria-label="Open menu"
            >
              <MenuIcon size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Inline mobile menu removed — use global drawer */}
    </nav>
  );
};

export default Navbar;
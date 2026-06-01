// Single canonical App.jsx (one App, one default export)
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import DrawerContainer from "./components/DrawerContainer";
import BottomNav from "./components/BottomNav";

import Home from "./pages/Home";
import About from "./pages/About";
import Domains from "./pages/Domains";
import Purpose from "./pages/Purpose";
import Team from "./pages/Team";
import Vision from "./pages/Vision";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Feed from "./pages/Feed.jsx";
import LicensePage from "./pages/LicensePage";
import PremiumPage from "./pages/Premium";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import UserSettings from "./pages/UserSettings";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/DashboardPage";
import Profile from "./pages/Profile";
import FeaturePage from "./pages/FeaturePage";
import Reels from "./pages/Reels";
import Market from "./pages/Market";
import Community from "./pages/Community";
import Messages from "./pages/Messages";
import HomeFeed from "./pages/HomeFeed.jsx";
import FilesVault from "./pages/FilesVault";
import CRM from "./pages/CRM";
import DeveloperAPIs from "./pages/DeveloperAPIs";
import AnalyticsPage from "./pages/AnalyticsPage";
import FilesVaultShare from "./pages/FilesVaultShare";
import ExecutiveCenter from "./pages/ExecutiveCenter";
import RequireFeature from "./components/RequireFeature";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProtectedRoute from "./components/AuthProtectedRoute";
import TierProtectedRoute from "./components/TierProtectedRoute";
import { NAV_ITEMS } from "./config/navigation";

import {
  Home as HomeIcon,
  Info,
  Briefcase,
  Eye,
  Users,
  Mail,
  LogOut,
  LayoutDashboard,
  Menu,
} from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
};

function AnimatedRoutes() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/signup")) {
      navigate("/homefeed");
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div variants={pageVariants}><Home /></motion.div>} />
        <Route path="/about" element={<motion.div variants={pageVariants}><About /></motion.div>} />
        <Route path="/domains" element={<motion.div variants={pageVariants}><Domains /></motion.div>} />
        <Route path="/purpose" element={<motion.div variants={pageVariants}><Purpose /></motion.div>} />
        <Route path="/team" element={<motion.div variants={pageVariants}><Team /></motion.div>} />
        <Route path="/vision" element={<motion.div variants={pageVariants}><Vision /></motion.div>} />
        <Route path="/careers" element={<motion.div variants={pageVariants}><Careers /></motion.div>} />
        <Route path="/contact" element={<motion.div variants={pageVariants}><Contact /></motion.div>} />
        <Route path="/feed" element={<motion.div variants={pageVariants}><Feed /></motion.div>} />
        <Route path="/home" element={<motion.div variants={pageVariants}><Home /></motion.div>} />
        <Route
          path="/reels"
          element={
            <AuthProtectedRoute>
              <motion.div variants={pageVariants}><Reels /></motion.div>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <AuthProtectedRoute>
              <motion.div variants={pageVariants}><Market /></motion.div>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <AuthProtectedRoute>
              <motion.div variants={pageVariants}><Community /></motion.div>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <AuthProtectedRoute>
              <motion.div variants={pageVariants}><Messages /></motion.div>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/homefeed"
          element={
            <AuthProtectedRoute>
              <motion.div variants={pageVariants}><HomeFeed /></motion.div>
            </AuthProtectedRoute>
          }
        />
        <Route path="/login" element={<motion.div variants={pageVariants}><Login /></motion.div>} />
        <Route path="/signup" element={<motion.div variants={pageVariants}><Signup /></motion.div>} />
        <Route path="/reset-password" element={<motion.div variants={pageVariants}><ResetPassword /></motion.div>} />
        <Route path="/verify-email" element={<motion.div variants={pageVariants}><VerifyEmail /></motion.div>} />
        <Route path="/two-factor-setup" element={<motion.div variants={pageVariants}><TwoFactorSetup /></motion.div>} />
        <Route path="/settings" element={<ProtectedRoute><motion.div variants={pageVariants}><UserSettings /></motion.div></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><motion.div variants={pageVariants}><AdminDashboard /></motion.div></ProtectedRoute>} />
        <Route path="/license" element={<motion.div variants={pageVariants}><LicensePage /></motion.div>} />
        <Route
          path="/dashboard"
          element={
            <AuthProtectedRoute>
              <motion.div variants={pageVariants}><Dashboard /></motion.div>
            </AuthProtectedRoute>
          }
        />
        {/* Explicit module routes (implemented pages) */}
        <Route
          path="/files-vault"
          element={
            <AuthProtectedRoute>
              <TierProtectedRoute requiredTier="standard">
                <motion.div variants={pageVariants}><FilesVault /></motion.div>
              </TierProtectedRoute>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/files-vault/share/:id"
          element={
            <AuthProtectedRoute>
              <TierProtectedRoute requiredTier="standard">
                <motion.div variants={pageVariants}><FilesVaultShare /></motion.div>
              </TierProtectedRoute>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/executive-center"
          element={
            <AuthProtectedRoute>
              <RequireFeature feature="analytics">
                <TierProtectedRoute requiredTier="premium">
                  <motion.div variants={pageVariants}><ExecutiveCenter /></motion.div>
                </TierProtectedRoute>
              </RequireFeature>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/crm-erp"
          element={
            <AuthProtectedRoute>
              <TierProtectedRoute requiredTier="premium">
                <motion.div variants={pageVariants}><CRM /></motion.div>
              </TierProtectedRoute>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/developer-apis"
          element={
            <AuthProtectedRoute>
              <TierProtectedRoute requiredTier="standard">
                <motion.div variants={pageVariants}><DeveloperAPIs /></motion.div>
              </TierProtectedRoute>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <AuthProtectedRoute>
              <TierProtectedRoute requiredTier="standard">
                <motion.div variants={pageVariants}><AnalyticsPage /></motion.div>
              </TierProtectedRoute>
            </AuthProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthProtectedRoute>
              <motion.div variants={pageVariants}><Profile /></motion.div>
            </AuthProtectedRoute>
          }
        />
        {NAV_ITEMS.filter((item) => !['/dashboard','/files-vault','/crm-erp','/developer-apis','/analytics'].includes(item.slug)).map((item) => (
          <Route
            key={item.slug}
            path={item.slug}
            element={
              <AuthProtectedRoute>
                <TierProtectedRoute requiredTier={item.access}>
                  <motion.div variants={pageVariants}>
                    <FeaturePage featureSlug={item.slug} />
                  </motion.div>
                </TierProtectedRoute>
              </AuthProtectedRoute>
            }
          />
        ))}
        <Route
          path="/premium"
          element={
            <ProtectedRoute>
              <TierProtectedRoute requiredTier="premium">
                <motion.div variants={pageVariants}><PremiumPage /></motion.div>
              </TierProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<motion.div variants={pageVariants}><NotFound /></motion.div>} />
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const [showSearch, setShowSearch] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract active tab from current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/homefeed") return "home";
    if (path === "/reels") return "reels";
    if (path === "/market") return "market";
    if (path === "/community") return "community";
    if (path === "/messages") return "messages";
    if (path === "/profile") return "profile";
    return "home";
  };

  const handleTabChange = (tabId) => {
    const routeMap = {
      home: "/homefeed",
      reels: "/reels",
      market: "/market",
      community: "/community",
      messages: "/messages",
      profile: "/profile",
    };
    navigate(routeMap[tabId] || `/${tabId}`);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && !showSearch) {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") setShowSearch(false);
    };

    const checkEnvironment = () => {
      const isMobile = window.innerWidth <= 768;
      const isDesktopApp = navigator.userAgent.includes("Electron");
      const isMobileApp = navigator.userAgent.includes("ReactNative");
      if (isMobileApp || isDesktopApp) setShowFooter(false);
      else if (isMobile) setShowFooter(false);
      else setShowFooter(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", checkEnvironment);
    checkEnvironment();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", checkEnvironment);
    };
  }, [showSearch]);

  return (
    <>
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <SearchBar onClose={() => setShowSearch(false)} />}
      <DrawerContainer />

      <div className={`${isAuthenticated ? "pb-16" : "pb-0"} bg-black dark:bg-gray-900`}>
        <AnimatedRoutes />
      </div>

      {isAuthenticated && (
        <BottomNav activeTab={getActiveTab()} setActiveTab={handleTabChange} />
      )}

      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;

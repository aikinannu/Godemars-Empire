import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Shield, Key, Mail, Smartphone, LogOut, Copy, Check, Trash2, Lock } from "lucide-react";

export default function UserSettings() {
  const { user, logout, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Profile state
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  // Sessions state
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: "Chrome on Windows",
      location: "New York, USA",
      ip: "192.168.1.1",
      lastActive: "2 hours ago",
      current: true,
    },
    {
      id: 2,
      device: "Safari on iPhone",
      location: "New York, USA",
      ip: "192.168.1.2",
      lastActive: "1 day ago",
      current: false,
    },
  ]);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState("authenticator");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await updatePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setSuccessMessage("Password changed successfully!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setErrorMessage(err.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllSessions = () => {
    if (window.confirm("Are you sure? You will be logged out of all devices.")) {
      logout();
      navigate("/login");
    }
  };

  const handleRemoveSession = (sessionId) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const handleEnable2FA = () => {
    navigate("/two-factor-setup");
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "This action cannot be undone. All your data will be permanently deleted. Are you sure?"
      )
    ) {
      console.log("Delete account - would call API");
      // TODO: Implement account deletion API call
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account, security, and preferences</p>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-start gap-3">
            <Check size={20} className="text-green-400 mt-0.5" />
            <div>
              <p className="font-semibold text-green-400">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg flex items-start gap-3">
            <Check size={20} className="text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 overflow-x-auto">
          {[
            { id: "profile", label: "Profile", icon: "👤" },
            { id: "security", label: "Security", icon: "🔐" },
            { id: "sessions", label: "Sessions", icon: "📱" },
            { id: "danger", label: "Danger Zone", icon: "⚠️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-yellow-400">Profile Information</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
                  />
                  <button
                    onClick={() => handleCopyEmail(user?.email)}
                    className="p-2 hover:bg-gray-700 rounded transition"
                  >
                    {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {user?.email_verified ? "✓ Verified" : "⚠️ Not verified"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={profileForm.username}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Account Created
                </label>
                <p className="text-gray-400">
                  {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-yellow-400">Security Settings</h2>

              {/* 2FA Section */}
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Shield size={24} className="text-yellow-400" />
                    <div>
                      <h3 className="font-semibold">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">
                        {twoFAEnabled ? "Enabled" : "Add extra protection to your account"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnable2FA}
                    className={`px-4 py-2 rounded font-semibold transition ${
                      twoFAEnabled
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-yellow-600 hover:bg-yellow-700 text-white"
                    }`}
                  >
                    {twoFAEnabled ? "Manage" : "Enable"}
                  </button>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Key size={20} /> Change Password
                </h3>

                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white font-semibold rounded transition"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-yellow-400">Active Sessions</h2>

              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{session.device}</p>
                        {session.current && (
                          <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {session.location} • {session.ip}
                      </p>
                      <p className="text-xs text-gray-500">Last active: {session.lastActive}</p>
                    </div>

                    {!session.current && (
                      <button
                        onClick={() => handleRemoveSession(session.id)}
                        className="ml-4 p-2 hover:bg-red-600/20 rounded transition text-gray-400 hover:text-red-400"
                      >
                        <LogOut size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleLogoutAllSessions}
                className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600 text-red-400 font-semibold rounded transition"
              >
                Logout All Other Sessions
              </button>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-red-500">Danger Zone</h2>

              <div className="bg-red-900/20 border border-red-600 p-4 rounded-lg">
                <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <Lock size={20} /> Delete Account
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  This will permanently delete your account and all associated data. This action
                  cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition flex items-center gap-2"
                >
                  <Trash2 size={18} /> Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

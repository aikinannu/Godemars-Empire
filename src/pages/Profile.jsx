import React, { useState, useEffect } from "react";
import {
  Edit2,
  LogOut,
  MapPin,
  Mail,
  Calendar,
  Award,
  ShieldCheck,
  CreditCard,
  Wallet,
  Archive,
  Server,
  Globe,
  Cloud,
  Layers,
  Users,
  Activity,
  Sparkles,
  Briefcase,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck,
  Loader,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatTierLabel, hasTierAccess, normalizeTier } from "../utils/tierUtils";
import DesktopSidebar from "../components/DesktopSidebar";
import DesktopQuickNav from "../components/DesktopQuickNav";
import * as api from "../services/api";

const hubSections = [
  {
    title: "Account",
    access: "basic",
    details: [
      { label: "Billing", icon: CreditCard },
      { label: "Wallets", icon: Wallet },
      { label: "Security", icon: ShieldCheck },
    ],
  },
  {
    title: "Products",
    access: "standard",
    details: [
      { label: "Licenses", icon: Archive },
      { label: "Marketplace", icon: Briefcase },
      { label: "Downloads", icon: Archive },
    ],
  },
  {
    title: "Domains",
    access: "standard",
    details: [
      { label: "DNS", icon: Globe },
      { label: "SSL", icon: ShieldCheck },
      { label: "Hosting", icon: Server },
    ],
  },
  {
    title: "Services",
    access: "standard",
    details: [
      { label: "Cloud", icon: Cloud },
      { label: "APIs", icon: Layers },
      { label: "Monitoring", icon: Activity },
    ],
  },
  {
    title: "Hiring",
    access: "premium",
    details: [
      { label: "Teams", icon: Users },
      { label: "Payroll", icon: CreditCard },
      { label: "Recruitment", icon: Briefcase },
    ],
  },
];

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [activeTab, setActiveTab] = useState("enterprise");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  });
  const [profile, setProfile] = useState({
    name: "User Profile",
    bio: "Welcome to my profile! 🚀",
    location: "Earth",
    website: "example.com",
    membershipTier: "basic",
    joinDate: "May 2024",
    followers: 0,
    following: 0,
    posts: 0,
  });

  const [activities, setActivities] = useState([]);

  const currentTier = normalizeTier(user?.membershipTier || user?.plan || user?.tier);

  // Fetch profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Get user profile
        const profileResponse = await api.getUserProfile(user.id);
        const profileData = profileResponse.data || {};
        
        const nameParts = [user.first_name, user.last_name].filter(Boolean);
        const displayName = user.name || nameParts.join(" ") || user.email?.split("@")[0] || "User Profile";

        setProfile({
          name: displayName,
          bio: profileData.bio || "Welcome to my profile! 🚀",
          location: profileData.location || "Earth",
          website: profileData.website || "example.com",
          membershipTier: normalizeTier(user.membershipTier || user.plan || user.tier),
          joinDate: new Date(user.created_at).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          followers: profileData.followers_count || 0,
          following: profileData.following_count || 0,
          posts: profileData.posts_count || 0,
        });

        setEditForm({
          name: displayName,
          bio: profileData.bio || "Welcome to my profile! 🚀",
          location: profileData.location || "Earth",
          website: profileData.website || "example.com",
        });

        // Fetch user's feed as activity
        try {
          const feedResponse = await api.getFeed(10);
          const feedActivities = (feedResponse.data || []).map((post) => ({
            id: post.id,
            type: "post",
            content: post.content,
            timestamp: new Date(post.created_at).toLocaleDateString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
          }));
          setActivities(feedActivities);
        } catch (err) {
          console.log("Could not load activity feed");
        }

        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load profile:", err);

        // Set default values on error
        const nameParts = [user.first_name, user.last_name].filter(Boolean);
        const displayName = user.name || nameParts.join(" ") || user.email?.split("@")[0] || "User Profile";

        setProfile((prev) => ({ ...prev, name: displayName }));
        setEditForm((prev) => ({ ...prev, name: displayName }));
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader className="animate-spin text-yellow-400" size={32} />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-2 lg:px-4">
        <div className="lg:grid lg:grid-cols-12 gap-6 pt-6">
          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 h-fit sticky top-24">
            <div className="rounded-xl overflow-hidden">
              <DesktopSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-6 pb-20 md:pb-4">
            {error && (
              <div className="bg-red-950/50 border border-red-700 rounded-xl p-4 text-red-200 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Profile Header */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-5xl shadow-lg">
                    👤
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                    <p className="text-gray-400">{user?.email}</p>
                    <p className="text-sm text-gray-500 mt-1">Joined {profile.joinDate}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg transition"
                      >
                        <Edit2 size={18} />
                        Edit
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                      >
                        <LogOut size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-300 mb-4">{profile.bio}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{profile.followers.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Followers</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{profile.following.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Following</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{profile.posts}</p>
                  <p className="text-xs text-gray-400">Posts</p>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin size={16} />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Globe size={16} />
                    {profile.website}
                  </div>
                )}
              </div>

              {/* Membership Badge */}
              <div className="mt-4 inline-block">
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-500/50">
                  {formatTierLabel(profile.membershipTier)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-6 border-b border-gray-700/50">
              <button
                onClick={() => setActiveTab("enterprise")}
                className={`px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === "enterprise"
                    ? "border-yellow-500 text-yellow-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                Enterprise Hub
              </button>
              <button
                onClick={() => setActiveTab("social")}
                className={`px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === "social"
                    ? "border-yellow-500 text-yellow-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                Activity
              </button>
            </div>

            {/* Enterprise Tab */}
            {activeTab === "enterprise" && (
              <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {hubSections.map((section) => {
                    const Icon = section.details[0].icon;
                    const isUnlocked = hasTierAccess(currentTier, section.access);
                    return (
                      <div
                        key={section.title}
                        className={`rounded-lg border ${
                          isUnlocked
                            ? "border-gray-700 bg-gray-900/50"
                            : "border-yellow-600 bg-gray-900/70"
                        } p-4`}
                      >
                        <div className="flex items-center gap-2 text-yellow-400 mb-3">
                          <Icon size={18} />
                          <h3 className="text-sm font-semibold text-white">
                            {section.title}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-400">
                          Fast access to {section.title.toLowerCase()} tools
                        </p>
                        {!isUnlocked && (
                          <p className="text-xs text-yellow-400 mt-2">
                            Requires {formatTierLabel(section.access)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  {hubSections.map((section) => {
                    const CardIcon = section.details[0].icon;
                    const sectionUnlocked = hasTierAccess(currentTier, section.access);
                    return (
                      <div
                        key={section.title}
                        className={`rounded-lg border ${
                          sectionUnlocked
                            ? "border-gray-700 bg-gray-900/50"
                            : "border-yellow-600 bg-gray-900/70"
                        } p-4`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">
                            {section.title}
                          </h3>
                          <CardIcon size={20} className="text-yellow-400" />
                        </div>
                        <div className="space-y-2">
                          {section.details.map(({ label }) => (
                            <div
                              key={label}
                              className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer transition"
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "social" && (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/80 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm font-medium">
                          {activity.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                    {activity.likes !== undefined && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-700/30 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart size={14} /> {activity.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} /> {activity.comments}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 hidden lg:block h-fit sticky top-24">
            <div className="space-y-4">
              {/* Follow Stats */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-4">Profile Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Followers</span>
                    <span className="text-lg font-bold text-yellow-400">
                      {profile.followers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Following</span>
                    <span className="text-lg font-bold text-yellow-400">
                      {profile.following.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Posts</span>
                    <span className="text-lg font-bold text-yellow-400">
                      {profile.posts}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Membership</span>
                    <span className="text-sm font-semibold text-yellow-400">
                      {formatTierLabel(profile.membershipTier)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Nav */}
              <div className="rounded-xl overflow-hidden">
                <DesktopQuickNav />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setIsEditing(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-xl">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-white">
                  Edit Profile
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Update your profile details
                </p>
                <div className="mt-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                  <textarea
                    placeholder="Bio"
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white focus:outline-none focus:border-yellow-500 resize-none h-24"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Location"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    />
                    <input
                      type="text"
                      placeholder="Website"
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  {saveError && (
                    <div className="text-sm text-red-400">{saveError}</div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setSaving(true);
                        setSaveError(null);
                        try {
                          const updatedUser = await updateProfile({
                            name: editForm.name,
                            bio: editForm.bio,
                            location: editForm.location,
                            website: editForm.website,
                          });
                          const nameParts = [
                            updatedUser.first_name,
                            updatedUser.last_name,
                          ].filter(Boolean);
                          const displayName =
                            updatedUser.name ||
                            nameParts.join(" ") ||
                            updatedUser.email?.split("@")[0] ||
                            "User Profile";
                          setProfile((prev) => ({
                            ...prev,
                            name: displayName,
                            bio: updatedUser.bio || prev.bio,
                            location: updatedUser.location || prev.location,
                            website: updatedUser.website || prev.website,
                          }));
                          setIsEditing(false);
                        } catch (err) {
                          setSaveError(
                            err.message || "Unable to save profile."
                          );
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="flex-1 rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-gray-950 transition hover:bg-yellow-600 disabled:opacity-70"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
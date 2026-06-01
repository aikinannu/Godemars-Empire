import React, { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
  Search,
  Settings,
  Bell,
  Heart,
  Share2,
  MoreHorizontal,
  Loader,
} from "lucide-react";
import DesktopSidebar from "../components/DesktopSidebar";
import DesktopQuickNav from "../components/DesktopQuickNav";
import { useAuth } from "../context/AuthContext";
import * as api from "../services/api";

const Community = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("trending");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");
  const [newCommunityPrivate, setNewCommunityPrivate] = useState(false);
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  // Fetch communities on mount and when sortBy changes
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const response = await api.getCommunities(50, 0, sortBy);
        const transformedCommunities = (response.data || []).map((community) => ({
          id: community.id,
          name: community.name,
          members: Math.floor(Math.random() * 10000), // Placeholder - not in API yet
          posts: Math.floor(Math.random() * 2000), // Placeholder - not in API yet
          icon: "💬",
          description: community.description || "A community for discussion",
          joined: false,
          trending: false,
          verified: false,
          is_private: community.is_private,
        }));
        setCommunities(transformedCommunities);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load communities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [sortBy]);

  // Fetch user's communities on mount
  useEffect(() => {
    const fetchUserCommunities = async () => {
      try {
        const response = await api.getUserCommunities();
        const joinedIds = (response.data || []).map((c) => c.id);
        setUserCommunities(joinedIds);
      } catch (err) {
        console.error("Failed to load user communities:", err);
      }
    };

    if (user) {
      fetchUserCommunities();
    }
  }, [user]);

  const toggleJoinCommunity = async (communityId) => {
    try {
      if (userCommunities.includes(communityId)) {
        await api.leaveCommunity(communityId);
        setUserCommunities(userCommunities.filter((id) => id !== communityId));
      } else {
        await api.joinCommunity(communityId);
        setUserCommunities([...userCommunities, communityId]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Failed to toggle community join:", err);
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) return;

    try {
      setCreatingCommunity(true);
      const response = await api.createCommunity(
        newCommunityName,
        newCommunityDescription,
        "💬",
        newCommunityPrivate
      );

      // Refresh communities list
      const allCommunities = await api.getCommunities(50, 0, sortBy);
      const transformedCommunities = (allCommunities.data || []).map(
        (community) => ({
          id: community.id,
          name: community.name,
          members: Math.floor(Math.random() * 10000),
          posts: Math.floor(Math.random() * 2000),
          icon: "💬",
          description: community.description || "A community for discussion",
          joined: false,
          trending: false,
          verified: false,
          is_private: community.is_private,
        })
      );
      setCommunities(transformedCommunities);

      // Reset form
      setNewCommunityName("");
      setNewCommunityDescription("");
      setNewCommunityPrivate(false);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Failed to create community:", err);
    } finally {
      setCreatingCommunity(false);
    }
  };

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCommunities = [...filteredCommunities].sort((a, b) => {
    if (sortBy === "members") return b.members - a.members;
    if (sortBy === "posts") return b.posts - a.posts;
    return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
  });

  const joinedCommunities = communities.filter((c) =>
    userCommunities.includes(c.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-2 lg:px-4">
        <div className="lg:grid lg:grid-cols-12 gap-6 pt-6">
          <aside className="hidden lg:block lg:col-span-3 h-fit sticky top-24">
            <div className="rounded-xl overflow-hidden">
              <DesktopSidebar />
            </div>
          </aside>

          <main className="lg:col-span-6 pb-20 md:pb-4">
            <div className="mb-6 space-y-4">
              {error && (
                <div className="bg-red-950/50 border border-red-700 rounded-xl p-4 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Communities</h1>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Create</span>
                </button>
              </div>
              <p className="text-gray-400">
                Find and join communities that match your interests
              </p>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="trending">Trending</option>
                  <option value="members">Most Members</option>
                  <option value="posts">Most Active</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="animate-spin text-yellow-400 mb-2" size={32} />
                <p className="text-gray-400">Loading communities...</p>
              </div>
            )}

            {!loading && (
              <div className="space-y-4">
                {communities
                  .filter((community) =>
                    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    community.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((community) => (
                    <div
                      key={community.id}
                      className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/80 hover:bg-gray-800/60 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-3xl shadow-md flex-shrink-0 group-hover:scale-110 transition">
                            {community.icon}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white text-lg">
                                {community.name}
                              </h3>
                              {community.verified && (
                                <span className="text-blue-400 text-sm">✓</span>
                              )}
                              {community.trending && (
                                <span className="text-red-500 text-xs bg-red-500/20 px-2 py-0.5 rounded-full">
                                  Trending
                                </span>
                              )}
                            </div>

                            <p className="text-gray-400 text-sm mb-3">
                              {community.description}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                {community.members.toLocaleString()} members
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare size={14} />
                                {community.posts.toLocaleString()} posts
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleJoinCommunity(community.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                              userCommunities.includes(community.id)
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-yellow-500 text-gray-950 hover:bg-yellow-600"
                            }`}
                          >
                            {userCommunities.includes(community.id)
                              ? "Joined"
                              : "Join"}
                          </button>
                          <button className="text-gray-400 hover:text-yellow-400 p-2 transition">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {communities.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No communities found</p>
                  </div>
                )}
              </div>
            )}
          </main>

          <aside className="lg:col-span-3 hidden lg:block h-fit sticky top-24">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Users size={18} />
                  My Communities ({joinedCommunities.length})
                </h3>
                {joinedCommunities.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No communities yet. Join one to get started!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {joinedCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{community.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {community.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {community.members.toLocaleString()} members
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl overflow-hidden">
                <DesktopQuickNav />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Create a Community
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Community Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript Developers"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="What is this community about?"
                  rows={3}
                  value={newCommunityDescription}
                  onChange={(e) => setNewCommunityDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Privacy
                </label>
                <select
                  value={newCommunityPrivate ? "private" : "public"}
                  onChange={(e) => setNewCommunityPrivate(e.target.value === "private")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCommunity}
                  disabled={!newCommunityName.trim() || creatingCommunity}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingCommunity && (
                    <Loader size={16} className="animate-spin" />
                  )}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;

import React, { useState } from "react";
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  Upload,
  Search,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import DesktopSidebar from "../components/DesktopSidebar";
import DesktopQuickNav from "../components/DesktopQuickNav";
import RequireFeature from "../components/RequireFeature";
import { useAuth } from "../context/AuthContext";

const Reels = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState([
    {
      id: 1,
      title: "Amazing Tricks",
      creator: "Pro User",
      creatorAvatar: "👤",
      views: 1200,
      likes: 345,
      comments: 42,
      liked: false,
      duration: "0:45",
    },
    {
      id: 2,
      title: "Tutorial",
      creator: "Expert",
      creatorAvatar: "👨‍💼",
      views: 2500,
      likes: 892,
      comments: 156,
      liked: false,
      duration: "2:30",
    },
    {
      id: 3,
      title: "Behind the Scenes",
      creator: "Creator",
      creatorAvatar: "🎬",
      views: 890,
      likes: 234,
      comments: 38,
      liked: false,
      duration: "1:15",
    },
    {
      id: 4,
      title: "Daily Vlog",
      creator: "Vlogger",
      creatorAvatar: "📸",
      views: 5600,
      likes: 1204,
      comments: 267,
      liked: false,
      duration: "3:00",
    },
    {
      id: 5,
      title: "Music Cover",
      creator: "Artist",
      creatorAvatar: "🎵",
      views: 3400,
      likes: 756,
      comments: 89,
      liked: false,
      duration: "2:15",
    },
    {
      id: 6,
      title: "Cooking Show",
      creator: "Chef",
      creatorAvatar: "👨‍🍳",
      views: 2100,
      likes: 543,
      comments: 72,
      liked: false,
      duration: "1:45",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const toggleLike = (reelId) => {
    setReels(
      reels.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              liked: !reel.liked,
              likes: reel.liked ? reel.likes - 1 : reel.likes + 1,
            }
          : reel
      )
    );
  };

  const filteredReels = reels.filter((reel) =>
    reel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reel.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {/* Header */}
            <div className="mb-6 space-y-4">
              <h1 className="text-3xl font-bold text-white">Reels</h1>
              <p className="text-gray-400">Watch and share short-form videos</p>

              {/* Search & Upload Bar */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Search reels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <RequireFeature feature="files_vault">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <Upload size={18} />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                </RequireFeature>
              </div>
            </div>

            {/* Reels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReels.map((reel) => (
                <div
                  key={reel.id}
                  className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/80 transition-all duration-200 group cursor-pointer"
                >
                  {/* Video Container */}
                  <div className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950/40 z-10" />
                    <div className="text-gray-400 group-hover:text-yellow-400 transition">
                      <Play size={56} fill="currentColor" />
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-gray-950/80 px-2 py-1 rounded text-xs text-white font-semibold z-20">
                      {reel.duration}
                    </div>

                    {/* Views Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-gray-950/80 px-2 py-1 rounded text-xs text-gray-300 z-20">
                      <Eye size={14} />
                      {reel.views.toLocaleString()}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-4">
                    {/* Creator */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                        {reel.creatorAvatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{reel.creator}</p>
                        <p className="text-xs text-gray-500">{reel.title}</p>
                      </div>
                      <button className="text-gray-400 hover:text-yellow-400 p-1 transition">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700/30 text-gray-400">
                      <button
                        onClick={() => toggleLike(reel.id)}
                        className={`flex items-center gap-1 hover:text-yellow-400 hover:bg-yellow-400/10 px-3 py-2 rounded-lg transition-all text-xs font-medium ${
                          reel.liked ? "text-red-500 bg-red-500/10" : ""
                        }`}
                      >
                        <Heart size={16} fill={reel.liked ? "currentColor" : "none"} />
                        <span>{reel.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-yellow-400 hover:bg-yellow-400/10 px-3 py-2 rounded-lg transition-all text-xs font-medium">
                        <MessageCircle size={16} />
                        <span>{reel.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-yellow-400 hover:bg-yellow-400/10 px-3 py-2 rounded-lg transition-all text-xs font-medium">
                        <Share2 size={16} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredReels.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No reels found</p>
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 hidden lg:block h-fit sticky top-24">
            <div className="rounded-xl overflow-hidden">
              <DesktopQuickNav />
            </div>
          </aside>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Upload a Reel</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-yellow-500/50 transition cursor-pointer">
                <Upload size={32} className="mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400 text-sm">Drag and drop your video or click to upload</p>
                <p className="text-gray-600 text-xs mt-1">Max 500MB, MP4/WebM</p>
              </div>
              <input
                type="text"
                placeholder="Title"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
              />
              <textarea
                placeholder="Description (optional)"
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 border border-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg transition">
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reels;

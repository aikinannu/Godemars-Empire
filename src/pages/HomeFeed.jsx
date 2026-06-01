import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Plus,
  Image as ImageIcon,
  Smile,
  Send,
  X,
  Trash2,
  Edit2,
  Loader,
} from "lucide-react";
import DesktopSidebar from "../components/DesktopSidebar";
import DesktopQuickNav from "../components/DesktopQuickNav";
import { useAuth } from "../context/AuthContext";
import * as api from "../services/api";

const HomeFeed = () => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showCommentModal, setShowCommentModal] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await api.getFeed(20, 0, sortBy);
        // Transform API response to component format
        const transformedPosts = (response.data || []).map((post) => ({
          id: post.id,
          author: post.first_name || "User",
          avatar: "👤",
          timestamp: new Date(post.created_at).toLocaleDateString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          content: post.content,
          image: post.image_url,
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          liked: false,
          shares: post.shares_count || 0,
          replies: [],
          user_id: post.user_id,
        }));
        setPosts(transformedPosts);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load feed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [sortBy]);

  const toggleLike = async (postId) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const isCurrentlyLiked = likedPosts.has(postId);

      // Optimistic update
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: !p.liked,
                likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1,
              }
            : p
        )
      );

      if (isCurrentlyLiked) {
        setLikedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        setLikedPosts((prev) => new Set(prev).add(postId));
      }

      // Call API
      await api.toggleLike(postId);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Revert optimistic update on error
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: !p.liked,
                likes: p.likes + (p.liked ? 1 : -1),
              }
            : p
        )
      );
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    try {
      const response = await api.createPost(postContent, null);

      const newPost = {
        id: response.data.id,
        author: user?.name || "You",
        avatar: "👤",
        timestamp: "now",
        content: postContent,
        image: null,
        likes: 0,
        comments: 0,
        liked: false,
        shares: 0,
        replies: [],
        user_id: user?.id,
      };

      setPosts([newPost, ...posts]);
      setPostContent("");
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Failed to create post:", err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;

    try {
      await api.addComment(postId, commentText);

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments + 1,
                replies: [
                  ...post.replies,
                  {
                    id: post.replies.length + 1,
                    author: user?.name || "You",
                    text: commentText,
                  },
                ],
              }
            : post
        )
      );
      setCommentText("");
      setShowCommentModal(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to add comment:", err);
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err) {
      setError(err.message);
      console.error("Failed to delete post:", err);
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "trending") {
      return b.likes + b.comments - (a.likes + a.comments);
    }
    return 0; // recent (default order)
  });

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

          {/* Main Feed */}
          <main className="lg:col-span-6 pb-20 md:pb-4">
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-950/50 border border-red-700 rounded-xl p-4 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Create Post Card */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/80 transition-all duration-200 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                    👤
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex-1 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 hover:text-gray-300 transition text-left text-sm"
                  >
                    What's on your mind?
                  </button>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-700/30">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 px-3 py-2 rounded-lg hover:bg-yellow-400/10 transition text-sm flex-1">
                    <ImageIcon size={18} />
                    <span>Photo</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 px-3 py-2 rounded-lg hover:bg-yellow-400/10 transition text-sm flex-1">
                    <Smile size={18} />
                    <span>Feeling</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg transition flex-1"
                  >
                    <Plus size={18} />
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="recent">Recent</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="animate-spin text-yellow-400 mb-2" size={32} />
                  <p className="text-gray-400">Loading posts...</p>
                </div>
              )}

              {/* Posts Feed */}
              {!loading && posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/80 hover:bg-gray-800/60 transition-all duration-200 shadow-lg"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                            {post.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {post.author}
                            </p>
                            <p className="text-xs text-gray-500">{post.timestamp}</p>
                          </div>
                        </div>
                        {user?.id === post.user_id && (
                          <div className="flex gap-1">
                            <button className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 p-2 rounded-lg transition">
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        {user?.id !== post.user_id && (
                          <button className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 p-2 rounded-lg transition">
                            <MoreHorizontal size={18} />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                        {post.content}
                      </p>

                      {post.image && (
                        <img
                          src={post.image}
                          alt="Post"
                          className="w-full rounded-lg mb-4 max-h-96 object-cover border border-gray-700/30"
                        />
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700/30 text-gray-400">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-2 hover:text-yellow-400 hover:bg-yellow-400/10 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                            likedPosts.has(post.id) ? "text-red-500 bg-red-500/10" : ""
                          }`}
                        >
                          <Heart
                            size={18}
                            fill={likedPosts.has(post.id) ? "currentColor" : "none"}
                          />
                          <span>{post.likes}</span>
                        </button>
                        <button
                          onClick={() => setShowCommentModal(post.id)}
                          className="flex items-center gap-2 hover:text-yellow-400 hover:bg-yellow-400/10 px-3 py-2 rounded-lg transition-all text-sm font-medium"
                        >
                          <MessageCircle size={18} />
                          <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-yellow-400 hover:bg-yellow-400/10 px-3 py-2 rounded-lg transition-all text-sm font-medium">
                          <Share2 size={18} />
                          <span>{post.shares}</span>
                        </button>
                      </div>

                      {/* Comments Preview */}
                      {post.replies.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700/30 space-y-3">
                          {post.replies.slice(-2).map((reply) => (
                            <div key={reply.id} className="text-sm">
                              <p className="font-medium text-gray-300">
                                {reply.author}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {reply.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 hidden lg:block h-fit sticky top-24">
            <div className="rounded-xl overflow-hidden">
              <DesktopQuickNav />
            </div>
          </aside>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Create Post</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                  👤
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {user?.name || "You"}
                  </p>
                  <p className="text-xs text-gray-500">Public</p>
                </div>
              </div>

              {/* Content Area */}
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 resize-none h-32 mb-4"
              />

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-700/50">
                <button className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 px-3 py-2 rounded-lg hover:bg-yellow-400/10 transition text-sm">
                  <ImageIcon size={18} />
                  <span>Photo</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 px-3 py-2 rounded-lg hover:bg-yellow-400/10 transition text-sm">
                  <Smile size={18} />
                  <span>Emoji</span>
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!postContent.trim()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Reply</h2>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Original Post Preview */}
              {posts.find((p) => p.id === showCommentModal) && (
                <div className="mb-4 pb-4 border-b border-gray-700/50">
                  <div className="text-sm">
                    <p className="font-medium text-gray-300">
                      {
                        posts.find((p) => p.id === showCommentModal)
                          ?.author
                      }
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {
                        posts.find((p) => p.id === showCommentModal)
                          ?.content
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Comment Input */}
              <div className="mb-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 resize-none h-24"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="flex-1 border border-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddComment(showCommentModal)}
                  disabled={!commentText.trim()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Reply
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HomeFeed;

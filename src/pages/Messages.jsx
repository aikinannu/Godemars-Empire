import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Search,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  X,
  Loader,
} from "lucide-react";
import DesktopSidebar from "../components/DesktopSidebar";
import DesktopQuickNav from "../components/DesktopQuickNav";
import { useAuth } from "../context/AuthContext";
import * as api from "../services/api";

export default function Messages() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await api.getConversations();
        const transformed = (response.data || []).map((conv) => ({
          id: conv.id,
          user: conv.other_user?.name || "Unknown",
          avatar: "👤",
          lastMessage: conv.last_message?.content || "",
          timestamp: conv.last_message_at
            ? new Date(conv.last_message_at).toLocaleDateString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "now",
          unread: false,
          online: true,
          messages: [],
          other_user_id: conv.other_user?.id,
        }));
        setConversations(transformed);
        if (transformed.length > 0) {
          setSelectedConversation(transformed[0].id);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await api.getConversationMessages(selectedConversation);
        const transformed = (response.data || []).map((msg) => ({
          id: msg.id,
          sender: msg.sender?.name || "Unknown",
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isSent: msg.sender_id === user?.id,
        }));
        
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation ? { ...conv, messages: transformed } : conv
          )
        );
        setCurrentMessages(transformed);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConversation, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, selectedConversation]);

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  );

  const filteredConversations = conversations.filter((conv) =>
    conv.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      
      // Optimistic update
      const newMessage = {
        id: Date.now(),
        sender: user?.name || "You",
        content: messageInput,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSent: true,
      };

      setCurrentMessages([...currentMessages, newMessage]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: messageInput,
                timestamp: "now",
              }
            : conv
        )
      );

      // Call API
      await api.sendMessage(selectedConversation, messageInput);
      setMessageInput("");
    } catch (err) {
      setError(err.message);
      console.error("Failed to send message:", err);
      // Revert optimistic update on error
      setCurrentMessages((prev) => prev.slice(0, -1));
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"
    >
      <div className="max-w-7xl mx-auto px-2 lg:px-4">
        <div className="lg:grid lg:grid-cols-12 gap-6 pt-6">
          <aside className="hidden lg:block lg:col-span-3 h-fit sticky top-24">
            <div className="rounded-xl overflow-hidden">
              <DesktopSidebar />
            </div>
          </aside>

          <main className="lg:col-span-6 pb-20 md:pb-4">
            <div className="flex flex-col h-screen lg:h-[calc(100vh-120px)] bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
              {error && (
                <div className="bg-red-950/50 border border-red-700 p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {currentConversation ? (
                <>
                  <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/90">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                          {currentConversation.avatar}
                        </div>
                        {currentConversation.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {currentConversation.user}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currentConversation.online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-yellow-400 p-2 transition">
                        <Phone size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-yellow-400 p-2 transition">
                        <Video size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-yellow-400 p-2 transition">
                        <Info size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-yellow-400 p-2 transition">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950/50">
                    {loadingMessages && (
                      <div className="flex justify-center py-4">
                        <Loader className="animate-spin text-yellow-400" size={24} />
                      </div>
                    )}
                    <AnimatePresence>
                      {currentMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              msg.isSent
                                ? "bg-yellow-500 text-gray-950"
                                : "bg-gray-800 text-gray-200"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.isSent
                                  ? "text-gray-800/70"
                                  : "text-gray-500"
                              }`}
                            >
                              {msg.timestamp}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-700/50 bg-gray-900/90 space-y-3">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-yellow-400 p-2 transition">
                        <Paperclip size={18} />
                      </button>
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                      />
                      <button className="text-gray-400 hover:text-yellow-400 p-2 transition">
                        <Smile size={18} />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !messageInput.trim()}
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 p-2 rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader className="animate-spin text-yellow-400" size={32} />
                      <p>Loading conversations...</p>
                    </div>
                  ) : (
                    <p>Select a conversation to start messaging</p>
                  )}
                </div>
              )}
            </div>
          </main>

          <aside className="lg:col-span-3 hidden lg:block pb-20 md:pb-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Messages</h2>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading && (
                  <div className="flex justify-center py-4">
                    <Loader className="animate-spin text-yellow-400" size={24} />
                  </div>
                )}
                {filteredConversations.map((conversation) => (
                  <motion.button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full p-3 rounded-lg text-left transition ${
                      selectedConversation === conversation.id
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : "bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {conversation.avatar}
                        </div>
                        {conversation.online && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-gray-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`font-semibold truncate ${
                              conversation.unread
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {conversation.user}
                          </p>
                          <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {conversation.timestamp}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>

                      {conversation.unread && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  );
}

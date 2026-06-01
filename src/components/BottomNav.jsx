import React from "react";
import { X, Menu } from "lucide-react";

const BottomNav = ({ tabs, activeTab, setActiveTab }) => {
  const defaultTabs = [
    { id: "home", label: "Home", icon: "🏠", unlocked: true },
    { id: "reels", label: "Reels", icon: "🎬", unlocked: true },
    { id: "market", label: "Market", icon: "🛍️", unlocked: true },
    { id: "community", label: "Community", icon: "👥", unlocked: true },
    { id: "messages", label: "Messages", icon: "💬", unlocked: true },
    { id: "profile", label: "Profile", icon: "👤", unlocked: true },
  ];
  const navTabs = tabs || defaultTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900 border-t border-gray-800 lg:hidden">
      <div className="flex justify-around items-center">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-center transition ${
              activeTab === tab.id
                ? "text-yellow-400 border-t-2 border-yellow-400"
                : tab.unlocked
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 cursor-not-allowed opacity-60"
            }`}
            title={tab.label}
            aria-disabled={!tab.unlocked}
          >
            <div className="text-2xl">{tab.icon}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;

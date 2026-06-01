import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, Film, ShoppingBag, Users, MessageSquare, User } from "lucide-react";

const ITEMS = [
  { id: "home", to: "/homefeed", label: "Home", Icon: HomeIcon },
  { id: "reels", to: "/reels", label: "Reels", Icon: Film },
  { id: "market", to: "/market", label: "Market", Icon: ShoppingBag },
  { id: "community", to: "/community", label: "Community", Icon: Users },
  { id: "messages", to: "/messages", label: "Messages", Icon: MessageSquare },
  { id: "profile", to: "/profile", label: "Profile", Icon: User },
];

export default function DesktopQuickNav({ className = "" }) {
  const { pathname } = useLocation();

  return (
    <aside role="navigation" aria-label="Quick navigation" className={`hidden lg:block ${className}`}>
      <div className="sticky top-20 w-64 space-y-3">
        {ITEMS.map(({ id, to, label, Icon }) => {
          const active = pathname === to || (to !== "/homefeed" && pathname.startsWith(to));
          return (
            <Link
              key={id}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 p-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                active ? "bg-gray-800 border-l-4 border-yellow-400" : "hover:bg-gray-800"
              }`}
            >
              <Icon size={20} className="text-yellow-400" />
              <div className="flex-1">
                <div className="font-medium text-sm text-white">{label}</div>
                <div className="text-xs text-gray-400">Go to {label}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

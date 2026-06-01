import React from "react";
import { Plus } from "lucide-react";

const FloatingButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full shadow-lg flex items-center justify-center transition transform hover:scale-110 z-40 md:hidden"
      title="Create new post"
    >
      <Plus size={28} />
    </button>
  );
};

export default FloatingButton;

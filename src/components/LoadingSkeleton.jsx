import React from "react";

export default function LoadingSkeleton({ count = 3, type = "text" }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          {type === "text" && (
            <>
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-700 rounded"></div>
            </>
          )}
          {type === "card" && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="h-6 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          )}
          {type === "button" && <div className="h-10 bg-gray-700 rounded-lg w-full"></div>}
        </div>
      ))}
    </div>
  );
}

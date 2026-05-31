import React, { useState } from "react";
import { X, Image, Smile } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useLicense } from '../context/LicenseContext';

const CreatePostModal = ({ isOpen, onClose }) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { hasFeature } = useLicense();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Send post to API
      console.log("Creating post:", content);
      setContent("");
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-yellow-400">Create Post</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 resize-none h-32"
            />

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                {hasFeature('files_vault') ? (
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded transition"
                    title="Add image"
                  >
                    <Image size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/license')}
                    className="p-2 text-yellow-300 bg-yellow-500/5 rounded transition text-xs font-semibold"
                    title="Upgrade to attach images"
                  >
                    Upgrade
                  </button>
                )}

                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded transition"
                  title="Add emoji"
                >
                  <Smile size={20} />
                </button>
              </div>

              <button
                type="submit"
                disabled={!content.trim() || isLoading}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
              >
                {isLoading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePostModal;

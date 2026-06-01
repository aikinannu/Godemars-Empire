import React, { useState } from "react";
import { Code, Chrome, Mail } from "lucide-react";

export const SocialAuthButtons = ({ isLoading, onSocialAuth }) => {
  const [selectedProvider, setSelectedProvider] = useState(null);

  const handleGoogleAuth = () => {
    setSelectedProvider("google");
    onSocialAuth("google");
  };

  const handleGitHubAuth = () => {
    setSelectedProvider("github");
    onSocialAuth("github");
  };

  const handleMicrosoftAuth = () => {
    setSelectedProvider("microsoft");
    onSocialAuth("microsoft");
  };

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: Chrome,
      color: "bg-white text-gray-900 hover:bg-gray-100",
      onClick: handleGoogleAuth,
    },
    {
      id: "github",
      name: "GitHub",
      icon: Code,
      color: "bg-gray-800 text-white hover:bg-gray-700 border border-gray-600",
      onClick: handleGitHubAuth,
    },
    {
      id: "microsoft",
      name: "Microsoft",
      icon: Mail,
      color: "bg-blue-600 text-white hover:bg-blue-700",
      onClick: handleMicrosoftAuth,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-4 mb-4">
        <div className="flex-1 h-px bg-gray-700"></div>
        <span className="text-xs text-gray-400">OR</span>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>
      <p className="text-center text-sm text-gray-400 mb-3">Continue with</p>
      <div className="grid grid-cols-3 gap-2">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isLoading_ = isLoading && selectedProvider === provider.id;

          return (
            <button
              key={provider.id}
              onClick={provider.onClick}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${provider.color} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`Sign in with ${provider.name}`}
            >
              {isLoading_ ? (
                <div className="animate-spin">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                </div>
              ) : (
                <Icon size={18} />
              )}
              <span className="hidden sm:inline">{provider.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SocialAuthButtons;

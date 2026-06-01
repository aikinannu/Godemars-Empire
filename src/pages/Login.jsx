import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader } from "lucide-react";
import SocialAuthButtons from "../components/SocialAuthButtons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");

    try {
      await login(email, password);
      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/homefeed"), 1500);
    } catch (err) {
      // Error is handled by the auth context and displayed via authError
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    setIsLoading(true);
    try {
      // In a real app, redirect to OAuth provider
      // window.location.href = `/api/v1/auth/${provider}`;
      console.log(`Starting ${provider} authentication...`);
      // Simulate OAuth flow
      setTimeout(() => {
        setSuccessMessage(`${provider} authentication in progress...`);
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      console.error(`${provider} auth error:`, err);
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() && password && password.length >= 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="max-w-md w-full p-8 bg-gray-900/90 border border-yellow-600 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center">Login</h1>
        <p className="text-gray-400 text-center mb-6">Sign in with your credentials</p>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-600 rounded-lg flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
            <span className="text-green-300 text-sm">{successMessage}</span>
          </div>
        )}

        {authError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-semibold">Login Failed</p>
              <p className="text-red-300 text-xs mt-1">{authError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Link to="/reset-password" className="text-xs text-yellow-400 hover:text-yellow-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading && <Loader size={16} />}
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <SocialAuthButtons isLoading={isLoading} onSocialAuth={handleSocialAuth} />
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-yellow-400 hover:text-yellow-300 underline">
              Sign up
            </Link>
          </p>
          <p className="text-center text-gray-400 text-sm">
            <Link to="/license" className="text-yellow-400 hover:text-yellow-300 underline">
              Activate License
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

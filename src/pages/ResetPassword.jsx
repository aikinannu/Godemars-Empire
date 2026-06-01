import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { translateError } from "../utils/errorTranslator";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);
  const [resetStep, setResetStep] = useState("request"); // 'request' or 'reset'
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      // In a real app, this would call a backend endpoint
      // For now, show a success message
      setSuccessMessage(
        `If an account exists with this email, you'll receive password reset instructions shortly.`
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="max-w-md w-full p-8 bg-gray-900/90 border border-yellow-600 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center">
          Reset Password
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Enter your email to receive password reset instructions
        </p>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-600 rounded-lg flex items-start gap-2">
            <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-300 text-sm font-semibold">Check Your Email</p>
              <p className="text-green-300 text-xs mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-semibold">Error</p>
              <p className="text-red-300 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
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

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading && <Loader size={16} />}
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-gray-400 text-sm">
            Remember your password?{" "}
            <Link to="/login" className="text-yellow-400 hover:text-yellow-300 underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-yellow-400 hover:text-yellow-300 underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

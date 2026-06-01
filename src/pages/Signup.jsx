import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { getPasswordStrength, getPasswordStrengthColor, getPasswordStrengthText } from "../utils/passwordValidator";
import SocialAuthButtons from "../components/SocialAuthButtons";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();

  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");

    try {
      await register(email, password);
      setSuccessMessage("Account created successfully! Redirecting...");
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
      // window.location.href = `/api/v1/auth/${provider}/signup`;
      console.log(`Starting ${provider} sign up...`);
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

  const isFormValid =
    email.trim() &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    password.length >= 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="max-w-md w-full p-8 bg-gray-900/90 border border-yellow-600 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center">Sign Up</h1>
        <p className="text-gray-400 text-center mb-6">Create your account</p>

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
              <p className="text-red-300 text-sm font-semibold">Registration Failed</p>
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
              className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none disabled:opacity-50 ${
                validationErrors.email ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-yellow-500"
              }`}
              required
            />
            {validationErrors.email && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none disabled:opacity-50 ${
                  validationErrors.password ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-yellow-500"
                }`}
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
            {validationErrors.password && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
            )}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Password Strength:</span>
                  <span className={`text-xs font-semibold ${
                    getPasswordStrength(password) === "weak" ? "text-red-400" :
                    getPasswordStrength(password) === "medium" ? "text-yellow-400" :
                    "text-green-400"
                  }`}>
                    {getPasswordStrengthText(getPasswordStrength(password))}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all ${getPasswordStrengthColor(getPasswordStrength(password))}`}
                    style={{
                      width: getPasswordStrength(password) === "weak" ? "33%" :
                             getPasswordStrength(password) === "medium" ? "66%" : "100%"
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none disabled:opacity-50 ${
                  validationErrors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-yellow-500"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading && <Loader size={16} />}
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>

          <SocialAuthButtons isLoading={isLoading} onSocialAuth={handleSocialAuth} />
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-gray-400 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-yellow-400 hover:text-yellow-300 underline">
              Login
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

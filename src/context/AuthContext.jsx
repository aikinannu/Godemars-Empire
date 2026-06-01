import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  registerUser, 
  loginUser, 
  getStoredUser, 
  logoutUser,
  getUserInfo,
  updateUserProfile,
  persistUser,
  changePassword,
  resetPassword,
} from "../userAuthClient";
import { hasTierAccess, normalizeTier } from "../utils/tierUtils";
import { translateError } from "../utils/errorTranslator";
import analytics from "../utils/analytics";
import { rateLimiter } from "../utils/security";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hydrateStoredUser = async (stored) => {
    if (!stored || !stored.token) return null;
    try {
      const result = await getUserInfo(stored.token);
      const payload = result?.data || result?.user || result;
      const merged = {
        token: stored.token,
        ...stored,
        ...payload,
      };
      return {
        ...merged,
        membershipTier: normalizeTier(
          merged.membershipTier || merged.plan || merged.tier
        ),
      };
    } catch (err) {
      console.warn("Failed to hydrate stored user:", err);
      return stored;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const stored = getStoredUser();
        if (stored && stored.token) {
          try {
            const hydrated = await hydrateStoredUser(stored);
            setUser(hydrated);
            setIsAuthenticated(true);
          } catch (err) {
            logoutUser();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const register = async (email, password) => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Check rate limiting for signup
    const rateLimitCheck = rateLimiter.check(`signup_${sanitizedEmail}`, 3, 60 * 60 * 1000);
    if (!rateLimitCheck.allowed) {
      const errorMsg = `Too many signup attempts. Please try again in ${rateLimitCheck.remainingTime} seconds.`;
      setError(errorMsg);
      analytics.trackSignupAttempt(sanitizedEmail, false, Date.now() - startTime);
      throw new Error(errorMsg);
    }
    
    try {
      const result = await registerUser(email, password);
      const userData = result.user || result.data?.user || { email: result.email || email.trim() };
      const userObject = {
        token: result.token,
        email: result.email || email.trim(),
        ...userData,
        membershipTier: normalizeTier(
          userData.membershipTier || userData.plan || userData.tier
        ),
      };
      setUser(userObject);
      setIsAuthenticated(true);
      
      // Track successful signup
      analytics.trackSignupAttempt(sanitizedEmail, true, Date.now() - startTime);
      analytics.setUserId(userObject.id || userObject.email);
      
      // Track email verification initiated
      analytics.trackEmailVerification(sanitizedEmail, false); // Email not yet verified
      
      return result;
    } catch (err) {
      const errorMsg = translateError(err);
      setError(errorMsg);
      
      // Track failed signup
      analytics.trackSignupAttempt(sanitizedEmail, false, Date.now() - startTime);
      
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Check rate limiting
    const rateLimitCheck = rateLimiter.check(sanitizedEmail, 5, 15 * 60 * 1000);
    if (!rateLimitCheck.allowed) {
      const errorMsg = `Too many login attempts. Please try again in ${rateLimitCheck.remainingTime} seconds.`;
      setError(errorMsg);
      analytics.trackLoginAttempt(sanitizedEmail, false, Date.now() - startTime, "email");
      throw new Error(errorMsg);
    }
    
    try {
      const result = await loginUser(email, password);
      const userData = result.user || result.data?.user || { email: result.email || email.trim() };
      const userObject = {
        token: result.token,
        email: result.email || email.trim(),
        ...userData,
        membershipTier: normalizeTier(
          userData.membershipTier || userData.plan || userData.tier
        ),
      };
      setUser(userObject);
      setIsAuthenticated(true);
      
      // Reset rate limit on successful login
      rateLimiter.resetAttempts(sanitizedEmail);
      
      // Track successful login
      analytics.trackLoginAttempt(sanitizedEmail, true, Date.now() - startTime, "email");
      analytics.setUserId(userObject.id || userObject.email);
      
      return result;
    } catch (err) {
      // Record failed attempt for rate limiting
      rateLimiter.recordFailedAttempt(sanitizedEmail);
      
      const errorMsg = translateError(err);
      setError(errorMsg);
      
      // Track failed login
      analytics.trackLoginAttempt(sanitizedEmail, false, Date.now() - startTime, "email");
      
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Track logout event
    analytics.trackEvent("logout", {
      userId: user?.id || user?.email,
    });
    
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    // Clear analytics session on logout
    analytics.clearSession();
  };

  const updatePassword = async (oldPassword, newPassword) => {
    if (!user?.token) {
      throw new Error("Not authenticated");
    }
    setLoading(true);
    setError(null);
    try {
      const result = await changePassword(user.email, oldPassword, newPassword, user.token);
      return result;
    } catch (err) {
      const errorMsg = err.message || "Password change failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const result = await resetPassword(email);
      return result;
    } catch (err) {
      const errorMsg = err.message || "Password reset request failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user?.token) {
      throw new Error("Not authenticated");
    }

    setLoading(true);
    setError(null);
    try {
      const result = await updateUserProfile(user.token, updates);
      const payload = result.data || result.user || result;
      const updatedUser = {
        ...user,
        ...payload,
        membershipTier: normalizeTier(
          payload.membershipTier || payload.plan || payload.tier || user.membershipTier
        ),
      };
      setUser(updatedUser);
      persistUser(updatedUser.email || user.email, updatedUser.token || user.token, updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMsg = err.message || "Profile update failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const membershipTier = normalizeTier(user?.membershipTier || user?.plan || user?.tier);
  const hasAccess = (requiredTier) => hasTierAccess(membershipTier, requiredTier);

  const value = {
    user,
    membershipTier,
    hasAccess,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    updatePassword,
    requestPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

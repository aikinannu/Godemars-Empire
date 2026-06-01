// Security utilities for preventing brute force attacks and rate limiting

class RateLimiter {
  constructor() {
    this.attempts = new Map(); // { key: [timestamps...] }
    this.blockedUsers = new Map(); // { key: expireTime }
  }

  /**
   * Check if an action should be rate limited
   * @param {string} key - Identifier (email, IP, etc.)
   * @param {number} maxAttempts - Max attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} { allowed: boolean, remainingAttempts: number }
   */
  check(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const expiryTime = this.blockedUsers.get(key);

    // Check if user is blocked
    if (expiryTime && now < expiryTime) {
      const remainingTime = Math.ceil((expiryTime - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: new Date(expiryTime),
        remainingTime,
      };
    }

    // Clean up blocked user
    if (expiryTime && now >= expiryTime) {
      this.blockedUsers.delete(key);
      this.attempts.delete(key);
    }

    // Get attempts for this key
    let timestamps = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    timestamps = timestamps.filter((t) => now - t < windowMs);

    // Check if limit exceeded
    if (timestamps.length >= maxAttempts) {
      // Block for 30 minutes
      const blockUntil = now + 30 * 60 * 1000;
      this.blockedUsers.set(key, blockUntil);

      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: new Date(blockUntil),
        remainingTime: 30 * 60,
      };
    }

    // Record this attempt
    timestamps.push(now);
    this.attempts.set(key, timestamps);

    return {
      allowed: true,
      remainingAttempts: maxAttempts - timestamps.length,
    };
  }

  /**
   * Record a failed attempt
   */
  recordFailedAttempt(key) {
    const now = Date.now();
    let timestamps = this.attempts.get(key) || [];
    timestamps.push(now);
    this.attempts.set(key, timestamps);
  }

  /**
   * Reset attempts for a key (after successful login)
   */
  resetAttempts(key) {
    this.attempts.delete(key);
    this.blockedUsers.delete(key);
  }

  /**
   * Get attempt count for a key
   */
  getAttemptCount(key) {
    const timestamps = this.attempts.get(key) || [];
    return timestamps.length;
  }

  /**
   * Check if key is blocked
   */
  isBlocked(key) {
    const expiryTime = this.blockedUsers.get(key);
    if (!expiryTime) return false;
    return Date.now() < expiryTime;
  }

  /**
   * Manually block a key
   */
  block(key, durationMs = 30 * 60 * 1000) {
    const blockUntil = Date.now() + durationMs;
    this.blockedUsers.set(key, blockUntil);
  }

  /**
   * Unblock a key
   */
  unblock(key) {
    this.blockedUsers.delete(key);
    this.attempts.delete(key);
  }

  /**
   * Get all blocked keys
   */
  getBlockedKeys() {
    const now = Date.now();
    const blocked = [];

    for (const [key, expiryTime] of this.blockedUsers) {
      if (now < expiryTime) {
        blocked.push({
          key,
          blockedUntil: new Date(expiryTime),
          remainingTime: Math.ceil((expiryTime - now) / 1000),
        });
      }
    }

    return blocked;
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.attempts.clear();
    this.blockedUsers.clear();
  }
}

// Security validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 6) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

export const sanitizeEmail = (email) => {
  return email.trim().toLowerCase();
};

export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export for React hooks
export const useRateLimiter = () => {
  return rateLimiter;
};

export default rateLimiter;

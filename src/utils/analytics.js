// Analytics tracking utility for Godemar's Empire
// Tracks user interactions, authentication events, and key metrics

class Analytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.events = [];
    this.startTime = Date.now();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID after authentication
  setUserId(userId) {
    this.userId = userId;
    localStorage.setItem("analytics_user_id", userId);
  }

  // Track authentication events
  trackAuthEvent(eventType, data = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type: `auth_${eventType}`,
      sessionId: this.sessionId,
      userId: this.userId,
      ...data,
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  // Track page views
  trackPageView(pageName, metadata = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type: "page_view",
      pageName,
      sessionId: this.sessionId,
      userId: this.userId,
      ...metadata,
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  // Track user interactions
  trackEvent(eventName, eventData = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventName,
      sessionId: this.sessionId,
      userId: this.userId,
      ...eventData,
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  // Track form submissions
  trackFormSubmit(formName, success, duration = 0) {
    this.trackEvent("form_submit", {
      form_name: formName,
      success,
      duration_ms: duration,
    });
  }

  // Track authentication attempts
  trackLoginAttempt(email, success, duration = 0, method = "email") {
    this.trackAuthEvent("login_attempt", {
      email,
      success,
      duration_ms: duration,
      method,
    });
  }

  // Track sign up flow
  trackSignupAttempt(email, success, duration = 0) {
    this.trackAuthEvent("signup_attempt", {
      email,
      success,
      duration_ms: duration,
    });
  }

  // Track email verification
  trackEmailVerification(email, success) {
    this.trackAuthEvent("email_verification", {
      email,
      success,
    });
  }

  // Track password reset
  trackPasswordReset(email, success) {
    this.trackAuthEvent("password_reset", {
      email,
      success,
    });
  }

  // Track social auth attempts
  trackSocialAuth(provider, success, duration = 0) {
    this.trackAuthEvent("social_auth", {
      provider,
      success,
      duration_ms: duration,
    });
  }

  // Track errors
  trackError(errorType, errorMessage, context = {}) {
    this.trackEvent("error", {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  }

  // Track user engagement
  trackEngagement(action, duration = 0) {
    this.trackEvent("engagement", {
      action,
      duration_ms: duration,
    });
  }

  // Get session metrics
  getSessionMetrics() {
    const sessionDuration = Date.now() - this.startTime;
    const authEvents = this.events.filter((e) => e.type.startsWith("auth_"));
    const pageViews = this.events.filter((e) => e.type === "page_view");
    const errors = this.events.filter((e) => e.type === "error");

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      sessionDuration,
      totalEvents: this.events.length,
      authEvents: authEvents.length,
      pageViews: pageViews.length,
      errors: errors.length,
      timestamp: new Date().toISOString(),
    };
  }

  // Send event to server (batch or individual)
  sendEvent(event) {
    try {
      // In development, log to console
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics]", event);
      }

      // Only send analytics in production when license includes 'analytics' feature
      const shouldSend = (process.env.NODE_ENV === "development") || this._tokenHasFeature("analytics");
      if (shouldSend) {
        fetch('/api/v1/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        }).catch(err => console.error('Analytics error:', err));
      }
    } catch (err) {
      console.error("Failed to send analytics event:", err);
    }
  }

  // Batch send events
  batchSendEvents() {
    if (this.events.length === 0) return;

    try {
      // Only batch send when license includes analytics feature or in dev
      if (process.env.NODE_ENV === "development" || this._tokenHasFeature("analytics")) {
        fetch("/api/v1/analytics/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: this.sessionId,
            userId: this.userId,
            events: this.events,
          }),
        }).catch((err) => console.error("Batch analytics error:", err));
      }

      // Clear events after sending
      this.events = [];
    } catch (err) {
      console.error("Failed to batch send events:", err);
    }
  }

  // Helper: parse stored license token payload and check features
  _parseJwt(token) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(Array.prototype.map.call(atob(b), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  _tokenHasFeature(feature) {
    try {
      if (typeof window === 'undefined') return false;
      const token = window.localStorage.getItem('gdwb_license_token');
      if (!token) return false;
      const payload = this._parseJwt(token);
      if (!payload || !Array.isArray(payload.features)) return false;
      return payload.features.indexOf(feature) !== -1;
    } catch (e) {
      return false;
    }
  }

  // Clear session data
  clearSession() {
    this.events = [];
    this.userId = null;
    localStorage.removeItem("analytics_user_id");
  }
}

// Create singleton instance
const analytics = new Analytics();

// Export hook for React components
export const useAnalytics = () => {
  return analytics;
};

export default analytics;

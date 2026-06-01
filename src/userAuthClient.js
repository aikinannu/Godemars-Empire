// User authentication client for backend user management
// Use relative paths for development (Vite proxy handles routing)
// Use full URLs for production
const isDevelopment = import.meta.env.MODE === 'development';
const SERVER_URL = import.meta.env.VITE_LICENSE_SERVER_URL?.replace(/\/$/, "") || "http://localhost:3002";

// In development, use relative paths (Vite proxy)
// In production, use full URLs
const API_BASE = isDevelopment ? '/api/v1' : `${SERVER_URL}/api/v1`;

const STORAGE_KEY_USER_TOKEN = "gdwb_user_token";
const STORAGE_KEY_USER = "gdwb_user";
const STORAGE_KEY_TENANT = "gdwb_tenant_id";

// Get or create default tenant
const getOrCreateTenant = async () => {
  // Check if we have a cached tenant
  const cachedTenant = typeof window !== "undefined" 
    ? window.localStorage.getItem(STORAGE_KEY_TENANT)
    : null;

  if (cachedTenant) {
    return cachedTenant;
  }

  // Create a default personal tenant
  const tenantId = generateUUID();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY_TENANT, tenantId);
  }
  return tenantId;
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Refresh coordination promise to avoid parallel refreshes
let refreshPromise = null;

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const resp = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      const data = await parseResponse(resp);
      const token = data?.data?.access_token || data?.access_token || data?.token;
      const user = data?.data?.user || data?.user || null;
      if (!token) throw new Error('No token returned by refresh');
      const stored = getStoredUser();
      const email = stored?.email || (user && user.email) || null;
      persistUser(email, token, user || {});
      return token;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

// Fetch wrapper that attaches Authorization header when available,
// sends cookies by default (`credentials: 'include'`) and attempts
// an automatic refresh on 401 responses.
const fetchWithAuth = async (url, options = {}) => {
  try {
    const opts = {
      credentials: (options.credentials !== undefined) ? options.credentials : 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };

    const stored = getStoredUser();
    if (stored && stored.token && !opts.headers.Authorization) {
      opts.headers.Authorization = `Bearer ${stored.token}`;
    }

    let response = await fetch(url, opts);
    if (response.status !== 401) return response;

    // Try to refresh and retry once
    try {
      await refreshAccessToken();
      const updated = getStoredUser();
      if (updated && updated.token) {
        opts.headers.Authorization = `Bearer ${updated.token}`;
      }
      response = await fetch(url, opts);
      return response;
    } catch (refreshErr) {
      clearPersistedUser();
      throw new Error('Session expired');
    }
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw new Error(`Network error: ${error.message}`);
  }
};

const parseResponse = async (response) => {
  let text = "";
  try {
    text = await response.text();
  } catch (e) {
    throw new Error("Failed to read response");
  }

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("Response text:", text);
    throw new Error(`Invalid server response: ${text || "Empty response"}`);
  }

  if (!response.ok) {
    const errorMessage = data.message || data.error || data.detail || `Server error: ${response.status}`;
    console.error("Server error response:", data);
    throw new Error(errorMessage);
  }

  return data;
};

export const persistUser = (email, token, userData) => {
  if (typeof window === "undefined") return;
  if (email) window.localStorage.setItem(STORAGE_KEY_USER, JSON.stringify({ email, ...userData }));
  if (token) {
    // Primary token storage used across this client
    window.localStorage.setItem(STORAGE_KEY_USER_TOKEN, token);
    // Also persist a token shape expected by other modules (`src/services/api.js`)
    window.localStorage.setItem('userAuthToken', JSON.stringify({ access_token: token }));
  }
};

const clearPersistedUser = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY_USER_TOKEN);
  window.localStorage.removeItem(STORAGE_KEY_USER);
  window.localStorage.removeItem('userAuthToken');
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(STORAGE_KEY_USER_TOKEN);
  const userStr = window.localStorage.getItem(STORAGE_KEY_USER);
  if (!token || !userStr) return null;
  try {
    return { token, ...JSON.parse(userStr) };
  } catch {
    return null;
  }
};

export const registerUser = async (email, password) => {
  if (!email || !email.trim()) {
    throw new Error("Email is required.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const tenantId = await getOrCreateTenant();

  console.log("Registering user:", email, "with tenant:", tenantId, "at", `${API_BASE}/auth/register`);

  const response = await fetchWithAuth(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
      first_name: email.trim().split("@")[0], // Use email prefix as first name
      tenant_id: tenantId,
    }),
  });

  const data = await parseResponse(response);
  const token = data.data?.access_token || data.access_token || data.token;
  
  if (!token) {
    throw new Error("No token received from server");
  }

  persistUser(email.trim(), token, {
    email: email.trim(),
    created_at: new Date().toISOString(),
  });

  return {
    email: email.trim(),
    token,
    user: data.data?.user || data.user || { email: email.trim() },
  };
};

export const loginUser = async (email, password) => {
  if (!email || !email.trim()) {
    throw new Error("Email is required.");
  }
  if (!password) {
    throw new Error("Password is required.");
  }

  const tenantId = await getOrCreateTenant();

  console.log("Logging in user:", email, "with tenant:", tenantId, "at", `${API_BASE}/auth/login`);

  const response = await fetchWithAuth(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
      tenant_id: tenantId,
    }),
  });

  const data = await parseResponse(response);
  const token = data.data?.access_token || data.access_token || data.token;
  
  if (!token) {
    throw new Error("No token received from server");
  }

  persistUser(email.trim(), token, { email: email.trim() });

  return {
    email: email.trim(),
    token,
    user: data.data?.user || data.user || { email: email.trim() },
  };
};

export const getUserInfo = async (token) => {
  if (!token) {
    throw new Error("No token available.");
  }

  const response = await fetchWithAuth(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);
  return data;
};

export const updateUserProfile = async (token, updates) => {
  if (!token) {
    throw new Error("No token available.");
  }

  const response = await fetchWithAuth(`${API_BASE}/auth/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await parseResponse(response);
  return data;
};

export const logoutUser = async () => {
  try {
    // Ask server to revoke refresh token and clear cookie
    await fetchWithAuth(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.warn('Logout request failed:', e);
  }
  clearPersistedUser();
};

export const changePassword = async (email, oldPassword, newPassword, token) => {
  if (!token) {
    throw new Error("No token available. Please login first.");
  }
  if (!oldPassword || !newPassword) {
    throw new Error("Both old and new passwords are required.");
  }
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const response = await fetchWithAuth(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });

  const data = await parseResponse(response);
  return data;
};

export const resetPassword = async (email) => {
  if (!email || !email.trim()) {
    throw new Error("Email is required.");
  }

  const response = await fetchWithAuth(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
    }),
  });

  const data = await parseResponse(response);
  return data;
};

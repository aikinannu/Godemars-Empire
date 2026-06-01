const SERVER_URL = import.meta.env.VITE_LICENSE_SERVER_URL?.replace(/\/$/, "") || "http://127.0.0.1:8001";
const API_BASE = `${SERVER_URL}/api/v1`;
const STORAGE_KEY_TOKEN = "gdwb_license_token";
const STORAGE_KEY_LICENSE = "gdwb_license_key";

const parseResponse = async (response) => {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Unexpected server response: ${text}`);
  }

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || data.error || "License server validation failed.");
  }

  return data;
};

const persistLicense = (licenseKey, token) => {
  if (typeof window === "undefined") return;
  if (licenseKey) window.localStorage.setItem(STORAGE_KEY_LICENSE, licenseKey);
  if (token) window.localStorage.setItem(STORAGE_KEY_TOKEN, token);
};

const clearPersistedLicense = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY_LICENSE);
  window.localStorage.removeItem(STORAGE_KEY_TOKEN);
};

export const getStoredLicense = () => {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(STORAGE_KEY_TOKEN);
  const licenseKey = window.localStorage.getItem(STORAGE_KEY_LICENSE);
  return token ? { token, licenseKey } : null;
};

export const getLicenseServerUrl = () => SERVER_URL;

export const validateLicense = async (licenseKey, site = window.location.origin) => {
  if (!licenseKey || !licenseKey.trim()) {
    throw new Error("A license key is required.");
  }

  const body = new URLSearchParams({
    license_key: licenseKey.trim(),
    site,
  });

  const response = await fetch(`${API_BASE}/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await parseResponse(response);
  persistLicense(licenseKey.trim(), data.token);

  return {
    licenseKey: licenseKey.trim(),
    token: data.token,
    expiresAt: data.exp,
    raw: data,
  };
};

export const introspectToken = async (token) => {
  const introspectToken = token || getStoredLicense()?.token;
  if (!introspectToken) {
    throw new Error("No license token available for introspection.");
  }

  const body = new URLSearchParams({ token: introspectToken });
  const response = await fetch(`${API_BASE}/introspect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  return await parseResponse(response);
};

export const clearLicenseSession = () => {
  clearPersistedLicense();
};

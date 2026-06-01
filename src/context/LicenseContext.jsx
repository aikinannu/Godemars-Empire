import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getStoredLicense,
  introspectToken as introspectTokenClient,
  validateLicense as validateLicenseClient,
  clearLicenseSession,
} from "../licenseClient";

const LicenseContext = createContext(null);
export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
};

export const LicenseProvider = ({ children }) => {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const stored = getStoredLicense();
        if (stored && stored.token) {
          const info = await introspectTokenClient(stored.token);
          setLicense({ token: stored.token, licenseKey: stored.licenseKey, info });
        }
      } catch (err) {
        clearLicenseSession();
        setLicense(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const validateLicense = async (licenseKey) => {
    setLoading(true);
    try {
      const result = await validateLicenseClient(licenseKey);
      // result contains token, licenseKey, raw
      setLicense({ token: result.token, licenseKey: result.licenseKey || result.licenseKey, info: result.raw });
      return result;
    } finally {
      setLoading(false);
    }
  };

  const decodeTokenFeatures = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return [];
      const b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(Array.prototype.map.call(atob(b), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const pl = JSON.parse(json);
      if (pl && Array.isArray(pl.features)) return pl.features;
    } catch (e) {
      return [];
    }
    return [];
  };

  const hasFeature = (feature) => {
    if (!feature) return false;
    if (!license) return false;
    const info = license.info || license.raw || {};
    const features = info.features || decodeTokenFeatures(license.token);
    return Array.isArray(features) && features.indexOf(feature) !== -1;
  };

  const clear = () => {
    clearLicenseSession();
    setLicense(null);
  };

  return (
    <LicenseContext.Provider value={{ license, loading, validateLicense, clear, hasFeature }}>
      {children}
    </LicenseContext.Provider>
  );
};

export default LicenseContext;

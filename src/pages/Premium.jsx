import React from "react";
import { useLicense } from "../context/LicenseContext";

export default function PremiumPage() {
  const { license } = useLicense();

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-semibold mb-4">Premium Content</h1>
      <p className="mb-4">This area is protected and requires an active license to view.</p>

      {license ? (
        <div className="bg-gray-900 p-4 rounded text-white">
          <p><strong>License:</strong> {license.licenseKey || "(unknown)"}</p>
          <pre className="mt-3 text-sm bg-black p-3 rounded">{JSON.stringify(license.info, null, 2)}</pre>
        </div>
      ) : (
        <div className="text-red-400">No active license found.</div>
      )}
    </div>
  );
}

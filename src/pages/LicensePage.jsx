import React, { useState } from "react";
import { useLicense } from "../context/LicenseContext";

export default function LicensePage() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { validateLicense } = useLicense();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const result = await validateLicense(key.trim());
      setStatus({ ok: true, result });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const result = status?.result;
  const isExpired = result?.expiresAt && result.expiresAt < Math.floor(Date.now() / 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">License Activation</h1>
          <p className="text-slate-400 text-lg">Unlock premium features for your account</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden mb-6 border border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Enter Your License Key</h2>
          </div>

          <div className="p-8">
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">License Key</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition"
                    placeholder="e.g., TEST-GDW-INTEG-000000000001"
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                  />
                  {key && (
                    <button
                      type="button"
                      onClick={() => setKey("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">Format: XXXX-XXXX-XXXX-XXXXXXXXXXX</p>
              </div>

              <button
                type="submit"
                disabled={loading || !key}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {loading ? "Validating…" : "Validate License"}
              </button>
            </form>
          </div>
        </div>

        {/* Status Messages */}
        {status && (
          <div className={`rounded-xl overflow-hidden border-2 transition-all ${status.ok ? "bg-emerald-900/30 border-emerald-600" : "bg-red-900/30 border-red-600"}`}>
            {status.ok ? (
              <div className="p-6">
                {/* Success Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-200">License Activated Successfully!</h3>
                    <p className="text-emerald-300 text-sm">Your license is now active</p>
                  </div>
                </div>

                {/* License Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* License Key */}
                  <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">License Key</p>
                    <p className="text-white font-mono text-sm break-all mb-3">{result?.licenseKey}</p>
                    <button
                      onClick={() => copyToClipboard(result?.licenseKey)}
                      className="text-xs px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Expiration Date */}
                  <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Expires On</p>
                    <p className={`text-lg font-semibold ${isExpired ? "text-red-400" : "text-emerald-400"}`}>
                      {formatDate(result?.expiresAt)}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {isExpired ? "⚠️ License Expired" : "✓ Active"}
                    </p>
                  </div>
                </div>

                {/* Features */}
                {result?.raw?.features && result.raw.features.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">Included Features</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {result.raw.features.map((feature, idx) => (
                        <div key={idx} className="bg-slate-700 rounded-lg p-3 border border-emerald-600/30 flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-sm text-slate-200 capitalize">{feature.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Token Display */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">JWT Token</p>
                  <div className="bg-slate-800 rounded p-3 overflow-x-auto mb-3">
                    <p className="text-xs text-slate-300 font-mono break-all">{result?.token?.substring(0, 100)}...</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result?.token)}
                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                  >
                    {copied ? "Copied!" : "Copy Token"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-200 mb-2">Validation Failed</h3>
                    <p className="text-red-300">{status.message}</p>
                    <p className="text-xs text-red-400 mt-3">Please check your license key and try again, or contact support.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {!status && (
          <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-6">
            <div className="flex gap-4">
              <div className="text-blue-400 flex-shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-200 mb-1">Don't have a license key?</h4>
                <p className="text-blue-300 text-sm">Contact our sales team or request a trial license to get started with premium features.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

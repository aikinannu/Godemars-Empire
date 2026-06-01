import React, { useState } from "react";
import { Shield, Copy, Check, Smartphone } from "lucide-react";

export default function TwoFactorSetup() {
  const [setupStep, setSetupStep] = useState("method"); // method, qr, verify, complete
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [qrCode, setQrCode] = useState("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23fff' width='200' height='200'/%3E%3C/svg%3E");
  const [backupCodes, setBackupCodes] = useState([
    "1A2B-3C4D-5E6F",
    "7G8H-9I0J-1K2L",
    "3M4N-5O6P-7Q8R",
    "9S0T-1U2V-3W4X",
  ]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const methods = [
    {
      id: "authenticator",
      name: "Authenticator App",
      description: "Use an authenticator app like Google Authenticator or Authy",
      icon: Smartphone,
    },
    {
      id: "sms",
      name: "SMS Text Message",
      description: "Receive verification codes via text message",
      icon: "📱",
    },
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    setSetupStep("qr");
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate verification
    setTimeout(() => {
      if (verificationCode.length === 6) {
        setSetupStep("complete");
      }
      setIsVerifying(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-10">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Shield size={48} className="mx-auto mb-4 text-yellow-400" />
          <h1 className="text-3xl font-bold text-yellow-400">Two-Factor Authentication</h1>
          <p className="text-gray-400 mt-2">Secure your account with an extra layer of protection</p>
        </div>

        {setupStep === "method" && (
          <div className="space-y-3">
            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-yellow-500 transition text-left group"
                >
                  <div className="flex items-start gap-3">
                    {typeof Icon === "string" ? (
                      <span className="text-2xl">{Icon}</span>
                    ) : (
                      <Icon size={24} className="text-yellow-400" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-yellow-400 transition">
                        {method.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{method.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {setupStep === "qr" && (
          <div className="bg-gray-900/90 border border-yellow-600 rounded-3xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">Scan QR Code</h2>
            <p className="text-gray-400 text-sm">
              Use your authenticator app to scan this code or enter the secret key manually:
            </p>

            <div className="bg-white p-4 rounded-lg flex items-center justify-center">
              <img src={qrCode} alt="QR Code" className="w-40 h-40" />
            </div>

            <div className="bg-gray-800 p-3 rounded-lg space-y-2">
              <p className="text-xs text-gray-400">Manual Entry Key:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm break-all text-yellow-400">
                  JBSWY3DPEBLW64TMMQ======
                </code>
                <button
                  onClick={() => handleCopyCode("JBSWY3DPEBLW64TMMQ======")}
                  className="p-2 hover:bg-gray-700 rounded transition"
                  title="Copy"
                >
                  {isCopied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSetupStep("verify")}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition"
            >
              Next: Verify Code
            </button>
          </div>
        )}

        {setupStep === "verify" && (
          <div className="bg-gray-900/90 border border-yellow-600 rounded-3xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">Verify Your Code</h2>
            <p className="text-gray-400 text-sm">
              Enter the 6-digit code from your authenticator app:
            </p>

            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-center text-2xl font-mono tracking-widest text-yellow-400 focus:outline-none focus:border-yellow-500"
            />

            <button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6 || isVerifying}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        )}

        {setupStep === "complete" && (
          <div className="bg-gray-900/90 border border-green-600 rounded-3xl p-6 space-y-4">
            <Check size={48} className="text-green-400 mx-auto" />
            <h2 className="text-xl font-bold text-green-400 text-center">2FA Enabled!</h2>
            <p className="text-gray-400 text-sm text-center">
              Your account is now protected with two-factor authentication.
            </p>

            <div className="bg-gray-800 p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-gray-300">Backup Codes (save in a safe place)</p>
              <div className="space-y-1">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <code className="flex-1 font-mono text-gray-300">{code}</code>
                    <button
                      onClick={() => handleCopyCode(code)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <Copy size={14} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => window.location.href = "/"}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

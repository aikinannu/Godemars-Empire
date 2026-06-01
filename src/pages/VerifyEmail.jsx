import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("verifying"); // verifying, success, error, expired
  const [email, setEmail] = useState("");
  const [resendCount, setResendCount] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setVerificationStatus("error");
      return;
    }

    setEmail(email);
    verifyEmailToken(token, email);
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendCount > 0) {
      setCanResend(true);
    }
  }, [countdown, resendCount]);

  const verifyEmailToken = async (token, email) => {
    try {
      // In a real app, this would call your backend
      // const response = await fetch(`/api/v1/auth/verify-email`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, email })
      // });
      // For demo purposes, simulate success
      setTimeout(() => {
        setVerificationStatus("success");
      }, 2000);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus("error");
    }
  };

  const handleResendEmail = async () => {
    setCanResend(false);
    setResendCount(resendCount + 1);
    setCountdown(60);

    try {
      // Call resend email endpoint
      // const response = await fetch(`/api/v1/auth/resend-verification`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      console.log("Resent verification email to:", email);
    } catch (error) {
      console.error("Resend error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="max-w-md w-full p-8 bg-gray-900/90 border border-yellow-600 rounded-3xl shadow-2xl text-center">
        {verificationStatus === "verifying" && (
          <>
            <Loader size={48} className="text-yellow-400 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">Verifying Email</h1>
            <p className="text-gray-300 text-sm">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {verificationStatus === "success" && (
          <>
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-400 mb-2">Email Verified!</h1>
            <p className="text-gray-300 text-sm mb-6">
              Your email has been successfully verified. You can now access all features.
            </p>
            <button
              onClick={() => navigate("/homefeed")}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {verificationStatus === "error" && (
          <>
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h1>
            <p className="text-gray-300 text-sm mb-6">
              We couldn't verify your email. The link may have expired or is invalid.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={!canResend}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                {canResend ? "Resend Verification Email" : `Resend in ${countdown}s`}
              </button>
              <Link
                to="/login"
                className="block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition text-center"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React from "react";

const PasswordResetModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-primary bg-opacity-80 z-50">
      <div className="bg-light rounded-2xl shadow-card p-8 w-[90%] max-w-md text-center">
        <h2 className="text-xl font-bold text-primary mb-2">Reset Password</h2>
        <p className="text-muted text-sm mb-4">
          Password reset is not handled through the legacy auth flow.
          Please reactivate your license if you need access, or contact support for help.
        </p>

        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PasswordResetModal;

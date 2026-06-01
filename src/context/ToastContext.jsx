import React, { createContext, useContext, useCallback, useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration = 3000) => {
    return addToast(message, "success", duration);
  }, [addToast]);

  const showError = useCallback((message, duration = 4000) => {
    return addToast(message, "error", duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration = 3000) => {
    return addToast(message, "info", duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const bgColor =
    toast.type === "success"
      ? "bg-green-900/95 border-green-600"
      : toast.type === "error"
      ? "bg-red-900/95 border-red-600"
      : "bg-blue-900/95 border-blue-600";

  const Icon =
    toast.type === "success"
      ? CheckCircle
      : toast.type === "error"
      ? AlertCircle
      : AlertCircle;

  const iconColor =
    toast.type === "success"
      ? "text-green-400"
      : toast.type === "error"
      ? "text-red-400"
      : "text-blue-400";

  const textColor =
    toast.type === "success"
      ? "text-green-300"
      : toast.type === "error"
      ? "text-red-300"
      : "text-blue-300";

  return (
    <div
      className={`pointer-events-auto border rounded-lg p-4 flex items-start gap-3 shadow-lg backdrop-blur-sm ${bgColor}`}
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className={`flex-1 text-sm ${textColor}`}>{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-300 transition"
      >
        <X size={16} />
      </button>
    </div>
  );
};

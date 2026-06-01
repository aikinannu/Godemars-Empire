import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { LicenseProvider } from "./context/LicenseContext";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LicenseProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </LicenseProvider>
    </AuthProvider>
  </React.StrictMode>
);

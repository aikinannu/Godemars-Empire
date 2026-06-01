// Deprecated auth adapter file.
// The app now uses the GD Workflow Bridge Pro license server for auth and licensing.

export const signUpWithEmail = async () => {
  throw new Error("Signup is deprecated. Use the license activation flow instead.");
};

export const loginWithEmail = async () => {
  throw new Error("Login is deprecated. Use the license activation flow instead.");
};

export const signInWithGoogle = async () => {
  throw new Error("Google login is deprecated. Use the license activation flow instead.");
};

export const logout = async () => {
  throw new Error("Logout is deprecated. License session management is handled by the GD Workflow license system.");
};

export const resetPassword = async () => {
  throw new Error("Password reset is deprecated. This project now uses license-based authentication.");
};

export const monitorAuthState = () => {
  throw new Error("Auth state monitoring is deprecated and no longer supported.");
};

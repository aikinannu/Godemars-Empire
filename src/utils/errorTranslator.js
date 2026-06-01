// Error message translator for user-friendly error displays
export const translateError = (error) => {
  if (!error) return "An unexpected error occurred. Please try again.";

  const message = error.message || error.toString();

  // Authentication specific errors
  if (message.includes("invalid_credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (message.includes("user_exists")) {
    return "This email is already registered. Please use a different email or log in.";
  }
  if (message.includes("user not found")) {
    return "No account found with this email. Please sign up first.";
  }
  if (message.includes("Session expired")) {
    return "Your session has expired. Please log in again.";
  }
  if (message.includes("No token")) {
    return "Authentication failed. Please try again or contact support.";
  }
  if (message.includes("Network error")) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  if (message.includes("password")) {
    return "Password must be at least 6 characters long.";
  }
  if (message.includes("Email")) {
    return "Please enter a valid email address.";
  }
  if (message.includes("ECONNREFUSED")) {
    return "Cannot reach the server. Please check if the service is running.";
  }
  if (message.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  // Generic fallback
  return message || "An error occurred. Please try again.";
};

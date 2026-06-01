// SMS 2FA service using Twilio
// For sending verification codes via SMS

const twilio = require("twilio");

class SMSService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      console.warn("Twilio credentials not configured - SMS 2FA disabled");
    }
  }

  /**
   * Generate a random 6-digit code
   */
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send 2FA code via SMS
   */
  async send2FACode(phoneNumber, code, username = "") {
    if (!this.client) {
      throw new Error("SMS service not configured");
    }

    try {
      const message = `Your Godemar's Empire 2FA code is: ${code}. Valid for 10 minutes.`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });

      console.log(`2FA code sent to ${phoneNumber}, SID: ${result.sid}`);
      return {
        success: true,
        messageSid: result.sid,
        phoneNumber,
      };
    } catch (err) {
      console.error("SMS send error:", err);
      throw new Error("Failed to send SMS code");
    }
  }

  /**
   * Send login alert via SMS
   */
  async sendLoginAlert(phoneNumber, deviceInfo = {}, username = "") {
    if (!this.client) {
      throw new Error("SMS service not configured");
    }

    try {
      const location = deviceInfo.location || "Unknown location";
      const message = `Alert: New login to your Godemar's Empire account from ${location}. If this wasn't you, secure your account.`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });

      console.log(`Login alert sent to ${phoneNumber}`);
      return {
        success: true,
        messageSid: result.sid,
      };
    } catch (err) {
      console.error("SMS alert error:", err);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Send account recovery SMS
   */
  async sendAccountRecovery(phoneNumber, recoveryCode, username = "") {
    if (!this.client) {
      throw new Error("SMS service not configured");
    }

    try {
      const message = `Your Godemar's Empire account recovery code is: ${recoveryCode}. Valid for 30 minutes.`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });

      console.log(`Recovery code sent to ${phoneNumber}`);
      return {
        success: true,
        messageSid: result.sid,
      };
    } catch (err) {
      console.error("SMS recovery error:", err);
      throw new Error("Failed to send recovery code");
    }
  }

  /**
   * Verify that a phone number is valid (US/international format)
   */
  validatePhoneNumber(phoneNumber) {
    // Basic validation - should be E.164 format or convertible to it
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ""));
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/\D/g, "");

    // Add country code if missing (assume US +1)
    if (cleaned.length === 10) {
      cleaned = "1" + cleaned;
    }

    return "+" + cleaned;
  }
}

module.exports = new SMSService();

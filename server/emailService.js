// Email service utility for sending transactional emails
// Supports multiple providers: SendGrid, Mailgun, Nodemailer
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || "nodemailer";
    this.fromEmail = process.env.EMAIL_FROM || "noreply@godemars.com";
    this.initProvider();
  }

  initProvider() {
    if (this.provider === "sendgrid") {
      this.sgMail = require("@sendgrid/mail");
      this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else if (this.provider === "mailgun") {
      this.mailgun = require("mailgun.js");
      this.mg = this.mailgun.client({
        username: "api",
        key: process.env.MAILGUN_API_KEY,
      });
    } else {
      // Nodemailer fallback or file outbox in dev when SMTP not configured
      const nodemailer = require("nodemailer");
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort, 10),
          secure: (process.env.SMTP_SECURE === 'true') || false,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      } else {
        // No SMTP configured — write emails to local outbox for dev/testing
        this.provider = 'file';
        this.outboxDir = path.join(__dirname, 'outbox');
        try { fs.mkdirSync(this.outboxDir, { recursive: true }); } catch (e) {}
        console.warn(`EmailService: SMTP not configured; using local file outbox at ${this.outboxDir}`);
      }
    }
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(email, token, username = "") {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    const subject = "Verify Your Email - Godemar's Empire";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a1a; color: #fbbf24; padding: 20px; text-align: center; border-radius: 10px;">
          <h2>Welcome to Godemar's Empire!</h2>
        </div>
        <div style="padding: 20px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
          <p>Hi ${username || "User"},</p>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: #fbbf24; color: #1a1a1a; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Or copy this link: ${verificationLink}</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">This link expires in 24 hours.</p>
        </div>
      </div>
    `;

    return this.send(email, subject, htmlContent);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken, username = "") {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const subject = "Reset Your Password - Godemar's Empire";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a1a; color: #fbbf24; padding: 20px; text-align: center; border-radius: 10px;">
          <h2>Password Reset Request</h2>
        </div>
        <div style="padding: 20px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
          <p>Hi ${username || "User"},</p>
          <p>We received a request to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #fbbf24; color: #1a1a1a; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">This link expires in 1 hour.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    return this.send(email, subject, htmlContent);
  }

  /**
   * Send 2FA verification code
   */
  async send2FAEmail(email, code, username = "") {
    const subject = "Your 2FA Verification Code";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a1a; color: #fbbf24; padding: 20px; text-align: center; border-radius: 10px;">
          <h2>Two-Factor Authentication</h2>
        </div>
        <div style="padding: 20px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
          <p>Hi ${username || "User"},</p>
          <p>Your 2FA verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #fbbf24; letter-spacing: 5px;">
              ${code}
            </div>
          </div>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    return this.send(email, subject, htmlContent);
  }

  /**
   * Send login alert
   */
  async sendLoginAlertEmail(email, deviceInfo = {}, username = "") {
    const subject = "New Login to Your Account";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a1a; color: #fbbf24; padding: 20px; text-align: center; border-radius: 10px;">
          <h2>Account Login Alert</h2>
        </div>
        <div style="padding: 20px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
          <p>Hi ${username || "User"},</p>
          <p>A new login to your account was detected:</p>
          <ul style="color: #666;">
            <li>Device: ${deviceInfo.deviceType || "Unknown"}</li>
            <li>Location: ${deviceInfo.location || "Unknown"}</li>
            <li>Time: ${deviceInfo.timestamp || new Date().toLocaleString()}</li>
          </ul>
          <p style="color: #999; font-size: 12px;">If this wasn't you, please secure your account immediately.</p>
        </div>
      </div>
    `;

    return this.send(email, subject, htmlContent);
  }

  /**
   * Generic email sending method
   */
  async send(to, subject, htmlContent) {
    try {
      if (this.provider === "sendgrid") {
        return await this.sendGrid(to, subject, htmlContent);
      } else if (this.provider === "mailgun") {
        return await this.sendMailgun(to, subject, htmlContent);
      } else if (this.provider === 'file') {
        return await this.writeOutbox(to, subject, htmlContent);
      } else {
        return await this.sendNodemailer(to, subject, htmlContent);
      }
    } catch (err) {
      console.error("Email send error:", err);
      // Fallback: when sending fails in dev, write to outbox if available
      if (this.outboxDir) {
        try {
          return await this.writeOutbox(to, subject, htmlContent);
        } catch (e) {
          // fallthrough
        }
      }
      throw err;
    }
  }

  async sendGrid(to, subject, htmlContent) {
    const msg = {
      to,
      from: this.fromEmail,
      subject,
      html: htmlContent,
    };

    const result = await this.sgMail.send(msg);
    console.log(`Email sent to ${to} via SendGrid`);
    return result;
  }

  async sendMailgun(to, subject, htmlContent) {
    const result = await this.mg.messages.create(
      process.env.MAILGUN_DOMAIN,
      {
        from: this.fromEmail,
        to,
        subject,
        html: htmlContent,
      }
    );

    console.log(`Email sent to ${to} via Mailgun`);
    return result;
  }

  async sendNodemailer(to, subject, htmlContent) {
    if (!this.transporter) {
      // transporter not configured — write to file outbox
      return await this.writeOutbox(to, subject, htmlContent);
    }

    const result = await this.transporter.sendMail({
      from: this.fromEmail,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`Email sent to ${to} via Nodemailer`);
    return result;
  }

  async writeOutbox(to, subject, htmlContent) {
    try {
      const meta = `To: ${to}\nSubject: ${subject}\nDate: ${new Date().toISOString()}\n\n`;
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,10)}.html`;
      const filePath = path.join(this.outboxDir || path.join(__dirname,'outbox'), fileName);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, meta + htmlContent, 'utf8');
      console.log(`Wrote email to local outbox: ${filePath}`);
      return { file: filePath };
    } catch (e) {
      console.error('Failed to write outbox email:', e);
      throw e;
    }
  }
}

module.exports = new EmailService();

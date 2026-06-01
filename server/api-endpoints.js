// Backend API endpoints for Phase 2 features
// Export as a function and mount from api-gateway.js: require('./api-endpoints')(app, pool)
module.exports = (app, db, authenticateToken) => {
  const { randomBytes } = require('crypto');
  const emailService = require('./emailService');
  const bcrypt = require('bcryptjs');

// ============================================
// EMAIL VERIFICATION ENDPOINTS
// ============================================

/**
 * POST /api/v1/auth/resend-verification
 * Resend email verification link
 * Body: { email }
 */
app.post("/api/v1/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await db.query("SELECT id, email, email_verified FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.rows[0].email_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Debug: inspect randomBytes at runtime
    try { console.log('api-endpoints: randomBytes typeof', typeof randomBytes); } catch (e) {}
    // Generate verification token and record id
    const token = randomBytes(32).toString("hex");
    const id = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token to database
    await db.query(
      "INSERT INTO email_verification_tokens (id, user_id, token, email, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [id, user.rows[0].id, token, email.toLowerCase(), expiresAt]
    );

    // Send email (use first_name when available)
    const displayName = user.rows[0].first_name || user.rows[0].email;
    await emailService.sendVerificationEmail(email, token, displayName);

    res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

/**
 * POST /api/v1/auth/verify-email
 * Verify email with token from link
 * Body: { token, email }
 */
app.post("/api/v1/auth/verify-email", async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: "Token and email are required" });
    }

    // Find verification token
    const tokenRecord = await db.query(
      "SELECT * FROM email_verification_tokens WHERE token = $1 AND email = $2",
      [token, email.toLowerCase()]
    );

    if (tokenRecord.rows.length === 0) {
      return res.status(404).json({ error: "Invalid verification token" });
    }

    const verificationToken = tokenRecord.rows[0];

    // Check if token expired
    if (new Date() > new Date(verificationToken.expires_at)) {
      return res.status(400).json({ error: "Verification token expired" });
    }

    // Mark email as verified
    await db.query("UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1", [
      verificationToken.user_id,
    ]);

    // Mark token as used
    await db.query("UPDATE email_verification_tokens SET verified_at = NOW() WHERE id = $1", [
      verificationToken.id,
    ]);

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// ============================================
// 2FA ENDPOINTS
// ============================================

/**
 * POST /api/v1/auth/setup-2fa
 * Initialize 2FA setup and return QR code
 * Auth: Bearer token required
 */
app.post("/api/v1/auth/setup-2fa", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const speakeasy = require("speakeasy");

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Godemar's Empire (${req.user.email})`,
      issuer: "Godemar's Empire",
      length: 32,
    });

    // Store temporary secret (not yet enabled)
    await db.query(
      "INSERT INTO two_factor_settings (user_id, authenticator_secret) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET authenticator_secret = $2",
      [userId, secret.base32]
    );

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    });
  } catch (err) {
    console.error("2FA setup error:", err);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
});

/**
 * POST /api/v1/auth/verify-2fa-code
 * Verify 2FA code and enable 2FA
 * Auth: Bearer token required
 * Body: { code, method: 'authenticator'|'sms' }
 */
app.post("/api/v1/auth/verify-2fa-code", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, method } = req.body;
    const speakeasy = require("speakeasy");

    if (!code || !method) {
      return res.status(400).json({ error: "Code and method are required" });
    }

    // Get 2FA settings
    const settings = await db.query("SELECT * FROM two_factor_settings WHERE user_id = $1", [
      userId,
    ]);

    if (settings.rows.length === 0) {
      return res.status(404).json({ error: "2FA not initialized" });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: settings.rows[0].authenticator_secret,
      encoding: "base32",
      token: code,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Enable 2FA
    await db.query(
      "UPDATE two_factor_settings SET enabled = true, method = $1, updated_at = NOW() WHERE user_id = $2",
      [method, userId]
    );

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      try { console.log('2FA: randomBytes typeof', typeof randomBytes); } catch (e) {}
      backupCodes.push(randomBytes(4).toString("hex").toUpperCase().match(/.{1,4}/g).join("-"));
    }

    // Store backup codes (generate ids)
    for (const code of backupCodes) {
      const codeId = randomBytes(12).toString('hex');
      await db.query(
        "INSERT INTO backup_codes (id, user_id, code, created_at) VALUES ($1, $2, $3, NOW())",
        [codeId, userId, code]
      );
    }

    // Log security event (details JSON)
    await db.query(
      "INSERT INTO security_events (id, user_id, event_type, details) VALUES ($1, $2, $3, $4)",
      [randomBytes(12).toString('hex'), userId, 'two_factor_enabled', JSON.stringify({ method, timestamp: new Date() })]
    );

    res.json({
      success: true,
      message: "2FA enabled successfully",
      backupCodes,
    });
  } catch (err) {
    console.error("2FA verification error:", err);
    res.status(500).json({ error: "Failed to verify 2FA code" });
  }
});

/**
 * POST /api/v1/auth/disable-2fa
 * Disable 2FA for user
 * Auth: Bearer token required
 * Body: { password }
 */
app.post("/api/v1/auth/disable-2fa", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Verify password
      const user = await db.query("SELECT password FROM users WHERE id = $1", [userId]);
      const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Disable 2FA
    await db.query(
      "UPDATE two_factor_settings SET enabled = false, method = NULL, updated_at = NOW() WHERE user_id = $1",
      [userId]
    );

    // Delete backup codes
    await db.query("DELETE FROM backup_codes WHERE user_id = $1", [userId]);

    // Log security event
    await db.query(
      "INSERT INTO security_events (id, user_id, event_type, details) VALUES ($1, $2, $3, $4)",
      [randomBytes(12).toString('hex'), userId, 'two_factor_disabled', JSON.stringify({ timestamp: new Date() })]
    );

    res.json({ success: true, message: "2FA disabled successfully" });
  } catch (err) {
    console.error("2FA disable error:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

// ============================================
// OAUTH ENDPOINTS
// ============================================

/**
 * POST /api/v1/auth/google/callback
 * Google OAuth callback handler
 */
app.post("/api/v1/auth/google/callback", async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify token with Google (implement OAuth library)
    // Extract user info: id, email, name, picture
    // Find or create user with oauth_profiles linkage

    res.json({ success: true, message: "Google auth callback" });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

/**
 * POST /api/v1/auth/github/callback
 * GitHub OAuth callback handler
 */
app.post("/api/v1/auth/github/callback", async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    // Get user info from GitHub API
    // Find or create user with oauth_profiles linkage

    res.json({ success: true, message: "GitHub auth callback" });
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    res.status(500).json({ error: "GitHub authentication failed" });
  }
});

// ============================================
// USER SETTINGS ENDPOINTS
// ============================================

/**
 * GET /api/v1/settings
 * Get user settings and preferences
 * Auth: Bearer token required
 */
app.get("/api/v1/settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const user = await db.query(
      "SELECT id, email, first_name, email_verified FROM users WHERE id = $1",
      [userId]
    );

    // Get 2FA settings
    const twoFA = await db.query(
      "SELECT enabled, method FROM two_factor_settings WHERE user_id = $1",
      [userId]
    );

    // Get active sessions
    const sessions = await db.query(
      "SELECT id, created_at, expires_at FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json({
      success: true,
      user: user.rows[0],
      twoFA: twoFA.rows[0] || { enabled: false },
      sessions: sessions.rows,
    });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

/**
 * GET /api/v1/admin/analytics
 * Get admin analytics dashboard data
 * Auth: Bearer token + admin role required
 */
app.get("/api/v1/admin/analytics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { dateRange = "7d" } = req.query;

    // Calculate date range
    const daysAgo = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Get statistics
    const stats = {
      totalUsers: await db.query("SELECT COUNT(*) as count FROM users"),
      activeToday: await db.query(
        "SELECT COUNT(*) as count FROM users WHERE last_login_at > NOW() - INTERVAL '1 day'"
      ),
      newSignups: await db.query(
        "SELECT COUNT(*) as count FROM users WHERE created_at > $1",
        [startDate]
      ),
      failedLogins: await db.query(
        "SELECT COUNT(*) as count FROM login_activity WHERE status = 'failed' AND created_at > $1",
        [startDate]
      ),
    };

    // Get login trends
    const loginTrend = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
       FROM login_activity
       WHERE created_at > $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate]
    );

    // Get 2FA adoption
    const twoFAAdoption = await db.query(`
      SELECT 
        COUNT(CASE WHEN enabled = true THEN 1 END) as enabled,
        COUNT(CASE WHEN enabled = false THEN 1 END) as disabled
      FROM two_factor_settings
    `);

    res.json({
      success: true,
      stats: {
        totalUsers: stats.totalUsers.rows[0].count,
        activeToday: stats.activeToday.rows[0].count,
        newSignups: stats.newSignups.rows[0].count,
        failedLogins: stats.failedLogins.rows[0].count,
      },
      loginTrend: loginTrend.rows,
      twoFAAdoption: twoFAAdoption.rows[0],
    });
  } catch (err) {
    console.error("Get analytics error:", err);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// ============================================
// HELPER: Admin role check middleware
// ============================================
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

};

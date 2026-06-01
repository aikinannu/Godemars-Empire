const express = require("express");
const fetch = require("node-fetch");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { createClient } = require('redis');
const { pool } = require("./db");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Runtime config + production safety checks
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3001";
const TRUST_PROXY = (process.env.TRUST_PROXY === 'true') || (process.env.NODE_ENV === 'production');

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_jwt_secret_change_me') {
    console.error('FATAL: Set JWT_SECRET to a strong secret in production.');
    process.exit(1);
  }
  if (!process.env.CORS_ORIGIN) {
    console.error('FATAL: Set CORS_ORIGIN to your frontend origin in production (no wildcard).');
    process.exit(1);
  }
  if (process.env.CORS_ORIGIN === '*') {
    console.error('FATAL: CORS_ORIGIN must not be wildcard in production.');
    process.exit(1);
  }
}

if (TRUST_PROXY) app.set('trust proxy', 1);

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Enforce HTTPS in production (respect X-Forwarded-Proto when behind a proxy)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const protoHeader = (req.headers['x-forwarded-proto'] || req.protocol || '').toString();
    const proto = protoHeader.split(',')[0];
    if (proto !== 'https' && !req.secure) {
      if (req.method === 'GET' || req.method === 'HEAD') {
        return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
      }
      return res.status(426).json({ error: 'upgrade_required', message: 'HTTPS required' });
    }
  }
  next();
});

// License server configuration
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || "http://localhost:8001";

// Redis configuration (optional). If Redis is available, use it for fast JTI revocation checks.
const REDIS_HOST = process.env.REDIS_HOST || process.env.LICENSE_REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || process.env.LICENSE_REDIS_PORT || '6379', 10);
const REDIS_PASS = process.env.REDIS_PASS || process.env.LICENSE_REDIS_PASS || undefined;

let redisClient = null;
// In-memory cache of revoked JTIs populated via Redis pub/sub for fast checks
const revokedCache = new Map(); // jti -> expires_at (epoch seconds) or 0 for no-expire
let redisSubClient = null;
// Allow disabling Redis in local/dev environments to avoid noisy errors
const REDIS_DISABLED = process.env.DISABLE_REDIS === 'true' || process.env.NO_REDIS === '1';
if (REDIS_DISABLED) {
  console.log('Redis disabled via DISABLE_REDIS/NO_REDIS; skipping initialization.');
} else {
  (async () => {
    try {
      const opts = { socket: { host: REDIS_HOST, port: REDIS_PORT } };
      if (REDIS_PASS) opts.password = REDIS_PASS;
      redisClient = createClient(opts);
      redisClient.on('error', (err) => console.error('Redis error', err));
      await redisClient.connect();
      console.log('Connected to Redis at', REDIS_HOST + ':' + REDIS_PORT);

      // Try to create a duplicate client for pub/sub to keep an up-to-date local cache
      try {
        redisSubClient = redisClient.duplicate();
        redisSubClient.on('error', (err) => console.error('Redis subscriber error', err));
        await redisSubClient.connect();
        await redisSubClient.subscribe('jti_revocations', (message) => {
          try {
            const payload = JSON.parse(message || '{}');
            if (!payload || !payload.jti) return;
            const expiresAt = payload.expires_at ? Number(payload.expires_at) : 0;
            revokedCache.set(payload.jti, expiresAt || 0);
            if (expiresAt && expiresAt > Date.now() / 1000) {
              const ms = expiresAt * 1000 - Date.now();
              setTimeout(() => revokedCache.delete(payload.jti), ms + 1000);
            }
          } catch (e) {
            // ignore malformed messages
          }
        });
        console.log('Subscribed to Redis jti_revocations channel');
      } catch (e) {
        console.warn('Redis subscriber not available:', e.message || e);
        redisSubClient = null;
      }
    } catch (e) {
      console.warn('Redis not available:', e.message || e);
      redisClient = null;
    }
  })();
}

const parseJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload || null;
  } catch (e) {
    return null;
  }
};

const isJtiRevoked = async (jti) => {
  if (!jti) return false;
  // Fast local cache check
  try {
    if (revokedCache.has(jti)) {
      const exp = revokedCache.get(jti);
      if (exp === 0) return true;
      if (exp > Date.now() / 1000) return true;
      // expired in cache
      revokedCache.delete(jti);
    }
  } catch (e) {
    // ignore cache errors
  }
  if (!redisClient) return false;
  try {
    const userKey = `jti:${jti}`;
    const adminKey = `admin_jti:${jti}`;
    const timeoutMs = 200; // fast failover when Redis is unresponsive
    const existsOrTimeout = async (key) => {
      try {
        return await Promise.race([
          redisClient.exists(key),
          new Promise((res) => setTimeout(() => res(0), timeoutMs))
        ]);
      } catch (e) {
        return 0;
      }
    };
    const existsUser = await existsOrTimeout(userKey);
    if (existsUser === 1) return true;
    const existsAdmin = await existsOrTimeout(adminKey);
    return existsAdmin === 1;
  } catch (e) {
    console.warn('Redis exists error', e.message || e);
    return false;
  }
};

// Middleware: enforce JTI revocation for incoming Bearer JWTs.
app.use(async (req, res, next) => {
  try {
    const auth = (req.get('Authorization') || '').toString();
    if (auth.startsWith('Bearer ')) {
      const token = auth.substring(7).trim();
      if (token.split('.').length === 3) {
        const payload = parseJwtPayload(token);
        if (payload && payload.jti) {
          const revoked = await isJtiRevoked(payload.jti);
          if (revoked) return res.status(403).json({ error: 'revoked', message: 'Token revoked' });
        }
      }
    }
  } catch (e) {
    // fail-open on middleware error so auth degradation doesn't lock users out
    console.warn('Revocation middleware error', e && e.message ? e.message : e);
  }
  return next();
});

// Generate UUID helper
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// JWT / Refresh token configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
// Shorter default access token lifetime; override via env `JWT_EXPIRY` if needed
const JWT_EXPIRY = process.env.JWT_EXPIRY || '5m'; // access token lifetime (default reduced)
// Shorter default refresh token lifetime for CI/production hardening
const REFRESH_TOKEN_EXPIRY_DAYS = process.env.REFRESH_TOKEN_EXPIRY_DAYS ? parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS, 10) : 7;
// Optional: enable remote introspection of access tokens for high-value flows
const ACCESS_TOKEN_INTROSPECT = (process.env.ACCESS_TOKEN_INTROSPECT === 'true');
const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'refresh_token';
const COOKIE_SECURE = (process.env.COOKIE_SECURE === 'true') || (process.env.NODE_ENV === 'production');
const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE || 'none').toLowerCase();
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

const generateAccessToken = (user) => {
  const payload = {
    sub: user.id || user.email,
    email: user.email,
    tenant_id: user.tenant_id || user.tenantId,
    jti: crypto.randomBytes(16).toString('hex'),
  };
  const opts = { expiresIn: JWT_EXPIRY };
  return jwt.sign(payload, JWT_SECRET, opts);
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const setRefreshCookie = (res, token, maxAgeMs) => {
  const opts = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    maxAge: maxAgeMs,
    path: '/',
  };
  if (COOKIE_DOMAIN) opts.domain = COOKIE_DOMAIN;

  // Warn in dev if using SameSite=None without secure flag — browsers may ignore the cookie
  if (COOKIE_SAMESITE === 'none' && !COOKIE_SECURE) {
    console.warn('Warning: Using SameSite=None without secure cookies; browsers may refuse cookies in some contexts. Set COOKIE_SECURE=true in production and use HTTPS.');
  }

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, opts);
};

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    port,
    license_server: LICENSE_SERVER_URL,
  });
});

// ============= AUTH ENDPOINTS =============

// User registration endpoint
app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { email, password, first_name, tenant_id } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "password_too_short", message: "Password must be at least 6 characters" });
    }
    // Check if user already exists in DB
    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length) {
        return res.status(409).json({ error: "user_exists", message: "User already registered" });
      }

      // Hash password with bcrypt
      const hashed = await bcrypt.hash(password, 10);
      const id = generateUUID();
      const tenantId = tenant_id || generateUUID();
      const firstName = first_name || email.split("@")[0];
      const createdAt = new Date().toISOString();

      await client.query(
        `INSERT INTO users(id, email, password, first_name, tenant_id, created_at)
         VALUES($1,$2,$3,$4,$5,$6)`,
        [id, email.toLowerCase(), hashed, firstName, tenantId, createdAt]
      );

      // Issue access token and refresh token
      const user = { id, email: email.toLowerCase(), tenant_id: tenantId, first_name: firstName, created_at: createdAt };
      const accessToken = generateAccessToken(user);

      const refreshToken = crypto.randomBytes(48).toString('hex');
      const refreshId = generateUUID();
      const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      await client.query(
        `INSERT INTO refresh_tokens(id, user_id, token_hash, expires_at)
         VALUES($1,$2,$3,$4)`,
        [refreshId, id, hashToken(refreshToken), refreshExpiresAt.toISOString()]
      );

      // Set secure HttpOnly cookie for refresh token
      setRefreshCookie(res, refreshToken, REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      res.status(201).json({
        success: true,
        data: {
          access_token: accessToken,
          user: {
            id,
            email: email.toLowerCase(),
            first_name: firstName,
            created_at: createdAt,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// User login endpoint
app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { email, password, tenant_id } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, email, password, first_name, tenant_id, created_at FROM users WHERE email = $1', [email.toLowerCase()]);
      if (!result.rows.length) {
        return res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
      }

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
      }

      // Issue access token and refresh token
      const userObj = { id: user.id, email: user.email, tenant_id: user.tenant_id, first_name: user.first_name, created_at: user.created_at };
      const accessToken = generateAccessToken(userObj);

      const refreshToken = crypto.randomBytes(48).toString('hex');
      const refreshId = generateUUID();
      const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      await client.query(
        `INSERT INTO refresh_tokens(id, user_id, token_hash, expires_at)
         VALUES($1,$2,$3,$4)`,
        [refreshId, user.id, hashToken(refreshToken), refreshExpiresAt.toISOString()]
      );

      setRefreshCookie(res, refreshToken, REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      res.json({
        success: true,
        data: {
          access_token: accessToken,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            created_at: user.created_at,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// Get user info endpoint
app.get("/api/v1/auth/me", async (req, res) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "unauthorized", message: "No token provided" });
    }
    
    const token = authHeader.substring(7);
      // Verify JWT signature and expiration
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
      }

      // Early Redis JTI revocation check (fast path)
      if (payload && payload.jti) {
        try {
          const revoked = await isJtiRevoked(payload.jti);
          if (revoked) return res.status(403).json({ error: 'revoked', error_description: 'Token has been revoked' });
        } catch (e) {
          console.warn('JTI check error', e.message || e);
        }
      }

      // Optional remote introspection check (consult license server for revocation/JTI blacklist)
      if (ACCESS_TOKEN_INTROSPECT) {
        try {
          const body = new URLSearchParams({ token });
          const resp = await fetch(`${LICENSE_SERVER_URL}/api/v1/introspect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
          });
          const j = await resp.json();
          if (!j || !j.success) {
            return res.status(401).json({ error: 'unauthorized', message: 'Token failed introspection' });
          }
        } catch (e) {
          console.error('Introspection error:', e);
          return res.status(503).json({ error: 'service_unavailable', message: 'Introspection unavailable' });
        }
      }

      // Lookup user in DB
      pool.query('SELECT id, email, first_name, tenant_id, created_at FROM users WHERE email = $1', [payload.email])
        .then((result) => {
          if (!result.rows.length) {
            return res.status(401).json({ error: 'unauthorized', message: 'User not found' });
          }
          const user = result.rows[0];
          res.json({
            success: true,
            data: {
              user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                tenant_id: user.tenant_id,
                created_at: user.created_at,
              },
            },
          });
        })
        .catch((dbErr) => {
          console.error('DB error in /me:', dbErr);
          res.status(500).json({ error: 'server_error', message: dbErr.message });
        });
  } catch (err) {
    console.error("Get user info error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// Refresh access token using refresh token stored in secure HttpOnly cookie
app.post('/api/v1/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies && req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) return res.status(401).json({ error: 'invalid_request', message: 'No refresh token' });

    const tokenHash = hashToken(refreshToken);
    const client = await pool.connect();
    try {
      const rtRes = await client.query('SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
      if (!rtRes.rows.length) {
        return res.status(401).json({ error: 'invalid_token', message: 'Refresh token not found' });
      }

      const rt = rtRes.rows[0];
      if (new Date(rt.expires_at) < new Date()) {
        // expired
        await client.query('DELETE FROM refresh_tokens WHERE id = $1', [rt.id]).catch(() => {});
        return res.status(401).json({ error: 'invalid_token', message: 'Refresh token expired' });
      }

      // Load user
      const userRes = await client.query('SELECT id, email, first_name, tenant_id, created_at FROM users WHERE id = $1', [rt.user_id]);
      if (!userRes.rows.length) return res.status(404).json({ error: 'user_not_found' });
      const user = userRes.rows[0];

      // Rotate refresh token
      const newRefreshToken = crypto.randomBytes(48).toString('hex');
      const newHash = hashToken(newRefreshToken);
      const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      await client.query('UPDATE refresh_tokens SET token_hash = $1, expires_at = $2 WHERE id = $3', [newHash, newExpiresAt.toISOString(), rt.id]);

      // Issue new access token
      const accessToken = generateAccessToken(user);

      // Set new cookie
      setRefreshCookie(res, newRefreshToken, REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      res.json({ success: true, data: { access_token: accessToken, user } });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// Logout endpoint - clears refresh token and cookie
app.post('/api/v1/auth/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies && req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]).catch(() => {});
    }
    const clearOpts = { httpOnly: true, secure: COOKIE_SECURE, sameSite: COOKIE_SAMESITE, path: '/' };
    if (COOKIE_DOMAIN) clearOpts.domain = COOKIE_DOMAIN;
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearOpts);
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ============= LICENSE ENDPOINTS =============
app.post("/api/v1/license/validate", async (req, res) => {
  try {
    const { license_key } = req.body || {};
    if (!license_key) {
      return res.status(400).json({ error: "license_key required" });
    }

    const body = new URLSearchParams({
      license_key,
      site: req.get("origin") || "http://localhost:3001",
    });

    const response = await fetch(`${LICENSE_SERVER_URL}/api/v1/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("License validate error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// License introspection endpoint
app.post("/api/v1/license/introspect", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "token required" });
    }

    // Check Redis for fast JTI revocation before contacting license server
    try {
      const payload = parseJwtPayload(token);
      if (payload && payload.jti) {
        const revoked = await isJtiRevoked(payload.jti);
        if (revoked) return res.status(403).json({ success: false, message: 'revoked_jti' });
      }
    } catch (e) {
      // ignore parse/redis errors and fall back to introspection
    }

    const body = new URLSearchParams({ token });

    const response = await fetch(`${LICENSE_SERVER_URL}/api/v1/introspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("License introspect error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// JWKS endpoint (public keys for JWT verification)
app.get("/api/v1/license/jwks", async (req, res) => {
  try {
    const response = await fetch(`${LICENSE_SERVER_URL}/api/v1/jwks`, {
      method: "GET",
    });

    const data = await response.json();
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("JWKS error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// Endpoint aliases for backward compatibility
app.post("/api/v1/validate", async (req, res) => {
  // Proxy to license validation
  try {
    const { license_key } = req.body;
    const body = new URLSearchParams({
      license_key: license_key || req.body.license_key,
      site: req.body.site || req.get("origin") || "http://localhost:3001",
    });

    const response = await fetch(`${LICENSE_SERVER_URL}/api/v1/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("License validate error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

app.post("/api/v1/introspect", async (req, res) => {
  // Proxy to license introspection
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "token required" });
    }

    // Fast Redis check for jti to avoid contacting license server when possible
    try {
      const payload = parseJwtPayload(token);
      if (payload && payload.jti) {
        const revoked = await isJtiRevoked(payload.jti);
        if (revoked) return res.status(403).json({ success: false, message: 'revoked_jti' });
      }
    } catch (e) {
      // ignore and continue to proxy
    }

    const body = new URLSearchParams({ token });

    const response = await fetch(`${LICENSE_SERVER_URL}/api/v1/introspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("License introspect error:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

// Admin revoke endpoint (gateway-level). Accepts JSON { jti, token, license_key, reason }
// Requires an admin bearer token in env: `GATEWAY_ADMIN_TOKEN` or falls back to `LICENSE_ADMIN_TOKEN`/`ADMIN_TOKEN`.
app.post('/api/v1/admin/revoke', async (req, res) => {
  try {
    const authHeader = (req.get('Authorization') || '').toString();
    const expected = process.env.GATEWAY_ADMIN_TOKEN || process.env.LICENSE_ADMIN_TOKEN || process.env.ADMIN_TOKEN || '';
    if (!expected) return res.status(500).json({ success: false, message: 'admin_token_not_configured' });
    if (!authHeader.startsWith('Bearer ') || authHeader.substring(7) !== expected) {
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }

    const { jti, token, license_key, reason } = req.body || {};
    if (!jti && !token && !license_key) {
      return res.status(400).json({ success: false, message: 'jti_or_token_or_license_key_required' });
    }

    let resolvedJti = jti || null;
    let exp = null;
    if (!resolvedJti && token) {
      const payload = parseJwtPayload(token);
      if (payload && payload.jti) {
        resolvedJti = payload.jti;
        exp = payload.exp || null;
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const defaultTtl = parseInt(process.env.DEFAULT_JTI_TTL_SECONDS || process.env.JTI_DEFAULT_TTL || '31536000', 10);
    const ttl = exp ? Math.max(1, exp - now) : defaultTtl;

    // Propagate to Redis if available (fast path for gateway enforcement)
    if (redisClient && resolvedJti) {
      try {
        await Promise.all([
          redisClient.set(`jti:${resolvedJti}`, '1', { EX: ttl }).catch(() => {}),
          redisClient.set(`admin_jti:${resolvedJti}`, '1', { EX: ttl }).catch(() => {})
        ]);
      } catch (e) {
        console.warn('Redis set failed for revoke:', e.message || e);
      }
    }

    // Forward to license server to persist revocation (if configured)
    if (process.env.LICENSE_SERVER_URL) {
      try {
        const target = license_key ? `${LICENSE_SERVER_URL}/api/v1/revoke` : `${LICENSE_SERVER_URL}/api/v1/admin/token/revoke`;
        const body = license_key ? { license_key } : { jti: resolvedJti, token: token, reason: reason || 'gateway_admin_revoke' };
        await fetch(target, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${expected}` },
          body: JSON.stringify(body),
        }).catch(() => {});
      } catch (e) {
        console.warn('Forward to license server failed:', e.message || e);
      }
    }

    return res.json({ success: true, jti: resolvedJti });
  } catch (err) {
    console.error('Admin revoke error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Mount Phase 2 endpoints (email verification, 2FA, OAuth, settings)
// Lightweight authenticate middleware used by mounted phase-2 endpoints
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = (req.get('Authorization') || '').toString();
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized', message: 'No token provided' });
    const token = authHeader.substring(7).trim();
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
    }

    if (payload && payload.jti) {
      try {
        const revoked = await isJtiRevoked(payload.jti);
        if (revoked) return res.status(403).json({ error: 'revoked', message: 'Token revoked' });
      } catch (e) {
        console.warn('auth middleware jti check failed', e && e.message ? e.message : e);
      }
    }

    // Attach full user record to req.user
    try {
      const r = await pool.query('SELECT id, email, first_name, tenant_id, created_at FROM users WHERE id = $1 OR email = $2', [payload.sub, payload.email]);
      if (!r.rows.length) return res.status(401).json({ error: 'unauthorized', message: 'User not found' });
      req.user = r.rows[0];
    } catch (e) {
      console.error('Auth middleware DB error', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'server_error', message: e.message });
    }

    return next();
  } catch (err) {
    console.error('authenticateToken error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'server_error' });
  }
};

try {
  require('./api-endpoints')(app, pool, authenticateToken);
} catch (e) {
  console.warn('api-endpoints not mounted:', e && e.message ? e.message : e);
}

// ============= SOCIAL ROUTES =============
const socialRoutes = require('./social-routes');
app.use('/api/social', socialRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "not_found", message: `${req.method} ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "server_error", message: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`\n✓ API Gateway running on http://localhost:${port}`);
  console.log(`  License Server: ${LICENSE_SERVER_URL}`);
  console.log(`  CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:3001"}\n`);
});

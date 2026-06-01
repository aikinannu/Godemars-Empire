# Godemar's Empire - Production Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Build](#frontend-build)
6. [Deployment](#deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Security & Compliance
- [ ] All environment variables are configured (no secrets in code)
- [ ] HTTPS/SSL certificates obtained and configured
- [ ] CORS whitelist configured (allowed domains only)
- [ ] Rate limiting verified working
- [ ] Password hashing algorithm current (bcrypt with rounds >= 10)
- [ ] JWT secrets are strong (>= 32 characters)
- [ ] Database credentials rotated
- [ ] Admin accounts created with strong passwords
- [ ] 2FA enabled for all admin accounts
- [ ] GDPR/Privacy policy reviewed and implemented

### Code Quality
- [ ] All tests passing (unit, integration)
- [ ] No console.log statements in production code
- [ ] Error messages don't leak sensitive info
- [ ] SQL injection prevention verified (parameterized queries)
- [ ] XSS prevention verified (input sanitization)
- [ ] CSRF tokens implemented
- [ ] Dependencies audited for vulnerabilities (`npm audit`)
- [ ] Dead code removed
- [ ] TypeScript compilation without errors (if using TS)

### Performance
- [ ] Frontend bundle size < 500KB (gzipped)
- [ ] Database queries optimized with proper indexes
- [ ] Redis caching configured (optional but recommended)
- [ ] CDN configured for static assets
- [ ] Database connection pooling configured
- [ ] API response times < 200ms

---

## Environment Configuration

### Create `.env` File

```bash
# Backend Server
NODE_ENV=production
PORT=3000
API_URL=https://api.godemars.com
APP_URL=https://godemars.com

# Database
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_NAME=godemar_production
DB_USER=db_user
DB_PASSWORD=<secure-password>
DB_POOL_SIZE=20

# JWT & Security
JWT_SECRET=<generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=<another-secure-random-string>
REFRESH_TOKEN_EXPIRY=30d
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# Email Service (Choose one)
EMAIL_PROVIDER=sendgrid  # or: mailgun, nodemailer
EMAIL_FROM=noreply@godemars.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
# OR for Mailgun:
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mail.godemars.com
# OR for Nodemailer:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret
MICROSOFT_CLIENT_ID=your-microsoft-app-id
MICROSOFT_CLIENT_SECRET=your-microsoft-app-secret
MICROSOFT_TENANT_ID=common  # or your tenant ID

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1-555-123-4567

# Redis (optional but recommended)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>

# Logging & Monitoring
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/xxxxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Admin Configuration
ADMIN_EMAIL=admin@godemars.com
INITIAL_ADMIN_PASSWORD=<temporary-password>  # Change on first login
```

### Store Securely
- Use environment variable management service (AWS Secrets Manager, HashiCorp Vault)
- Never commit `.env` to version control
- Rotate secrets every 90 days
- Different secrets for each environment (dev/staging/prod)

---

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE godemar_production;
```

### 2. Run Schema Migrations

```bash
# Connect to production database
psql -h your-host -U db_user -d godemar_production < schema-updates.sql

# Verify tables created
psql -h your-host -U db_user -d godemar_production -c "\dt"
```

### 3. Create Indexes

```sql
-- Email verification
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

-- 2FA
CREATE INDEX idx_two_factor_settings_user ON two_factor_settings(user_id);
CREATE INDEX idx_backup_codes_user ON backup_codes(user_id);

-- OAuth
CREATE INDEX idx_oauth_profiles_user ON oauth_profiles(user_id);
CREATE INDEX idx_oauth_profiles_provider ON oauth_profiles(provider, provider_id);

-- Security
CREATE INDEX idx_login_activity_user ON login_activity(user_id);
CREATE INDEX idx_login_activity_email ON login_activity(email);
CREATE INDEX idx_login_activity_status ON login_activity(status);
CREATE INDEX idx_login_activity_created ON login_activity(created_at);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
```

### 4. Create Initial Admin Account

```sql
INSERT INTO users (
  email, 
  username, 
  password, 
  email_verified, 
  role
) VALUES (
  'admin@godemars.com',
  'admin',
  '$2b$12$...',  -- hashed password from bcrypt
  true,
  'admin'
);
```

### 5. Enable Row-Level Security (optional but recommended)

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_settings ENABLE ROW LEVEL SECURITY;
-- Add RLS policies per table
```

---

## Backend Configuration

### 1. Install Dependencies

```bash
cd server
npm install
npm install @sendgrid/mail  # or mailgun/twilio as needed
```

### 2. Build Backend

```bash
npm run build  # if TypeScript
```

### 3. Verify Backend Tests

```bash
npm test
npm run test:coverage
```

### 4. Start Backend Service

```bash
npm start
# Should output: Server running on port 3000
```

---

## Frontend Build

### 1. Build Production Bundle

```bash
cd ../
npm run build
# Output: build/ directory ready for deployment
```

### 2. Verify Build Size

```bash
# Check bundle size
npm run build --report
# Should be < 500KB gzipped

# Analyze dependencies
npm ls
```

### 3. Run Production Preview

```bash
npm run preview
# Visit http://localhost:4173
```

---

## Deployment

### Option 1: AWS EC2 + PM2

```bash
# SSH into server
ssh ubuntu@your-server-ip

# Clone repository
git clone https://github.com/yourusername/godemar.git
cd godemar

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Set environment variables
nano .env  # paste your .env content

# Install dependencies
npm install

# Build frontend
npm run build

# Start with PM2
pm2 start "npm start" --name "godemar-backend"
pm2 start "npm run dev" --name "godemar-frontend"
pm2 save
pm2 startup

# Configure Nginx as reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
# Add proxy_pass http://localhost:3000;

# Enable HTTPS with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d godemars.com -d www.godemars.com
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and deploy
docker build -t godemar:latest .
docker run -d --env-file .env -p 3000:3000 godemar:latest
```

### Option 3: Vercel (Frontend) + Railway (Backend)

1. **Frontend (Vercel)**
   ```bash
   vercel deploy --prod
   ```

2. **Backend (Railway)**
   - Connect GitHub repo
   - Set environment variables
   - Deploy automatically

---

## Post-Deployment Verification

### Health Checks

```bash
# Test backend
curl https://api.godemars.com/health

# Test frontend
curl https://godemars.com

# Test email service
curl -X POST https://api.godemars.com/admin/test-email
```

### Security Verification

```bash
# Check SSL certificate
openssl s_client -connect godemars.com:443

# Check headers
curl -I https://godemars.com
# Should include: Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options

# OWASP Security Headers
# Use https://securityheaders.com for scoring
```

### Database Verification

```sql
-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify row counts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM email_verification_tokens;
SELECT COUNT(*) FROM two_factor_settings;
```

### Test Critical Flows

- [ ] User signup with email verification
- [ ] User login with password
- [ ] Password reset flow
- [ ] 2FA setup and verification
- [ ] Social OAuth login (test each provider)
- [ ] Admin dashboard access
- [ ] User settings page
- [ ] Rate limiting (test > 5 failed logins)
- [ ] Email notifications working

---

## Monitoring & Maintenance

### Logging Setup

```javascript
// Use structured logging
const logger = require('winston');

logger.info('User login', { userId: 123, timestamp: new Date() });
logger.error('Email send failed', { error: err.message });
```

### Alerts & Notifications

Set up alerts for:
- [ ] Failed login attempts > 10/hour
- [ ] API errors > 5% of requests
- [ ] Database connection pool exhaustion
- [ ] Email service failures
- [ ] OAuth provider downtime
- [ ] SSL certificate expiration (30 days before)
- [ ] Database disk usage > 80%

### Regular Maintenance

```bash
# Daily
- Monitor error logs
- Check API response times

# Weekly
- Review failed authentication attempts
- Check database performance
- Verify backups completed

# Monthly
- Rotate secrets
- Update dependencies (npm update)
- Run security audit (npm audit)
- Review admin logs
- Database maintenance (vacuum, analyze)

# Quarterly
- Full security audit
- Penetration testing
- Compliance review (GDPR, etc.)
```

### Backup Strategy

```bash
# Daily backups at 2 AM UTC
0 2 * * * pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > /backups/godemar_$(date +\%Y\%m\%d).sql.gz

# Keep backups for 30 days
find /backups -name "godemar_*.sql.gz" -mtime +30 -delete

# Test restore monthly
pg_restore /backups/godemar_backup.sql.gz
```

### Performance Tuning

```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email);

-- Monitor query performance
SELECT query, calls, total_time FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;
```

---

## Troubleshooting

### Common Issues

**Issue: Email not sending**
```bash
# Check email service credentials
curl -H "Authorization: Bearer $SENDGRID_API_KEY" https://api.sendgrid.com/v3/mail/send -d '...'

# Check logs
tail -f /var/log/app.log | grep -i email
```

**Issue: Database connection errors**
```bash
# Check connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check pool settings
SELECT * FROM pg_stat_activity;
```

**Issue: CORS errors**
```javascript
// Verify CORS configuration in api-gateway.js
app.use(cors({
  origin: [process.env.APP_URL],
  credentials: true
}));
```

---

## Support & Resources

- Documentation: https://docs.godemars.com
- Issue Tracker: https://github.com/yourusername/godemar/issues
- Security: security@godemars.com
- Status Page: https://status.godemars.com

---

**Last Updated:** 2026-05-31  
**Version:** 2.0  
**Deployment Status:** Ready for Production

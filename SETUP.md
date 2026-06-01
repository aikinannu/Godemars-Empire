# Central SaaS Platform - Development Setup

## Prerequisites
- Node.js 18+ and npm
- PHP 8.2+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

## Quick Start with Docker Compose

### 1. Copy environment files
```bash
cp .env.example .env.local
cp backend/.env.example backend/.env.local
cp backend/php-services/.env.example backend/php-services/.env.local
```

### 2. Start all services
```bash
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:3001
- API Gateway: http://localhost:3000
- License Server (PHP): http://localhost:8001

### 3. Run database migrations
```bash
npm run migrate
```

### 4. Seed initial data
```bash
npm run seed
```

## Manual Setup (Development)

### 1. Frontend Setup

```bash
cd GodemarsEmpire2

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000
VITE_SOCKET_IO_URL=http://localhost:3000
VITE_LICENSE_SERVER_URL=http://127.0.0.1:8001
EOF

# Start development server
npm run dev
```

Frontend runs on **http://localhost:3001**

### 2. Backend Setup - Node.js API Gateway

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://saas:password@localhost:5432/saas_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=30d
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx
S3_BUCKET=saas-dev
AWS_REGION=us-east-1
CORS_ORIGIN=http://localhost:3001
SOCKET_IO_CORS_ORIGIN=http://localhost:3001
SERVICE_REGISTRY_HOST=http://localhost:3001
EOF

# Install database tools
npm install -g @prisma/cli

# Create database and run migrations
npm run migrate:fresh

# Seed database
npm run seed

# Start API gateway
npm run dev
```

API Gateway runs on **http://localhost:3000**

### 3. PostgreSQL Setup

```bash
# Using Docker (easiest)
docker run -d \
  --name saas-postgres \
  -e POSTGRES_USER=saas \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=saas_db \
  -p 5432:5432 \
  postgres:15-alpine

# Or using Homebrew (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb -U postgres saas_db

# Create user
psql -U postgres -d saas_db << EOF
CREATE USER saas WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE saas_db TO saas;
EOF
```

### 4. Redis Setup

```bash
# Using Docker
docker run -d \
  --name saas-redis \
  -p 6379:6379 \
  redis:7-alpine

# Or using Homebrew (macOS)
brew install redis
brew services start redis
```

### 5. PHP Services Setup (Legacy Services)

```bash
cd backend/php-services

# Install Composer dependencies (if using Laravel or framework)
composer install

# Or use built-in PHP server for development
php -S 127.0.0.1:8001 -t license-server license-server/index.php

# For production, use:
php -S 0.0.0.0:8001 -t license-server license-server/index.php
```

PHP Services run on **http://localhost:8001**

## Database Schema Setup

### 1. Run migrations

```bash
cd backend
npm run migrate
```

### 2. Manual migration (if needed)

```bash
# Create tables
npm run prisma migrate dev --name init

# Push schema to database (development)
npm run prisma db push

# Generate Prisma client
npm run prisma generate
```

### 3. View database UI

```bash
npm run prisma studio
```

Opens Prisma Studio at **http://localhost:5555**

## Environment Variables Reference

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_IO_URL=http://localhost:3000
VITE_LICENSE_SERVER_URL=http://127.0.0.1:8001
VITE_ENV=development
```

### Backend (.env.local)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRY=30d
REFRESH_TOKEN_EXPIRY=90d

# Payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx

# AWS/Storage
S3_BUCKET=saas-dev
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:3001
SOCKET_IO_CORS_ORIGIN=http://localhost:3001

# Services
SERVICE_REGISTRY_HOST=http://localhost:3000
PHP_SERVICE_URL=http://localhost:8001
```

## Testing the Setup

### 1. Check services are running

```bash
# Frontend
curl http://localhost:3001

# API Gateway
curl http://localhost:3000/api/v1/health

# Database
psql -U saas -d saas_db -c "SELECT 1"

# Redis
redis-cli ping

# License Server
curl http://localhost:8001/api/v1/health
```

### 2. Test authentication flow

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

## Common Issues & Solutions

### PostgreSQL Connection Failed
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432 -U saas

# Check credentials
psql -h localhost -U saas -d saas_db
```

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Migrations Failing
```bash
# Reset database (careful!)
npm run migrate:reset

# View migration status
npm run prisma migrate status

# Create new migration after schema change
npm run prisma migrate dev --name <migration_name>
```

## Development Commands

### Frontend
```bash
npm run dev          # Start dev server (http://localhost:3001)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Check code style
```

### Backend
```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled code
npm run migrate      # Run database migrations
npm run seed         # Seed database with test data
npm test             # Run tests
npm run lint         # Check code style
npm run prisma studio # Open database UI
```

## Docker Compose Services

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Rebuild images
```bash
docker-compose build --no-cache
```

## Security - Local Development

⚠️ **Important**: These are development defaults. NEVER use these in production:

```
JWT_SECRET=development-secret-key-change-in-production
Database Password: password
Admin Email: admin@example.local
Admin Password: Admin@123456
```

For production, use:
- Strong, randomly generated secrets (32+ characters)
- Environment-specific vault (AWS Secrets Manager, HashiCorp Vault)
- SSL certificates (Let's Encrypt)
- Restricted network access
- Regular security audits

## Next Steps

1. **Frontend Development**: Start building React components in `src/`
2. **Backend Development**: Create API routes in `backend/src/routes/`
3. **Database Modeling**: Update Prisma schema in `backend/prisma/schema.prisma`
4. **Testing**: Write tests in `__tests__/` directories
5. **Deployment**: See `DEPLOYMENT.md` for production setup

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Commands](https://redis.io/commands/)

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f <service>`
2. Review environment variables
3. Verify all services are running
4. Check database connectivity

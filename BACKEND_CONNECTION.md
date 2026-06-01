# GodemarsEmpire2 - Backend Connection Setup

## Prerequisites

Make sure the GD Workflow backend services are running:

```bash
# Terminal 1: Auth Service (Port 3002)
cd packages/auth-service
npm run start

# Terminal 2: API Gateway (Port 3000)
cd packages/api-gateway
npm run start

# Terminal 3: Other services as needed
```

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env.local` and update if needed:

```bash
cp .env.example .env.local
```

Default configuration (.env.local):
```
VITE_LICENSE_SERVER_URL=http://localhost:3002
VITE_API_URL=http://localhost:3000/api/v1
```

### 2. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000` with automatic proxy routing to the backend.

## Backend API Endpoints

The frontend automatically connects to:

### Authentication Endpoints (via Auth Service - Port 3002)
- `POST /api/v1/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "User Name"
  }
  ```

- `POST /api/v1/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- `GET /api/v1/auth/me` - Get current user info
  ```
  Headers: Authorization: Bearer <token>
  ```

- `POST /api/v1/auth/change-password` - Change password
  ```json
  {
    "old_password": "current",
    "new_password": "newpassword"
  }
  ```

- `POST /api/v1/auth/reset-password` - Request password reset
  ```json
  {
    "email": "user@example.com"
  }
  ```

## Troubleshooting

### "Failed to fetch" Error

1. **Check backend is running**
   ```bash
   curl http://localhost:3002/health
   curl http://localhost:3000/health
   ```

2. **Check CORS headers**
   Backend should include:
   ```
   Access-Control-Allow-Origin: http://localhost:3000
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

3. **Check network tab in DevTools**
   - Look for the actual request being made
   - Check response status and headers
   - Verify endpoint URL matches backend

4. **Check backend logs**
   ```bash
   # Look for error messages in terminal where backend is running
   tail -f logs/combined.log
   ```

### CORS Errors

If you see CORS errors:

1. Ensure backend has CORS enabled:
   ```typescript
   app.use(cors()); // In auth-service
   ```

2. Vite proxy is configured in `vite.config.js`:
   ```javascript
   proxy: {
     '/api/v1': {
       target: 'http://localhost:3002',
       changeOrigin: true,
     },
   }
   ```

### Wrong Endpoint Errors

Make sure endpoints match the backend API:

- ❌ Old: `/api/v1/token` 
- ✅ New: `/api/v1/auth/login`

- ❌ Old: `/api/v1/userinfo`
- ✅ New: `/api/v1/auth/me`

## Backend Requirements

Your backend must implement these endpoints:

```typescript
// POST /api/v1/auth/register
{
  email: string,
  password: string (min 6 chars),
  name?: string
} → {
  access_token: string,
  token?: string,
  user?: { email, ... }
}

// POST /api/v1/auth/login
{
  email: string,
  password: string
} → {
  access_token: string,
  token?: string,
  user?: { email, ... }
}

// GET /api/v1/auth/me
headers: { Authorization: "Bearer <token>" }
→ { email, name, ... }
```

## Production Deployment

For production, update `.env.local`:

```
VITE_LICENSE_SERVER_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api/v1
```

Then build:

```bash
npm run build
npm run preview
```

## Debugging

Enable debug logging by adding this to your browser console:

```javascript
// See all API calls
localStorage.setItem('debug', 'gdwb:*');
```

Check browser console and DevTools Network tab for detailed request/response logs.

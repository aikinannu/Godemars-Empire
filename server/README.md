Local proxy for license-server

1. Install dependencies

```bash
cd server
npm install
```

2. Run the proxy (defaults to port 4000)

```bash
PORT=4000 LICENSE_SERVER_URL=http://localhost:8080 npm start
```

3. Configure the React app to use the proxy during development by adding to `.env`:

```
REACT_APP_LICENSE_PROXY_URL=http://localhost:4000
```

Notes:
- The proxy forwards `/api/license/validate` to `${LICENSE_SERVER_URL}/api/v1/validate`.
- It does not require Firebase or user authentication to validate a license key.
- For production, deploy this proxy behind HTTPS and secure it with CORS or access controls if needed.

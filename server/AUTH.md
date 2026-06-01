Authentication changes

This API gateway now issues short-lived JWT access tokens and long-lived refresh tokens stored in a secure, HttpOnly cookie.

Endpoints:

- `POST /api/v1/auth/register` — registers a user and returns an `access_token` in the JSON response. A secure HttpOnly `refresh_token` cookie is set.
- `POST /api/v1/auth/login` — returns `access_token` and sets HttpOnly `refresh_token` cookie.
- `POST /api/v1/auth/refresh` — exchanges the refresh cookie for a new `access_token` (rotates the refresh token and resets the cookie).
- `POST /api/v1/auth/logout` — revokes the refresh token and clears the cookie.
- `GET /api/v1/auth/me` — requires `Authorization: Bearer <access_token>` and returns user info.

Notes for frontend integration:

- When calling the API endpoints that rely on cookies (refresh/logout), the frontend must send credentials. With `fetch` use `credentials: 'include'`.
- The API CORS now allows credentials; ensure `VITE_API_URL` and `CORS_ORIGIN` are set appropriately.
- Access tokens are still returned in JSON and can be stored client-side (in memory) and used in `Authorization` headers for API requests.

Environment variables:

- `JWT_SECRET` — secret used to sign access tokens (set in production).
- `JWT_EXPIRY` — access token lifetime (default `15m`).
- `REFRESH_TOKEN_EXPIRY_DAYS` — refresh token lifetime in days (default `14`).
- `COOKIE_SECURE` — set `true` in production to enforce secure cookies.
- `COOKIE_SAMESITE` — SameSite attribute for the refresh cookie (default `none` to allow cross-site use; set to `lax`/`strict` to restrict).
- `COOKIE_DOMAIN` — optional cookie Domain attribute (useful when serving frontend and API from subdomains).

Security notes:
- `SameSite=None` requires `Secure` in modern browsers; ensure `COOKIE_SECURE=true` and serve over HTTPS in production. For local development you may leave `COOKIE_SECURE=false` and the gateway will warn when `SameSite=None` is used without secure cookies.

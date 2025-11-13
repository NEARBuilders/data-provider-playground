# gateway

This is based on this [Railway Template](https://github.com/railwayapp-templates/caddy-reverse-proxy/tree/main).

The main domain points to this proxy server, which then handles the following routing:

- `/api/*`: [API Server](../server) - API endpoints (RPC and REST/OpenAPI)
- `/*`: [Web App](../web) - Next.js frontend with ORPC client

## Railway Environment Variables

Set these environment variables on your Railway Gateway service (using Railway internal networking):

```bash
# Gateway Configuration
PORT=443

# Backend (Server) Service - Railway Internal
SERVER_DOMAIN=b2sserver.railway.internal
SERVER_PORT=8787

# Frontend (Web) Service - Railway Internal
WEB_DOMAIN=m
WEB_PORT=3000
```

**Note:** Port 8787 is the server default. Port 3000 is Railway's default for web services. Check your actual service settings if different.

## Architecture

```
User → ${domain}
         ↓
    Railway Gateway (Caddy)
         ↓
    ├─ /          → Web App (Next.js)
    └─ /api/*     → API Server (Hono + ORPC)
```

## Authentication Flow

With this gateway setup:
- Cookies are **same-site** (much more secure!)
- Auth works with `sameSite: "lax"` (prevents CSRF)
- No more cross-domain cookie issues
- Frontend and backend share the same origin

## Deployment

1. Deploy gateway service from this directory
2. Add custom domain
3. Update DNS to point to Railway gateway URL
4. Update backend and web services with new environment variables
5. Redeploy all services

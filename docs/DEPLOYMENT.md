# Deployment

## Production Build

```bash
# From the root directory
npm run build
```

This runs:
1. `cd backend && npm run build` — Compiles TypeScript to `backend/dist/`
2. `cd frontend && tsc -b && vite build` — Builds React app to `frontend/dist/`

## Production Start

```bash
# Set production environment
export NODE_ENV=production

# Start the backend server
cd backend && npm start
```

The API server starts on the configured port (default: 3001).

## Serving the Frontend

### Option 1: Static File Server (Recommended)

Serve `frontend/dist/` with any static file server (Nginx, Apache, Caddy, etc.) and proxy `/api` requests to the backend.

**Nginx example:**
```nginx
server {
    listen 80;
    server_name srimalibatik.com;

    root /path/to/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads/ {
        proxy_pass http://localhost:3001;
    }
}
```

### Option 2: Backend Serves Built Frontend

Modify `backend/src/app.ts` to serve `frontend/dist/` as static files in production.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API server port (default: 3001) |
| `DATABASE_URL` | No | SQLite path (default: `file:./data/srimali.db`) |
| `JWT_SECRET` | **Yes** | Secure random string for JWT signing |
| `FRONTEND_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |
| `NODE_ENV` | No | `development` or `production` |
| `ADMIN_USERNAME` | No | Default admin username (default: `admin`) |
| `ADMIN_PASSWORD` | No | Default admin password (default: `admin123`) |

## Database

The SQLite database is at `backend/prisma/data/srimali.db`. For production:

1. Run migrations: `cd backend && npx prisma migrate deploy`
2. Run seed: `cd backend && npm run db:seed`
3. Backup the `.db` file regularly

## Security Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Change `ADMIN_PASSWORD` from default
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (reverse proxy with Let's Encrypt)
- [ ] Restrict CORS `FRONTEND_URL` to actual domain
- [ ] Remove/rotate any hardcoded secrets

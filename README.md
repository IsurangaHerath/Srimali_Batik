# Srimali Batik

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A modern web application for **Srimali Batik** — a Sri Lankan batik store. Features a public storefront for browsing patterns and products, WhatsApp ordering integration, and a full admin panel for managing inventory.

---

## Features

- **Public Storefront** — Browse batik patterns and products with detail views
- **Color Selection** — View products by available colors for each pattern
- **WhatsApp Integration** — Place orders directly via WhatsApp from any product
- **Admin Panel** — JWT-authenticated admin dashboard
- **CRUD Management** — Manage patterns, products, colors, categories, and settings
- **File Uploads** — Upload product and pattern images via admin panel
- **Activity Log** — Track admin actions with timestamps
- **Responsive Design** — Tailwind CSS with dark mode support
- **Rate Limiting** — API rate limiting and login brute-force protection
- **SQLite Database** — Zero-configuration local storage via Prisma ORM

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router 7, TanStack React Query, Zustand, Framer Motion, Tailwind CSS, Radix UI |
| **Backend** | Node.js, Express 4, Prisma ORM, JWT, Zod, Helmet |
| **Database** | SQLite (local, file-based) |
| **Build** | Vite 6, TypeScript 5.6 |

---

## Project Structure

```
srimali-batik/
├── backend/                 # Express API server
│   ├── prisma/              # Schema, migrations, seed
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── lib/             # JWT, Prisma client, utilities
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # Public API routes
│   │   ├── routes/admin/    # Admin API routes
│   │   └── types/           # Shared TypeScript types
│   └── uploads/             # Uploaded images
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # UI, layout, admin, public components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client, utilities
│   │   ├── pages/           # Route pages (public + admin)
│   │   └── stores/          # Zustand state stores
│   └── public/              # Static assets
├── docs/                    # Documentation
├── package.json             # Root orchestrator
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# 1. Install root dependencies
npm install

# 2. Install backend dependencies
cd backend && npm install

# 3. Install frontend dependencies
cd ../frontend && npm install

# 4. Go back to root
cd ..
```

### Configuration

Copy the environment file and adjust as needed:

```bash
cp backend/.env.example backend/.env
```

Key configuration values in `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `DATABASE_URL` | SQLite database path | `file:./data/srimali.db` |
| `JWT_SECRET` | JWT signing secret | (change this) |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | (change this) |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |

### Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..
```

This creates the SQLite database and seeds it with initial data (including the default admin user).

### Running Locally

```bash
# From the root directory — starts both backend and frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:5173/admin

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

**Change these immediately after first login** by updating `backend/.env` and running the seed script again.

---

## Available Scripts

### Root

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend concurrently |
| `npm run build` | Build both backend and frontend for production |
| `npm start` | Start the backend in production mode |

### Backend (`cd backend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Run compiled production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run typecheck` | Run TypeScript type checking |

### Frontend (`cd frontend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |

---

## API Overview

All API endpoints are prefixed with `/api`.

### Public Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/verify` | Verify JWT token |
| GET | `/api/patterns` | List all patterns |
| GET | `/api/patterns/:slug` | Get pattern by slug |
| GET | `/api/products` | List all products |
| GET | `/api/products/:slug` | Get product by slug |
| GET | `/api/colors` | List all colors |
| GET | `/api/categories` | List all categories |
| GET | `/api/settings` | Get site settings |

### Admin Endpoints (JWT required)

| Method | Route | Description |
|--------|-------|-------------|
| CRUD | `/api/admin/patterns` | Manage patterns |
| CRUD | `/api/admin/products` | Manage products |
| CRUD | `/api/admin/colors` | Manage colors |
| CRUD | `/api/admin/categories` | Manage categories |
| CRUD | `/api/admin/settings` | Manage settings |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/activity` | Activity log |
| POST | `/api/admin/upload` | Upload image |

---

## Deployment

### Build

```bash
npm run build
```

- Backend compiles to `backend/dist/`
- Frontend compiles to `frontend/dist/`

### Production Start

```bash
NODE_ENV=production npm start
```

The backend serves the API on the configured port. The frontend's built files can be served by a static file server (e.g., Nginx) or the backend can be configured to serve them.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3001 in use | Change `PORT` in `backend/.env` |
| Port 5173 in use | Change port in `frontend/vite.config.ts` |
| Database errors | Delete `backend/prisma/data/srimali.db` and re-run migrations |
| Admin login fails | Run `npm run db:seed` to reset admin credentials |

---

## Project Architecture

See `docs/ARCHITECTURE.md` for detailed architecture documentation.

---

## License

MIT

---

## Acknowledgements

- Built with [React](https://react.dev/), [Express](https://expressjs.com/), and [Prisma](https://www.prisma.io/)
- UI components from [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

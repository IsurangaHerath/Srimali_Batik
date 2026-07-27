# Architecture

## Overview

Srimali Batik follows a modern two-tier architecture with a **React SPA frontend** and an **Express REST API backend**. The application runs entirely locally with a SQLite database.

```
┌──────────────┐      ┌──────────────┐      ┌──────────┐
│   Browser    │ ───> │  Express API │ ───> │  SQLite  │
│  (React SPA) │      │  (Port 3001) │      │   (DB)   │
└──────────────┘      └──────────────┘      └──────────┘
       │                      │
       │                      ├── Prisma ORM
       │                      ├── JWT Auth
       │                      └── File Uploads
       │
       └── Vite Dev Server (Port 5173)
           └── Proxies /api → localhost:3001
```

## Frontend Architecture

The frontend is a single-page application built with React 19 and React Router 7.

### State Management

- **Zustand** stores for: auth state, theme preferences, upload state
- **TanStack React Query** for server data fetching, caching, and mutations

### Routing Structure

```
/                   → PublicLayout → HomePage
/patterns           → PublicLayout → PatternsPage
/patterns/:slug     → PublicLayout → PatternDetailPage
/admin/login        → LoginPage
/admin              → AuthGuard → AdminLayout
  /admin            → DashboardPage
  /admin/patterns   → AdminPatternsPage
  /admin/products   → AdminProductsPage
  /admin/colors     → AdminColorsPage
  /admin/settings   → AdminSettingsPage
  /admin/activity   → AdminActivityPage
*                   → NotFoundPage
```

### Component Hierarchy

```
App
├── Toaster
├── Routes
│   ├── PublicLayout
│   │   ├── HomePage
│   │   ├── PatternsPage
│   │   ├── PatternDetailPage
│   │   ├── Lightbox
│   │   └── PatternCard
│   ├── LoginPage
│   ├── AuthGuard → AdminLayout
│   │   ├── DashboardPage
│   │   ├── AdminPatternsPage
│   │   ├── AdminProductsPage
│   │   ├── AdminColorsPage
│   │   ├── AdminSettingsPage
│   │   ├── AdminActivityPage
│   │   └── ImageUpload
│   └── NotFoundPage
```

### UI Components

14 reusable UI components built on Radix UI primitives: button, card, dialog, alert-dialog, select, switch, input, textarea, label, badge, table, skeleton, toast, toaster.

## Backend Architecture

The backend is an Express 4 application organized into routes, middleware, and libraries.

### Request Lifecycle

```
Request → Helmet → CORS → Morgan → JSON Parser → Rate Limiter
  → Route Handler → Prisma → Response
  ↓ (if error)
  Error Handler → JSON Error Response
```

### Route Organization

- **Public routes**: Auth, patterns, products, colors, categories, settings
- **Admin routes** (JWT-protected): Same entities plus stats, activity, upload

### Key Design Decisions

- **Prisma ORM**: Type-safe database access with auto-generated client
- **Zod validation**: Request body validation on all write endpoints
- **JWT tokens**: Stateless authentication for admin panel
- **Rate limiting**: 100 requests/15min general, 5 requests/min for login
- **Helmet**: Security headers (CSP, XSS protection, etc.)
- **UUID**: Primary keys for all database records
- **Composable middleware**: Auth guard and error handler are reusable

## Data Flow

1. Admin creates/updates data via admin panel
2. Frontend sends mutation to admin API endpoint with JWT
3. Backend validates request (Zod), processes via Prisma
4. Response is sent back; React Query invalidates cache
5. Public storefront fetches fresh data automatically

# Repository Analysis — Srimali Batik

> Generated on 2026-07-27

## 1. Project Overview

**Srimali Batik** is a web application for a batik store. It has a **public storefront** (product browsing, pattern viewing, WhatsApp ordering) and an **admin panel** (manage patterns, products, colors, categories, settings).

The project is in a **mid-migration state** — it contains two parallel codebases:

| Layer | Old (Abandoned) | New (Active) |
|-------|-----------------|--------------|
| Backend | `src/server/` — Express + better-sqlite3 + WebSocket, port 3000 | `backend/` — Express + Prisma + JWT + Multer, port 3001 |
| Frontend | `src/public/` — Vanilla TypeScript + modular CSS, built by root `vite.config.ts` | `frontend/` — React 19 + Vite + Tailwind CSS, built by `frontend/vite.config.ts` |
| Database | `data/srimali.db` — Direct SQLite | `backend/prisma/data/srimali.db` — Prisma-managed SQLite |

---

## 2. Current Directory Structure

```
D:\Projects\Srimali Batik\
├── .env.example
├── .gitignore
├── package.json                  # Root orchestrator (concurrently)
├── package-lock.json
├── prompt.txt                    # AI agent instructions
├── README.md                     # Outdated — describes old architecture
├── tsconfig.json                 # Points to OLD code (src/)
├── tsconfig.server.json          # Points to OLD server (src/server/)
├── vite.config.ts                # Builds OLD frontend (src/public/) — UNUSED
│
├── backend/                      # ACTIVE — New backend (Prisma + Express)
│   ├── .env                      # Contains hardcoded secrets — COMMITTED (unsafe)
│   ├── backend-test-err.log      # EMPTY — DELETE
│   ├── backend-test.log          # EMPTY — DELETE
│   ├── package.json
│   ├── tsconfig.json
│   ├── data/                     # EMPTY — DELETE
│   ├── uploads/                  # Uploaded images (cover.jpg, logo.png)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   ├── data/srimali.db
│   │   └── migrations/
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── config/env.ts
│       ├── lib/jwt.ts, prisma.ts, utils.ts
│       ├── middleware/auth.ts, errorHandler.ts
│       ├── routes/ (auth, categories, colors, patterns, products, settings)
│       ├── routes/admin/ (activity, categories, colors, patterns, products, settings, stats, upload)
│       ├── services/            # EMPTY — DELETE
│       └── types/index.ts
│
├── frontend/                     # ACTIVE — New React frontend
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── public/
│   │   ├── cover.jpg
│   │   └── logo.png
│   ├── dist/                    # Built output — should be gitignored
│   └── src/
│       ├── App.tsx, main.tsx, index.css
│       ├── lib/api.ts, utils.ts
│       ├── hooks/use-data.ts, use-toast.ts, use-utils.ts
│       ├── stores/authStore.ts, themeStore.ts, uploadStore.ts
│       ├── components/admin/, layout/, public/, ui/ (14 shadcn components)
│       └── pages/public/, admin/
│
├── src/                          # ABANDONED — Old codebase
│   ├── public/                   # Old vanilla TS frontend
│   │   ├── index.html, admin.html
│   │   ├── assets/ (Cover photo.png, logo 1.png)
│   │   ├── src/admin/, shared/, storefront/
│   │   └── styles/ (14 CSS files — tokens, components, layouts, pages)
│   └── server/                   # Old Express backend
│       ├── index.ts, db.ts, broadcast.ts
│       ├── middleware/, routes/, schemas/
│       └── db/                   # EMPTY
│
├── public/                       # ABANDONED — Old built output / staging
│   ├── index.html, admin.html
│   ├── css/styles.css            # 2403 lines — UNUSED monolith
│   ├── assets/                   # EMPTY
│   └── dist/                     # Built from src/public/
│
├── data/                         # ABANDONED — Old SQLite DB
│   ├── srimali.db
│   ├── srimali.db-shm
│   └── srimali.db-wal
│
├── routes/                       # EMPTY — DELETE
│
├── dist/                         # ABANDONED — Compiled old server code
│   └── server/ (21 files: .js, .d.ts, .d.ts.map)
│
└── .kilo/                        # AI agent working directory — should be gitignored
```

---

## 3. Issues Found

### 🔴 Structural Issues (4)

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Two parallel codebases** — Old (`src/` + `public/` + `data/`) and New (`backend/` + `frontend/`) co-exist | Confusion, wasted disk space, build conflicts |
| 2 | **Port conflict** — Both `vite.config.ts` (root) and `frontend/vite.config.ts` use port 5173 | Cannot run both simultaneously |
| 3 | **Root `tsconfig.json`** — Still points to old `src/` code, declares path aliases for old frontend | Misleading, unused by new code |
| 4 | **Root `vite.config.ts`** — Configures build for old `src/public/` frontend | Unused — new frontend has its own config |

### 🔴 Security Issues (5)

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | **Hardcoded JWT secret** | `backend/.env` — `JWT_SECRET="dev-secret-change-in-production-min-32-chars!!"` | High |
| 2 | **Hardcoded admin credentials** | `backend/.env` — `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=admin123` | High |
| 3 | **Hardcoded credentials in seed** | `backend/prisma/seed.ts` — password `'password123'` | High |
| 4 | **Fallback secrets in source code** | `backend/src/config/env.ts`, `backend/src/lib/jwt.ts` — same hardcoded secret as fallback | High |
| 5 | **`.env` file committed** | `backend/.env` is tracked by git — `.env` pattern only in root `.gitignore`, not in `backend/` | High |

### 🟡 Empty / Unused Directories (7)

| Directory | Action |
|-----------|--------|
| `routes/` | DELETE — empty |
| `data/` | DELETE — old DB (already gitignored) |
| `backend/data/` | DELETE — empty |
| `backend/src/services/` | DELETE — empty |
| `src/server/db/` | DELETE — empty |
| `src/public/styles/tokens/` | DELETE — empty |
| `public/assets/` | DELETE — empty |

### 🟡 Empty Log Files (2)

| File | Action |
|------|--------|
| `backend/backend-test.log` | DELETE |
| `backend/backend-test-err.log` | DELETE |

### 🟡 Orphaned / Unused Files (3 groups)

| Files | Reason | Action |
|-------|--------|--------|
| `public/` directory (all contents) | Old static frontend — not served by either backend | DELETE |
| `public/css/styles.css` (2403 lines) | Not imported by any active HTML page | DELETE |
| `dist/server/` (21 files) | Compiled old server — superseded by `backend/` | DELETE |

### 🟡 Duplicate Image Files

| Image | Locations |
|-------|-----------|
| `cover` / `Cover photo` | `backend/uploads/cover.jpg`, `frontend/public/cover.jpg`, `src/public/assets/Cover photo.png`, `public/dist/Cover photo.png` |
| `logo` | `backend/uploads/logo.png`, `frontend/public/logo.png`, `src/public/assets/logo 1.png`, `public/dist/logo 1.png` |

**Recommendation**: Keep `frontend/public/cover.jpg` and `frontend/public/logo.png` as the source-of-truth. Keep `backend/uploads/` copies for the API. Delete old PNG variants.

### 🟡 `.gitignore` Issues

| Missing Entry | Why |
|---------------|-----|
| `frontend/dist/` | Built output — should not be tracked |
| `.kilo/` | AI agent working directory |
| `backend/.env` | Contains secrets — only root `.env` is ignored |
| `backend/data/` | Empty directory — but should be listed if used |

### 🟡 Outdated README

The current `README.md` describes the **old** architecture (`data/`, `public/`, `src/`, port 3000). It does not mention the new React frontend, Prisma backend, JWT auth, or admin features.

---

## 4. Dependency Analysis

### Root `package.json`

| Package | Type | Verdict |
|---------|------|---------|
| `concurrently` ^9.0.0 | devDependency | **KEEP** — required for `npm run dev` |

### `backend/package.json`

| Package | Type | Verdict |
|---------|------|---------|
| `@prisma/client` ^5.22.0 | dependency | **KEEP** — ORM |
| `bcryptjs` ^2.4.3 | dependency | **KEEP** — password hashing |
| `cors` ^2.8.5 | dependency | **KEEP** — CORS |
| `dotenv` ^17.4.2 | dependency | **KEEP** — env loading |
| `express` ^4.21.0 | dependency | **KEEP** — web framework |
| `express-rate-limit` ^7.4.0 | dependency | **KEEP** — rate limiting |
| `helmet` ^7.1.0 | dependency | **KEEP** — security headers |
| `jsonwebtoken` ^9.0.2 | dependency | **KEEP** — JWT auth |
| `morgan` ^1.10.0 | dependency | **KEEP** — HTTP logging |
| `multer` ^1.4.5-lts.1 | dependency | **KEEP** — file uploads |
| `uuid` ^10.0.0 | dependency | **KEEP** — UUID generation |
| `zod` ^3.23.0 | dependency | **KEEP** — validation |
| `prisma` ^5.22.0 | devDependency | **KEEP** — schema management |
| `tsx` ^4.19.0 | devDependency | **KEEP** — TS execution |
| `typescript` ^5.6.0 | devDependency | **KEEP** |
| `@types/*` (8) | devDependency | **KEEP** — type definitions |

**Verdict**: All backend dependencies are actively used.

### `frontend/package.json`

| Package | Type | Verdict |
|---------|------|---------|
| `@hookform/resolvers` ^3.9.0 | dependency | **KEEP** — form validation |
| `@radix-ui/*` (8) | dependency | **KEEP** — UI primitives |
| `@tanstack/react-query` ^5.56.0 | dependency | **KEEP** — data fetching |
| `axios` ^1.7.7 | dependency | **KEEP** — HTTP client |
| `class-variance-authority` ^0.7.0 | dependency | **KEEP** — component variants |
| `clsx` ^2.1.1 | dependency | **KEEP** — className utility |
| `framer-motion` ^11.11.0 | dependency | **KEEP** — animations |
| `lucide-react` ^0.447.0 | dependency | **KEEP** — icons |
| `react` ^19.0.0-rc | dependency | **KEEP** — UI library |
| `react-dom` ^19.0.0-rc | dependency | **KEEP** |
| `react-hook-form` ^7.53.0 | dependency | **KEEP** — forms |
| `react-helmet-async` ^2.0.5 | dependency | **KEEP** — SEO/head |
| `react-router-dom` ^7.0.0 | dependency | **KEEP** — routing |
| `tailwind-merge` ^2.5.0 | dependency | **KEEP** — Tailwind class merging |
| `tailwindcss-animate` ^1.0.7 | dependency | **KEEP** — Tailwind animations |
| `zod` ^3.23.0 | dependency | **KEEP** — validation |
| `zustand` ^5.0.0 | dependency | **KEEP** — state management |
| `@vitejs/plugin-react` ^4.3.0 | devDependency | **KEEP** |
| `autoprefixer` ^10.4.20 | devDependency | **KEEP** |
| `postcss` ^8.4.47 | devDependency | **KEEP** |
| `tailwindcss` ^3.4.13 | devDependency | **KEEP** |
| `typescript` ^5.6.0 | devDependency | **KEEP** |
| `vite` ^6.0.0 | devDependency | **KEEP** |

**Verdict**: All frontend dependencies are actively used. No removals recommended.

---

## 5. Abandoned Code — What to Do

### Old Backend (`src/server/`) — DELETE

- **Files**: `index.ts`, `db.ts`, `broadcast.ts`, 2 middleware, 3 routes, 3 schemas, 1 empty dir
- **Compiled**: `dist/server/` (21 files)
- **Why safe**: The new `backend/` covers all the same functionality plus more (auth, categories, settings, uploads, rate limiting, security headers)
- **Dependencies**: The old server's dependencies (better-sqlite3, ws, etc.) are NOT in any `package.json` — old code used different dependencies

### Old Frontend Source (`src/public/`) — DELETE

- **Files**: 2 HTML, 2 images, 14 CSS, ~20 TypeScript source files
- **Why safe**: The new `frontend/` covers all functionality with a modern React SPA
- **Built output**: `public/dist/` can also be deleted

### Old Static Frontend (`public/`) — DELETE

- **Files**: `index.html`, `admin.html`, `css/styles.css` (2403 lines, unused), empty `assets/`
- **Why safe**: Not served by either backend. The old backend served `src/public/` via Vite; the new backend serves just the API

### Old SQLite Database (`data/`) — KEEP (for reference) or DELETE

- **Why keep**: Contains the actual product/pattern/color data that may not have been migrated to the new DB
- **Recommendation**: Keep temporarily, then DELETE after verifying data migration

### Root Config Files — DELETE or UPDATE

| File | Action |
|------|--------|
| `vite.config.ts` (root) | DELETE — not used by any active workflow |
| `tsconfig.json` (root) | DELETE — old code references |
| `tsconfig.server.json` | DELETE — old code references |

---

## 6. Summary

| Category | Count |
|----------|-------|
| Structural issues | 4 |
| Security issues | 5 |
| Empty directories to delete | 7 |
| Empty log files to delete | 2 |
| Orphaned directories to delete | 5 |
| Duplicate image files | 4 |
| `.gitignore` improvements needed | 4 |
| Dependencies to remove | 0 |

# Implementation Plan — Srimali Batik Cleanup

> Generated on 2026-07-27

This plan outlines the incremental cleanup of the Srimali Batik repository. Each step is designed to be safe, reversible, and independently verifiable.

---

## Phase 1: Abandoned Code Removal (Safe Deletions)

### Step 1.1 — Remove Empty Directories

| Directory | Reason | Safe? |
|-----------|--------|-------|
| `routes/` | Completely empty | ✅ Yes — no content |
| `backend/data/` | Empty (DB is in `backend/prisma/data/`) | ✅ Yes — no content |
| `backend/src/services/` | Empty | ✅ Yes — no content |
| `src/server/db/` | Empty | ✅ Yes — no content |
| `src/public/styles/tokens/` | Empty (tokens are in `tokens.css` one level up) | ✅ Yes — no content |
| `public/assets/` | Empty | ✅ Yes — no content |

### Step 1.2 — Remove Empty Log Files

| File | Reason | Safe? |
|------|--------|-------|
| `backend/backend-test.log` | 0 bytes | ✅ Yes |
| `backend/backend-test-err.log` | 0 bytes | ✅ Yes |

### Step 1.3 — Remove Root Vite Config (Old Frontend Builder)

**File**: `vite.config.ts` (root)

**Why safe**: 
- The old frontend (`src/public/`) is abandoned — superseded by `frontend/`
- `npm run dev` uses `frontend/vite.config.ts`, not the root one
- The root config conflicts on port 5173
- No script references the root config (root `package.json` has no vite scripts)

**Check**: Verify `npm run dev` runs `cd frontend && npm run dev`

### Step 1.4 — Remove Root TypeScript Configs (Old Code References)

**Files**: `tsconfig.json` (root), `tsconfig.server.json`

**Why safe**:
- Both reference old `src/` code (abandoned)
- The new backend uses `backend/tsconfig.json`
- The new frontend uses `frontend/tsconfig.json`
- No active build script depends on these configs

**Check**: Root `package.json` has no `tsc` scripts

### Step 1.5 — Remove Old Backend (`src/server/`)

**Files**: Entire `src/server/` directory

**Why safe**:
- Superseded by `backend/` which has auth, categories, settings, uploads, Prisma, rate limiting, Helmet
- Compiled output `dist/server/` is also unused
- Old server's dependencies (`better-sqlite3`, `ws`) are not in any active `package.json`

**Check**: Verify `backend/` has equivalent routes (products, patterns, colors) plus more

### Step 1.6 — Remove Old Frontend Source (`src/public/`)

**Files**: Entire `src/public/` directory

**Why safe**:
- Superseded by `frontend/` React SPA
- No active workflow references these files
- Root `vite.config.ts` (being removed in Step 1.3) was the only builder pointing here

**Note**: Keep `src/public/assets/Cover photo.png` and `src/public/assets/logo 1.png` temporarily — check if referenced by any remaining code

### Step 1.7 — Remove Old Static Frontend (`public/`)

**Files**: Entire `public/` directory

**Why safe**:
- Not served by either backend
- `public/css/styles.css` (2403 lines) is not imported by any active page
- Old built output in `public/dist/` is not used
- The new frontend is served by Vite dev server and built to `frontend/dist/`

### Step 1.8 — Remove Old Server Compiled Output (`dist/server/`)

**Files**: Entire `dist/server/` directory (21 files)

**Why safe**:
- Compiled output of old `src/server/` (being removed in Step 1.5)
- "dist/" is already in `.gitignore`, but files may still be on disk

### Step 1.9 — Remove Old SQLite Database (`data/`)

**Files**: `data/srimali.db`, `data/srimali.db-shm`, `data/srimali.db-wal`

**Why safe**:
- The new backend uses `backend/prisma/data/srimali.db`
- Old DB is already in `.gitignore`
- **⚠️ Verify data migration**: Before deleting, ensure the old data has been migrated to the new database

---

## Phase 2: Configuration Cleanup

### Step 2.1 — Update `.gitignore`

**Changes**:
```gitignore
# Add missing entries
backend/.env
frontend/dist/
.kilo/
```

**Why**: 
- `backend/.env` contains secrets (currently committed!)
- `frontend/dist/` is built output
- `.kilo/` is an AI agent working directory

### Step 2.2 — Remove `backend/.env` from Git Tracking

**Why**: The `.env` file contains hardcoded credentials. It should NOT be committed.

**Action**: 
1. Add `backend/.env` to `.gitignore`
2. Create `backend/.env.example` with placeholder values
3. Remove the file from git tracking (`git rm --cached backend/.env`)

### Step 2.3 — Create `backend/.env.example`

```env
DATABASE_URL="file:./data/srimali.db"
JWT_SECRET="change-this-to-a-secure-random-string"
PORT=3001
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"
```

### Step 2.4 — Simplify Root `package.json`

- Keep concurrent scripts as-is (they work correctly)
- Update description if needed
- No functional changes

---

## Phase 3: Documentation Rewrite

### Step 3.1 — Rewrite `README.md`

Complete rewrite to reflect the **new** architecture:
- Project overview
- Technology stack (React 19, Tailwind, Prisma, Express, Vite)
- Accurate folder structure (only active directories)
- Installation steps (npm install in root, backend, frontend)
- Configuration (backend/.env)
- Running locally (npm run dev)
- Build / deployment
- API overview
- Admin panel
- Troubleshooting
- License

### Step 3.2 — Create `/docs/` Folder

| Document | Content |
|----------|---------|
| `docs/ARCHITECTURE.md` | System architecture, component relationships |
| `docs/FOLDER_STRUCTURE.md` | Detailed folder breakdown |
| `docs/DATABASE.md` | Prisma schema, models, seed |
| `docs/API.md` | All API endpoints, request/response formats |
| `docs/DEPLOYMENT.md` | Production build and deployment |
| `docs/DEVELOPMENT_GUIDE.md` | Dev workflow, conventions |
| `docs/CODING_STANDARDS.md` | Code style, naming, patterns |

---

## Phase 4: Security Hardening

### Step 4.1 — Remove Hardcoded Fallback Secrets from Source

**Files**: `backend/src/config/env.ts`, `backend/src/lib/jwt.ts`

**Action**: Remove fallback hardcoded secret. If env var is not set, throw a clear error at startup.

### Step 4.2 — Remove Hardcoded Credentials from Seed

**File**: `backend/prisma/seed.ts`

**Action**: Replace hardcoded admin password with environment variable or mark as placeholder with clear comment.

---

## Phase 5: Final Report

### Step 5.1 — Create `CLEANUP_REPORT.md`

Document every change made:
- ✅ Files deleted
- ✅ Files renamed
- ✅ Files moved
- ✅ Files merged
- ✅ Documentation created
- ✅ Dependencies removed
- ⬜ Remaining technical debt
- ⬜ Recommended future improvements

---

## Execution Order

```
Phase 1: Abandoned Code Removal
├── 1.1 Empty directories      — delete 6 dirs
├── 1.2 Empty log files        — delete 2 files
├── 1.3 Root vite.config.ts    — delete 1 file
├── 1.4 Root tsconfigs         — delete 2 files
├── 1.5 Old backend            — delete src/server/
├── 1.6 Old frontend source    — delete src/public/
├── 1.7 Old static frontend    — delete public/
├── 1.8 Old compiled output    — delete dist/server/
└── 1.9 Old database           — delete data/ (after verification)

Phase 2: Configuration Cleanup
├── 2.1 .gitignore update
├── 2.2 Un-track backend/.env
├── 2.3 Create .env.example
└── 2.4 Root package.json tidy

Phase 3: Documentation
├── 3.1 Rewrite README.md
└── 3.2 Create docs/ folder (7 docs)

Phase 4: Security
├── 4.1 Remove fallback secrets
└── 4.2 Seed credentials cleanup

Phase 5: Final Report
└── 5.1 CLEANUP_REPORT.md
```

---

## Rollback Plan

Every deletion is done in small, logical commits. To roll back:

```bash
git revert <commit-hash>
```

No large-scale rewrites are performed — only deletions and documentation changes. Business logic is never modified.

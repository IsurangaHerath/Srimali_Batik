# Development Guide

## Prerequisites

- Node.js >= 18
- npm >= 9
- Git

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd srimali-batik

# Install all dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Configure environment
cp backend/.env.example backend/.env

# Initialize database
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..
```

## Development Workflow

```bash
# Start both backend and frontend
npm run dev
```

This runs both servers concurrently:
- **Backend** (port 3001) — `tsx watch` for auto-restart on changes
- **Frontend** (port 5173) — Vite dev server with HMR

### Running Individually

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## Code Quality

```bash
# Type checking
cd backend && npm run typecheck
cd frontend && npm run typecheck
```

The project uses TypeScript with strict mode enabled. Run `typecheck` before committing to catch type errors.

## Database Changes

```bash
cd backend

# After modifying schema.prisma:
npx prisma migrate dev --name describe-change

# Regenerate Prisma client without migration:
npx prisma generate

# Seed/Re-seed database:
npx prisma db seed

# Browse database GUI:
npx prisma studio
```

## Adding a New Entity

1. Add model to `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add-entity`
3. Create API routes in `backend/src/routes/` and `backend/src/routes/admin/`
4. Register routes in `backend/src/app.ts`
5. Create React Query hooks in `frontend/src/hooks/use-data.ts`
6. Create admin pages in `frontend/src/pages/admin/`
7. Add route to `frontend/src/App.tsx`

## Code Conventions

- **Imports**: External → Internal, absolute → relative
- **Naming**: PascalCase for components/types, camelCase for functions/variables
- **Components**: Small, focused, single responsibility
- **API routes**: Zod validation on all write endpoints
- **Error handling**: Use the centralized error handler, never `console.error` in routes
- **State**: React Query for server state, Zustand for client state
- **CSS**: Tailwind utility classes, custom CSS only in `frontend/src/index.css`

## Project Scripts

### Root

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers |
| `npm run build` | Build both projects |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

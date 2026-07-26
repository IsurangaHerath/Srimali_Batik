# Srimali Batik — Full Rebuild Plan

## Context

Srimali Batik is a local-only Express + SQLite + WebSocket showcase app for a Sri Lankan batik business. Two pages: public storefront (`/`) and admin panel (`/admin`). No authentication, no cloud services, no build step.

**Current state:** ~10 source files, ~2,400 lines of monolithic CSS, vanilla JS, no input validation, no error middleware, duplicate CRUD patterns, XSS protection only in admin (not storefront), no tests, no TypeScript.

**Goal:** Full production-grade rebuild — TypeScript, Vite build pipeline, zod validation, error middleware, rate limiting, feature-based architecture, modern UI matching Linear/Stripe/Vercel quality, full accessibility, loading/error/empty states, reorganized folder structure. Preserve all business functionality.

---

## Architecture Decisions

### 1. Build Pipeline
- **Backend:** TypeScript compiled with `tsc` (no bundler needed for server)
- **Frontend:** Vite builds into `public/dist/`, Express serves static files from there
- **Dev mode:** `npm run dev` runs nodemon for server + Vite dev server with HMR
- **Prod mode:** `npm run build` then `npm start` serves built assets

### 2. Folder Structure

```
srimali-batik/
├── src/
│   ├── server/
│   │   ├── index.ts              # Express app + server bootstrap
│   │   ├── db.ts                 # SQLite connection + table init
│   │   ├── broadcast.ts          # WebSocket client registry + broadcast
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts   # Global error handler
│   │   │   └── rateLimiter.ts    # Rate limiting middleware
│   │   ├── routes/
│   │   │   ├── patterns.ts
│   │   │   ├── products.ts
│   │   │   └── colors.ts
│   │   └── schemas/
│   │       ├── pattern.schema.ts  # zod schemas for validation
│   │       ├── product.schema.ts
│   │       └── color.schema.ts
│   └── public/                    # Vite source (built to public/dist/)
│       ├── index.html             # Storefront entry
│       ├── admin.html             # Admin entry
│       ├── src/
│       │   ├── shared/
│       │   │   ├── types.ts       # Shared TypeScript types
│       │   │   ├── api.ts         # API client (fetch wrapper)
│       │   │   ├── constants.ts   # Config, event types, paths
│       │   │   ├── utils.ts       # ID generation, URL validation, etc.
│       │   │   └── websocket.ts   # WebSocket manager
│       │   ├── storefront/
│       │   │   ├── index.ts       # Storefront bootstrap
│       │   │   ├── theme.ts       # Theme toggle logic
│       │   │   ├── navigation.ts  # Nav, scroll, routing
│       │   │   └── render/
│       │   │       ├── patterns.ts
│       │   │       ├── products.ts
│       │   │       ├── colors.ts
│       │   │       ├── lightbox.ts
│       │   │       └── toast.ts
│       │   └── admin/
│       │       ├── index.ts       # Admin bootstrap
│       │       ├── tabs.ts        # Tab management
│       │       ├── modals.ts      # Modal open/close logic
│       │       └── render/
│       │           ├── patterns.ts
│       │           ├── products.ts
│       │           └── colors.ts
│       └── styles/
│           ├── tokens.css         # CSS custom properties (design tokens)
│           ├── base.css           # Reset, typography, global
│           ├── components/
│           │   ├── buttons.css
│           │   ├── cards.css
│           │   ├── forms.css
│           │   ├── modals.css
│           │   ├── toasts.css
│           │   ├── skeleton.css
│           │   └── lightbox.css
│           ├── layouts/
│           │   ├── navbar.css
│           │   ├── footer.css
│           │   └── grid.css
│           └── pages/
│               ├── storefront.css
│               └── admin.css
├── data/                          # SQLite DB (gitignored)
├── public/                        # Built assets (Vite output, gitignored)
├── dist/                          # Compiled server (gitignored)
├── package.json
├── tsconfig.json
├── tsconfig.server.json
├── vite.config.ts
└── README.md
```

### 3. Technology Choices

| Layer | Choice | Why |
|-------|--------|-----|
| Backend runtime | Node.js + Express | Keep existing, add TS |
| Database | better-sqlite3 | Keep existing |
| Real-time | ws | Keep existing |
| Validation | zod | Request input validation, type inference |
| Frontend build | Vite | Fast HMR, TS support, asset optimization |
| Language | TypeScript | Type safety across full stack |
| CSS | Vanilla CSS + custom properties | No framework needed; design tokens via CSS vars |
| State | In-memory + WebSocket sync | Keep existing pattern, improve structure |

### 4. What Stays the Same (Business Logic)

- Patterns → Products → Colors data model
- WhatsApp ordering flow (wa.me link with pre-filled message)
- Local-only architecture (no auth, no cloud)
- SQLite storage at `data/srimali.db`
- WebSocket real-time sync between tabs
- Dark/light theme toggle with localStorage persistence
- Image URL storage (not file upload)
- ID generation client-side for new records

### 5. What Changes

- All JS → TypeScript with proper types
- Monolithic CSS → design token system + component CSS
- No input validation → zod schemas on all API routes
- No error handling → global error middleware
- No rate limiting → express-rate-limit
- Duplicate CRUD code → shared route helpers
- No loading states → skeleton loaders on all data fetches
- XSS risk in storefront → consistent escaping
- No accessibility audit → WCAG 2.1 AA compliance
- Flat folder → feature-based structure
- No tests → basic API route tests

---

## Implementation Tasks

### Phase 1 — Project Scaffolding

1. Update `package.json`:
   - Add `typescript`, `@types/node`, `@types/express`, `@types/ws`, `@types/cors`
   - Add `vite`, `zod`, `express-rate-limit`, `morgan`, `@types/morgan`
   - Add scripts: `build`, `dev`, `start`, `build:server`, `build:client`
2. Create `tsconfig.json` (strict mode, ES2022, module: NodeNext)
3. Create `tsconfig.server.json` (extends base, server-specific)
4. Create `vite.config.ts` (multi-page: index.html + admin.html, output to `public/dist/`)
5. Create `.gitignore` entries for `dist/`, `public/dist/`, `data/`, `node_modules/`

### Phase 2 — Backend TypeScript + Validation

6. **`src/server/schemas/pattern.schema.ts`** — zod schema:
   ```ts
   export const CreatePatternSchema = z.object({
     id: z.string().min(1).optional(),
     name: z.string().min(1).max(200),
     description: z.string().max(2000).default(''),
     image: z.string().url().or(z.literal('')).default(''),
     colors: z.array(z.string()).default([]),
   });
   ```
   Similar schemas for update, product, and color.

7. **`src/server/middleware/errorHandler.ts`** — Global error handler:
   - 404 handler for unknown routes
   - 500 handler for unhandled errors
   - Consistent JSON error format: `{ error: string, details?: string }`

8. **`src/server/middleware/rateLimiter.ts`** — Rate limiting:
   - 100 requests per 15 minutes per IP for API routes
   - Stricter limit for write operations

9. **Refactor `src/server/db.ts`** to TypeScript:
   - Export typed `getDb()` function
   - Add proper types for row objects

10. **Refactor `src/server/broadcast.ts`** to TypeScript:
    - Type the WebSocket clients
    - Export typed broadcast functions

11. **Refactor routes** (`patterns.ts`, `products.ts`, `colors.ts`):
    - Use zod for request validation
    - Extract shared CRUD helper to reduce duplication
    - Return consistent response shapes
    - Add proper HTTP status codes

12. **`src/server/index.ts`** — Main server file:
    - Express app with all middleware
    - Static file serving from `public/dist/` in production
    - Vite dev middleware in development
    - WebSocket server integration
    - Health check endpoint

### Phase 3 — Shared Frontend TypeScript

13. **`src/public/src/shared/types.ts`** — Shared types:
    ```ts
    export interface Pattern { id: string; name: string; description: string; image: string; colors: string[]; createdAt: string; updatedAt: string; }
    export interface Product { id: string; pattern_id: string; name: string; type: string; description: string; image: string; price: string; colors: string[]; createdAt: string; updatedAt: string; }
    export interface Color { id: string; name: string; hex: string; darkHex: string; image: string; createdAt: string; updatedAt: string; }
    export interface AllData { patterns: Pattern[]; products: Product[]; colors: Color[]; }
    export type EntityType = 'patterns' | 'products' | 'colors';
    export type WSEventType = 'pattern_created' | 'pattern_updated' | ...;
    ```

14. **`src/public/src/shared/constants.ts`** — Config:
    - API base URL, WhatsApp number, fallback image, event type constants

15. **`src/public/src/shared/api.ts`** — API client:
    - Typed fetch wrapper with error handling
    - Methods: `getAllData()`, `create()`, `update()`, `delete()` for each entity
    - Request/response typing

16. **`src/public/src/shared/websocket.ts`** — WebSocket manager:
    - Connection management with auto-reconnect
    - Event subscription pattern
    - Typed message handling
    - Broadcast outgoing changes

17. **`src/public/src/shared/utils.ts`** — Utilities:
    - `generateId(prefix)`, `isValidImageUrl()`, `escapeHtml()`, `getFallbackImage()`

### Phase 4 — Design System (CSS)

18. **`src/public/src/styles/tokens.css`** — Design tokens:
    ```css
    :root {
      /* Typography */
      --font-display: 'Playfair Display', serif;
      --font-body: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
      --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem;
      --text-3xl: 1.875rem; --text-4xl: 2.25rem; --text-5xl: 3rem;

      /* Spacing */
      --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
      --space-5: 20px; --space-6: 24px; --space-8: 32px;
      --space-10: 40px; --space-12: 48px; --space-16: 64px;

      /* Border radius */
      --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
      --radius-xl: 20px; --radius-full: 9999px;

      /* Shadows */
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 40px rgba(0,0,0,0.15);
      --shadow-xl: 0 20px 60px rgba(0,0,0,0.2);

      /* Transitions */
      --transition-fast: 150ms ease;
      --transition-normal: 250ms ease;
      --transition-slow: 400ms ease;
    }

    [data-theme="light"] {
      --bg-primary: #faf8f5; --bg-secondary: #f0ebe3;
      --bg-card: #ffffff; --bg-navbar: rgba(255,255,255,0.95);
      --text-primary: #0f0f0f; --text-secondary: #44403c;
      --text-muted: #78716c; --border-color: #e7e2dc;
      --accent-primary: #b8860b; --accent-secondary: #8b6914;
      --accent-gold: #d4a84b;
      --shadow-color: rgba(0,0,0,0.06);
      --whatsapp-green: #25D366;
      --danger: #dc2626; --success: #16a34a; --info: #0891b2;
    }

    [data-theme="dark"] {
      --bg-primary: #0f0d0a; --bg-secondary: #1a1815;
      --bg-card: #24211e; --bg-navbar: rgba(26,24,21,0.95);
      --text-primary: #f5f5f5; --text-secondary: #a8a29e;
      --text-muted: #78716c; --border-color: #3d3835;
      --accent-primary: #d4a84b; --accent-secondary: #b8860b;
      --accent-gold: #e8c76c;
      --shadow-color: rgba(0,0,0,0.3);
      --whatsapp-green: #16a34a;
      --danger: #ef4444; --success: #22c55e; --info: #06b6d4;
    }
    ```

19. **`src/public/src/styles/base.css`** — Reset + global styles:
    - Modern CSS reset
    - Body defaults
    - Focus styles for accessibility
    - Smooth scroll

20. **Component CSS files** — Buttons, cards, forms, modals, toasts, skeleton, lightbox
21. **Layout CSS files** — Navbar, footer, grid system
22. **Page CSS files** — Storefront-specific, admin-specific

### Phase 5 — Storefront Frontend

23. **`src/public/src/storefront/index.ts`** — Bootstrap:
    - Initialize theme, navigation, data loading
    - Render initial content with loading states
    - Wire up WebSocket events to UI updates

24. **`src/public/src/storefront/theme.ts`** — Theme management:
    - localStorage + prefers-color-scheme
    - Smooth transition between themes
    - Update all theme toggle buttons

25. **`src/public/src/storefront/navigation.ts`** — Navigation:
    - Mobile hamburger menu
    - Smooth scroll
    - Active nav highlighting
    - Scroll-to-top button
    - Product detail view routing (show/hide sections)

26. **`src/public/src/storefront/render/patterns.ts`** — Pattern grid:
    - Skeleton loading state
    - Empty state
    - Pattern cards with hover effects
    - Lazy image loading with IntersectionObserver
    - Lightbox on image click

27. **`src/public/src/storefront/render/products.ts`** — Product grid:
    - Color swatch selector
    - Product cards with type badges
    - WhatsApp order button
    - Price display
    - Empty state

28. **`src/public/src/storefront/render/lightbox.ts`** — Lightbox:
    - Full-screen image preview
    - Keyboard navigation (ESC, arrow keys)
    - Smooth open/close animation
    - Caption support

29. **`src/public/src/storefront/render/toast.ts`** — Toast notifications:
    - Success, error, info variants
    - Auto-dismiss with animation
    - Stack multiple toasts

### Phase 6 — Admin Frontend

30. **`src/public/src/admin/index.ts`** — Admin bootstrap
31. **`src/public/src/admin/tabs.ts`** — Tab switching (Patterns/Products/Colors)
32. **`src/public/src/admin/modals.ts`** — Modal management
33. **`src/public/src/admin/render/patterns.ts`** — Pattern list + CRUD forms
34. **`src/public/src/admin/render/products.ts`** — Product list + CRUD forms
35. **`src/public/src/admin/render/colors.ts`** — Color list + CRUD forms

### Phase 7 — HTML Entry Points

36. **`src/public/index.html`** — Storefront HTML:
    - Clean semantic structure
    - Vite entry point via `<script type="module">`
    - Meta tags, favicon, font preconnect

37. **`src/public/admin.html`** — Admin HTML:
    - Tab-based layout
    - Modal forms for each entity
    - Vite entry point

### Phase 8 — Polish & QA

38. **Accessibility pass:**
    - ARIA labels on all interactive elements
    - Keyboard navigation for modals, lightbox, menus
    - Focus trapping in modals
    - Screen reader announcements for dynamic content
    - Color contrast verification

39. **Performance pass:**
    - Image lazy loading
    - Code splitting (storefront and admin are separate Vite entries)
    - CSS purging via Vite
    - Minification in production build

40. **Error handling:**
    - Network error states
    - API error display
    - Graceful degradation if WebSocket unavailable

41. **Testing:**
    - Basic API route tests with supertest
    - Validation schema tests

---

## Validation Plan

1. `npm run build` succeeds with no TypeScript errors
2. `npm start` serves the app on localhost:3000
3. Storefront loads with skeleton states → populated data
4. Admin panel can create, edit, delete patterns/products/colors
5. Changes sync in real-time between storefront and admin tabs via WebSocket
6. WhatsApp order button generates correct pre-filled message
7. Theme toggle persists across page reloads
8. Mobile responsive at 320px, 768px, 1024px, 1440px
9. All forms have validation feedback
10. No XSS vulnerabilities (all user input escaped in UI)
11. Lighthouse accessibility score ≥ 90
12. All API endpoints return proper error responses for invalid input

---

## Out of Scope

- User authentication (app is intentionally local-only)
- Image file upload (URL-only is intentional for simplicity)
- Database migration to PostgreSQL/other
- Cloud deployment
- SEO optimization beyond basic meta tags
- Multi-language support
- Payment integration

# Folder Structure

```
srimali-batik/
│
├── backend/                        # Express API server
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (6 models)
│   │   ├── seed.ts                 # Initial data seeder
│   │   ├── data/                   # SQLite database file (gitignored)
│   │   └── migrations/             # Prisma migration files
│   ├── src/
│   │   ├── index.ts                # Server entry point
│   │   ├── app.ts                  # Express app factory
│   │   ├── config/
│   │   │   └── env.ts              # Environment variable loader
│   │   ├── lib/
│   │   │   ├── jwt.ts              # JWT sign/verify helpers
│   │   │   ├── prisma.ts           # Prisma client singleton
│   │   │   └── utils.ts            # Utility functions (slugify)
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT authentication middleware
│   │   │   └── errorHandler.ts     # Error handling + 404
│   │   ├── routes/
│   │   │   ├── auth.ts             # POST login, GET verify
│   │   │   ├── categories.ts       # Public: GET categories
│   │   │   ├── colors.ts           # Public: GET colors
│   │   │   ├── patterns.ts         # Public: GET patterns
│   │   │   ├── products.ts         # Public: GET products
│   │   │   ├── settings.ts         # Public: GET settings
│   │   │   └── admin/
│   │   │       ├── activity.ts     # GET activity log
│   │   │       ├── categories.ts   # CRUD categories
│   │   │       ├── colors.ts       # CRUD colors
│   │   │       ├── patterns.ts     # CRUD patterns
│   │   │       ├── products.ts     # CRUD products
│   │   │       ├── settings.ts     # CRUD settings
│   │   │       ├── stats.ts        # GET dashboard stats
│   │   │       └── upload.ts       # POST file upload
│   │   └── types/
│   │       └── index.ts            # Shared TypeScript types
│   ├── uploads/                    # Uploaded images
│   ├── .env                        # Environment variables (gitignored)
│   ├── .env.example                # Environment template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # React SPA
│   ├── public/
│   │   ├── cover.jpg               # Hero image
│   │   └── logo.png                # Brand logo
│   ├── src/
│   │   ├── main.tsx                # Entry point
│   │   ├── App.tsx                 # Root component + routing
│   │   ├── index.css               # Tailwind + CSS variables
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AuthGuard.tsx   # JWT-protected route wrapper
│   │   │   │   └── ImageUpload.tsx # File upload component
│   │   │   ├── layout/
│   │   │   │   ├── AdminLayout.tsx # Admin sidebar + header
│   │   │   │   └── PublicLayout.tsx# Public navbar + footer
│   │   │   ├── public/
│   │   │   │   ├── Lightbox.tsx    # Image lightbox viewer
│   │   │   │   └── PatternCard.tsx # Pattern grid card
│   │   │   └── ui/                 # Reusable UI primitives (14)
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── select.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── toast.tsx
│   │   │       └── toaster.tsx
│   │   ├── hooks/
│   │   │   ├── use-data.ts         # React Query hooks for all entities
│   │   │   ├── use-toast.ts        # Toast notification hook
│   │   │   └── use-utils.ts        # Utility hook
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance with auth interceptor
│   │   │   └── utils.ts            # cn(), formatDate(), slugify()
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── NotFoundPage.tsx
│   │   │   │   ├── PatternDetailPage.tsx
│   │   │   │   └── PatternsPage.tsx
│   │   │   └── admin/
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── LoginPage.tsx
│   │   │       ├── activity/AdminActivityPage.tsx
│   │   │       ├── colors/AdminColorsPage.tsx
│   │   │       ├── patterns/AdminPatternsPage.tsx
│   │   │       ├── products/AdminProductsPage.tsx
│   │   │       └── settings/AdminSettingsPage.tsx
│   │   └── stores/
│   │       ├── authStore.ts         # Zustand auth state
│   │       ├── themeStore.ts        # Zustand theme/dark mode
│   │       └── uploadStore.ts       # Zustand upload state
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── CODING_STANDARDS.md
│
├── package.json                    # Root orchestrator
├── .gitignore
├── .env.example
├── README.md
├── REPOSITORY_ANALYSIS.md
├── IMPLEMENTATION_PLAN.md
└── prompt.txt
```

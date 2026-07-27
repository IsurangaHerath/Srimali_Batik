# Coding Standards

## TypeScript

- **Strict mode** enabled in all `tsconfig.json` files
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and primitive aliases
- Avoid `any` — use `unknown` and type guards instead
- Use `const` assertions for literal types
- Explicit return types on public functions

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `PatternCard`, `AdminLayout` |
| Hooks | camelCase, prefixed with `use` | `useData`, `useToast` |
| Functions | camelCase | `formatDate`, `slugify` |
| Variables | camelCase | `patternCount`, `isLoading` |
| Constants | UPPER_SNAKE_CASE or camelCase | `API_BASE_URL`, `defaultColors` |
| Files | camelCase (utilities), PascalCase (components) | `api.ts`, `PatternCard.tsx` |
| Folders | camelCase or kebab-case | `admin/`, `components/ui/` |
| Types/Interfaces | PascalCase | `PatternWithColors`, `ApiResponse` |
| API Routes | kebab-case | `/api/admin/activity-log` |
| Database Models | PascalCase (Prisma) | `PatternColor`, `ActivityLog` |
| Database Fields | camelCase | `createdAt`, `imageUrl` |

## Component Patterns

```tsx
// Functional component with explicit return type
function PatternCard({ pattern }: PatternCardProps): JSX.Element {
  return <div>{pattern.name}</div>
}
```

- Each component in its own file
- Named exports preferred
- Props interface defined in the same file
- Destructure props at function parameter level

## Import Order

1. External libraries (react, axios, etc.)
2. Internal absolute imports (`@/components/...`)
3. Relative imports (`./utils`)
4. CSS imports

## Error Handling

```typescript
// Backend — use centralized error handler
throw new AppError(400, 'Validation failed')

// Frontend — use React Query error handling
const { error } = useQuery(...)
```

- Never catch errors silently
- Always provide meaningful error messages
- Use the centralized error handler middleware in Express

## API Routes Pattern

```typescript
import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public
router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.entity.findMany()
    res.json(items)
  } catch (error) {
    next(error)
  }
})

// Admin (protected)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string() })
    const data = schema.parse(req.body)
    const item = await prisma.entity.create({ data })
    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

export default router
```

## State Management Rules

- **Server state** (data from API) → TanStack React Query
- **Client state** (UI preferences, auth tokens) → Zustand
- **Form state** → React Hook Form
- Avoid putting server data in Zustand stores

## Git Commit Style

```
type: short description

type: feat | fix | chore | refactor | docs | style | perf | test

Examples:
feat: add product color selector
fix: handle empty pattern list on home page
chore: remove unused dependencies
docs: update API reference
refactor: extract ImageUpload component
```

- One logical change per commit
- Write descriptive commit messages
- Keep commits small and focused

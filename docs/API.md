# API Reference

Base URL: `http://localhost:3001/api` (development)

## Authentication

### POST /api/auth/login

Login with admin credentials.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (401):**
```json
{ "error": "Invalid credentials" }
```

### GET /api/auth/verify

Verify JWT token validity. Requires `Authorization: Bearer <token>` header.

**Response (200):**
```json
{
  "valid": true,
  "admin": { "id": "uuid", "username": "admin" }
}
```

---

## Public Endpoints

### GET /api/patterns

List all patterns with their colors, products, and category.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Traditional Floral Saree",
    "slug": "traditional-floral-saree",
    "description": "...",
    "imageUrl": "/uploads/cover.jpg",
    "category": { "id": "uuid", "name": "Floral", "slug": "floral" },
    "colors": [{ "id": "uuid", "name": "Crimson Red", "hex": "#E74C3C", "darkHex": "#C0392B" }],
    "products": [
      { "id": "uuid", "name": "Floral Saree", "slug": "floral-saree", "type": "Saree", "price": "15,000 LKR", "imageUrl": null }
    ],
    "createdAt": "2026-07-26T..."
  }
]
```

### GET /api/patterns/:slug

Get a single pattern by slug.

### GET /api/products

List all products with their pattern and colors.

### GET /api/products/:slug

Get a single product by slug.

### GET /api/colors

List all colors.

**Response (200):**
```json
[
  { "id": "uuid", "name": "Emerald Green", "slug": "emerald-green", "hex": "#2ECC71", "darkHex": "#27AE60", "imageUrl": null }
]
```

### GET /api/categories

List all categories.

### GET /api/settings

Get site settings.

**Response (200):**
```json
{
  "whatsapp_number": "+94771234567",
  "store_name": "Srimali Batik",
  "store_email": "info@srimalibatik.com",
  "store_phone": "+94 77 123 4567",
  "store_address": "Colombo, Sri Lanka",
  "store_description": "Handcrafted batik clothing and fabrics since 1990."
}
```

---

## Admin Endpoints (JWT Required)

All admin endpoints require `Authorization: Bearer <token>` header.

### CRUD Patterns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/patterns` | List all patterns (admin view) |
| GET | `/api/admin/patterns/:id` | Get pattern by ID |
| POST | `/api/admin/patterns` | Create pattern |
| PUT | `/api/admin/patterns/:id` | Update pattern |
| DELETE | `/api/admin/patterns/:id` | Delete pattern |

### CRUD Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/products` | List all products |
| GET | `/api/admin/products/:id` | Get product by ID |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |

### CRUD Colors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/colors` | List all colors |
| GET | `/api/admin/colors/:id` | Get color by ID |
| POST | `/api/admin/colors` | Create color |
| PUT | `/api/admin/colors/:id` | Update color |
| DELETE | `/api/admin/colors/:id` | Delete color |

### CRUD Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/categories` | List all categories |
| GET | `/api/admin/categories/:id` | Get category by ID |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |

### CRUD Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/settings` | List all settings |
| PUT | `/api/admin/settings/:key` | Update setting by key |

### Dashboard

**GET /api/admin/stats**

**Response:**
```json
{
  "patterns": 5,
  "products": 12,
  "colors": 10,
  "categories": 4
}
```

### Activity Log

**GET /api/admin/activity**

**Response:**
```json
[
  {
    "id": "uuid",
    "action": "CREATE",
    "entity": "pattern",
    "entityId": "uuid",
    "detail": "Created pattern 'Traditional Floral Saree'",
    "ip": "::1",
    "createdAt": "2026-07-26T..."
  }
]
```

### File Upload

**POST /api/admin/upload**

Multipart form-data with `file` field.

**Response (200):**
```json
{
  "url": "/uploads/uuid-filename.png"
}
```

---

## Error Responses

All errors return JSON:

```json
{
  "error": "Error message",
  "details": "Optional detailed message (development only)"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error |
| 401 | Unauthorized (missing/invalid JWT) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

# Database

The application uses **SQLite** via **Prisma ORM**. The database file is stored at `backend/prisma/data/srimali.db`.

## Schema

### Models

```
Admin
├── id        String (UUID, PK)
├── username  String (unique)
├── password  String (bcrypt hashed)
├── createdAt DateTime
└── updatedAt DateTime

Category
├── id          String (UUID, PK)
├── name        String (unique)
├── slug        String (unique)
├── description String?
├── createdAt   DateTime
├── updatedAt   DateTime
└── patterns    Pattern[] (1:N)

Color
├── id        String (UUID, PK)
├── name      String (unique)
├── slug      String (unique)
├── hex       String
├── darkHex   String?
├── imageUrl  String?
├── createdAt DateTime
├── updatedAt DateTime
├── patterns  PatternColor[] (M:N)
└── products  ProductColor[] (M:N)

Pattern
├── id          String (UUID, PK)
├── name        String (unique)
├── slug        String (unique)
├── description String?
├── imageUrl    String?
├── categoryId  String? (FK → Category)
├── category    Category? (N:1)
├── createdAt   DateTime
├── updatedAt   DateTime
├── products    Product[] (1:N)
└── colors      PatternColor[] (M:N)

Product
├── id          String (UUID, PK)
├── patternId   String (FK → Pattern)
├── pattern     Pattern (N:1)
├── name        String
├── slug        String (unique)
├── type        String?
├── description String?
├── imageUrl    String?
├── price       String?
├── createdAt   DateTime
├── updatedAt   DateTime
└── colors      ProductColor[] (M:N)

PatternColor (Join Table)
├── patternId String (FK → Pattern)
├── colorId   String (FK → Color)
└── @@id([patternId, colorId])

ProductColor (Join Table)
├── productId String (FK → Product)
├── colorId   String (FK → Color)
└── @@id([productId, colorId])

Setting
├── id    String (UUID, PK)
├── key   String (unique)
├── value String

ActivityLog
├── id        String (UUID, PK)
├── action    String
├── entity    String
├── entityId  String?
├── detail    String?
├── ip        String?
└── createdAt DateTime
```

## Relationships

```
Category ──1:N──> Pattern ──1:N──> Product
                      │               │
                      │ M:N           │ M:N
                      ├──> Color <────┘
                      via PatternColor
                          & ProductColor

Admin (standalone, for auth)
Setting (key-value store, standalone)
ActivityLog (standalone, append-only)
```

## Migrations

```bash
cd backend
npx prisma migrate dev   # Create/apply migrations
npx prisma db push       # Push schema directly (dev only)
npx prisma db seed       # Seed with initial data
npx prisma studio        # GUI database browser
```

## Seed Data

The seed script (`backend/prisma/seed.ts`) creates:

1. **Admin user**: `admin` / `password123`
2. **4 categories**: Traditional, Modern, Floral, Geometric
3. **10 colors**: Emerald Green, Royal Blue, Crimson Red, Sunset Orange, Purple Reign, Midnight Black, Pure White, Golden Yellow, Teal, Warm Brown
4. **6 settings**: WhatsApp number, store name, email, phone, address, description
5. **3 sample patterns** with **6 sample products**

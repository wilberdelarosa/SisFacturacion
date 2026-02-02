# @template/database

Shared database module using Prisma. This package exports the typed `PrismaClient` used by all services (e.g., `service-a`, `service-b`).

## 🎯 "Flexible Database" Philosophy

Even though we default to **PostgreSQL**, this configuration is designed to be swappable.

### How to change the Database Provider?

1. Open `prisma/schema.prisma`
2. Change the `datasource` block:

**For MySQL:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

**For SQLite (Local Dev):**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

3. Run `pnpm db:generate` to rebuild the client core.

## 🛠️ Usage

### 1. In your service's `package.json`:
Add this dependency:
```json
"dependencies": {
  "@template/database": "workspace:*"
}
```

### 2. In your code:
```typescript
import { prisma } from '@template/database';

async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
}
```

## 📜 Commands

- `pnpm db:generate`: Generates the TypeScript client based on schema.
- `pnpm db:push`: Pushes schema changes to the database (Prototyping).
- `pnpm db:studio`: Opens the visual database editor.

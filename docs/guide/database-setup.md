# Database Setup & Configuration Guide

This template comes with a **Flexible Database Module** powered by [Prisma](https://www.prisma.io/).
By default, it is configured for **PostgreSQL**, but it can be switched to MySQL, SQLite, or SQL Server in seconds.

---

## 🚀 Quick Start

### 1. Configure Connection
Create or edit the `.env` file in `packages/database/.env`:

```bash
# PostgreSQL (Default)
DATABASE_URL="postgresql://user:password@localhost:5432/myapp?schema=public"
```

### 2. Apply Changes
Run this command from the root of the repo:

```bash
pnpm db:push
```
This will:
1. Connect to your database.
2. Create the tables defined in `prisma/schema.prisma`.
3. Generate the TypeScript client.

---

## 🔄 How to Switch Providers
This is the "Magic Switch" feature of the template.

### Scenario: Switching to MySQL
1. Open `packages/database/prisma/schema.prisma`.
2. Change the provider:

```diff
datasource db {
- provider = "postgresql"
+ provider = "mysql"
  url      = env("DATABASE_URL")
}
```

3. Update your `.env` connection string to a MySQL format:
```bash
DATABASE_URL="mysql://user:password@localhost:3306/myapp"
```

4. Run `pnpm db:generate`. Done.

---

## 🛡️ Best Practices for this Template

### 1. Where do I add new tables?
Always edit `packages/database/prisma/schema.prisma`. Do **NOT** create separate schema files for each service yet (unless you are splitting into physical microservices).

### 2. How do I access the DB?
In your service (e.g., `services/service-a`), import the shared client:

```typescript
import { prisma } from '@template/database';

const users = await prisma.user.findMany();
```

### 3. Migrations (Production)
For local dev, `db:push` is fine. For production, use migrations:

```bash
pnpm exec prisma migrate dev --name init_tables
```

---

## 📊 Visualizing the Data
You don't need DBeaver or pgAdmin. Just run:

```bash
pnpm db:studio
```
This opens a web interface at `http://localhost:5555` to view and edit your data.

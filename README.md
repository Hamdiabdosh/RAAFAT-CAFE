# CaféOS (RAAFAT-CAFE)

Subscription SaaS for independent café owners — digital menus, QR ordering, and live order management.

## Stack

| Layer | Tech |
|--------|------|
| Web | TanStack Start + Router + Query, Tailwind, shadcn/ui |
| API | Express 5, Prisma, PostgreSQL, JWT |
| Real-time | Socket.io (Module 5+) |

## Local development

### 1. Database

```bash
docker compose up -d
```

Postgres runs on **port 5433** (to avoid conflicts with a local 5432 instance).

### 2. API

```bash
cd api
cp .env.example .env   # if needed
bun install
bun run db:migrate
bun run db:seed
bun run dev            # http://localhost:3001
```

**Seed credentials**

- Admin: `admin@cafeos.local` / `ChangeMeAdmin123`
- Plans: Basic, Pro

### 3. Web

```bash
# from repo root
bun install
bun run dev            # http://localhost:5173
```

Ensure `.env` contains:

```
VITE_API_URL=http://localhost:3001
```

### 4. Test the Phase A flow

1. Register at `/register`
2. Check API console for verification link → open `/verify/{token}`
3. Sign in at `/login`
4. Choose plan at `/select-plan`
5. Dashboard shows **pending activation** banner
6. Admin: `/admin/login` → `/admin/cafes` → **Activate Pro (30d)**
7. Owner refreshes dashboard → subscription **active**

## Project structure

```
api/                 Express + Prisma backend
src/routes/          TanStack Router pages
src/stores/          Zustand (auth, admin)
docs/                Product spec & AI prompts
```

## Build order (from spec)

Phase A ✅ Auth & subscription foundation  
Phase B ✅ Café management (profile, hours, QR, theme)  
Phase C ✅ Menu builder (categories, items, modifiers, publish)  
Phase D → Customer ordering + order queue  
Phase E → Analytics + admin polish

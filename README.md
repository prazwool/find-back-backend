# FindBack Backend (independent Git repository)

REST API for the **FindBack — Lost & Found** MERN application. This is a standalone Git repository and can be pushed to its own GitHub repository (for example, `findback-backend`).

**Stack:** Node.js 20+, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer, Sharp, Zod.

## Run locally

1. Start MongoDB locally, or run `docker compose up -d` from this directory (requires Docker).
2. Copy `.env.example` to `.env` (on Windows PowerShell: `Copy-Item .env.example .env`).
3. Set `JWT_SECRET` in `.env` to your own random string of at least 32 characters; configure `MONGODB_URI` if needed.
4. Run the commands below **from this backend directory**:

```bash
npm install
npm run seed
npm run dev
```

API: http://localhost:5000/api
Health: http://localhost:5000/api/health

You can generate a secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

## Seed demo data

`npm run seed` adds, if absent:

- 2 demo accounts: `demo@findback.dev` and `visitor@findback.dev` (new accounts use `Demo12345!`)
- 12 sample lost/found items
- 4 sample claim requests (pending, approved, rejected)

Seeding is repeatable and preserves records that already exist; it doesn't reset existing account passwords. It refuses to run with `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` is explicitly configured. Don't leave demo accounts/passwords enabled on a public production site.

## API routes

| Method | Route | Use |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user |
| GET | `/api/stats` | Public statistics |
| GET | `/api/items` | Search, filter and paginate items |
| GET | `/api/items/:id` | Item details |
| GET | `/api/items/mine` | My items |
| POST | `/api/items` | Create item (multipart images) |
| PATCH | `/api/items/:id` | Edit item |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/claims` | Submit claim request |
| GET | `/api/claims/mine` | Sent requests |
| GET | `/api/claims/incoming` | Received requests |
| PATCH | `/api/claims/:id` | Approve or reject claim |

## Scripts

```bash
npm run dev    # watch-mode development server
npm start      # production-style server
npm run seed   # demo data
npm test       # Node test runner
```

## Frontend integration

Run the separate `findback-frontend` repository on http://localhost:5173; the backend default `CLIENT_ORIGIN=http://localhost:5173` allows browser requests from it. The Vite development server proxies `/api` and `/uploads` to this server.

To deploy the backend separately, set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN=https://your-frontend.example`, and `NODE_ENV=production`. User uploads are stored on local disk in `uploads/`; for hosts with ephemeral filesystems, configure persistent storage or migrate uploads to an object store.

## Push to GitHub

This ZIP contains **no `.git` directory or existing commits**. Initialize Git yourself, then create an empty GitHub repository and run:

```bash
git init -b main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/findback-backend.git
git branch -M main
git push -u origin main
```

This backend repository is independent of the frontend repository. MIT licensed.

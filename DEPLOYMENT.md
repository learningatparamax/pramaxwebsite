# Publishing to your domain

Recommended stack (all have free tiers and need no server management):

| Part | Host | Why |
|---|---|---|
| Database | **Neon** (serverless PostgreSQL) | Standard Postgres, free tier, backups/branching, one connection string |
| Backend (FastAPI) | **Render** (`render.yaml` in repo) | Deploys from GitHub on push, HTTPS included |
| Frontend (Next.js) | **Vercel** | Built by the Next.js team, custom domain + SSL in a few clicks |

Any hosted PostgreSQL works instead of Neon (Supabase, Render Postgres, Azure Database for PostgreSQL) — just change `DATABASE_URL`.

## 1. Database — Neon
1. Create a project at neon.tech, database name `pramax`.
2. Copy the connection string (`postgresql://...?sslmode=require`).
3. Load starter content from your Mac:
   ```bash
   cd backend && source .venv/bin/activate
   DATABASE_URL="<neon connection string>" python -m app.seed
   ```
   Tables are created automatically.

## 2. Backend — Render
1. Push the branch to GitHub.
2. Render → **New → Blueprint** → choose the repo; it reads `render.yaml`.
3. Fill in the secret env vars: `DATABASE_URL` (Neon), `ADMIN_API_KEY`, `XAI_API_KEY`,
   `ALLOWED_ORIGINS` (`https://www.yourdomain.com,https://yourdomain.com`).
4. Optional: add a custom domain such as `api.yourdomain.com` under Settings → Custom Domains.
5. Check `https://<backend-url>/api/database-health` returns `{"database":"connected"}`.

Note: Render's free plan sleeps after inactivity (first request ~30–60 s). Use a paid instance for production.

## 3. Frontend — Vercel
1. Vercel → **Add New Project** → import the repo, **Root Directory = `frontend`**.
2. Environment variable: `BACKEND_API_URL = https://<backend-url>` (no trailing slash).
3. Deploy, then **Settings → Domains** → add `yourdomain.com` and `www.yourdomain.com`
   and create the DNS records Vercel shows at your domain registrar.

The browser only talks to the Next.js site; the Next.js API routes call the backend server-side,
so `ALLOWED_ORIGINS` mainly matters if you call the backend directly from a browser.

## Branch → environment
Use the existing `dev` / `uat` / `main` branches with separate Neon branches/databases and
separate Render/Vercel environments, each with its own `DATABASE_URL`.

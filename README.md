# Pramax Website

Marketing and customer-engagement site for Pramax: services, industry solutions, case studies,
a lead form, and an AI chat assistant powered by xAI Grok.

| Part | Stack | Folder |
|---|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS | [`frontend/`](frontend) |
| Backend | FastAPI, SQLAlchemy 2, Pydantic | [`backend/`](backend) |
| Database | SQLite locally, PostgreSQL (Neon) in production | — |
| AI chat | xAI Grok via the OpenAI-compatible SDK | [`backend/app/grok_service.py`](backend/app/grok_service.py) |

The browser only talks to the Next.js site. Next.js API routes (`frontend/src/app/api/`) forward
requests server-side to the FastAPI backend at `BACKEND_API_URL`.

## Quick start

Requires Node.js 18+ and Python 3.10+. Full instructions: [LOCAL_SETUP.md](LOCAL_SETUP.md).

```bash
# Backend — terminal 1
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in ADMIN_API_KEY and XAI_API_KEY
python -m app.seed
uvicorn app.main:app --reload --port 8000

# Frontend — terminal 2
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

- Site: http://localhost:3000
- API docs: http://127.0.0.1:8000/docs

## Configuration

Secrets live in `backend/.env` and `frontend/.env.local`, which are git-ignored. Never commit them;
copy from the `.env.example` files instead.

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Empty = local SQLite (`backend/pramax.db`); set to a PostgreSQL URL in production |
| `ADMIN_API_KEY` | backend | Required in the `X-Admin-Key` header for admin endpoints |
| `XAI_API_KEY` | backend | xAI key for `/api/chat` |
| `GROK_MODEL` | backend | Grok model name |
| `ALLOWED_ORIGINS` | backend | Comma-separated CORS origins |
| `BACKEND_API_URL` | frontend | URL of the FastAPI backend |

## API overview

| Endpoint | Access |
|---|---|
| `GET /api/health`, `GET /api/database-health` | Public |
| `GET /api/services`, `/api/industry-solutions`, `/api/case-studies` | Public |
| `POST /api/leads`, `POST /api/chat` | Public |
| `POST/PUT/DELETE` on services, industry solutions, case studies | Admin |
| `GET /api/leads`, `/api/knowledge`; `POST/DELETE /api/knowledge` | Admin |

Starter content is in [`backend/seed_data.json`](backend/seed_data.json). Re-run `python -m app.seed`
after editing it; existing titles are skipped.

## Branches and deployment

`dev` → `uat` → `main`. Pushing to `main` deploys the frontend and backend to Azure App Service
([`.github/workflows/deploy-azure.yml`](.github/workflows/deploy-azure.yml)); the database runs on Neon.
See [DEPLOYMENT.md](DEPLOYMENT.md).

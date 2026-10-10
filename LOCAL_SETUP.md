# Local setup (macOS)

Next.js 15 frontend (`frontend/`) + FastAPI backend (`backend/`) + xAI Grok chat.

**Database:** SQLite locally (zero install), managed PostgreSQL (Neon) in production.
The same code runs on both — only `DATABASE_URL` changes. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Prerequisites
- Node.js 18+ (`node -v`)
- Python 3.10+ (`python3 --version`)

> **macOS note:** the built-in `/usr/bin/python3` is 3.9 and is too old. If you installed Python and
> Node with Homebrew, put Homebrew first on your PATH (one time):
> `echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`

## 1. Backend (terminal 1)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set ADMIN_API_KEY and XAI_API_KEY; leave DATABASE_URL empty
python -m app.seed          # loads starter content from seed_data.json
uvicorn app.main:app --reload --port 8000
```
Check http://127.0.0.1:8000/api/health — API docs at http://127.0.0.1:8000/docs

## 2. Frontend (terminal 2)
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000

## Managing content
- Bulk: edit `backend/seed_data.json` and re-run `python -m app.seed` (existing titles are skipped).
- One at a time: via curl (or http://127.0.0.1:8000/docs) with the `X-Admin-Key` header:
```bash
curl -X POST http://127.0.0.1:8000/api/services \
  -H "Content-Type: application/json" -H "X-Admin-Key: <ADMIN_API_KEY>" \
  -d '{"title":"Data Engineering","category":"Data","description":"Modern data platforms on Microsoft Fabric."}'
```
- Chat knowledge base: `POST /api/knowledge` (admin) with `{"trigger": "...", "response": "..."}`,
  or via the frontend at `POST /api/admin` with the same `X-Admin-Key` header.

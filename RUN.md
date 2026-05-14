# Running Deck Studio locally

URLs after the commands below:

- Frontend: http://localhost:3001/
- Backend: http://localhost:8002/
- API docs (Swagger): http://localhost:8002/docs
- Health check: http://localhost:8002/health

## Prerequisites (one-time)

- MySQL running on `localhost:3306` with database `wacdeckstudio` and a user `wacdeck` / `wacdeck123` (see [backend/.env](backend/.env)).
- Redis running on `localhost:6379`.
- Node.js 18+ and Python 3.10+.

If you've never installed deps:

```bash
# Frontend
cd /var/www/html/Deck-Studio-React
npm install

# Backend
cd /var/www/html/Deck-Studio-React/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Start the backend

```bash
cd /var/www/html/Deck-Studio-React/backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8002
```

For dev with auto-reload on file changes:

```bash
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

## Start the frontend

In a second terminal:

```bash
cd /var/www/html/Deck-Studio-React
npm run dev
```

Vite reads `port: 3001` from [vite.config.ts](vite.config.ts) and proxies `/api` to `http://localhost:8002`.

## Optional: Celery worker (background jobs)

Only needed if you use the async generation/export pipelines (the sync paths at `/generate/sync` and `/generate/stream` don't require it).

```bash
cd /var/www/html/Deck-Studio-React/backend
.venv/bin/celery -A app.tasks.celery_app worker --loglevel=info
```

## Run both in the background

If you want to leave both running and reclaim your terminal:

```bash
# Backend
cd /var/www/html/Deck-Studio-React/backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8002 > /tmp/wac-backend.log 2>&1 &

# Frontend
cd /var/www/html/Deck-Studio-React
npm run dev -- --host 0.0.0.0 > /tmp/wac-frontend.log 2>&1 &
```

Logs:

```bash
tail -f /tmp/wac-backend.log
tail -f /tmp/wac-frontend.log
```

## Stopping

```bash
pkill -f "uvicorn app.main:app"
pkill -f "vite"
```

## Environment

- Backend config: [backend/.env](backend/.env) — set `GEMINI_API_KEY` here for AI generation/image-gen to work.
- Frontend config: [.env](.env) — `VITE_API_URL=http://localhost:8002`.
- Allowed origins for CORS are listed in [backend/.env](backend/.env) under `ALLOWED_ORIGINS`. Add the frontend URL there if you change the port.

## Troubleshooting

- **`address already in use`** — something is already on the port. `ss -ltn | grep -E ':(8002|3001)'` to see, then `pkill -f` the offender.
- **MySQL `Access denied for user 'wacdeck'`** — the user needs `mysql_native_password` auth, not `caching_sha2_password`. Reset with:
  ```sql
  ALTER USER 'wacdeck'@'localhost' IDENTIFIED WITH mysql_native_password BY 'wacdeck123';
  FLUSH PRIVILEGES;
  ```
- **`email-validator is not installed`** — `.venv/bin/pip install 'pydantic[email]'`.
- **Backend exits at startup with `error parsing value for field "ALLOWED_ORIGINS"`** — the value in [backend/.env](backend/.env) must be a JSON list, e.g. `ALLOWED_ORIGINS=["http://localhost:3001"]`.

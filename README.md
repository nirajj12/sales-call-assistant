# Intellify

LangGraph-orchestrated sales call intelligence with FastAPI, Celery, Redis, PostgreSQL, and a React Router frontend.

## Architecture

The backend now runs as a graph-driven async job pipeline:

1. `POST /api/v1/analyze` queues a job
2. Celery worker invokes the compiled LangGraph workflow
3. Graph nodes normalize transcript, extract MEDDIC and objections in parallel, validate schema outputs, verify evidence, run judge/coaching synthesis, and persist the result
4. Frontend polls `GET /api/v1/jobs/{job_id}`
5. Full result is fetched from `GET /api/v1/analysis/{analysis_id}`

Core files:

- [app/graph/state.py](/Users/nirajmac/Documents/Intellify/app/graph/state.py)
- [app/graph/nodes.py](/Users/nirajmac/Documents/Intellify/app/graph/nodes.py)
- [app/graph/routes.py](/Users/nirajmac/Documents/Intellify/app/graph/routes.py)
- [app/graph/workflow.py](/Users/nirajmac/Documents/Intellify/app/graph/workflow.py)
- [app/worker.py](/Users/nirajmac/Documents/Intellify/app/worker.py)
- [app/db/database.py](/Users/nirajmac/Documents/Intellify/app/db/database.py)

## Environment

Copy [.env.example](/Users/nirajmac/Documents/Intellify/.env.example) to `.env`.

Recommended working local setup:

```env
APP_ENV=development
ENVIRONMENT=development
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/sales_call_intelligence
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER_FALLBACKS=
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

Then add only the API key for the provider you are actually using.

## Install

```bash
cd /Users/nirajmac/Documents/Intellify
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

Start Redis:

```bash
docker run -d -p 6379:6379 --name intellify-redis redis:7
```

Start PostgreSQL on a host port that does not conflict with a local Postgres install:

```bash
docker run -d \
  --name intellify-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sales_call_intelligence \
  -p 5433:5432 \
  postgres:16
```

Start FastAPI:

```bash
cd /Users/nirajmac/Documents/Intellify
uvicorn app.main:app --reload --port 8000
```

Start Celery worker in a second terminal:

```bash
cd /Users/nirajmac/Documents/Intellify
celery -A app.worker.celery_app worker --loglevel=info --concurrency=4
```

Start the frontend in a third terminal:

```bash
cd /Users/nirajmac/Documents/Intellify/ui/web
npm install
npm run dev
```

Frontend:

- [http://localhost:4000](http://localhost:4000)

Backend:

- [http://127.0.0.1:8000](http://127.0.0.1:8000)
- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## API

- `GET /health`
- `POST /api/v1/analyze`
- `POST /api/v1/analyze/upload`
- `GET /api/v1/jobs/{job_id}`
- `GET /api/v1/analysis/{analysis_id}`
- `GET /api/v1/analyses`

### Sample analyze request

```json
{
  "transcript": "Rep: What is your biggest challenge?\nCustomer: We lose 20 hours a week to manual reporting.",
  "source_name": "Test Call"
}
```

## Tests

```bash
pytest tests/ -v
```

Quick smoke test:

```bash
cd /Users/nirajmac/Documents/Intellify
bash scripts/smoke_test.sh
```

The test suite now focuses on:

- graph topology behavior
- node-level validation and failure handling
- shared graph state reducer behavior
- API job-queue endpoints

## Notes

- The active backend contract is async `/api/v1` job endpoints.
- The frontend already uses polling against `/api/v1/jobs/{job_id}`.
- If you use a Groq model, keep `LLM_PROVIDER_FALLBACKS` empty unless you also switch to provider-compatible model names.
- The old synchronous backend path has been removed to avoid maintenance confusion.

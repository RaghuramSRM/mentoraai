# Local Setup

## Requirements

- Python 3.11+
- Node.js 20+
- npm

## Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example ..\.env
python -m alembic -c alembic.ini upgrade head
python scripts\ingest_knowledge.py
python -m uvicorn app.main:app --reload --port 8000
```

Keep `AI_PROVIDER=demo` for the self-contained offline experience. For live responses, set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` in the root `.env`.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Use `demo@mentora.ai` / `MentoraDemo123!` or register a new learner. Set `VITE_API_URL` in `frontend/.env` only when the backend is hosted elsewhere.

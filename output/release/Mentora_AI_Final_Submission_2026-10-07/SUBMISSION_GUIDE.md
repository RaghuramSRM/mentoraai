# Mentora AI Final Submission Guide

## Project identity

Mentora AI is an IBM SkillsBuild for Academia internship project aligned with SDG 4 Quality Education. It is a working local web application, not an official IBM product.

## Included deliverables

- Full React and TypeScript frontend source
- Full FastAPI and SQLAlchemy backend source
- Alembic database migrations
- Curated Markdown knowledge corpus and ChromaDB ingestion script
- Backend and frontend automated tests
- Technical, setup, testing, API, architecture, database, RAG, and deployment documentation
- Lean Canvas PDF
- Concept Note in DOCX and PDF formats
- PowerPoint project presentation

## Evaluator quick start

### Backend

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item .env.example .env
cd backend
python -m alembic -c alembic.ini upgrade head
python scripts\ingest_knowledge.py
python -m uvicorn app.main:app --port 8000
```

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with:

- Email: `demo@mentora.ai`
- Password: `MentoraDemo123!`

If port 8000 is unavailable, run the API on another port and set `VITE_API_URL` in `frontend/.env.local` before starting Vite.

## Verification commands

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest -q

cd ..\frontend
npm test
npm run lint
npm run build
```

Expected verified results at submission time are 12 passing backend tests and 3 passing frontend tests, followed by a successful lint and production build.

## Scope statement

The submitted MVP includes registration, authentication, onboarding, assessment, ordered career roadmaps, grounded mentor routing, adaptive quizzes, career guidance, projects, research updates, progress, streaks, reminders, and activity history. The default provider works offline.

Live-model evaluation, public production deployment, automated research crawling, external email or WhatsApp delivery, native mobile applications, LMS integrations, payments, and marketplaces remain future work. These limitations do not prevent local evaluation of the submitted internship prototype.

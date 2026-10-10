# Mentora AI Development Process

## Current Status

MVP P0/P1 COMPLETE — authenticated personalized learning, adaptive assessment and quizzes, grounded agents, career guidance, projects, reminders and analytics.

## Completed

- [x] Repository structure
- [x] Backend foundation and database models
- [x] JWT authentication
- [x] Demo seed data
- [x] Student profile and onboarding API
- [x] Assessment scoring and roadmap generation
- [x] Agent orchestrator and deterministic AI fallback
- [x] Tutor, quiz, career, project, research, progress, streak, and reminder APIs
- [x] Responsive React dashboard and feature views
- [x] Core backend tests
- [x] Project documentation
- [x] Career-aware assessment selection
- [x] Topic-wise scoring and strength bands
- [x] Assessment history preservation
- [x] Deterministic personalized roadmap generation
- [x] Backend-owned roadmap progress and unlocking
- [x] Existing-profile hydration and first-time onboarding distinction
- [x] Alembic migration preserving existing records
- [x] Persisted adaptive quiz attempts
- [x] Topic-aware quiz generation
- [x] Performance-driven difficulty selection
- [x] Quiz scoring, explanations and weak-topic updates
- [x] Quiz history and user isolation
- [x] Adaptive Quiz frontend workflow
- [x] Provider abstraction with offline demo and optional OpenAI mode
- [x] Persistent ChromaDB ingestion and grounded source retrieval
- [x] Database-backed career projects and research updates
- [x] Real activity-derived current and longest streaks
- [x] Reminder completion and project progress workflows
- [x] Registration and recent-activity UI
- [x] API rate limiting for AI generation routes
- [x] Backend and frontend unit tests
- [x] Prerequisite-ordered AI Engineer path with mathematics and statistics foundation
- [x] Final IBM submission package and evaluator guide

## In Progress

- None for the scoped local MVP.

## Blocked

- None

## Known Issues

- Live LLM calls require `AI_PROVIDER=openai` and a valid key; no key was supplied for live-provider verification.
- Local RAG uses deterministic hashed embeddings, suitable for offline demonstration but not equivalent to a production embedding model.
- Research updates are curated seed data and do not perform a live crawl.
- Rate limiting is process-local; a distributed production deployment should use shared storage.

## Next Action

Deploy to a production environment only after configuring PostgreSQL, secrets, HTTPS, production CORS, shared rate limiting, monitoring and backups. P2 integrations remain deliberately out of MVP scope.

## Verification

- Backend: 12 tests passed
- Frontend: 3 unit tests, TypeScript check and Vite production build passed
- Frontend lint: passed
- Migration: `20261007_03` applied successfully to the existing SQLite database
- Knowledge ingestion: 7 Markdown chunks indexed; DSA retrieval smoke test passed

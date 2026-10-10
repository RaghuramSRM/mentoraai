# Testing

Run the backend suite from `backend`:

```powershell
..\.venv\Scripts\python.exe -m pytest -q
```

Run client unit tests, lint and the production build from `frontend`:

```powershell
npm test
npm run lint
npm run build
```

The backend suite covers authentication, user isolation, assessment and roadmap personalization, adaptive quizzes, Chroma retrieval, grounded routing, career analysis, projects, reminders, activity and streaks. Client tests cover token lifecycle, authenticated request headers and surfaced API errors. Build and lint provide the TypeScript and bundle checks.

Live-provider behavior requires a valid external key and should be evaluated separately for response quality, cost, latency and safety. Offline demo-provider behavior is deterministic and covered by the local suite.

# Deployment

Mentora AI has not been deployed by this repository. For a production release:

1. Deploy the FastAPI service behind HTTPS and run Alembic migrations before application startup.
2. Use managed PostgreSQL and configure backups, connection limits and restore testing.
3. Set a strong `JWT_SECRET`, restricted `CORS_ORIGINS`, `DATABASE_URL`, provider secrets and an appropriate token lifetime through the host's secret store.
4. Persist the Chroma directory on durable storage or move retrieval to a managed vector database. Run knowledge ingestion during release.
5. Replace process-local AI route limiting with a shared limiter such as Redis, then add structured logs, metrics, tracing and alerts.
6. Build the frontend with the production `VITE_API_URL` and serve the generated static assets from a CDN-backed host.
7. Run backend tests, frontend tests, lint, build and authenticated smoke tests against staging before promotion.

External messaging, payments, LMS connectivity and marketplace features need separate privacy, consent, security and operational reviews before implementation.

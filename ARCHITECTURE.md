# Architecture

Mentora uses a single React client, a FastAPI application, and one relational database. This keeps the college MVP understandable and deployable while preserving clear boundaries for AI providers and retrieval.

```mermaid
sequenceDiagram
  actor Student
  participant UI as React UI
  participant API as FastAPI
  participant O as Orchestrator
  participant A as Specialist Agent
  participant K as Knowledge Base
  participant DB as Database
  Student->>UI: Ask or complete activity
  UI->>API: Authorized request
  API->>O: Intent + learner context
  O->>A: Route task
  A->>K: Retrieve context when useful
  A-->>API: Validated response
  API->>DB: Persist learning evidence
  API-->>UI: Agent, answer, sources
```

All persisted queries include the authenticated user ID. The deterministic demo provider makes the core journey testable without external credentials. A production provider should return Pydantic-validated structured output, retry once on malformed output, and fail safely.


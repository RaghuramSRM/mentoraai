# API Summary

All routes except `/health`, `/auth/register`, and `/auth/login` require a Bearer token.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create learner and token |
| POST | `/auth/login` | Authenticate |
| GET | `/users/me` | Current user |
| GET/PUT | `/profile` | Read/update onboarding profile |
| GET | `/assessment/questions` | Safe questions without answers |
| POST | `/assessment/submit` | Score and adapt roadmap |
| GET | `/assessments` | Assessment history |
| GET | `/roadmap` | Current learning path |
| PATCH | `/roadmap/items/{item_id}` | Update progress or mark in progress |
| POST | `/roadmap/items/{item_id}/complete` | Complete item and unlock the next |
| POST | `/mentor/chat` | Orchestrate agent response |
| GET | `/mentor/history` | Persisted conversation |
| POST | `/quiz/generate` | Topic quiz |
| POST | `/quiz/{attempt_id}/submit` | Score one owned open attempt and return explanations |
| GET | `/quiz/history` | Completed quiz attempts for the current user |
| GET | `/career/analysis` | Skill-gap analysis |
| GET | `/projects` | Recommended projects |
| PATCH | `/projects/{project_id}` | Start or update an owned project |
| GET | `/research/updates` | Curated AI updates |
| GET/PUT | `/progress` | Analytics and mastery |
| GET/POST | `/reminders` | In-app reminders |
| PATCH | `/reminders/{reminder_id}` | Update or complete a reminder |
| GET | `/activity` | Recent learner activity |
| GET | `/dashboard` | Aggregated learner home |

Assessment submission uses `{ "answers": [{ "question_id": 1, "selected_answer": 1 }] }`. The response contains total score, percentage, per-topic percentages, weak/average/strong topics, explanations, and the new roadmap ID.

Quiz generation accepts `topic`, `difficulty` (`adaptive`, `beginner`, `intermediate`, or `advanced`) and `count`. Adaptive mode uses the most recent completed attempt for that topic. Submission uses the same question-ID answer shape and returns a scored review plus the next recommended difficulty.

`/mentor/chat` routes by intent, retrieves local knowledge, records the conversation and returns `agent`, `response`, `provider`, and `sources`. The mentor and quiz-generation routes are limited to 30 requests per IP and route per minute in the local process.

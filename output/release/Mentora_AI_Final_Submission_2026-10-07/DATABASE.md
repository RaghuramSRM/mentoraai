# Database

Core SQLAlchemy models:

- `users`: identity and password hash
- `profiles`: education, experience, goal, schedule, skills and onboarding state
- `roadmaps`: generated ordered roadmap items and backend-calculated overall progress
- `assessments`: answers, question IDs, total score, topic scores and weak/average/strong topics
- `quiz_attempts`: owned quiz sessions, selected difficulty, question IDs, answers, score, weakness and completion state
- `conversations`: message, selected agent and response
- `progress`: per-user topic mastery
- `reminders`: user-owned in-app tasks
- `activities`: dated learning events used for recent activity and streaks
- `projects`: shared catalog of portfolio projects and required skills
- `user_projects`: learner status and progress for catalog projects
- `research_updates`: curated research/news records shown in the dashboard

Every learner-owned record contains `user_id`; API queries scope on the authenticated user. SQLite is the local default and PostgreSQL is recommended for deployment. Alembic migrations live in `backend/alembic/versions`; run `python -m alembic -c alembic.ini upgrade head` from `backend` before startup after pulling schema changes.

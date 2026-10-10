import os
from collections import defaultdict, deque
from datetime import date, datetime, timedelta
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import create_token, current_user, hash_password, verify_password
from .agents import choose_agent, run_agent
from .activity import record_activity, streak_summary
from .career import analyze, project_score
from .content import KNOWLEDGE, PROJECTS, QUESTIONS, QUIZ_QUESTIONS, UPDATES
from .database import Base, SessionLocal, engine, get_db
from .models import Activity, Assessment, Conversation, Profile, Progress, Project, QuizAttempt, Reminder, ResearchUpdate, Roadmap, User, UserProject
from .personalization import generate_roadmap, normalize_access, roadmap_progress, score_assessment, select_questions
from .quiz import adaptive_difficulty, score_quiz, select_quiz_questions
from .rag import retrieve
from .schemas import AssessmentSubmit, LoginIn, MentorIn, ProfileIn, ProgressIn, QuizRequest, QuizSubmit, RegisterIn, ReminderIn, ReminderUpdate, RoadmapProgressIn, UserProjectUpdate

app = FastAPI(title="Mentora AI API", version="1.0.0")
cors_origins=[value.strip() for value in os.getenv("CORS_ORIGINS","http://localhost:5173,http://127.0.0.1:5173").split(",") if value.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(engine)

request_windows = defaultdict(deque)


@app.middleware("http")
async def limit_expensive_requests(request, call_next):
    if request.url.path in {"/mentor/chat", "/quiz/generate"}:
        key = f"{request.client.host if request.client else 'unknown'}:{request.url.path}"
        now = datetime.utcnow().timestamp(); window = request_windows[key]
        while window and now - window[0] > 60: window.popleft()
        if len(window) >= 30:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=429, content={"detail":"Too many expensive requests; retry in a minute"})
        window.append(now)
    return await call_next(request)


def seed():
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == "demo@mentora.ai"))
        if not user:
            user = User(name="Demo Student", email="demo@mentora.ai", password_hash=hash_password("MentoraDemo123!")); db.add(user); db.flush()
            profile = Profile(user_id=user.id, education="B.E. Computer Science and Engineering", branch="CSE", year="3", experience_level="Intermediate", career_goal="AI Engineer", daily_study_time="1 hour", skills=["Python", "Java", "DSA", "React", "SQL"], onboarding_completed=True); db.add(profile); db.flush()
            initial = {"topic_scores":{"Python":100,"Machine Learning":50,"Data Science":50,"SQL":100},"weak_topics":[],"average_topics":["Machine Learning","Data Science"],"strong_topics":["Python","SQL"]}
            db.add(Roadmap(user_id=user.id, title="AI Engineer Learning Path", career_goal="AI Engineer", items=generate_roadmap(profile, initial), overall_progress=0))
            db.add(Assessment(user_id=user.id, kind="initial", score=6, total=8, weak_topics=[], average_topics=["Machine Learning","Data Science"], strong_topics=["Python","SQL"], topic_scores=initial["topic_scores"], question_ids=[1,2,5,6,7,8,9,10], answers=[]))
            db.add_all([Progress(user_id=user.id, topic="Python", percent=85), Progress(user_id=user.id, topic="Machine Learning", percent=62), Progress(user_id=user.id, topic="Model Evaluation", percent=35), Reminder(user_id=user.id, title="Continue Model Evaluation lesson", due_at=datetime.utcnow() + timedelta(days=1))])
        if not db.scalar(select(Project)):
            db.add_all([Project(title=p["title"],description=p["description"],difficulty=p["difficulty"],skills=p["skills"],technologies=p["skills"],career_goals=["AI Engineer","ML Engineer","Data Scientist"] if "Predictor" in p["title"] else ["AI Engineer","Software Developer"]) for p in PROJECTS])
        if not db.scalar(select(ResearchUpdate)):
            db.add_all([ResearchUpdate(title=u["title"],topic=u["topic"],summary=u["summary"],source=u["source"],source_url="",published_at=datetime.fromisoformat(u["published_at"])) for u in UPDATES])
        db.commit()
    finally:
        db.close()


seed()
DB = Annotated[Session, Depends(get_db)]
Me = Annotated[User, Depends(current_user)]


@app.get("/health")
def health(): return {"status":"ok", "service":"mentora-api"}


@app.post("/auth/register", status_code=201)
def register(data: RegisterIn, db: DB):
    if db.scalar(select(User).where(User.email == data.email.lower())): raise HTTPException(409, "Email already registered")
    user = User(name=data.name, email=data.email.lower(), password_hash=hash_password(data.password)); db.add(user); db.flush()
    db.add(Profile(user_id=user.id)); db.commit(); return {"access_token":create_token(user.id), "token_type":"bearer"}


@app.post("/auth/login")
def login(data: LoginIn, db: DB):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or not verify_password(data.password, user.password_hash): raise HTTPException(401, "Incorrect email or password")
    return {"access_token":create_token(user.id), "token_type":"bearer"}


@app.get("/users/me")
def me(user: Me): return {"id":user.id,"name":user.name,"email":user.email}


@app.get("/profile")
def get_profile(user: Me): return user.profile


@app.put("/profile")
def put_profile(data: ProfileIn, user: Me, db: DB):
    profile = user.profile or Profile(user_id=user.id)
    previous_goal = profile.career_goal
    previous_road = db.scalar(select(Roadmap).where(Roadmap.user_id == user.id).order_by(Roadmap.created_at.desc(), Roadmap.id.desc()))
    for key, value in data.model_dump().items(): setattr(profile, key, value)
    db.add(profile)
    if previous_goal != profile.career_goal:
        latest = db.scalar(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc(), Assessment.id.desc()))
        assessment_result = {"topic_scores": latest.topic_scores or {}, "weak_topics": latest.weak_topics or [], "strong_topics": latest.strong_topics or []} if latest else {}
        items = generate_roadmap(profile, assessment_result)
        completed = {item["title"] for item in (previous_road.items if previous_road else []) if item.get("status") == "completed"}
        for item in items:
            if item["title"] in completed:
                item["status"], item["progress"] = "completed", 100
        items = normalize_access(items)
        db.add(Roadmap(user_id=user.id, title=f"{profile.career_goal} Learning Path", career_goal=profile.career_goal, items=items, overall_progress=roadmap_progress(items)))
        record_activity(db, user.id, "profile", f"Changed career goal to {profile.career_goal}")
    db.commit(); db.refresh(profile); return profile


@app.get("/assessment/questions")
def questions(user: Me):
    return [{k:v for k,v in q.items() if k != "correct_answer"} for q in select_questions(user.profile)]


@app.post("/assessment/submit")
def submit_assessment(data: AssessmentSubmit, user: Me, db: DB):
    selected = select_questions(user.profile)
    expected = {q["id"] for q in selected}
    answer_map = {a.question_id: a.selected_answer for a in data.answers}
    if set(answer_map) != expected: raise HTTPException(422, "Answers must match the current personalized assessment")
    try: result = score_assessment(answer_map, selected)
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    assessment = Assessment(user_id=user.id, kind="initial", score=result["score"], total=result["total"], weak_topics=result["weak_topics"], average_topics=result["average_topics"], strong_topics=result["strong_topics"], topic_scores=result["topic_scores"], question_ids=list(answer_map), answers=[a.model_dump() for a in data.answers]); db.add(assessment)
    items = generate_roadmap(user.profile, result)
    road = Roadmap(user_id=user.id, title=f"{user.profile.career_goal} Learning Path", career_goal=user.profile.career_goal, items=items, overall_progress=roadmap_progress(items)); db.add(road); record_activity(db,user.id,"assessment",f"Completed assessment with {result['percentage']}%"); db.commit()
    next_item = next((item for item in items if item["status"] != "completed"), None)
    return {**result, "adaptive_recommendation": f"Continue with {next_item['title']}." if next_item else "Your current roadmap is complete.", "roadmap_id": road.id}


@app.get("/assessments")
def assessments(user: Me, db: DB): return db.scalars(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc())).all()


@app.get("/roadmap")
def roadmap(user: Me, db: DB):
    result = db.scalar(select(Roadmap).where(Roadmap.user_id == user.id).order_by(Roadmap.created_at.desc(), Roadmap.id.desc()))
    needs_sequence_upgrade = bool(result and result.items and result.items[0].get("sequence_version") != 2)
    goal_changed = bool(result and result.career_goal != user.profile.career_goal)
    if not result or not result.items or "id" not in result.items[0] or needs_sequence_upgrade or goal_changed:
        latest = db.scalar(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc(), Assessment.id.desc()))
        assessment_result = {"topic_scores": latest.topic_scores or {}, "weak_topics": latest.weak_topics or [], "strong_topics": latest.strong_topics or []} if latest else {}
        upgraded = generate_roadmap(user.profile, assessment_result)
        if result and needs_sequence_upgrade:
            previous = {item["title"]: item for item in result.items}
            for item in upgraded:
                old = previous.get(item["title"])
                if old and float(old.get("progress", 0)) > float(item.get("progress", 0)):
                    item["progress"] = old["progress"]
                    item["status"] = old.get("status", "in_progress")
            result.items = normalize_access(upgraded); result.overall_progress = roadmap_progress(result.items); db.add(result)
        else:
            if result and goal_changed:
                completed = {item["title"] for item in result.items if item.get("status") == "completed"}
                for item in upgraded:
                    if item["title"] in completed:
                        item["status"], item["progress"] = "completed", 100
                upgraded = normalize_access(upgraded)
            result = Roadmap(user_id=user.id,title=f"{user.profile.career_goal} Learning Path",career_goal=user.profile.career_goal,items=upgraded,overall_progress=roadmap_progress(upgraded)); db.add(result)
        db.commit(); db.refresh(result)
    return result


@app.patch("/roadmap/items/{item_id}")
def update_roadmap_item(item_id: str, data: RoadmapProgressIn, user: Me, db: DB):
    road = db.scalar(select(Roadmap).where(Roadmap.user_id == user.id).order_by(Roadmap.created_at.desc()))
    if not road: raise HTTPException(404, "Roadmap not found")
    items, found = [dict(item) for item in road.items], False
    allowed = {"available", "in_progress", "completed"}
    for index, item in enumerate(items):
        if item["id"] != item_id: continue
        found = True
        if item["status"] == "locked": raise HTTPException(409, "Complete the prerequisite topic first")
        status = data.status or ("completed" if data.progress == 100 else "in_progress" if data.progress > 0 else item["status"])
        if status not in allowed: raise HTTPException(422, "Invalid roadmap status")
        item["progress"], item["status"] = data.progress, status
        if status == "completed":
            item["progress"] = 100
            record_activity(db,user.id,"roadmap",f"Completed {item['title']}")
        break
    if not found: raise HTTPException(404, "Roadmap item not found")
    items = normalize_access(items)
    road.items, road.overall_progress = items, roadmap_progress(items)
    db.add(road); db.commit(); db.refresh(road); return road


@app.post("/roadmap/items/{item_id}/complete")
def complete_roadmap_item(item_id: str, user: Me, db: DB):
    return update_roadmap_item(item_id, RoadmapProgressIn(progress=100, status="completed"), user, db)


@app.post("/mentor/chat")
def mentor(data: MentorIn, user: Me, db: DB):
    agent=choose_agent(data.message)
    try:
        retrieved = retrieve(data.message) if agent == "Tutor" else []
        response = run_agent(agent, data.message, user.profile, retrieved)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    row=Conversation(user_id=user.id,agent=agent,message=data.message,response=response); db.add(row); record_activity(db,user.id,"mentor",f"Used {agent}"); db.commit()
    sources = list(dict.fromkeys(chunk["source"] for chunk in retrieved))
    if os.getenv("AI_PROVIDER", "demo").lower() == "demo":
        sources = sources[:1]
    return {"agent":agent,"response":response,"provider":os.getenv("AI_PROVIDER","demo"),"sources":sources}


@app.get("/mentor/history")
def history(user: Me, db: DB): return db.scalars(select(Conversation).where(Conversation.user_id==user.id).order_by(Conversation.created_at)).all()


@app.post("/quiz/generate")
def generate_quiz(data: QuizRequest, user: Me, db: DB):
    previous = db.scalar(select(QuizAttempt).where(QuizAttempt.user_id == user.id, QuizAttempt.topic == data.topic, QuizAttempt.status == "completed").order_by(QuizAttempt.completed_at.desc()))
    difficulty = adaptive_difficulty(previous.percentage if previous else None) if data.difficulty == "adaptive" else data.difficulty
    if difficulty not in {"beginner", "intermediate", "advanced"}: raise HTTPException(422, "Difficulty must be beginner, intermediate, advanced, or adaptive")
    try: selected_questions = select_quiz_questions(data.topic, difficulty, data.count)
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    attempt = QuizAttempt(user_id=user.id, topic=selected_questions[0]["topic"], difficulty=difficulty, question_ids=[q["id"] for q in selected_questions], total=len(selected_questions)); db.add(attempt); db.commit(); db.refresh(attempt)
    safe = [{k:v for k,v in q.items() if k != "correct_answer"} for q in selected_questions]
    return {"attempt_id":attempt.id,"topic":attempt.topic,"difficulty":difficulty,"questions":safe}


@app.post("/quiz/{attempt_id}/submit")
def submit_quiz(attempt_id: int, data: QuizSubmit, user: Me, db: DB):
    attempt = db.scalar(select(QuizAttempt).where(QuizAttempt.id == attempt_id, QuizAttempt.user_id == user.id))
    if not attempt: raise HTTPException(404, "Quiz attempt not found")
    if attempt.status == "completed": raise HTTPException(409, "Quiz attempt already submitted")
    question_lookup = {q["id"]:q for q in QUIZ_QUESTIONS}
    questions = [question_lookup[qid] for qid in attempt.question_ids]
    answer_map = {a.question_id:a.selected_answer for a in data.answers}
    try: result = score_quiz(answer_map, questions)
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    attempt.answers = [a.model_dump() for a in data.answers]; attempt.score = result["score"]; attempt.percentage = result["percentage"]
    attempt.weak_topics = [attempt.topic] if result["percentage"] < 60 else []; attempt.status = "completed"; attempt.completed_at = datetime.utcnow()
    mastery = db.scalar(select(Progress).where(Progress.user_id == user.id, Progress.topic == attempt.topic)) or Progress(user_id=user.id, topic=attempt.topic)
    mastery.percent = result["percentage"]; mastery.updated_at = datetime.utcnow(); db.add_all([attempt, mastery]); record_activity(db,user.id,"quiz",f"Scored {result['percentage']}% in {attempt.topic}"); db.commit()
    return {**result,"attempt_id":attempt.id,"topic":attempt.topic,"difficulty":attempt.difficulty,"weak_topics":attempt.weak_topics,"next_difficulty":adaptive_difficulty(result["percentage"])}


@app.get("/quiz/history")
def quiz_history(user: Me, db: DB):
    return db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user.id, QuizAttempt.status == "completed").order_by(QuizAttempt.completed_at.desc())).all()


@app.get("/career/analysis")
def career(user: Me): return analyze(user.profile)


@app.get("/projects")
def projects(user: Me, db: DB):
    rows=db.scalars(select(Project)).all(); enrolled={x.project_id:x for x in db.scalars(select(UserProject).where(UserProject.user_id==user.id)).all()}
    ranked=sorted(rows,key=lambda row:project_score(row,user.profile),reverse=True)
    return [{"id":p.id,"title":p.title,"description":p.description,"difficulty":p.difficulty,"skills":p.skills,"technologies":p.technologies,"match_score":project_score(p,user.profile),"status":enrolled[p.id].status if p.id in enrolled else "recommended","progress":enrolled[p.id].progress if p.id in enrolled else 0} for p in ranked]


@app.patch("/projects/{project_id}")
def update_project(project_id: int, data: UserProjectUpdate, user: Me, db: DB):
    if not db.get(Project,project_id): raise HTTPException(404,"Project not found")
    row=db.scalar(select(UserProject).where(UserProject.user_id==user.id,UserProject.project_id==project_id)) or UserProject(user_id=user.id,project_id=project_id)
    if data.status is not None:
        if data.status not in {"recommended","planned","in_progress","completed"}: raise HTTPException(422,"Invalid project status")
        row.status=data.status
    if data.progress is not None: row.progress=data.progress
    if row.progress==100: row.status="completed"
    db.add(row); record_activity(db,user.id,"project",f"Updated project {project_id} to {row.progress}%"); db.commit(); db.refresh(row); return row


@app.get("/research/updates")
def updates(user: Me, db: DB): return db.scalars(select(ResearchUpdate).order_by(ResearchUpdate.published_at.desc())).all()


@app.get("/progress")
def progress(user: Me, db: DB):
    rows=db.scalars(select(Progress).where(Progress.user_id==user.id)).all(); assessments=db.scalars(select(Assessment).where(Assessment.user_id==user.id)).all()
    assessment_avg=round(sum(x.score/x.total*100 for x in assessments)/len(assessments)) if assessments else 0
    quizzes=db.scalars(select(QuizAttempt).where(QuizAttempt.user_id==user.id,QuizAttempt.status=="completed")).all()
    quiz_avg=round(sum(x.percentage for x in quizzes)/len(quizzes)) if quizzes else 0
    road=db.scalar(select(Roadmap).where(Roadmap.user_id==user.id).order_by(Roadmap.created_at.desc()))
    overall=road.overall_progress if road else 0
    streak=streak_summary(db,user.id)
    return {"overall":overall,"assessment_average":assessment_avg,"average_quiz_score":quiz_avg,"streak":streak["current"],"longest_streak":streak["longest"],"topics":rows}


@app.put("/progress")
def put_progress(data: ProgressIn, user: Me, db: DB):
    row=db.scalar(select(Progress).where(Progress.user_id==user.id,Progress.topic==data.topic)) or Progress(user_id=user.id,topic=data.topic)
    row.percent=data.percent; row.updated_at=datetime.utcnow(); db.add(row); db.commit(); return row


@app.get("/reminders")
def reminders(user: Me, db: DB): return db.scalars(select(Reminder).where(Reminder.user_id==user.id)).all()


@app.post("/reminders", status_code=201)
def add_reminder(data: ReminderIn, user: Me, db: DB):
    row=Reminder(user_id=user.id,**data.model_dump()); db.add(row); record_activity(db,user.id,"reminder","Created a learning reminder"); db.commit(); db.refresh(row); return row


@app.patch("/reminders/{reminder_id}")
def update_reminder(reminder_id: int, data: ReminderUpdate, user: Me, db: DB):
    row=db.scalar(select(Reminder).where(Reminder.id==reminder_id,Reminder.user_id==user.id))
    if not row: raise HTTPException(404,"Reminder not found")
    row.completed=data.completed; db.add(row); record_activity(db,user.id,"reminder",f"{'Completed' if data.completed else 'Reopened'} reminder"); db.commit(); db.refresh(row); return row


@app.get("/activity")
def activity(user: Me, db: DB): return db.scalars(select(Activity).where(Activity.user_id==user.id).order_by(Activity.created_at.desc()).limit(20)).all()


@app.get("/dashboard")
def dashboard(user: Me, db: DB):
    road=roadmap(user,db); latest=db.scalar(select(Assessment).where(Assessment.user_id==user.id).order_by(Assessment.created_at.desc()))
    current=next((item for item in road.items if item["status"] in {"available","in_progress"}), None)
    project_rows=projects(user,db); recent=activity(user,db)
    return {"user":{"name":user.name,"career_goal":user.profile.career_goal},"progress":progress(user,db),"roadmap":road,"current_item":current,"weak_areas":latest.weak_topics if latest else [],"recommended_next_topic":current["title"] if current else None,"recommended_project":project_rows[0] if project_rows else None,"updates":updates(user,db)[:1],"recent_activity":recent[:5]}

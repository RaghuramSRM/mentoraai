import os
import tempfile
from pathlib import Path
from uuid import uuid4

TEST_DB = Path(tempfile.gettempdir()) / f"mentora_phase1_{uuid4().hex}.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["JWT_SECRET"] = "test-secret"

from fastapi.testclient import TestClient
from app.content import QUESTIONS, QUIZ_QUESTIONS
from app.main import app
from app.rag import ingest, retrieve

client = TestClient(app)
correct_answers = {q["id"]: q["correct_answer"] for q in QUESTIONS}
quiz_answers = {q["id"]: q["correct_answer"] for q in QUIZ_QUESTIONS}


def create_user(email, goal, skills, experience="Intermediate", study_time="1 hour"):
    registered = client.post("/auth/register", json={"name": email.split("@")[0], "email": email, "password": "Testing123!"})
    assert registered.status_code == 201
    headers = {"Authorization": f"Bearer {registered.json()['access_token']}"}
    profile = {"education":"B.E. CSE","branch":"CSE","year":"3","experience_level":experience,"career_goal":goal,"daily_study_time":study_time,"skills":skills,"onboarding_completed":True}
    assert client.put("/profile", headers=headers, json=profile).status_code == 200
    return headers


def assessment_payload(headers, weak_topic=None, half_topic=None):
    questions = client.get("/assessment/questions", headers=headers).json()
    per_topic_seen = {}
    answers = []
    for question in questions:
        selected = correct_answers[question["id"]]
        if question["topic"] == weak_topic:
            selected = (selected + 1) % len(question["options"])
        elif question["topic"] == half_topic:
            per_topic_seen[half_topic] = per_topic_seen.get(half_topic, 0) + 1
            if per_topic_seen[half_topic] == 1:
                selected = (selected + 1) % len(question["options"])
        answers.append({"question_id":question["id"],"selected_answer":selected})
    return {"answers":answers}


def test_login_protection_and_profile_hydration():
    login = client.post("/auth/login", json={"email":"demo@mentora.ai","password":"MentoraDemo123!"})
    assert login.status_code == 200
    assert client.get("/profile").status_code in {401, 403}
    profile = client.get("/profile", headers={"Authorization":f"Bearer {login.json()['access_token']}"})
    assert profile.status_code == 200
    assert profile.json()["onboarding_completed"] is True


def test_topic_scoring_and_assessment_history():
    headers = create_user("scoring@example.com", "AI Engineer", ["Python"])
    result = client.post("/assessment/submit", headers=headers, json=assessment_payload(headers, weak_topic="Machine Learning", half_topic="Data Science"))
    assert result.status_code == 200
    body = result.json()
    assert body["topic_scores"]["Machine Learning"] == 0
    assert body["topic_scores"]["Data Science"] == 50
    assert "Machine Learning" in body["weak_topics"]
    assert "Data Science" in body["average_topics"]
    assert "Python" in body["strong_topics"]
    second = client.post("/assessment/submit", headers=headers, json=assessment_payload(headers))
    assert second.status_code == 200
    history = client.get("/assessments", headers=headers).json()
    assert len(history) == 2
    assert history[0]["topic_scores"]


def test_career_and_assessment_personalization_differs():
    ai = create_user("ai@example.com", "AI Engineer", ["Python", "SQL"])
    web = create_user("web@example.com", "Full Stack Developer", ["HTML/CSS"])
    assert client.post("/assessment/submit", headers=ai, json=assessment_payload(ai, weak_topic="Machine Learning")).status_code == 200
    assert client.post("/assessment/submit", headers=web, json=assessment_payload(web, weak_topic="Web Development")).status_code == 200
    ai_road = client.get("/roadmap", headers=ai).json()["items"]
    web_road = client.get("/roadmap", headers=web).json()["items"]
    assert [item["title"] for item in ai_road[:5]] == ["Python", "Mathematics & Statistics", "Data Science", "SQL", "Machine Learning"]
    assert web_road[0]["title"] == "HTML/CSS"
    assert {x["title"] for x in ai_road} != {x["title"] for x in web_road}


def test_current_skills_and_results_change_priority():
    weak_python = create_user("weakpython@example.com", "Data Scientist", [])
    strong_python = create_user("strongpython@example.com", "Data Scientist", ["Python"])
    client.post("/assessment/submit", headers=weak_python, json=assessment_payload(weak_python, weak_topic="Python"))
    client.post("/assessment/submit", headers=strong_python, json=assessment_payload(strong_python))
    weak_titles = [x["title"] for x in client.get("/roadmap", headers=weak_python).json()["items"]]
    strong_titles = [x["title"] for x in client.get("/roadmap", headers=strong_python).json()["items"]]
    assert weak_titles.index("Python") == strong_titles.index("Python") == 0
    strong_road = client.get("/roadmap", headers=strong_python).json()["items"]
    assert strong_road[0]["status"] == "completed"


def test_completion_unlocks_next_and_calculates_progress():
    headers = create_user("progress@example.com", "AI Engineer", ["Python"])
    client.post("/assessment/submit", headers=headers, json=assessment_payload(headers, weak_topic="Machine Learning"))
    road = client.get("/roadmap", headers=headers).json()
    assert road["items"][0]["status"] == "completed"
    assert road["items"][1]["status"] == "available"
    completed = client.post(f"/roadmap/items/{road['items'][1]['id']}/complete", headers=headers)
    assert completed.status_code == 200
    updated = completed.json()
    assert updated["items"][1]["status"] == "completed"
    first_incomplete = next(item for item in updated["items"] if item["status"] != "completed")
    assert first_incomplete["status"] == "available"
    completed_count = sum(item["status"] == "completed" for item in updated["items"])
    assert updated["overall_progress"] == round(completed_count * 100 / len(updated["items"]), 1)


def test_roadmap_user_isolation():
    owner = create_user("owner@example.com", "AI Engineer", [])
    other = create_user("other@example.com", "Full Stack Developer", [])
    client.post("/assessment/submit", headers=owner, json=assessment_payload(owner))
    client.post("/assessment/submit", headers=other, json=assessment_payload(other))
    owner_item = client.get("/roadmap", headers=owner).json()["items"][0]["id"]
    assert client.post(f"/roadmap/items/{owner_item}/complete", headers=other).status_code == 404


def test_career_goal_change_regenerates_active_roadmap_and_dashboard():
    headers = create_user("goal-change@example.com", "AI Engineer", ["Python", "SQL"])
    original = client.get("/roadmap", headers=headers).json()
    assert original["career_goal"] == "AI Engineer"
    profile = client.get("/profile", headers=headers).json()
    profile["career_goal"] = "Full Stack Developer"
    updated = client.put("/profile", headers=headers, json=profile)
    assert updated.status_code == 200

    road = client.get("/roadmap", headers=headers).json()
    titles = [item["title"] for item in road["items"]]
    assert road["career_goal"] == "Full Stack Developer"
    assert road["title"] == "Full Stack Developer Learning Path"
    assert titles[:4] == ["HTML/CSS", "JavaScript", "TypeScript", "React"]
    assert "Deep Learning" not in titles

    dashboard = client.get("/dashboard", headers=headers).json()
    assert dashboard["user"]["career_goal"] == "Full Stack Developer"
    assert dashboard["roadmap"]["career_goal"] == "Full Stack Developer"
    assert dashboard["recommended_next_topic"] in titles


def generate_quiz(headers, topic="Python"):
    result = client.post("/quiz/generate", headers=headers, json={"topic":topic,"difficulty":"adaptive","count":5})
    assert result.status_code == 200
    return result.json()


def submit_quiz(headers, quiz, correct=True):
    answers=[]
    for question in quiz["questions"]:
        answer=quiz_answers[question["id"]]
        if not correct: answer=(answer+1)%len(question["options"])
        answers.append({"question_id":question["id"],"selected_answer":answer})
    return client.post(f"/quiz/{quiz['attempt_id']}/submit",headers=headers,json={"answers":answers})


def test_quiz_generation_submission_explanations_and_history():
    headers=create_user("quiz@example.com","AI Engineer",["Python"])
    quiz=generate_quiz(headers)
    assert quiz["difficulty"] == "beginner"
    assert all("correct_answer" not in q for q in quiz["questions"])
    submitted=submit_quiz(headers,quiz).json()
    assert submitted["percentage"] == 100
    assert submitted["next_difficulty"] == "advanced"
    assert all(item["explanation"] for item in submitted["review"])
    history=client.get("/quiz/history",headers=headers).json()
    assert len(history)==1 and history[0]["status"]=="completed"


def test_quiz_adapts_and_updates_topic_mastery():
    headers=create_user("adaptive@example.com","AI Engineer",["Python"])
    first=generate_quiz(headers); submit_quiz(headers,first,correct=True)
    second=generate_quiz(headers)
    assert second["difficulty"] == "advanced"
    low=submit_quiz(headers,second,correct=False).json()
    assert low["weak_topics"] == ["Python"]
    assert low["next_difficulty"] == "beginner"
    progress=client.get("/progress",headers=headers).json()
    python=next(x for x in progress["topics"] if x["topic"]=="Python")
    assert python["percent"] == 0


def test_quiz_attempt_isolation_and_no_resubmission():
    owner=create_user("quizowner@example.com","AI Engineer",[])
    other=create_user("quizother@example.com","AI Engineer",[])
    quiz=generate_quiz(owner)
    payload={"answers":[{"question_id":q["id"],"selected_answer":quiz_answers[q["id"]]} for q in quiz["questions"]]}
    assert client.post(f"/quiz/{quiz['attempt_id']}/submit",headers=other,json=payload).status_code==404
    assert client.post(f"/quiz/{quiz['attempt_id']}/submit",headers=owner,json=payload).status_code==200
    assert client.post(f"/quiz/{quiz['attempt_id']}/submit",headers=owner,json=payload).status_code==409


def test_rag_ingestion_retrieval_and_grounded_tutor():
    assert ingest(force=True) >= 13
    result=retrieve("Why does binary search need sorted data?",2)
    assert result and result[0]["topic"]=="dsa"
    headers=create_user("rag@example.com","Software Developer",["Python","DSA"])
    chat=client.post("/mentor/chat",headers=headers,json={"message":"Explain binary search"})
    assert chat.status_code==200
    assert chat.json()["agent"]=="Tutor"
    assert chat.json()["sources"]
    assert "O(log n)" in chat.json()["response"]
    assert 200 <= len(chat.json()["response"]) < 1800
    assert len(chat.json()["sources"]) == len(set(chat.json()["sources"]))


def test_rag_covers_all_learning_paths():
    expected = {
        "neural network": "deep-learning",
        "gradient descent": "mathematics-statistics",
        "model monitoring and drift": "mlops",
        "Git commits and pull requests": "software-engineering",
        "HTML CSS and JavaScript": "web-development",
        "data visualization charts": "data-science",
        "SQL transactions and indexes": "sql",
        "recursion and dynamic programming": "dsa",
        "large language model tokens": "generative-ai",
        "technical project portfolio": "projects",
    }
    for query, topic in expected.items():
        result = retrieve(query, 3)
        assert any(item["topic"] == topic for item in result), (query, result)

    headers = create_user("broad-rag@example.com", "AI Engineer", ["Python"])
    chat = client.post("/mentor/chat", headers=headers, json={"message": "Explain neural networks in simple terms"})
    assert chat.status_code == 200
    assert "layered mathematical model" in chat.json()["response"]
    assert "Backpropagation" in chat.json()["response"]
    assert "deep-learning/fundamentals.md" in chat.json()["sources"]


def test_computed_career_projects_and_project_progress():
    headers=create_user("career@example.com","Full Stack Developer",["JavaScript","React"])
    analysis=client.get("/career/analysis",headers=headers).json()
    assert "JavaScript" in analysis["required_skills"]
    assert "JavaScript" not in analysis["skill_gaps"]
    assert analysis["certifications"] and analysis["interview_preparation"]
    projects=client.get("/projects",headers=headers).json()
    updated=client.patch(f"/projects/{projects[0]['id']}",headers=headers,json={"status":"in_progress","progress":40})
    assert updated.status_code==200 and updated.json()["progress"]==40


def test_reminder_completion_activity_and_real_streak():
    headers=create_user("activity@example.com","AI Engineer",[])
    reminder=client.post("/reminders",headers=headers,json={"title":"Study SQL","due_at":None})
    assert reminder.status_code==201
    completed=client.patch(f"/reminders/{reminder.json()['id']}",headers=headers,json={"completed":True})
    assert completed.status_code==200 and completed.json()["completed"] is True
    activities=client.get("/activity",headers=headers).json()
    assert len(activities)>=2
    progress=client.get("/progress",headers=headers).json()
    assert progress["streak"]==1 and progress["longest_streak"]==1

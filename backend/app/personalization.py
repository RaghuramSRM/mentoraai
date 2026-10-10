from collections import defaultdict
from uuid import uuid4
from .content import QUESTIONS

WEAK_THRESHOLD, STRONG_THRESHOLD = 50, 80
CAREER_SKILLS = {
    "AI Engineer": ["Python", "Mathematics & Statistics", "Data Science", "SQL", "Machine Learning", "Deep Learning", "Generative AI", "RAG", "MLOps", "AI Projects"],
    "ML Engineer": ["Python", "Mathematics & Statistics", "Data Science", "SQL", "Machine Learning", "Deep Learning", "MLOps", "ML Projects"],
    "Data Scientist": ["Python", "Statistics", "Data Science", "SQL", "Visualization", "Machine Learning", "Data Projects"],
    "Data Analyst": ["SQL", "Data Science", "Statistics", "Visualization", "Analytics Projects"],
    "Full Stack Developer": ["HTML/CSS", "JavaScript", "TypeScript", "React", "Web Development", "APIs", "SQL", "Authentication", "Deployment", "Web Projects"],
    "Software Developer": ["Python", "DSA", "Git", "APIs", "SQL", "Testing", "Deployment", "Software Projects"],
}
ALIASES = {"JavaScript": "Web Development", "TypeScript": "Web Development", "React": "Web Development", "HTML/CSS": "Web Development", "APIs": "Web Development", "RAG": "Generative AI", "Deep Learning": "Machine Learning", "Statistics": "Data Science", "Visualization": "Data Science"}
DESCRIPTIONS = {"Python": "Write clear Python programs and use core data structures.", "DSA": "Build efficient solutions with common data structures and algorithms.", "SQL": "Query, join and model relational data confidently.", "Mathematics & Statistics": "Build the linear algebra, probability and statistics foundation used in machine learning.", "Machine Learning": "Train, validate and evaluate predictive models.", "Data Science": "Clean, explore and communicate insights from data.", "Web Development": "Build accessible, API-driven web applications.", "Generative AI": "Understand LLM applications, prompting, embeddings and evaluation.", "Deep Learning": "Learn neural networks, optimization and modern architectures.", "RAG": "Build grounded assistants with retrieval and source-aware generation.", "MLOps": "Package, deploy and monitor machine-learning systems."}

def assessment_topics(profile):
    available, preferred = {q["topic"] for q in QUESTIONS}, []
    for skill in [*CAREER_SKILLS.get(profile.career_goal, CAREER_SKILLS["Software Developer"]), *(profile.skills or [])]:
        topic = ALIASES.get(skill, skill)
        if topic in available and topic not in preferred: preferred.append(topic)
    for fallback in ["Python", "DSA", "SQL"]:
        if fallback not in preferred: preferred.append(fallback)
    return preferred[:5]

def select_questions(profile):
    return [q for topic in assessment_topics(profile) for q in QUESTIONS if q["topic"] == topic][:10]

def score_assessment(answer_map, questions):
    grouped, correct_total, review = defaultdict(lambda: {"correct": 0, "total": 0}), 0, []
    for q in questions:
        if q["id"] not in answer_map: raise ValueError(f"Missing answer for question {q['id']}")
        selected = answer_map[q["id"]]
        if selected >= len(q["options"]): raise ValueError(f"Invalid option for question {q['id']}")
        correct = selected == q["correct_answer"]; correct_total += int(correct)
        grouped[q["topic"]]["correct"] += int(correct); grouped[q["topic"]]["total"] += 1
        review.append({"question_id": q["id"], "correct": correct, "correct_answer": q["correct_answer"], "explanation": q["explanation"]})
    scores = {t: round(v["correct"] / v["total"] * 100) for t, v in grouped.items()}
    return {"score": correct_total, "total": len(questions), "percentage": round(correct_total / len(questions) * 100), "topic_scores": scores, "weak_topics": [t for t,s in scores.items() if s < WEAK_THRESHOLD], "average_topics": [t for t,s in scores.items() if WEAK_THRESHOLD <= s < STRONG_THRESHOLD], "strong_topics": [t for t,s in scores.items() if s >= STRONG_THRESHOLD], "review": review}

def generate_roadmap(profile, result):
    catalog = CAREER_SKILLS.get(profile.career_goal, CAREER_SKILLS["Software Developer"])
    scores, strong, current = result.get("topic_scores", {}), set(result.get("strong_topics", [])), {s.lower() for s in (profile.skills or [])}
    days, items = {"30 min": 14, "1 hour": 8, "2 hours": 5, "3+ hours": 3}.get(profile.daily_study_time, 8), []
    first_incomplete_found = False
    for order, skill in enumerate(catalog, start=1):
        assessed, score = ALIASES.get(skill, skill), scores.get(ALIASES.get(skill, skill))
        difficulty = "advanced" if profile.experience_level == "Advanced" or score == 100 else "beginner" if profile.experience_level == "Beginner" or score == 0 else "intermediate"
        mastered = assessed in strong or (skill.lower() in current and assessed not in scores)
        status, progress = ("completed", 100) if mastered else (("available", 0) if not first_incomplete_found else ("locked", 0))
        if not mastered: first_incomplete_found = True
        items.append({"id": uuid4().hex[:12], "title": skill, "topic": assessed, "description": DESCRIPTIONS.get(skill, f"Develop practical {skill} skills for the {profile.career_goal} path."), "difficulty": difficulty, "estimated_time": f"{days} days", "prerequisite": items[-1]["title"] if items else None, "order": order, "status": status, "progress": progress, "sequence_version": 2})
    return items

def normalize_access(items):
    first_incomplete_found = False
    for item in items:
        if item.get("status") == "completed" or float(item.get("progress", 0)) >= 100:
            item["status"], item["progress"] = "completed", 100
        elif not first_incomplete_found:
            item["status"] = "in_progress" if float(item.get("progress", 0)) > 0 else "available"
            first_incomplete_found = True
        else:
            item["status"] = "locked"
    return items

def roadmap_progress(items):
    return round(sum(float(item.get("progress", 0)) for item in items) / len(items), 1) if items else 0

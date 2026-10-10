from .content import QUIZ_QUESTIONS

DIFFICULTIES = ["beginner", "intermediate", "advanced"]


def adaptive_difficulty(previous_percentage):
    if previous_percentage is None:
        return "beginner"
    if previous_percentage >= 80:
        return "advanced"
    if previous_percentage >= 60:
        return "intermediate"
    return "beginner"


def select_quiz_questions(topic, difficulty, count):
    topic_pool = [q for q in QUIZ_QUESTIONS if q["topic"].lower() == topic.lower()]
    if not topic_pool:
        raise ValueError("Unsupported quiz topic")
    preferred = [q for q in topic_pool if q["difficulty"] == difficulty]
    others = [q for q in topic_pool if q not in preferred]
    return (preferred + others)[:count]


def score_quiz(answer_map, questions):
    if set(answer_map) != {q["id"] for q in questions}:
        raise ValueError("Answers must match this quiz")
    review, score = [], 0
    for q in questions:
        selected = answer_map[q["id"]]
        if selected >= len(q["options"]):
            raise ValueError(f"Invalid option for question {q['id']}")
        correct = selected == q["correct_answer"]
        score += int(correct)
        review.append({"question_id":q["id"],"question":q["question"],"selected_answer":selected,"correct_answer":q["correct_answer"],"correct":correct,"explanation":q["explanation"]})
    percentage = round(score / len(questions) * 100)
    return {"score":score,"total":len(questions),"percentage":percentage,"review":review}

import re

from .content import PROJECTS, UPDATES
from .providers import DemoProvider, ProviderError, get_provider
from .rag import normalized_tokens


def choose_agent(message: str):
    text = message.lower()
    if any(x in text for x in ["career", "job", "become", "skill gap", "interview", "certification"]): return "Career Coach"
    if any(x in text for x in ["quiz", "test me", "question"]): return "Quiz Master"
    if any(x in text for x in ["project", "portfolio", "build"]): return "Project Guide"
    if any(x in text for x in ["latest", "research", "news", "update"]): return "Researcher"
    if any(x in text for x in ["remind", "schedule"]): return "Reminder"
    return "Tutor"


def _grounded_demo_answer(message: str, retrieved: list[dict]) -> str:
    query_terms = set(normalized_tokens(message)) - {
        "a", "an", "and", "explain", "how", "in", "is", "me", "simply", "the", "to", "what",
    }
    if not retrieved:
        return "I could not find a sufficiently relevant grounded lesson. Try naming the concept, tool, or roadmap topic you want to learn."

    primary_topic = retrieved[0]["topic"]
    candidates = []
    source_order = 0
    for chunk_index, chunk in enumerate(retrieved):
        if chunk["topic"] != primary_topic:
            continue
        for sentence in re.split(r"\n+|(?<=[.!?])\s+", chunk["text"]):
            clean = sentence.strip().lstrip("# ")
            if not clean or len(clean.split()) < 4:
                continue
            terms = set(normalized_tokens(clean))
            relevance = len(query_terms & terms)
            candidates.append({
                "text": clean,
                "relevance": relevance,
                "chunk": chunk_index,
                "order": source_order,
            })
            source_order += 1

    if candidates:
        lead = max(candidates, key=lambda item: (item["relevance"], -item["chunk"], -item["order"]))
        selected = [lead["text"]]
        for item in sorted(candidates, key=lambda value: (value["chunk"], value["order"])):
            if item["text"] not in selected:
                selected.append(item["text"])
            if len(selected) == 8 or sum(len(value) for value in selected) > 1500:
                break
        return " ".join(selected)
    return "I could not find a sufficiently relevant grounded lesson. Try naming the concept, tool, or roadmap topic you want to learn."


def run_agent(agent, message, profile, retrieved):
    provider = get_provider()
    context = "\n\n".join(chunk["text"] for chunk in retrieved)
    learner = f"Career goal: {profile.career_goal}; experience: {profile.experience_level}; skills: {', '.join(profile.skills or [])}."
    if isinstance(provider, DemoProvider):
        if agent == "Tutor":
            return _grounded_demo_answer(message, retrieved)
        if agent == "Quiz Master": return "Open Adaptive Quiz to start a persisted, scored quiz whose difficulty changes with your performance."
        if agent == "Career Coach": return f"For your {profile.career_goal} goal, use Career & Projects for a computed skill-gap plan based on your saved skills."
        if agent == "Project Guide": return f"A useful next project is {PROJECTS[1]['title']}: {PROJECTS[1]['description']}"
        if agent == "Researcher": return UPDATES[0]["summary"]
        return "Open Reminders to create a persistent learning reminder."
    prompts = {
        "Tutor": "Teach clearly at the learner's stated level. Use only the retrieved context for factual claims and say when context is insufficient.",
        "Quiz Master": "Guide the learner to the adaptive quiz feature; do not invent an unscored quiz in chat.",
        "Career Coach": "Give concise, actionable career guidance grounded in the learner profile.",
        "Project Guide": "Recommend one feasible portfolio project and explain why it fits the learner.",
        "Researcher": "Summarize the supplied research update without inventing facts.",
        "Reminder": "Help the learner phrase a concrete reminder; do not claim it was saved.",
    }
    return provider.generate(prompts[agent], f"{learner}\nRetrieved context:\n{context}\nLearner request: {message}")

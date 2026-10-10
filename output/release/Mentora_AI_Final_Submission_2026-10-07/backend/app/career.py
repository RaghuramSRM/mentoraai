from .personalization import CAREER_SKILLS

CERTIFICATIONS = {
    "AI Engineer": ["Microsoft Azure AI Engineer Associate", "AWS Certified Machine Learning Engineer"],
    "Full Stack Developer": ["Meta Front-End Developer", "AWS Certified Developer"],
    "Data Scientist": ["Google Advanced Data Analytics", "Microsoft Azure Data Scientist Associate"],
}

def analyze(profile):
    required = CAREER_SKILLS.get(profile.career_goal, CAREER_SKILLS["Software Developer"])
    owned = {skill.lower() for skill in profile.skills or []}
    gaps = [skill for skill in required if skill.lower() not in owned]
    return {"goal":profile.career_goal,"strengths":profile.skills or [],"required_skills":required,"skill_gaps":gaps,"next_steps":[f"Learn {skill}" for skill in gaps[:4]],"certifications":CERTIFICATIONS.get(profile.career_goal, ["Choose a role-relevant cloud or platform certification after building core projects"]),"interview_preparation":["Explain one project end to end","Practice role-specific fundamentals","Prepare behavioral STAR stories"]}

def project_score(project, profile):
    goal_match = 4 if profile.career_goal in (project.career_goals or []) else 0
    owned = {s.lower() for s in profile.skills or []}
    skill_match = sum(1 for skill in project.skills or [] if skill.lower() in owned)
    return goal_match + skill_match

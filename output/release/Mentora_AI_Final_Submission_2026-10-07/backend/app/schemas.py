from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileIn(BaseModel):
    education: str = ""
    branch: str = ""
    year: str = ""
    experience_level: str = "Beginner"
    career_goal: str = "AI Engineer"
    daily_study_time: str = "1 hour"
    skills: list[str] = []
    onboarding_completed: bool = True


class AssessmentAnswer(BaseModel):
    question_id: int
    selected_answer: int = Field(ge=0)


class AssessmentSubmit(BaseModel):
    answers: list[AssessmentAnswer] = Field(min_length=1)


class MentorIn(BaseModel):
    message: str = Field(min_length=2, max_length=4000)


class QuizRequest(BaseModel):
    topic: str = "Python"
    difficulty: str = "adaptive"
    count: int = Field(default=5, ge=1, le=10)


class QuizSubmit(BaseModel):
    answers: list[AssessmentAnswer] = Field(min_length=1)


class ProgressIn(BaseModel):
    topic: str
    percent: float = Field(ge=0, le=100)


class RoadmapProgressIn(BaseModel):
    progress: float = Field(ge=0, le=100)
    status: str | None = None


class ReminderIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    due_at: datetime | None = None


class ReminderUpdate(BaseModel):
    completed: bool


class UserProjectUpdate(BaseModel):
    status: str | None = None
    progress: float | None = Field(default=None, ge=0, le=100)

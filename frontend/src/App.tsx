import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Route,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { clearToken, getToken, request, setToken, submitProjectEvidence } from "./api";

type View =
  | "dashboard"
  | "roadmap"
  | "mentor"
  | "marketplace"
  | "assessment"
  | "quiz"
  | "career"
  | "updates"
  | "progress"
  | "reminders"
  | "onboarding";
type Dashboard = any;
const nav = [
  ["dashboard", "Overview", LayoutDashboard],
  ["roadmap", "Roadmap", Route],
  ["mentor", "AI Mentor", Bot],
  ["marketplace", "Marketplace", ShoppingBag],
  ["assessment", "Assessment", BookOpen],
  ["quiz", "Adaptive Quiz", Target],
  ["career", "Career & Projects", BriefcaseBusiness],
  ["updates", "AI Updates", Lightbulb],
  ["progress", "Progress", TrendingUp],
  ["reminders", "Reminders", Bell],
] as const;


function Login({ onDone }: { onDone: () => void }) {
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@mentora.ai");
  const [password, setPassword] = useState("MentoraDemo123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await request(registering ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(
          registering ? { name, email, password } : { email, password },
        ),
      });
      setToken(r.access_token);
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="brand-mark">
          <Sparkles /> Mentora AI
        </div>
        <div>
          <p className="eyebrow">PERSONALIZED. ADAPTIVE. AGENTIC.</p>
          <h1>Build the skills your future needs.</h1>
          <p className="hero-copy">
            One mentor that assesses, plans, teaches, tests and guides your
            career — around your goals and pace.
          </p>
        </div>
        <div className="agent-row">
          <span>Tutor</span>
          <span>Quiz Master</span>
          <span>Career Coach</span>
          <span>Researcher</span>
        </div>
      </section>
      <section className="login-card">
        <div>
          <p className="eyebrow purple">
            {registering ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}
          </p>
          <h2>
            {registering ? "Start your journey" : "Continue your journey"}
          </h2>
          <p className="muted">
            Use the demo account to explore the complete flow.
          </p>
        </div>
        <form onSubmit={submit}>
          {registering && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </label>
          )}
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={busy}>
            {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}{" "}
            <ChevronRight size={18} />
          </button>
        </form>
        <button
          className="link auth-switch"
          onClick={() => {
            setRegistering(!registering);
            setError("");
          }}
        >
          {registering
            ? "Already have an account? Sign in"
            : "New learner? Create an account"}
        </button>
        <div className="demo-note">
          <strong>Demo credentials loaded</strong>
          <span>All features work without an AI API key.</span>
        </div>
      </section>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="stat">
      <span className={`icon ${tone}`}>
        <Icon size={21} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function DashboardView({
  data,
  setView,
}: {
  data: Dashboard;
  setView: (v: View) => void;
}) {
  const road = data.roadmap.items;
  const current = data.current_item;
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">YOUR LEARNING HOME</p>
          <h1>
            Good evening, {data.user.name.split(" ")[0]} <span>👋</span>
          </h1>
          <p className="muted">
            Small focused steps compound into remarkable careers.
          </p>
        </div>
        <button className="primary compact" onClick={() => setView("mentor")}>
          <Bot size={18} /> Ask Mentora
        </button>
      </header>
      <section className="stats">
        <Stat
          icon={TrendingUp}
          value={`${data.progress.overall}%`}
          label="Roadmap progress"
          tone="purple"
        />
        <Stat
          icon={Target}
          value={data.user.career_goal}
          label="Career goal"
          tone="blue"
        />
        <Stat
          icon={CheckCircle2}
          value={`${data.progress.assessment_average}%`}
          label="Assessment average"
          tone="green"
        />
        <Stat
          icon={BookOpen}
          value={`${road.filter((x: any) => x.status === "completed").length}/${road.length}`}
          label="Topics completed"
          tone="orange"
        />
      </section>
      <div className="grid-main">
        <section className="panel roadmap-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow purple">PERSONALIZED ROADMAP</p>
              <h2>{data.roadmap.title}</h2>
            </div>
            <button className="link" onClick={() => setView("roadmap")}>
              View all <ChevronRight size={16} />
            </button>
          </div>
          <div className="timeline">
            {road.slice(0, 4).map((item: any, i: number) => (
              <div className={`timeline-item ${item.status}`} key={item.id}>
                <span>
                  {item.status === "completed" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  {item.status === "in_progress" && (
                    <div className="bar">
                      <i style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                </div>
                <em>{item.status.replace("_", " ")}</em>
              </div>
            ))}
          </div>
        </section>
        <aside className="stack">
          <section className="panel next-card">
            <p className="eyebrow">RECOMMENDED NEXT TOPIC</p>
            <h3>{current?.title || "Roadmap complete"}</h3>
            <p>{current?.description || "You completed every roadmap item."}</p>
            <button className="soft" onClick={() => setView("roadmap")}>
              Open roadmap <ChevronRight size={16} />
            </button>
          </section>
          <section className="panel">
            <p className="eyebrow purple">WEAK AREAS</p>
            <div className="chips">
              {data.weak_areas.length ? (
                data.weak_areas.map((x: string) => <span key={x}>{x}</span>)
              ) : (
                <span>No weak areas detected</span>
              )}
            </div>
          </section>
          <section className="panel">
            <p className="eyebrow purple">RECENT ACTIVITY</p>
            {data.recent_activity.length ? (
              data.recent_activity.slice(0, 3).map((item: any) => (
                <div className="activity-row" key={item.id}>
                  <strong>{item.detail}</strong>
                  <small>
                    {new Date(item.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))
            ) : (
              <p className="muted">
                Complete a lesson or quiz to begin your activity history.
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function RoadmapView({
  data,
  onRefresh,
}: {
  data: any;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState("");
  async function update(item: any, complete = false) {
    setBusy(item.id);
    try {
      await request(`/roadmap/items/${item.id}${complete ? "/complete" : ""}`, {
        method: complete ? "POST" : "PATCH",
        body: complete
          ? undefined
          : JSON.stringify({
              progress: item.progress || 10,
              status: "in_progress",
            }),
      });
      await onRefresh();
    } finally {
      setBusy("");
    }
  }
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">PERSONALIZED PATH</p>
          <h1>{data.title}</h1>
          <p className="muted">
            Generated from your goal, skills and assessment performance ·{" "}
            {data.overall_progress}% complete
          </p>
        </div>
      </header>
      <div className="learning-path">
        {data.items.map((x: any, i: number) => (
          <article className={`path-card ${x.status}`} key={x.id}>
            <div className="path-number">
              {x.status === "completed" ? <CheckCircle2 /> : i + 1}
            </div>
            <div className="grow">
              <div className="panel-head">
                <div>
                  <span className="badge">{x.status.replace("_", " ")}</span>
                  <h2>{x.title}</h2>
                </div>
                <strong>{x.progress}%</strong>
              </div>
              <p>{x.description}</p>
              <div className="chips">
                <span>{x.difficulty}</span>
                <span>{x.estimated_time}</span>
                {x.prerequisite && <span>After: {x.prerequisite}</span>}
              </div>
              <div className="bar">
                <i style={{ width: `${x.progress}%` }} />
              </div>
              {x.status !== "locked" && x.status !== "completed" && (
                <div className="roadmap-actions">
                  <button
                    className="soft"
                    disabled={busy === x.id}
                    onClick={() => update(x)}
                  >
                    Mark in progress
                  </button>
                  <button
                    className="primary compact"
                    disabled={busy === x.id}
                    onClick={() => update(x, true)}
                  >
                    Complete topic
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MentorView() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!message.trim()) return;
    const q = message;
    setMessage("");
    setChat((c) => [...c, { role: "user", text: q }]);
    setBusy(true);
    try {
      const r = await request("/mentor/chat", {
        method: "POST",
        body: JSON.stringify({ message: q }),
      });
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: r.response,
          agent: r.agent,
          sources: r.sources,
        },
      ]);
    } catch (e: any) {
      setChat((c) => [...c, { role: "error", text: e.message }]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mentor-layout">
      <div className="mentor-main">
        <header className="page-head">
          <div>
            <p className="eyebrow purple">MULTI-AGENT LEARNING ASSISTANT</p>
            <h1>Ask Mentora</h1>
            <p className="muted">
              Your request is routed to the specialist best equipped to help.
            </p>
          </div>
        </header>
        <div className="chat">
          {chat.length === 0 && (
            <div className="empty">
              <span className="big-icon">
                <Bot />
              </span>
              <h2>What would you like to learn?</h2>
              <p>
                Ask for an explanation, quiz, project, career plan, or AI
                update.
              </p>
              <div className="prompts">
                {[
                  "Explain overfitting",
                  "Test me on Python",
                  "What should I learn for my career?",
                ].map((p) => (
                  <button onClick={() => setMessage(p)} key={p}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <small>{m.agent || m.role}</small>
              <p>{m.text}</p>
              {m.sources?.length > 0 && (
                <em>Grounded in: {m.sources.join(", ")}</em>
              )}
            </div>
          ))}
          {busy && (
            <div className="bubble assistant">
              <small>Orchestrator</small>
              <p>Choosing the right specialist…</p>
            </div>
          )}
        </div>
        <div className="composer">
          <textarea
            value={message}
            placeholder="Explain neural networks in simple terms"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="primary" onClick={send} disabled={busy}>
            Send <Sparkles size={17} />
          </button>
        </div>
      </div>
      <aside className="agent-panel">
        <p className="eyebrow purple">SPECIALISTS</p>
        {[
          "Tutor",
          "Quiz Master",
          "Career Coach",
          "Project Guide",
          "Researcher",
        ].map((a, i) => (
          <div className="agent" key={a}>
            <span>{i + 1}</span>
            <div>
              <strong>{a}</strong>
              <small>
                {
                  [
                    "Explains with context",
                    "Tests and adapts",
                    "Maps career gaps",
                    "Turns skills into proof",
                    "Simplifies new ideas",
                  ][i]
                }
              </small>
            </div>
          </div>
        ))}
      </aside>
    </section>
  );
}

function AssessmentView({ onComplete }: { onComplete: () => Promise<void> }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    request("/assessment/questions")
      .then(setQuestions)
      .catch((e) => setError(e.message));
  }, []);
  async function submit() {
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id],
      }));
      const r = await request("/assessment/submit", {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      setResult(r);
      await onComplete();
    } catch (e: any) {
      setError(e.message);
    }
  }
  if (result)
    return (
      <div className="result panel">
        <span className="big-icon green">
          <CheckCircle2 />
        </span>
        <p className="eyebrow purple">ASSESSMENT COMPLETE</p>
        <h1>{result.percentage}%</h1>
        <p>
          You answered {result.score} of {result.total} correctly.
        </p>
        <div className="score-grid">
          {Object.entries(result.topic_scores).map(([topic, score]) => (
            <div key={topic}>
              <div className="panel-head">
                <strong>{topic}</strong>
                <span>{String(score)}%</span>
              </div>
              <div className="bar">
                <i style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
        <h3>Personalized next step</h3>
        <p>{result.adaptive_recommendation}</p>
        <div className="indicator-row">
          <div>
            <small>Strengths</small>
            <div className="chips success">
              {result.strong_topics.map((x: string) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
          <div>
            <small>Needs focus</small>
            <div className="chips">
              {result.weak_topics.map((x: string) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">PERSONALIZED SKILL CHECK</p>
          <h1>Career-aware assessment</h1>
          <p className="muted">
            Questions are selected from your goal and current skills.
          </p>
        </div>
      </header>
      {error && <div className="error-banner">{error}</div>}
      <div className="questions">
        {questions.map((q, i) => (
          <article className="panel question" key={q.id}>
            <div className="panel-head">
              <span className="badge">{q.topic}</span>
              <small>{q.difficulty}</small>
            </div>
            <h3>
              {i + 1}. {q.question}
            </h3>
            <div className="options">
              {q.options.map((o: string, j: number) => (
                <button
                  className={answers[q.id] === j ? "selected" : ""}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: j }))}
                  key={o}
                >
                  {String.fromCharCode(65 + j)}. {o}
                </button>
              ))}
            </div>
          </article>
        ))}
        <button
          className="primary"
          disabled={
            questions.length === 0 ||
            Object.keys(answers).length !== questions.length
          }
          onClick={submit}
        >
          Submit and personalize roadmap
        </button>
      </div>
    </section>
  );
}

function QuizView({ onComplete }: { onComplete: () => Promise<void> }) {
  const topics = [
    "Python",
    "DSA",
    "SQL",
    "Machine Learning",
    "Data Science",
    "Web Development",
    "Generative AI",
  ];
  const [topic, setTopic] = useState("Python");
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request("/quiz/history")
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  async function generate() {
    setBusy(true);
    setError("");
    setResult(null);
    setAnswers({});
    try {
      setQuiz(
        await request("/quiz/generate", {
          method: "POST",
          body: JSON.stringify({ topic, difficulty: "adaptive", count: 5 }),
        }),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const payload = quiz.questions.map((q: any) => ({
        question_id: q.id,
        selected_answer: answers[q.id],
      }));
      const response = await request(`/quiz/${quiz.attempt_id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      setResult(response);
      setHistory(await request("/quiz/history"));
      await onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (result)
    return (
      <section>
        <header className="page-head">
          <div>
            <p className="eyebrow purple">ADAPTIVE QUIZ COMPLETE</p>
            <h1>
              {result.percentage}% on {result.topic}
            </h1>
            <p className="muted">
              Next difficulty: <strong>{result.next_difficulty}</strong>
            </p>
          </div>
          <button className="primary compact" onClick={generate}>
            Try another quiz
          </button>
        </header>
        <div className="quiz-review">
          {result.review.map((item: any, index: number) => (
            <article
              className={`panel review-item ${item.correct ? "correct" : "incorrect"}`}
              key={item.question_id}
            >
              <div className="panel-head">
                <h3>
                  {index + 1}. {item.question}
                </h3>
                <span className="badge">
                  {item.correct ? "Correct" : "Review"}
                </span>
              </div>
              <p>{item.explanation}</p>
            </article>
          ))}
        </div>
      </section>
    );

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">ADAPTIVE PRACTICE</p>
          <h1>Quiz Master</h1>
          <p className="muted">
            Difficulty adapts from your most recent result in this topic.
          </p>
        </div>
      </header>
      {error && <div className="error-banner">{error}</div>}
      {!quiz ? (
        <div className="quiz-start">
          <section className="panel">
            <label>
              Choose a topic
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                {topics.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <button className="primary" onClick={generate} disabled={busy}>
              {busy ? "Preparing…" : "Start adaptive quiz"}
            </button>
          </section>
          <section className="panel">
            <h2>Recent attempts</h2>
            {history.length ? (
              history.slice(0, 5).map((item) => (
                <div className="history-row" key={item.id}>
                  <span>
                    {item.topic} · {item.difficulty}
                  </span>
                  <strong>{item.percentage}%</strong>
                </div>
              ))
            ) : (
              <p className="muted">No completed quizzes yet.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="questions">
          <div className="panel-head">
            <div>
              <span className="badge">{quiz.difficulty}</span>
              <h2>{quiz.topic}</h2>
            </div>
            <small>{quiz.questions.length} questions</small>
          </div>
          {quiz.questions.map((q: any, index: number) => (
            <article className="panel question" key={q.id}>
              <div className="panel-head">
                <span className="badge">{q.topic}</span>
                <small>{q.difficulty}</small>
              </div>
              <h3>
                {index + 1}. {q.question}
              </h3>
              <div className="options">
                {q.options.map((option: string, answer: number) => (
                  <button
                    className={answers[q.id] === answer ? "selected" : ""}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [q.id]: answer }))
                    }
                    key={option}
                  >
                    {String.fromCharCode(65 + answer)}. {option}
                  </button>
                ))}
              </div>
            </article>
          ))}
          <button
            className="primary"
            disabled={
              busy || Object.keys(answers).length !== quiz.questions.length
            }
            onClick={submit}
          >
            {busy ? "Scoring…" : "Submit quiz"}
          </button>
        </div>
      )}
    </section>
  );
}

function CareerView() {
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [evidenceInputs, setEvidenceInputs] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [evidenceMsg, setEvidenceMsg] = useState<Record<number, string>>({});

  useEffect(() => {
    request("/career/analysis").then(setData);
    request("/projects").then(setProjects);
  }, []);

  if (!data) return <Loader />;

  async function updateProject(project: any) {
    await request(`/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "in_progress",
        progress: Math.max(project.progress, 10),
      }),
    });
    setProjects(await request("/projects"));
  }

  async function submitEvidence(projectId: number) {
    const url = (evidenceInputs[projectId] ?? "").trim();
    if (!url) return;
    setSubmitting(projectId);
    setEvidenceMsg((prev) => ({ ...prev, [projectId]: "" }));
    try {
      await submitProjectEvidence(projectId, url);
      setEvidenceMsg((prev) => ({ ...prev, [projectId]: "Evidence verified! Ranking score boosted." }));
      setProjects(await request("/projects"));
    } catch (e: any) {
      setEvidenceMsg((prev) => ({ ...prev, [projectId]: e.message || "Failed to submit evidence" }));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">CAREER COACH</p>
          <h1>Your path to {data.goal}</h1>
          <p className="muted">
            Translate learning into demonstrable, job-relevant skills with verified portfolio evidence.
          </p>
        </div>
      </header>
      <div className="career-grid">
        <div className="panel">
          <h2>Skill-gap analysis</h2>
          <p className="muted">Your current strengths</p>
          <div className="chips success">
            {data.strengths.map((x: string) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <p className="muted gap-top">Priority gaps</p>
          <div className="chips">
            {data.skill_gaps.map((x: string) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <ol>
            {data.next_steps.map((x: string) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <p className="muted gap-top">Recommended certifications</p>
          <ul>
            {data.certifications.map((x: string) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="muted gap-top">Interview preparation</p>
          <ul>
            {data.interview_preparation.map((x: string) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="projects">
          {projects.map((p) => (
            <article className="panel project-card-enhanced" key={p.title}>
              <div className="panel-head">
                <div className="project-tags">
                  <span className="badge">{p.difficulty}</span>
                  {p.ranking_score > 0 && (
                    <span className="badge rank-badge">🏆 Rank: {Math.round(p.ranking_score)}/100</span>
                  )}
                </div>
                <small>Match {p.match_score}%</small>
              </div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="chips">
                {p.skills.map((x: string) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
              <div className="bar">
                <i style={{ width: `${p.progress}%` }} />
              </div>

              {p.evidence_url && (
                <div className="evidence-display">
                  <a
                    href={p.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    className="evidence-link"
                  >
                    <ExternalLink size={14} /> Evidence: {p.evidence_url}
                  </a>
                  <span className="verified-pill">✓ Verified</span>
                </div>
              )}

              <div className="evidence-box">
                <div className="evidence-form">
                  <input
                    type="url"
                    placeholder="https://github.com/username/project-repo"
                    value={evidenceInputs[p.id] ?? (p.evidence_url || "")}
                    onChange={(e) =>
                      setEvidenceInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                  />
                  <button
                    className="primary compact"
                    disabled={submitting === p.id || !(evidenceInputs[p.id] ?? (p.evidence_url || "")).trim()}
                    onClick={() => submitEvidence(p.id)}
                  >
                    {submitting === p.id ? "Saving…" : p.evidence_url ? "Update Evidence" : "Submit Evidence"}
                  </button>
                </div>
                {evidenceMsg[p.id] && (
                  <p className={`evidence-feedback ${evidenceMsg[p.id].includes("verified") ? "success" : "error"}`}>
                    {evidenceMsg[p.id]}
                  </p>
                )}
              </div>

              <button
                className="soft project-action"
                disabled={p.status === "completed"}
                onClick={() => updateProject(p)}
              >
                {p.status === "recommended"
                  ? "Start project"
                  : `${p.status.replace("_", " ")} · ${p.progress}%`}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketplaceView() {
  const [tab, setTab] = useState<"mentors" | "certifications">("mentors");
  const [mentors, setMentors] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookedMentor, setBookedMentor] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      request("/marketplace/mentors"),
      request("/marketplace/certifications"),
    ])
      .then(([m, c]) => {
        setMentors(m);
        setCertifications(c);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredMentors = useMemo(() => {
    if (!search.trim()) return mentors;
    const q = search.toLowerCase();
    return mentors.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q) ||
        m.title?.toLowerCase().includes(q) ||
        m.expertise?.some((e: string) => e.toLowerCase().includes(q))
    );
  }, [mentors, search]);

  const filteredCerts = useMemo(() => {
    if (!search.trim()) return certifications;
    const q = search.toLowerCase();
    return certifications.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.issuer?.toLowerCase().includes(q) ||
        c.skill_level?.toLowerCase().includes(q)
    );
  }, [certifications, search]);

  if (loading) return <Loader />;

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">EXPAND YOUR HORIZONS</p>
          <h1>Marketplace</h1>
          <p className="muted">
            Connect with vetted industry mentors and earn industry-recognized credentials.
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {bookedMentor && (
        <div className="booking-toast">
          <CheckCircle2 size={20} />
          <div>
            <strong>Mentorship Session Requested!</strong>
            <p>Your session with {bookedMentor} has been booked. A calendar invite was sent to your email.</p>
          </div>
          <button className="link" onClick={() => setBookedMentor(null)}>Dismiss</button>
        </div>
      )}

      <div className="marketplace-controls">
        <div className="marketplace-tabs">
          <button
            className={`tab-btn ${tab === "mentors" ? "active" : ""}`}
            onClick={() => setTab("mentors")}
          >
            <Users size={17} /> Industry Mentors ({mentors.length})
          </button>
          <button
            className={`tab-btn ${tab === "certifications" ? "active" : ""}`}
            onClick={() => setTab("certifications")}
          >
            <Award size={17} /> Certifications ({certifications.length})
          </button>
        </div>
        <div className="search-box">
          <Search size={17} />
          <input
            type="search"
            placeholder={
              tab === "mentors"
                ? "Search by mentor, company, or skill…"
                : "Search certifications or providers…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tab === "mentors" ? (
        <div className="mentors-grid">
          {filteredMentors.length === 0 ? (
            <p className="muted">No mentors match your search criteria.</p>
          ) : (
            filteredMentors.map((m) => (
              <article className="panel mentor-card" key={m.id}>
                <div className="mentor-card-head">
                  <div className="mentor-avatar">
                    {m.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="mentor-info">
                    <h3>{m.name}</h3>
                    <p className="mentor-title">
                      {m.title} <span className="mentor-company">@ {m.company}</span>
                    </p>
                    <div className="mentor-meta">
                      <span className="rating-pill">
                        <Star size={13} fill="#f59e0b" color="#f59e0b" /> {m.rating} ({m.reviews_count})
                      </span>
                      <span className="rate-pill">${m.hourly_rate}/hr</span>
                      <span className="availability-pill">{m.availability}</span>
                    </div>
                  </div>
                </div>
                <p className="mentor-bio">{m.bio}</p>
                <div className="chips">
                  {m.expertise?.map((skill: string) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <button
                  className="primary compact mentor-book-btn"
                  onClick={() => setBookedMentor(m.name)}
                >
                  Book 1-on-1 Session
                </button>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="certs-grid">
          {filteredCerts.length === 0 ? (
            <p className="muted">No certifications match your search criteria.</p>
          ) : (
            filteredCerts.map((c) => (
              <article className="panel cert-card" key={c.id}>
                <div className="panel-head">
                  <span className="badge issuer-badge">{c.issuer}</span>
                  <span className="cert-cost">{c.cost}</span>
                </div>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <div className="cert-attributes">
                  <span>Level: <strong>{c.skill_level}</strong></span>
                  <span>Est. Time: <strong>{c.estimated_hours}h</strong></span>
                </div>
                <div className="cert-actions">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="primary compact link-btn"
                  >
                    View Credential <ExternalLink size={15} />
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}


function UpdatesView() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    request("/research/updates").then(setItems);
  }, []);
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">CURATED RESEARCH</p>
          <h1>AI knowledge updates</h1>
          <p className="muted">
            Important developments, simplified into practical learning.
          </p>
        </div>
      </header>
      <div className="updates">
        {items.map((x) => (
          <article className="panel" key={x.id}>
            <div className="panel-head">
              <span className="badge">{x.topic}</span>
              <small>{x.published_at}</small>
            </div>
            <h2>{x.title}</h2>
            <p>{x.summary}</p>
            <small>Source: {x.source}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function RemindersView({ onChange }: { onChange: () => Promise<void> }) {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState("");
  async function load() {
    setItems(await request("/reminders"));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function createReminder() {
    if (!title.trim()) return;
    try {
      await request("/reminders", {
        method: "POST",
        body: JSON.stringify({ title, due_at: dueAt || null }),
      });
      setTitle("");
      setDueAt("");
      await load();
      await onChange();
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function toggle(item: any) {
    await request(`/reminders/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !item.completed }),
    });
    await load();
    await onChange();
  }
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">LEARNING ROUTINE</p>
          <h1>Reminders</h1>
          <p className="muted">
            Keep the next learning action concrete and visible.
          </p>
        </div>
      </header>
      {error && <div className="error-banner">{error}</div>}
      <div className="reminder-grid">
        <section className="panel">
          <h2>Create reminder</h2>
          <label>
            What will you do?
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Complete SQL joins lesson"
            />
          </label>
          <label>
            When?
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
          <button className="primary" onClick={createReminder}>
            Add reminder
          </button>
        </section>
        <section className="panel">
          <h2>Your reminders</h2>
          {items.length ? (
            items.map((item) => (
              <button
                className={`reminder-row ${item.completed ? "done" : ""}`}
                onClick={() => toggle(item)}
                key={item.id}
              >
                <span>{item.completed ? <CheckCircle2 /> : <Bell />}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.due_at
                      ? new Date(item.due_at).toLocaleString()
                      : "No due time"}
                  </small>
                </div>
              </button>
            ))
          ) : (
            <p className="muted">No reminders yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}

function ProgressView({ data }: { data: any }) {
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">LEARNING ANALYTICS</p>
          <h1>Your progress</h1>
          <p className="muted">
            Use evidence to choose the next useful action.
          </p>
        </div>
      </header>
      <section className="stats">
        <Stat
          icon={TrendingUp}
          value={`${data.overall}%`}
          label="Roadmap progress"
          tone="purple"
        />
        <Stat
          icon={Flame}
          value={`${data.streak} days`}
          label={`Current streak · best ${data.longest_streak}`}
          tone="orange"
        />
        <Stat
          icon={CheckCircle2}
          value={`${data.average_quiz_score}%`}
          label="Quiz average"
          tone="green"
        />
        <Stat
          icon={BookOpen}
          value={`${data.assessment_average}%`}
          label="Assessment average"
          tone="blue"
        />
      </section>
      <div className="panel topic-progress">
        <h2>Topic mastery</h2>
        {data.topics.map((x: any) => (
          <div key={x.topic}>
            <div className="panel-head">
              <strong>{x.topic}</strong>
              <span>{x.percent}%</span>
            </div>
            <div className="bar">
              <i style={{ width: `${x.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OnboardingView({ done }: { done: () => void }) {
  const empty = {
    education: "",
    branch: "",
    year: "",
    experience_level: "Beginner",
    career_goal: "AI Engineer",
    daily_study_time: "1 hour",
    skills: [] as string[],
    onboarding_completed: false,
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const skills = [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "SQL",
    "DSA",
    "Machine Learning",
    "Deep Learning",
    "Data Science",
    "Generative AI",
    "Cloud",
  ];
  useEffect(() => {
    request("/profile")
      .then((p) => setForm({ ...empty, ...p }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function save() {
    try {
      await request("/profile", {
        method: "PUT",
        body: JSON.stringify({ ...form, onboarding_completed: true }),
      });
      done();
    } catch (e: any) {
      setError(e.message);
    }
  }
  if (loading) return <Loader />;
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow purple">
            {form.onboarding_completed
              ? "EDIT LEARNER PROFILE"
              : "FIRST-TIME ONBOARDING"}
          </p>
          <h1>
            {form.onboarding_completed
              ? "Keep your learning context current"
              : "Tell us where you are headed"}
          </h1>
        </div>
      </header>
      {error && <div className="error-banner">{error}</div>}
      <div className="panel form-grid">
        <label>
          Education
          <input
            value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
          />
        </label>
        <label>
          Branch
          <input
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
          />
        </label>
        <label>
          Year
          <input
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </label>
        <label>
          Experience
          <select
            value={form.experience_level}
            onChange={(e) =>
              setForm({ ...form, experience_level: e.target.value })
            }
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </label>
        <label>
          Career goal
          <select
            value={form.career_goal}
            onChange={(e) => setForm({ ...form, career_goal: e.target.value })}
          >
            <option>AI Engineer</option>
            <option>ML Engineer</option>
            <option>Data Scientist</option>
            <option>Data Analyst</option>
            <option>Software Developer</option>
            <option>Full Stack Developer</option>
          </select>
        </label>
        <label>
          Daily study time
          <select
            value={form.daily_study_time}
            onChange={(e) =>
              setForm({ ...form, daily_study_time: e.target.value })
            }
          >
            <option>30 min</option>
            <option>1 hour</option>
            <option>2 hours</option>
            <option>3+ hours</option>
          </select>
        </label>
        <div className="skills-field">
          <span>Current skills</span>
          <div className="chips selectable">
            {skills.map((s) => (
              <button
                className={form.skills.includes(s) ? "active" : ""}
                onClick={() =>
                  setForm({
                    ...form,
                    skills: form.skills.includes(s)
                      ? form.skills.filter((x) => x !== s)
                      : [...form.skills, s],
                  })
                }
                key={s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button className="primary" onClick={save}>
          Save profile <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

function Loader() {
  return <div className="loader">Loading your learning space…</div>;
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [view, setView] = useState<View>("dashboard");
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  async function load() {
    try {
      setDashboard(await request("/dashboard"));
      setError("");
    } catch (e: any) {
      if (e.message.includes("authentication")) {
        clearToken();
        setAuthed(false);
      } else setError(e.message);
    }
  }
  useEffect(() => {
    if (authed) load();
  }, [authed]);
  const page = useMemo(() => {
    if (!dashboard) return <Loader />;
    if (view === "dashboard")
      return <DashboardView data={dashboard} setView={setView} />;
    if (view === "roadmap")
      return <RoadmapView data={dashboard.roadmap} onRefresh={load} />;
    if (view === "mentor") return <MentorView />;
    if (view === "assessment") return <AssessmentView onComplete={load} />;
    if (view === "quiz") return <QuizView onComplete={load} />;
    if (view === "career") return <CareerView />;
    if (view === "marketplace") return <MarketplaceView />;
    if (view === "updates") return <UpdatesView />;
    if (view === "progress") return <ProgressView data={dashboard.progress} />;
    if (view === "reminders") return <RemindersView onChange={load} />;
    return (
      <OnboardingView
        done={async () => {
          await load();
          setView("assessment");
        }}
      />
    );
  }, [dashboard, view]);
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  return (
    <div className="app">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand-mark">
          <Sparkles /> Mentora AI
        </div>
        <button className="close" onClick={() => setOpen(false)}>
          <X />
        </button>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              className={view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                setOpen(false);
              }}
              key={id}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setView("onboarding")}>
            <GraduationCap size={19} /> Profile
          </button>
          <button
            onClick={() => {
              clearToken();
              setAuthed(false);
            }}
          >
            <LogOut size={19} /> Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <button className="menu" onClick={() => setOpen(true)}>
          <Menu />
        </button>
        {error ? (
          <div className="error-banner">
            {error}
            <button onClick={load}>Retry</button>
          </div>
        ) : (
          page
        )}
      </main>
    </div>
  );
}

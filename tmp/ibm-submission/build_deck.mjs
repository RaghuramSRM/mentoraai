import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:/Users/ragav/OneDrive/Desktop/Programs/Mentora AI";
const SKILL_DIR = "C:/Users/ragav/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations";
const RUNTIME_PYTHON = "C:/Users/ragav/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const buildDir = path.join(workspaceDir, "tmp/ibm-submission/deck-build");
const outDir = path.join(workspaceDir, "output/ibm-submission");
const FINAL_PPTX = path.join(outDir, "Mentora_AI_Project_Presentation_Final_v2.pptx");
await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outDir, { recursive: true });

const { finalizePresentation, makeNativeBulletParagraphs } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href
);

const W = 1280;
const H = 720;
const FONT = "Aptos";
const DISPLAY = "Aptos Display";
const C = {
  navy: "#101F47",
  blue: "#0F62FE",
  teal: "#007D79",
  ink: "#182033",
  gray: "#596579",
  pale: "#EEF4FF",
  pale2: "#F7F9FD",
  white: "#FFFFFF",
  green: "#198038",
  amber: "#B28600",
  line: "#C8D4EA",
};

const deck = Presentation.create({ slideSize: { width: W, height: H } });

function rect(slide, left, top, width, height, fill, radius = false, line = "none") {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left, top, width, height },
    fill,
    line: line === "none" ? { fill: "none", width: 0 } : { fill: line, width: 1 },
  });
}

function text(slide, value, left, top, width, height, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: opts.typeface ?? FONT,
    fontSize: opts.fontSize ?? 24,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    autoFit: "none",
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
  };
  return shape;
}

function bullets(slide, items, left, top, width, height, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  shape.text = makeNativeBulletParagraphs(items, {
    marginLeftPoints: opts.marginLeft ?? 19,
    hangingPoints: opts.hanging ?? 9,
    spaceAfterPoints: opts.spaceAfter ?? 10,
  });
  shape.text.style = {
    typeface: FONT,
    fontSize: opts.fontSize ?? 23,
    color: opts.color ?? C.ink,
    autoFit: "none",
  };
  return shape;
}

function title(slide, value, subtitle = "") {
  text(slide, value, 64, 42, 1120, 64, { typeface: DISPLAY, fontSize: 38, bold: true, color: C.navy });
  if (subtitle) text(slide, subtitle, 66, 108, 1080, 38, { fontSize: 18, color: C.gray });
  rect(slide, 64, 151, 82, 5, C.blue);
}

function footer(slide, n) {
  text(slide, "Mentora AI | IBM SkillsBuild internship project", 64, 680, 650, 20, { fontSize: 11, color: "#758198" });
  text(slide, String(n).padStart(2, "0"), 1170, 678, 48, 24, { fontSize: 12, color: "#758198", align: "right" });
}

function note(slide, body) {
  slide.speakerNotes.textFrame.setText(body);
}

// 1 Cover
{
  const slide = deck.slides.add();
  slide.background.fill = C.navy;
  const img = await fs.readFile(path.join(workspaceDir, "tmp/ibm-submission/mentora-cover-blue-teal.png"));
  slide.images.add({ blob: img, contentType: "image/png", alt: "Student using an AI learning companion", fit: "cover", position: { left: 0, top: 0, width: W, height: H } });
  rect(slide, 0, 0, 690, H, { color: C.navy, transparency: 8 });
  text(slide, "MENTORA AI", 72, 150, 500, 70, { typeface: DISPLAY, fontSize: 54, bold: true, color: C.white });
  text(slide, "Agentic learning and career guidance for students", 75, 233, 500, 104, { fontSize: 30, color: C.white });
  rect(slide, 76, 364, 94, 6, C.teal);
  text(slide, "IBM SkillsBuild for Academia internship project\nSDG 4 Quality Education", 76, 394, 490, 70, { fontSize: 18, color: "#E6ECFF" });
  text(slide, "Working web MVP", 76, 580, 220, 34, { fontSize: 17, bold: true, color: "#BFD4FF" });
  note(slide, "Cover illustration generated for this presentation. Project framing follows the IBM SkillsBuild Masterclass 5 project discussion and guidelines supplied by the student.");
}

// 2 Problem
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "The student learning gap", "Students can access content but still lack a coherent path and persistent guidance");
  text(slide, "Learning today", 72, 202, 300, 40, { fontSize: 21, bold: true, color: C.blue });
  bullets(slide, [
    "Resources are scattered across course platforms, videos, search, and chat tools.",
    "Static courses rarely adapt to a student's career goal or changing performance.",
    "Weak topics, project evidence, and career preparation remain disconnected.",
    "Rapid AI change makes learning material age quickly.",
  ], 72, 252, 640, 330, { fontSize: 24, spaceAfter: 12 });
  rect(slide, 805, 205, 8, 360, C.teal);
  text(slide, "Design question", 850, 212, 300, 34, { fontSize: 20, bold: true, color: C.gray });
  text(slide, "How can one system learn from each student's evidence and guide the next useful action?", 850, 266, 320, 220, { typeface: DISPLAY, fontSize: 32, bold: true, color: C.navy });
  text(slide, "SDG 4 focuses the project on relevant, effective learning rather than content volume alone.", 850, 505, 320, 72, { fontSize: 18, color: C.gray });
  footer(slide, 2);
  note(slide, "Source: supplied IBM SkillsBuild Masterclass 5 PDF, pages 8 and 11. No external statistics are claimed.");
}

// 3 Solution journey
{
  const slide = deck.slides.add();
  slide.background.fill = C.pale2;
  title(slide, "The Mentora learner journey", "A single evidence trail connects goals, learning, practice, and career preparation");
  const stages = [
    ["01", "Profile", "Goal, skills, experience, study time"],
    ["02", "Assess", "Topic scores and weak areas"],
    ["03", "Roadmap", "Ordered modules and unlocking"],
    ["04", "Learn", "Grounded mentor and adaptive quizzes"],
    ["05", "Build", "Projects, career gaps, progress"],
  ];
  stages.forEach((s, i) => {
    const x = 65 + i * 238;
    text(slide, s[0], x, 215, 70, 46, { fontSize: 28, bold: true, color: i === 0 ? C.teal : C.blue });
    text(slide, s[1], x, 276, 192, 42, { typeface: DISPLAY, fontSize: 27, bold: true, color: C.navy });
    text(slide, s[2], x, 330, 188, 106, { fontSize: 18, color: C.gray });
    if (i < stages.length - 1) rect(slide, x + 186, 231, 38, 3, C.line);
  });
  rect(slide, 65, 490, 1110, 1, C.line);
  text(slide, "Every completed activity updates the learner record used by the dashboard, roadmap, quizzes, and career analysis.", 180, 530, 920, 70, { fontSize: 24, bold: true, color: C.ink, align: "center" });
  footer(slide, 3);
  note(slide, "The journey reflects the implemented application flow and the solution categories listed on page 14 of the supplied IBM SkillsBuild PDF.");
}

// 4 Capabilities
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "Implemented MVP capabilities", "The submission demonstrates a working product rather than a concept-only mock-up");
  const rows = [
    ["Personalized learning", "Career-aware assessment and sequenced roadmap", "Implemented"],
    ["AI tutor", "Intent routing, learner context, and grounded local sources", "Implemented"],
    ["Adaptive assessment", "Scored quizzes, explanations, history, next difficulty", "Implemented"],
    ["Career guidance", "Skill gaps, certifications, interview preparation", "Implemented"],
    ["Projects and progress", "Ranked projects, progress, activity, streaks", "Implemented"],
    ["Reminders and updates", "In-app reminders and curated research records", "MVP scope"],
  ];
  text(slide, "Capability", 74, 196, 240, 30, { fontSize: 16, bold: true, color: C.gray });
  text(slide, "What the learner receives", 340, 196, 620, 30, { fontSize: 16, bold: true, color: C.gray });
  text(slide, "Status", 1010, 196, 170, 30, { fontSize: 16, bold: true, color: C.gray });
  rows.forEach((row, i) => {
    const y = 238 + i * 66;
    if (i % 2 === 0) rect(slide, 62, y - 8, 1145, 58, C.pale2);
    text(slide, row[0], 74, y, 245, 34, { fontSize: 20, bold: true, color: C.navy });
    text(slide, row[1], 340, y, 635, 42, { fontSize: 18, color: C.ink });
    text(slide, row[2], 1010, y, 170, 34, { fontSize: 17, bold: true, color: row[2] === "Implemented" ? C.green : C.amber });
  });
  footer(slide, 4);
  note(slide, "Source: current Mentora AI implementation and automated test suite. The status wording distinguishes complete MVP functions from intentionally limited delivery channels.");
}

// 5 Architecture
{
  const slide = deck.slides.add();
  slide.background.fill = C.navy;
  text(slide, "Agentic system architecture", 64, 44, 1120, 64, { typeface: DISPLAY, fontSize: 38, bold: true, color: C.white });
  text(slide, "One orchestrator selects a specialist and keeps the learner record central", 66, 108, 1000, 38, { fontSize: 18, color: "#C8D8FF" });
  const agents = ["Tutor", "Quiz Master", "Career Coach", "Project Guide", "Researcher", "Reminder"];
  rect(slide, 96, 250, 230, 112, C.blue, true);
  text(slide, "Learner request", 119, 284, 184, 40, { fontSize: 25, bold: true, color: C.white, align: "center" });
  rect(slide, 430, 222, 300, 170, C.white, true);
  text(slide, "Orchestrator", 465, 254, 230, 44, { typeface: DISPLAY, fontSize: 30, bold: true, color: C.navy, align: "center" });
  text(slide, "Intent + profile + retrieved context", 478, 315, 205, 52, { fontSize: 18, color: C.gray, align: "center" });
  agents.forEach((name, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 850 + col * 170;
    const y = 188 + row * 112;
    rect(slide, x, y, 150, 70, i === 0 ? C.teal : "#253866", true, "#5E78B4");
    text(slide, name, x + 10, y + 20, 130, 30, { fontSize: 17, bold: true, color: C.white, align: "center" });
  });
  rect(slide, 327, 304, 102, 4, "#6FA4FF");
  rect(slide, 731, 304, 118, 4, "#6FA4FF");
  text(slide, "React interface", 106, 500, 210, 34, { fontSize: 18, bold: true, color: "#BFD4FF", align: "center" });
  text(slide, "FastAPI + JWT", 474, 500, 210, 34, { fontSize: 18, bold: true, color: "#BFD4FF", align: "center" });
  text(slide, "SQL database + ChromaDB", 884, 500, 260, 34, { fontSize: 18, bold: true, color: "#BFD4FF", align: "center" });
  text(slide, "05", 1170, 678, 48, 24, { fontSize: 12, color: "#9CB2E2", align: "right" });
  note(slide, "Architecture reflects the implemented React, FastAPI, SQLAlchemy, ChromaDB, and provider-adapter design. The agent roles follow page 14 of the supplied IBM SkillsBuild PDF.");
}

// 6 Personalization loop
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "Personalization uses learner evidence", "Each cycle changes the next recommendation instead of resetting the learner");
  const loop = [
    ["Profile", "Career goal and prior skills"],
    ["Measure", "Assessment and quiz evidence"],
    ["Adapt", "Weak topics and difficulty"],
    ["Guide", "Roadmap and project priority"],
  ];
  loop.forEach((item, i) => {
    const x = 102 + i * 285;
    rect(slide, x, 230, 230, 128, i === 2 ? C.pale : C.pale2, true, C.line);
    text(slide, String(i + 1).padStart(2, "0"), x + 18, 247, 54, 30, { fontSize: 18, bold: true, color: C.blue });
    text(slide, item[0], x + 18, 285, 190, 35, { typeface: DISPLAY, fontSize: 27, bold: true, color: C.navy });
    text(slide, item[1], x + 18, 328, 192, 42, { fontSize: 16, color: C.gray });
    if (i < loop.length - 1) rect(slide, x + 230, 291, 55, 3, C.teal);
  });
  text(slide, "The backend owns scores, unlocking, progress, and history. This prevents the interface from fabricating learner state.", 214, 455, 850, 86, { fontSize: 25, bold: true, color: C.ink, align: "center" });
  footer(slide, 6);
  note(slide, "Source: current Mentora AI backend behavior and tests for assessment history, roadmap progression, adaptive quiz difficulty, and user isolation.");
}

// 7 Lean Canvas summary
{
  const slide = deck.slides.add();
  slide.background.fill = C.pale2;
  title(slide, "Lean Canvas summary", "The project can start as a student pilot and expand only after learning outcomes are validated");
  const blocks = [
    ["Problem", "Scattered resources, static paths, weak accountability"],
    ["Users", "College students, AI learners, institutions"],
    ["Value", "One evidence trail across learning and career preparation"],
    ["Solution", "Roadmaps, tutor, adaptive quizzes, projects, reminders"],
    ["Channels", "College pilots, SkillsBuild communities, web app"],
    ["Metrics", "Completion, quiz improvement, active days, projects"],
    ["Costs", "Models, storage, hosting, validation, product support"],
    ["Revenue", "Freemium, premium mentor, institutional licenses"],
    ["Advantage", "Working agentic MVP with grounded local retrieval"],
  ];
  blocks.forEach((b, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 72 + col * 400;
    const y = 190 + row * 145;
    text(slide, b[0], x, y, 330, 30, { fontSize: 20, bold: true, color: C.blue });
    text(slide, b[1], x, y + 40, 335, 72, { fontSize: 18, color: C.ink });
    if (col < 2) rect(slide, x + 352, y, 1, 105, C.line);
  });
  footer(slide, 7);
  note(slide, "Condensed from the full Lean Canvas delivered with this submission. Categories follow the IBM SkillsBuild Masterclass 5 example, pages 11 to 19.");
}

// 8 Validation
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  title(slide, "Prototype validation", "Automated and browser checks cover the complete local learner journey");
  text(slide, "12", 90, 205, 180, 100, { typeface: DISPLAY, fontSize: 76, bold: true, color: C.blue, align: "center" });
  text(slide, "backend tests passed", 84, 304, 195, 50, { fontSize: 19, bold: true, color: C.gray, align: "center" });
  text(slide, "3", 348, 205, 180, 100, { typeface: DISPLAY, fontSize: 76, bold: true, color: C.teal, align: "center" });
  text(slide, "frontend unit tests passed", 328, 304, 220, 50, { fontSize: 19, bold: true, color: C.gray, align: "center" });
  rect(slide, 618, 194, 2, 190, C.line);
  bullets(slide, [
    "Lint, TypeScript, and production build passed",
    "Authenticated API smoke test passed",
    "Grounded Tutor retrieval passed",
    "Browser login, dashboard, and mentor flow verified",
  ], 680, 205, 500, 250, { fontSize: 21, spaceAfter: 11 });
  rect(slide, 82, 438, 1090, 1, C.line);
  text(slide, "Demo path", 84, 470, 160, 35, { fontSize: 20, bold: true, color: C.blue });
  text(slide, "Login   Assessment   Roadmap   Ask Tutor   Adaptive Quiz   Career and Projects   Progress", 240, 470, 890, 64, { fontSize: 22, bold: true, color: C.navy });
  text(slide, "The demo provider keeps every core flow available offline. Live model mode remains optional.", 240, 548, 840, 50, { fontSize: 18, color: C.gray });
  footer(slide, 8);
  note(slide, "Verification results recorded on 7 October 2026 in the local project workspace. The live OpenAI provider was not tested because no API key was supplied.");
}

// 9 Impact and scope
{
  const slide = deck.slides.add();
  slide.background.fill = C.navy;
  text(slide, "Impact measures and responsible scope", 64, 44, 1120, 64, { typeface: DISPLAY, fontSize: 38, bold: true, color: C.white });
  text(slide, "A pilot should measure learning outcomes before expanding delivery channels", 66, 108, 1000, 38, { fontSize: 18, color: "#C8D8FF" });
  text(slide, "Pilot measures", 78, 190, 300, 40, { fontSize: 24, bold: true, color: "#8DB5FF" });
  bullets(slide, [
    "Roadmap completion by learner",
    "Quiz improvement by topic",
    "Active learning days and streaks",
    "Project progress and learner feedback",
  ], 78, 250, 480, 250, { fontSize: 23, color: C.white, spaceAfter: 12 });
  rect(slide, 622, 185, 2, 370, "#49608D");
  text(slide, "Current boundaries", 690, 190, 360, 40, { fontSize: 24, bold: true, color: "#42BE65" });
  bullets(slide, [
    "Research updates are curated, not live crawled",
    "Reminders stay inside the application",
    "Live model mode requires a configured key and evaluation",
    "Mobile, LMS, payments, and marketplaces remain future work",
  ], 690, 250, 485, 300, { fontSize: 22, color: C.white, spaceAfter: 11 });
  text(slide, "Mentora AI is an internship project, not an official IBM product.", 79, 610, 1000, 40, { fontSize: 18, bold: true, color: "#BFD4FF" });
  text(slide, "09", 1170, 678, 48, 24, { fontSize: 12, color: "#9CB2E2", align: "right" });
  note(slide, "The metric categories reflect page 18 of the supplied IBM SkillsBuild PDF. Boundaries reflect the current implementation and prevent unsupported claims.");
}

// 10 Close
{
  const slide = deck.slides.add();
  slide.background.fill = C.white;
  text(slide, "Mentora AI demonstrates the complete local learning loop", 76, 92, 1120, 112, { typeface: DISPLAY, fontSize: 43, bold: true, color: C.navy });
  text(slide, "A student can move from career goal to assessment, roadmap, grounded support, adaptive practice, project evidence, and measurable progress in one application.", 80, 234, 1040, 118, { fontSize: 26, color: C.ink });
  rect(slide, 80, 397, 1040, 2, C.line);
  text(slide, "Next stage", 80, 438, 190, 36, { fontSize: 21, bold: true, color: C.blue });
  text(slide, "Run a small student pilot, evaluate learning outcomes, and harden the platform before adding external messaging or institutional integrations.", 272, 438, 840, 100, { fontSize: 23, color: C.ink });
  text(slide, "10", 1170, 678, 48, 24, { fontSize: 12, color: "#758198", align: "right" });
  note(slide, "Closing recommendation based on the current MVP status. Production deployment and external integrations remain separate future work.");
}

// 11 Thank you
{
  const slide = deck.slides.add();
  slide.background.fill = C.navy;
  text(slide, "THANK YOU", 80, 210, 1110, 92, { typeface: DISPLAY, fontSize: 54, bold: true, color: C.white, align: "center" });
  rect(slide, 550, 330, 180, 6, C.teal);
  text(slide, "Mentora AI", 80, 375, 1110, 54, { typeface: DISPLAY, fontSize: 28, bold: true, color: "#BFD4FF", align: "center" });
  text(slide, "IBM SkillsBuild for Academia internship project", 80, 438, 1110, 40, { fontSize: 19, color: C.white, align: "center" });
  text(slide, "11", 1170, 678, 48, 24, { fontSize: 12, color: "#9CB2E2", align: "right" });
  note(slide, "Final acknowledgement slide.");
}

const stagingDir = path.join(workspaceDir, ".codex-finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "mentora-ai-candidate-v2.pptx");
await (await PresentationFile.exportPptx(deck)).save(candidatePath);

const result = await finalizePresentation({
  explicitTotalSlideCount: 11,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [FONT, DISPLAY] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "Mentora_AI_Project_Presentation_Final_v2.validation.json"),
});
console.log(JSON.stringify(result, null, 2));

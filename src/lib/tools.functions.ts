import { createServerFn } from "@tanstack/react-start";

const clip = (s: unknown, n = 20000) => String(s ?? "").trim().slice(0, n);
const str = { type: "string" };
const strArr = { type: "array", items: str };
const obj = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });

// ---------- Cover letter ----------
export type CoverLetter = { subject: string; letter: string };
export const writeCoverLetter = createServerFn({ method: "POST" })
  .inputValidator((d: { ad: string; cv: string; tone: string; length: string; language: string }) => {
    const ad = clip(d?.ad), cv = clip(d?.cv);
    if (ad.length < 30 || cv.length < 30) throw new Error("Add both the job ad and your CV.");
    return { ad, cv, tone: d?.tone === "warm" ? "warm" : "formal", length: d?.length === "short" ? "short" : "standard", language: clip(d?.language, 40) || "English" };
  })
  .handler(async ({ data }) => {
    const { aiJson, FACTS_ONLY } = await import("./ai.server");
    const words = data.length === "short" ? "150-200 words" : "280-380 words";
    return aiJson<CoverLetter>(
      `You write cover letters for international job seekers. ${FACTS_ONLY}
Only mention skills, roles, projects and achievements that appear in the CV, and connect them to requirements that appear in the ad. If the CV doesn't show a requirement, don't claim it — you may express genuine willingness to learn. Do not add placeholder brackets except [Your name] at the sign-off if no name is in the CV.
Tone: ${data.tone === "warm" ? "warm, personal and confident, still professional" : "formal and professional"}. Length: ${words}. Write the whole letter in ${data.language}. subject: a short email subject line in ${data.language}. letter: plain text with paragraphs separated by blank lines, including greeting and sign-off.`,
      `JOB AD:\n"""\n${data.ad}\n"""\n\nCV:\n"""\n${data.cv}\n"""`, "cover_letter", obj({ subject: str, letter: str }));
  });

// ---------- Mock interview ----------
export type Grade = { score: number; strong: string; improve: string; stronger: string };
export const interviewQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: { context: string; cv: string }) => {
    const context = clip(d?.context);
    if (context.length < 20) throw new Error("Describe the role or paste the ad first.");
    return { context, cv: clip(d?.cv) };
  })
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai.server");
    return aiJson<{ questions: string[] }>(
      "You are an interviewer. Write exactly 5 realistic interview questions for this role, mixing motivation, technical and behavioural questions. Base them only on the role text and, if given, the CV. Write in English.",
      `ROLE:\n${data.context}\n\nCV:\n${data.cv || "(none)"}`, "questions", obj({ questions: strArr }));
  });

export const gradeAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: { question: string; answer: string; cv: string; context: string }) => {
    const answer = clip(d?.answer, 5000);
    if (answer.length < 3) throw new Error("Write or say an answer first.");
    return { question: clip(d?.question, 600), answer, cv: clip(d?.cv), context: clip(d?.context, 6000) };
  })
  .handler(async ({ data }) => {
    const { aiJson, FACTS_ONLY } = await import("./ai.server");
    const r = await aiJson<Grade>(
      `You are a kind, honest interview coach. Grade the candidate's answer. ${FACTS_ONLY}
score: integer 0-10. strong: one or two sentences on what worked. improve: one or two concrete improvements. stronger: a rewritten, stronger answer (under 150 words) that uses ONLY facts from the CV and the candidate's own answer — no invented numbers, employers or titles. If there's no CV, use only the answer's facts.`,
      `ROLE CONTEXT:\n${data.context || "(not given)"}\n\nQUESTION: ${data.question}\n\nANSWER:\n${data.answer}\n\nCV:\n${data.cv || "(none)"}`,
      "grade", obj({ score: { type: "integer" }, strong: str, improve: str, stronger: str }));
    if (r.ok) r.result.score = Math.max(0, Math.min(10, Math.round(r.result.score)));
    return r;
  });

export const interviewSummary = createServerFn({ method: "POST" })
  .inputValidator((d: { items: { question: string; score: number; improve: string }[] }) => ({ items: (d?.items ?? []).slice(0, 6).map((i) => ({ question: clip(i.question, 500), score: Number(i.score) || 0, improve: clip(i.improve, 600) })) }))
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai.server");
    return aiJson<{ improvements: string[]; verdict: string }>(
      "Summarise a mock interview. improvements: exactly the 3 most important, concrete improvements across all answers. verdict: one encouraging, honest sentence.",
      JSON.stringify(data.items), "summary", obj({ improvements: strArr, verdict: str }));
  });

// ---------- Swedish micro-lesson ----------
export type Lesson = { phrase: string; meaning: string; pronunciation: string; example_sv: string; example_en: string; quiz: { question: string; options: string[]; answer: number; why: string }[] };
export const microLesson = createServerFn({ method: "POST" })
  .inputValidator((d: { phrase: string }) => {
    const phrase = clip(d?.phrase, 80);
    if (phrase.length < 2) throw new Error("Pick a phrase.");
    return { phrase };
  })
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai.server");
    const r = await aiJson<Lesson>(
      `You teach Swedish job-ad and workplace vocabulary to international job seekers. Make a short lesson in English for the given Swedish phrase.
phrase: the phrase in Swedish. meaning: 1-2 sentences, what it means and what it implies for a job seeker. pronunciation: a simple English-friendly pronunciation guide with the stressed syllable in CAPITALS. example_sv: one natural Swedish example sentence from a job ad or workplace; example_en: its translation. quiz: exactly 3 multiple-choice questions, 4 options each, answer = 0-based index of the correct option, why = one short explanation. Be accurate; don't invent legal facts.`,
      `PHRASE: ${data.phrase}`, "lesson",
      obj({ phrase: str, meaning: str, pronunciation: str, example_sv: str, example_en: str,
        quiz: { type: "array", items: obj({ question: str, options: strArr, answer: { type: "integer" }, why: str }) } }));
    if (r.ok) r.result.quiz = r.result.quiz.slice(0, 3);
    return r;
  });

// ---------- Employer ad review ----------
export type AdReview = {
  score: number; summary: string;
  issues: { phrase: string; problem: string; rewrite: string }[];
  language: { verdict: "Clearly justified" | "Unclear" | "Not justified" | "No language requirement"; reason: string };
  rewritten: string;
};
export const reviewEmployerAd = createServerFn({ method: "POST" })
  .inputValidator((d: { ad: string }) => {
    const ad = clip(d?.ad);
    if (ad.length < 80) throw new Error("Please paste the full job ad.");
    return { ad };
  })
  .handler(async ({ data }) => {
    const { aiJson } = await import("./ai.server");
    const r = await aiJson<AdReview>(
      `You help employers make job ads clear and inclusive for international talent. Review the ad. Reply in English, but quote phrases exactly as written in the ad.
score: ad clarity 0-100 (clear requirements vs nice-to-haves, plain language, no unexplained local jargon, no exclusionary wording). summary: 1-2 sentences.
issues: up to 10 unclear, jargon-heavy or exclusionary phrases; phrase MUST be an exact substring of the ad; problem: why it's unclear/exclusionary; rewrite: a clearer alternative in the ad's language.
language: is the local-language requirement clearly justified by the actual tasks? reason: one line, quote the relevant phrase.
rewritten: a clearer, inclusive version of the full ad in the same language as the original. Never add facts, benefits, salaries or requirements that aren't in the original; keep the employer's facts intact.`,
      `JOB AD:\n"""\n${data.ad}\n"""`, "ad_review",
      obj({ score: { type: "integer" }, summary: str,
        issues: { type: "array", items: obj({ phrase: str, problem: str, rewrite: str }) },
        language: obj({ verdict: { type: "string", enum: ["Clearly justified", "Unclear", "Not justified", "No language requirement"] }, reason: str }),
        rewritten: str }));
    if (r.ok) {
      r.result.score = Math.max(0, Math.min(100, Math.round(r.result.score)));
      r.result.issues = r.result.issues.filter((i) => i.phrase && data.ad.includes(i.phrase));
    }
    return r;
  });

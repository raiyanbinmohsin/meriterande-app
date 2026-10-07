import { createServerFn } from "@tanstack/react-start";
import { styleRules, countryOf } from "./decode.functions";

export type Idea = { title: string; problem: string; approach: string; value: string; feasibility: string; readiness: number; skills_to_learn: string[] };
export type Outreach = {
  email: { subject: string; body: string };
  linkedin_note: string;
  linkedin_post: string;
  interview: { question: string; hint: string }[];
  tough: { question: string; hint: string };
};
export type Pitch = Outreach & { ideas: Idea[]; best_index: number; contacts: string[]; assumptions: string };

type Res<T> = { ok: true; result: T } | { ok: false; error: string };

const strArr = { type: "array", items: { type: "string" } };
const qa = { type: "object", additionalProperties: false, required: ["question", "hint"], properties: { question: { type: "string" }, hint: { type: "string" } } };
const outreachProps = {
  email: { type: "object", additionalProperties: false, required: ["subject", "body"], properties: { subject: { type: "string" }, body: { type: "string" } } },
  linkedin_note: { type: "string" },
  linkedin_post: { type: "string" },
  interview: { type: "array", items: qa },
  tough: qa,
};
const outreachReq = ["email", "linkedin_note", "linkedin_post", "interview", "tough"];
const ideaSchema = {
  type: "object", additionalProperties: false,
  required: ["title", "problem", "approach", "value", "feasibility", "readiness", "skills_to_learn"],
  properties: { title: { type: "string" }, problem: { type: "string" }, approach: { type: "string" }, value: { type: "string" }, feasibility: { type: "string" }, readiness: { type: "integer" }, skills_to_learn: strArr },
};
const pitchSchema = {
  type: "object", additionalProperties: false,
  required: ["ideas", "best_index", "contacts", "assumptions", ...outreachReq],
  properties: { ideas: { type: "array", items: ideaSchema }, best_index: { type: "integer" }, contacts: strArr, assumptions: { type: "string" }, ...outreachProps },
};
const outreachSchema = { type: "object", additionalProperties: false, required: outreachReq, properties: outreachProps };
const skillsSchema = { type: "object", additionalProperties: false, required: ["skills"], properties: { skills: strArr } };

const RULES = `You help a university student pitch a self-proposed master's/bachelor's thesis to a company.
STRICT RULES:
- Never invent facts about the company (products, teams, numbers, tech stack, news). Use only the provided company info. If company info is missing or thin, frame ideas around clearly stated assumptions (e.g. "Assuming you run large-scale streaming data...") and put a one-line summary of those assumptions in "assumptions" ("" if none were needed).
- Never invent people's names or email addresses. contacts: 3-4 generic role titles only (e.g. "Head of Data", "University relations / talent team", "Engineering manager, data platform").
- Emails are specific and humble, no buzzwords, no hype. Under 180 words in the body. Mention the student's relevant skills, programme and start date, propose the chosen idea, ask for a 20-minute call. Sign with "[Your name]".
- linkedin_note: under 300 characters.
- linkedin_post: 2-4 sentences announcing "I'm pitching a thesis to [Company]" with the idea, humble and specific, max 2 hashtags.
- interview: exactly 5 questions a company would ask a thesis candidate about this idea, each with a hint drawn only from the CV. tough: one tough question about the student's biggest gap, with an honest hint.
- 15 hp ≈ 10 weeks full-time, 30 hp ≈ 20 weeks full-time; feasibility notes must respect this.
- readiness (0-100): how ready the student is to deliver the idea based ONLY on the CV and skills; skills_to_learn: 2-5 concrete skills still missing.`;

function emailLangRule(emailLang: string, country: string) {
  const c = countryOf(country);
  const l = emailLang === "local" && c.lang ? c.lang : "English";
  return `\nEMAIL LANGUAGE: Write email.subject, email.body, linkedin_note and linkedin_post in ${l}, regardless of the output language for other fields.`;
}

async function callAI<T>(instructions: string, input: string, name: string, schema: object): Promise<Res<T>> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { ok: false, error: "AI is not configured." };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra", instructions, input, stream: true, store: false,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) return { ok: false, error: "Too many requests right now — please try again in a minute." };
    if (res.status === 402) return { ok: false, error: "AI credits are exhausted for this workspace." };
    return { ok: false, error: `The AI service returned an error (${res.status}).` };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const p = line.slice(5).trim();
      if (!p || p === "[DONE]") continue;
      try {
        const ev = JSON.parse(p);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        if (ev.type === "response.failed" || ev.type === "error") return { ok: false, error: "The AI request failed. Please try again." };
      } catch {}
    }
  }
  try { return { ok: true, result: JSON.parse(text) as T }; }
  catch { return { ok: false, error: "The AI declined or returned an unreadable answer. Please try again." }; }
}

type Input = {
  cv: string; skills: string[]; program: string; start: string; length: string; company: string; companyInfo: string;
  tone: string; emailLang: string; lang: string; roast: boolean; country: string;
};

function clean(d: Partial<Input>): Input {
  const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  return {
    cv: s(d.cv, 20000), skills: (Array.isArray(d.skills) ? d.skills : []).map((x) => s(x, 60)).slice(0, 30),
    program: s(d.program, 200), start: s(d.start, 20), length: d.length === "15 hp" ? "15 hp" : "30 hp",
    company: s(d.company, 120), companyInfo: s(d.companyInfo, 15000), tone: d.tone === "Friendly" ? "Friendly" : "Formal",
    emailLang: d.emailLang === "local" ? "local" : "English", lang: s(d.lang || "English", 30), roast: !!d.roast, country: s(d.country || "Sweden", 30),
  };
}

function brief(d: Input) {
  return `STUDENT\nProgramme: ${d.program || "not specified"}\nThesis start: ${d.start || "not specified"}\nThesis length: ${d.length}\nSkills: ${d.skills.join(", ") || "not specified"}\nCV:\n"""\n${d.cv || "(none)"}\n"""\n\nTARGET COMPANY: ${d.company}\nCOMPANY INFO (only trusted facts):\n"""\n${d.companyInfo || "(none — use stated assumptions)"}\n"""\n\nEMAIL TONE: ${d.tone}`;
}

export const generatePitch = createServerFn({ method: "POST" })
  .inputValidator((d: Partial<Input>) => {
    const x = clean(d);
    if (!x.company) throw new Error("Please enter a target company.");
    if (x.cv.length < 30 && x.skills.length === 0) throw new Error("Add your CV or a few skills first.");
    return x;
  })
  .handler(async ({ data }): Promise<Res<Pitch>> => {
    const r = await callAI<Pitch>(RULES + styleRules(data.lang, data.roast, data.country) + emailLangRule(data.emailLang, data.country) +
      `\nReturn exactly 3 ideas. best_index: the strongest idea (0-based). The email, notes, post and interview questions are about that idea.`,
      brief(data), "pitch", pitchSchema);
    if (r.ok) {
      const p = r.result;
      p.ideas = p.ideas.slice(0, 3).map((i) => ({ ...i, readiness: Math.max(0, Math.min(100, Math.round(i.readiness))) }));
      p.best_index = Math.max(0, Math.min(p.ideas.length - 1, Math.round(p.best_index)));
      p.interview = p.interview.slice(0, 5);
    }
    return r;
  });

export const pitchForIdea = createServerFn({ method: "POST" })
  .inputValidator((d: Partial<Input> & { idea: Idea }) => {
    const x = clean(d);
    const i = d.idea;
    if (!i?.title) throw new Error("Pick an idea.");
    return { ...x, idea: { title: String(i.title).slice(0, 200), problem: String(i.problem).slice(0, 600), approach: String(i.approach).slice(0, 800), value: String(i.value).slice(0, 600) } };
  })
  .handler(async ({ data }): Promise<Res<Outreach>> => {
    const r = await callAI<Outreach>(RULES + styleRules(data.lang, data.roast, data.country) + emailLangRule(data.emailLang, data.country),
      brief(data) + `\n\nCHOSEN IDEA:\n${JSON.stringify(data.idea, null, 1)}`, "outreach", outreachSchema);
    if (r.ok) r.result.interview = r.result.interview.slice(0, 5);
    return r;
  });

export const extractSkills = createServerFn({ method: "POST" })
  .inputValidator((d: { cv: string }) => ({ cv: String(d?.cv ?? "").slice(0, 20000) }))
  .handler(async ({ data }): Promise<Res<{ skills: string[] }>> => {
    if (data.cv.trim().length < 30) return { ok: true, result: { skills: [] } };
    const r = await callAI<{ skills: string[] }>(
      "Extract 5-15 concrete technical and professional skills, tools, methods and languages explicitly present in this CV. Short names only (e.g. \"PySpark\", \"SQL\", \"Swedish (B1)\"). Never add skills not in the text.",
      data.cv, "skills", skillsSchema);
    if (r.ok) r.result.skills = [...new Set(r.result.skills.map((s) => s.trim()).filter(Boolean))].slice(0, 20);
    return r;
  });

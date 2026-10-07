import { createServerFn } from "@tanstack/react-start";
import { styleRules } from "./decode.functions";

export type Milestone = {
  horizon: "7 days" | "14 days" | "1 month" | "2 months" | "6 months";
  goal: string;
  tasks: string[];
  resource_type: string;
  proof: string;
  projected_score: number;
};
export type PlanResult = {
  verdict: { label: "Apply now" | "Apply in ~X weeks" | "Long-term target"; weeks: number | null; reasoning: string };
  can_close: string[];
  cannot_close: string[];
  milestones: Milestone[];
};

const strArr = { type: "array", items: { type: "string" } };
const HORIZONS = ["7 days", "14 days", "1 month", "2 months", "6 months"];
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "can_close", "cannot_close", "milestones"],
  properties: {
    verdict: {
      type: "object",
      additionalProperties: false,
      required: ["label", "weeks", "reasoning"],
      properties: {
        label: { type: "string", enum: ["Apply now", "Apply in ~X weeks", "Long-term target"] },
        weeks: { anyOf: [{ type: "integer" }, { type: "null" }] },
        reasoning: { type: "string" },
      },
    },
    can_close: strArr,
    cannot_close: strArr,
    milestones: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["horizon", "goal", "tasks", "resource_type", "proof", "projected_score"],
        properties: {
          horizon: { type: "string", enum: HORIZONS },
          goal: { type: "string" },
          tasks: strArr,
          resource_type: { type: "string" },
          proof: { type: "string" },
          projected_score: { type: "integer" },
        },
      },
    },
  },
};

const SYSTEM = `You build honest, personalized upskilling roadmaps for international job seekers in Sweden, based ONLY on the gaps between their CV and a specific job ad. Reply in plain English.
RULES:
- Exactly 5 milestones, in order: "7 days", "14 days", "1 month", "2 months", "6 months".
- Each milestone: one-sentence goal; 2-4 concrete tasks realistically sized to the given hours per week (cumulative time available by that horizon); a FREE resource type matching the learning style (e.g. "official docs", "a small portfolio project", "free YouTube course") — never specific URLs, brand course names or links; a concrete proof of skill to add to the CV (e.g. "GitHub repo: streaming pipeline with Kafka"); a projected fit score (0-100) if completed. Scores start from the current score and must not decrease.
- Be realistic. Years of required experience, degrees, citizenship, licences that take long, or fluent Swedish cannot be closed in days or weeks. List what can be closed in can_close and what cannot (realistically, within the target date) in cannot_close. Never claim the impossible; projected scores must reflect hard gaps that remain.
- verdict.label: "Apply now" if the current fit is already competitive or remaining gaps are minor; "Apply in ~X weeks" if key closable gaps can be closed within roughly the target date (set weeks to an integer); "Long-term target" if hard gaps remain. weeks is null unless label is "Apply in ~X weeks". reasoning: one sentence.
- Do not invent facts about the candidate or the ad.`;

export const buildPlan = createServerFn({ method: "POST" })
  .inputValidator((d: { ad: string; cv: string; score: number; gaps: string[]; hours: number; styles: string[]; target: string; lang?: string; roast?: boolean }) => {
    const ad = String(d?.ad ?? "").trim(), cv = String(d?.cv ?? "").trim();
    if (!ad || !cv) throw new Error("A job ad and CV are required.");
    if (ad.length > 20000 || cv.length > 20000) throw new Error("Text is too long.");
    const hours = Math.max(2, Math.min(40, Math.round(Number(d.hours) || 5)));
    const styles = (Array.isArray(d.styles) ? d.styles : []).map(String).slice(0, 4);
    const target = String(d.target ?? "1 month").slice(0, 20);
    const gaps = (Array.isArray(d.gaps) ? d.gaps : []).map(String).slice(0, 10);
    return { lang: String(d.lang ?? "English"), roast: !!d.roast, ad, cv, score: Math.max(0, Math.min(100, Number(d.score) || 0)), gaps, hours, styles, target };
  })
  .handler(async ({ data }): Promise<{ ok: true; result: PlanResult } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured." };
    const input = `JOB AD:\n"""\n${data.ad}\n"""\n\nCV:\n"""\n${data.cv}\n"""\n\nCURRENT FIT SCORE: ${data.score}/100\nIDENTIFIED GAPS:\n${data.gaps.map((g) => `- ${g}`).join("\n")}\n\nHOURS PER WEEK: ${data.hours}\nLEARNS BEST VIA: ${data.styles.join(", ") || "no preference"}\nTARGET APPLICATION DATE: in ${data.target}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM + styleRules(data.lang, data.roast),
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "plan", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) return { ok: false, error: "Too many requests right now — please try again in a minute." };
      if (res.status === 402) return { ok: false, error: "AI credits are exhausted for this workspace." };
      let msg = "";
      try { msg = (await res.json())?.error?.message ?? ""; } catch {}
      return { ok: false, error: msg || `The AI service returned an error (${res.status}).` };
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
          if (ev.type === "response.failed" || ev.type === "error")
            return { ok: false, error: ev.response?.error?.message ?? ev.message ?? "The AI request failed." };
        } catch {}
      }
    }
    try {
      const result = JSON.parse(text) as PlanResult;
      let prev = data.score;
      result.milestones = result.milestones.slice(0, 5).map((m) => {
        const s = Math.max(prev, Math.min(100, Math.round(m.projected_score)));
        prev = s;
        return { ...m, projected_score: s, tasks: m.tasks.slice(0, 4) };
      });
      return { ok: true, result };
    } catch {
      return { ok: false, error: "The AI declined or returned an unreadable answer. Please try again." };
    }
  });

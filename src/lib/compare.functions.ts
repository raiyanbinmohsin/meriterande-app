import { createServerFn } from "@tanstack/react-start";
import { styleRules } from "./decode.functions";

export type CompareRow = { label: string; summary: string; score: number; swedish: string; met: number; total: number; time: string; gaps: string[] };
export type CompareResult = { best_index: number; reason: string };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["best_index", "reason"],
  properties: { best_index: { type: "integer" }, reason: { type: "string" } },
};

const SYSTEM = `You help an international job seeker in Sweden decide which of several decoded job ads to apply to first, using only the data given.
Pick best_index (0-based) weighing fit score, Swedish requirement vs the candidate, must-haves met and time to close the gap. reason: one or two sentences completing "Apply to this one first, because..." (do not repeat that prefix). Never invent facts.`;

export const recommendAd = createServerFn({ method: "POST" })
  .inputValidator((d: { rows: CompareRow[]; lang?: string; roast?: boolean }) => {
    const rows = (Array.isArray(d?.rows) ? d.rows : []).slice(0, 3).map((r) => ({
      label: String(r.label).slice(0, 40), summary: String(r.summary).slice(0, 600), score: Number(r.score) || 0,
      swedish: String(r.swedish).slice(0, 30), met: Number(r.met) || 0, total: Number(r.total) || 0,
      time: String(r.time).slice(0, 60), gaps: (r.gaps ?? []).map(String).slice(0, 5),
    }));
    if (rows.length < 2) throw new Error("Need at least two ads.");
    return { rows, lang: String(d?.lang ?? "English"), roast: !!d?.roast };
  })
  .handler(async ({ data }): Promise<{ ok: true; result: CompareResult } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-luna",
        instructions: SYSTEM + styleRules(data.lang, data.roast),
        input: JSON.stringify(data.rows, null, 1),
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "compare", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) return { ok: false, error: "Too many requests right now — please try again in a minute." };
      if (res.status === 402) return { ok: false, error: "AI credits are exhausted for this workspace." };
      return { ok: false, error: "The AI service couldn't make a recommendation right now." };
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
          if (ev.type === "response.failed" || ev.type === "error") return { ok: false, error: "The AI request failed." };
        } catch {}
      }
    }
    try {
      const r = JSON.parse(text) as CompareResult;
      r.best_index = Math.max(0, Math.min(data.rows.length - 1, Math.round(r.best_index)));
      return { ok: true, result: r };
    } catch {
      return { ok: false, error: "The AI returned an unreadable answer. Please try again." };
    }
  });

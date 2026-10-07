import { createServerFn } from "@tanstack/react-start";

export type DecodeResult = {
  role_summary: string;
  must_haves: string[];
  nice_to_haves: string[];
  swedish: { verdict: "Required" | "Helpful" | "Not needed" | "Not specified"; reason: string };
  hidden_signals: { phrase: string; explanation: string }[];
  fit: null | { score: number; strengths: string[]; gaps: string[]; angle: string; must_haves_met: number; time_to_close: string };
  roast: string;
};

export const LANGS = ["English", "Swedish", "Arabic", "Persian", "Bengali", "Ukrainian", "Spanish", "Hindi", "Turkish", "Somali", "Polish", "Chinese"] as const;

export function styleRules(lang: string, roast: boolean) {
  const l = (LANGS as readonly string[]).includes(lang) ? lang : "English";
  return `\nOUTPUT LANGUAGE: Write every explanation, summary, list item, tip and sentence in ${l}. Exact phrases quoted from the ad (in quotation marks) and Swedish term names stay in their original language. Enum values stay exactly as specified in English.` +
    (roast
      ? `\nROAST MODE ON: write verdicts, reasoning and gaps in a funny, savage-but-kind tone. Roast the gap, never the person — no insults about identity, background, intelligence or appearance. Stay accurate; humour never changes the facts.`
      : "");
}

const strArr = { type: "array", items: { type: "string" } };
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["role_summary", "must_haves", "nice_to_haves", "swedish", "hidden_signals", "fit", "roast"],
  properties: {
    role_summary: { type: "string" },
    must_haves: strArr,
    nice_to_haves: strArr,
    swedish: {
      type: "object",
      additionalProperties: false,
      required: ["verdict", "reason"],
      properties: {
        verdict: { type: "string", enum: ["Required", "Helpful", "Not needed", "Not specified"] },
        reason: { type: "string" },
      },
    },
    hidden_signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["phrase", "explanation"],
        properties: { phrase: { type: "string" }, explanation: { type: "string" } },
      },
    },
    fit: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["score", "strengths", "gaps", "angle", "must_haves_met", "time_to_close"],
          properties: {
            score: { type: "integer" },
            must_haves_met: { type: "integer" },
            time_to_close: { type: "string" },
            strengths: strArr,
            gaps: strArr,
            angle: { type: "string" },
          },
        },
      ],
    },
    roast: { type: "string" },
  },
};

const SYSTEM = `You decode Swedish (or English) job ads for international job seekers in Sweden. Reply in plain English.
STRICT RULES:
- Never invent requirements, benefits or facts that are not in the ad. Only use what the text says.
- If something is unknown or not mentioned, write "not specified".
- role_summary: 2-3 plain-English sentences.
- must_haves: explicit requirements ("krav", "du har", "vi söker dig som", "required"). Translate to English.
- nice_to_haves: things marked "meriterande", "plus", "fördel", "nice to have". Translate to English.
- swedish.verdict: "Required" if Swedish is demanded, "Helpful" if meriterande/preferred, "Not needed" only if the ad clearly says English is enough or the ad is clearly English-only with no Swedish mention, otherwise "Not specified". swedish.reason: one line quoting the exact relevant phrase from the ad in quotes.
- hidden_signals: Swedish workplace phrases actually present in the ad (e.g. meriterande, B-körkort, tillsvidareanställning, provanställning, kollektivavtal, friskvårdsbidrag, löpande urval, heltid, tjänstepension, registerutdrag) with a short explanation of what it means in practice. Only include phrases found in the ad.
- fit: null if no CV is provided. Otherwise score 0-100 based only on CV vs ad, exactly 3 strengths, 3 gaps, and one sentence on how to angle the application. Do not assume skills not in the CV. must_haves_met: how many of the must_haves the CV clearly meets. time_to_close: short realistic estimate to close the key closable gaps (e.g. "~3 weeks", "6+ months", "already a fit").
- roast: "" unless ROAST MODE is on; then one or two punchy, kind sentences roasting the gap between CV and ad (or the ad itself if no CV).`;

export const decodeAd = createServerFn({ method: "POST" })
  .inputValidator((d: { ad: string; cv?: string; lang?: string; roast?: boolean }) => {
    const ad = String(d?.ad ?? "").trim();
    const cv = String(d?.cv ?? "").trim();
    if (ad.length < 30) throw new Error("Please paste a longer job ad.");
    if (ad.length > 20000 || cv.length > 20000) throw new Error("Text is too long (max 20,000 characters each).");
    return { ad, cv, lang: String(d?.lang ?? "English"), roast: !!d?.roast };
  })
  .handler(async ({ data }): Promise<{ ok: true; result: DecodeResult } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured." };
    const input = `JOB AD:\n"""\n${data.ad}\n"""\n\nCV:\n${data.cv ? `"""\n${data.cv}\n"""` : "(none provided — fit must be null)"}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM + styleRules(data.lang, data.roast),
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "decode", strict: true, schema } },
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
      const result = JSON.parse(text) as DecodeResult;
      if (!data.roast) result.roast = "";
      if (result.fit) result.fit.score = Math.max(0, Math.min(100, Math.round(result.fit.score)));
      return { ok: true, result };
    } catch {
      return { ok: false, error: "The AI declined or returned an unreadable answer. Please try again." };
    }
  });

import { createServerFn } from "@tanstack/react-start";

export type FoundJob = {
  id: string; title: string; employer: string; city: string; published: string;
  url: string; text: string; score: number | null; reason: string;
};

const FRIENDLY = "We couldn't reach Platsbanken right now. Please try again in a moment.";

const schema = {
  type: "object", additionalProperties: false, required: ["scores"],
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["id", "score", "reason"],
        properties: { id: { type: "string" }, score: { type: "integer" }, reason: { type: "string" } },
      },
    },
  },
};

const SYSTEM = `You give quick fit scores (0-100) for job ads against one CV, for an international job seeker in Sweden.
Use only the CV and ad text. Weigh explicit requirements most (experience, skills, Swedish language, licences). Never assume skills not in the CV.
For every ad id return score and a one-line plain-English reason (max ~20 words) naming the main match or gap.`;

type Hit = {
  id: string; headline?: string; publication_date?: string; webpage_url?: string;
  employer?: { name?: string }; workplace_address?: { municipality?: string; city?: string; region?: string };
  description?: { text?: string };
};

async function scoreJobs(key: string, cv: string, jobs: FoundJob[]) {
  const input = `CV:\n"""\n${cv}\n"""\n\nADS:\n` + jobs.map((j) => `--- id: ${j.id}\n${j.title} — ${j.employer}\n${j.text.slice(0, 1800)}`).join("\n\n");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra", instructions: SYSTEM, input, stream: true, store: false,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "scores", strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) return { error: res.status === 429 ? "Too many requests — scores unavailable, try again in a minute." : res.status === 402 ? "AI credits are exhausted, so fit scores are unavailable." : "Fit scores are unavailable right now." };
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
        if (ev.type === "response.failed" || ev.type === "error") return { error: "Fit scores are unavailable right now." };
      } catch {}
    }
  }
  try { return { scores: (JSON.parse(text) as { scores: { id: string; score: number; reason: string }[] }).scores }; }
  catch { return { error: "Fit scores are unavailable right now." }; }
}

export const findJobs = createServerFn({ method: "POST" })
  .inputValidator((d: { keywords: string; city?: string; cv?: string }) => {
    const keywords = String(d?.keywords ?? "").trim().slice(0, 100);
    if (keywords.length < 2) throw new Error("Please enter a keyword, e.g. \"data engineer\".");
    return { keywords, city: String(d?.city ?? "").trim().slice(0, 60), cv: String(d?.cv ?? "").trim().slice(0, 20000) };
  })
  .handler(async ({ data }): Promise<{ ok: true; jobs: FoundJob[]; note: string } | { ok: false; error: string }> => {
    let hits: Hit[];
    try {
      const q = [data.keywords, data.city].filter(Boolean).join(" ");
      const r = await fetch(`https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&limit=10`, { headers: { accept: "application/json" } });
      if (!r.ok) return { ok: false, error: FRIENDLY };
      hits = ((await r.json()) as { hits?: Hit[] }).hits ?? [];
    } catch {
      return { ok: false, error: FRIENDLY };
    }
    let jobs: FoundJob[] = hits.map((h) => ({
      id: String(h.id),
      title: h.headline ?? "Untitled role",
      employer: h.employer?.name ?? "not specified",
      city: h.workplace_address?.municipality ?? h.workplace_address?.city ?? h.workplace_address?.region ?? "not specified",
      published: (h.publication_date ?? "").slice(0, 10),
      url: h.webpage_url ?? `https://arbetsformedlingen.se/platsbanken/annonser/${h.id}`,
      text: [h.headline, h.employer?.name && `Employer: ${h.employer.name}`, h.description?.text].filter(Boolean).join("\n\n").slice(0, 15000),
      score: null, reason: "",
    }));
    let note = "";
    const key = process.env["LOVABLE_API_KEY"];
    if (!jobs.length) return { ok: true, jobs, note };
    if (data.cv.length < 30) note = "Add your CV to get fit scores.";
    else if (!key) note = "Fit scores are unavailable right now.";
    else {
      const s = await scoreJobs(key, data.cv, jobs);
      if ("error" in s) note = s.error ?? "";
      else {
        const m = new Map(s.scores.map((x) => [x.id, x]));
        jobs = jobs.map((j) => {
          const x = m.get(j.id);
          return x ? { ...j, score: Math.max(0, Math.min(100, Math.round(x.score))), reason: x.reason } : j;
        }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      }
    }
    return { ok: true, jobs, note };
  });

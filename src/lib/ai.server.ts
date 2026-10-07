// Shared server-only helper: one structured-JSON call to the Lovable AI Gateway (Responses API).
export type AiResult<T> = { ok: true; result: T } | { ok: false; error: string };

export async function aiJson<T>(instructions: string, input: string, name: string, schema: object): Promise<AiResult<T>> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { ok: false, error: "AI is not configured." };
  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name, strict: true, schema } },
      }),
    });
  } catch {
    return { ok: false, error: "Couldn't reach the AI service. Please try again." };
  }
  if (!res.ok) {
    if (res.status === 429) return { ok: false, error: "Too many requests right now — please try again in a minute." };
    if (res.status === 402) return { ok: false, error: "AI credits are exhausted for this workspace." };
    let msg = "";
    try { msg = ((await res.json()) as { error?: { message?: string } })?.error?.message ?? ""; } catch {}
    return { ok: false, error: msg || `The AI service returned an error (${res.status}).` };
  }
  try {
    const j = (await res.json()) as { output?: { type: string; content?: { type: string; text?: string }[] }[]; output_text?: string };
    const text = j.output_text ?? j.output?.flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("") ?? "";
    if (!text) return { ok: false, error: "The AI declined or returned an empty answer." };
    return { ok: true, result: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: "The AI returned an unreadable answer. Please try again." };
  }
}

export const FACTS_ONLY = `STRICT: Use only facts present in the CV and the provided text. Never invent experience, employers, numbers, metrics, dates, degrees or titles. If something is unknown, leave it out or say "not specified".`;

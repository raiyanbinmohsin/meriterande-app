import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const FEEDBACK_MAX = 1000;

export const sendFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { message: string; page?: string; website?: string }) => ({
    message: String(d?.message ?? "").trim(),
    page: String(d?.page ?? "").split("?")[0]!.slice(0, 200),
    website: String(d?.website ?? ""),
  }))
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (data.website) return { ok: true }; // honeypot
    if (data.message.length < 3) return { ok: false, error: "Please write a few words." };
    if (data.message.length > FEEDBACK_MAX) return { ok: false, error: `Please keep it under ${FEEDBACK_MAX} characters.` };
    const { rateLimit } = await import("./rate-limit.server");
    const rl = await rateLimit("feedback"); if (rl) return rl;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) userId = (await supabaseAdmin.auth.getUser(auth.slice(7))).data.user?.id ?? null;
    const { error } = await supabaseAdmin.from("feedback").insert({ message: data.message, page: data.page || null, user_id: userId });
    if (error) { console.error("feedback", error); return { ok: false, error: "Couldn't send your feedback. Please try again." }; }
    return { ok: true };
  });

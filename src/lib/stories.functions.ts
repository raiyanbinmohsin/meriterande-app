import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const STORY_LIMITS = { name: 80, role: 120, story: 1200, perDay: 3 } as const;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const submitStory = createServerFn({ method: "POST" })
  .inputValidator((d: { name?: string | null; role: string; story: string; consent: boolean; website?: string }) => ({
    name: d?.name ? String(d.name).trim() : null,
    role: String(d?.role ?? "").trim(),
    story: String(d?.story ?? "").trim(),
    consent: d?.consent === true,
    website: String(d?.website ?? ""),
  }))
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    // Honeypot: bots fill the hidden field. Pretend success, store nothing.
    if (data.website) return { ok: true };
    if (!data.consent) return { ok: false, error: "Please tick the consent box." };
    if (data.role.length < 2 || data.role.length > STORY_LIMITS.role) return { ok: false, error: "Tell us the role you landed (max 120 characters)." };
    if (data.story.length < 20 || data.story.length > STORY_LIMITS.story) return { ok: false, error: "Your story needs 20–1200 characters." };
    if (data.name && data.name.length > STORY_LIMITS.name) return { ok: false, error: "Name can be at most 80 characters." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }
    const ip = getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = await sha256(`meriterande-story:${ip}`);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const ipCount = await supabaseAdmin.from("stories").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
    if ((ipCount.count ?? 0) >= STORY_LIMITS.perDay) return { ok: false, error: "You've shared 3 stories today. Please try again tomorrow." };
    if (userId) {
      const uc = await supabaseAdmin.from("stories").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
      if ((uc.count ?? 0) >= STORY_LIMITS.perDay) return { ok: false, error: "You've shared 3 stories today. Please try again tomorrow." };
    }
    const { error } = await supabaseAdmin.from("stories").insert({
      name: data.name || null, role: data.role, story: data.story, consent: true, status: "pending", ip_hash: ipHash, user_id: userId,
    });
    if (error) { console.error("story insert", error); return { ok: false, error: "Couldn't send your story. Please try again." }; }
    return { ok: true };
  });

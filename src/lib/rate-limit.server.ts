import { getRequestHeader } from "@tanstack/react-start/server";
import { RATE_LIMITS, limitMessage, type RateKind } from "./rate-limit";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns an error result when the caller is over the hourly limit; otherwise records the call and returns null. */
export async function rateLimit(kind: RateKind): Promise<{ ok: false; error: string } | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let id = "";
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data } = await supabaseAdmin.auth.getUser(auth.slice(7));
      if (data.user) id = `u:${data.user.id}`;
    }
    if (!id) id = `ip:${getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}`;
    const key = await sha256(`meriterande-rl:${id}`);
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabaseAdmin.from("rate_events").select("id", { count: "exact", head: true }).eq("key_hash", key).eq("kind", kind).gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMITS[kind]) return { ok: false, error: limitMessage(kind) };
    await supabaseAdmin.from("rate_events").insert({ key_hash: key, kind });
    // Records older than 24h are removed by the scheduled purge_expired_data() job.
    return null;
  } catch (e) {
    console.error("rateLimit", e);
    return null; // never block users because the limiter itself failed
  }
}

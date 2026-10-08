import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Aggregates come only from the get_insights() database function (thresholds enforced there),
// which is callable by the server alone — and only for signed-in users who opted in.
export const loadInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<unknown> => {
    const { data: me } = await context.supabase.from("user_data").select("share_insights").eq("user_id", context.userId).maybeSingle();
    if (!me?.share_insights) return { ready: false, joined: 0, needed: 10, optedIn: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_insights");
    if (error) { console.error("get_insights", error); return { ready: false, joined: 0, needed: 10 }; }
    return data;
  });

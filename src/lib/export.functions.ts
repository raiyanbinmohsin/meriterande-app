import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Returns every server-side row tied to the signed-in user (stories and feedback have no
// user-readable RLS, so they are read with the admin client strictly filtered by userId).
export const exportMyServerData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [stories, feedback, insights] = await Promise.all([
      supabaseAdmin.from("stories").select("name, role, story, status, created_at").eq("user_id", userId),
      supabaseAdmin.from("feedback").select("message, page, created_at").eq("user_id", userId),
      supabaseAdmin.from("insight_events").select("job_title, fit_score, gaps, created_at").eq("user_id", userId),
    ]);
    if (stories.error || feedback.error || insights.error) throw new Error("Couldn't export your data. Please try again.");
    return { stories: stories.data, feedback: feedback.data, insight_events: insights.data };
  });

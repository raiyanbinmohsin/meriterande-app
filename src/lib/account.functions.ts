import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FAIL = "Couldn't delete your account. Nothing was removed — please try again.";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const { userId } = context;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // Deleting the auth user is the single atomic step: every app table references
      // auth.users ON DELETE CASCADE, so rows go in the same transaction or not at all.
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) { console.error("deleteUser", error); return { ok: false, error: FAIL }; }
      // Explicit cleanup (should already be empty via cascade); report honestly if anything remains.
      const tables = ["user_roles", "user_data", "insight_events"] as const;
      const left: string[] = [];
      for (const t of tables) {
        const del = await supabaseAdmin.from(t).delete().eq("user_id", userId);
        if (del.error) left.push(t);
      }
      if (left.length) return { ok: false, error: "Your account was deleted, but some data couldn't be confirmed as removed. Please contact us." };
      return { ok: true };
    } catch (e) {
      console.error("deleteMyAccount", e);
      return { ok: false, error: FAIL };
    }
  });

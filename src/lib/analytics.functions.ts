import { createServerFn } from "@tanstack/react-start";

export const EVENTS = ["decode_started", "decode_completed", "roadmap_generated", "share_card_downloaded", "tracker_card_saved", "thesis_pitch_generated"] as const;
export type EventName = (typeof EVENTS)[number];

// Privacy-friendly: stores only the event name, page path and time — no user id, IP, cookies or content.
export const logEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; path?: string }) => {
    if (!(EVENTS as readonly string[]).includes(d?.name)) throw new Error("Unknown event");
    return { name: d.name as EventName, path: String(d?.path ?? "").split("?")[0]!.slice(0, 200) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analytics_events").insert({ name: data.name, path: data.path || null });
    return { ok: true };
  });

export function track(name: EventName) {
  if (typeof window === "undefined") return;
  void logEvent({ data: { name, path: window.location.pathname } }).catch(() => {});
}

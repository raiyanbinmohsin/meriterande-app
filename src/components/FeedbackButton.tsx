import { useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { sendFeedback, FEEDBACK_MAX } from "@/lib/feedback.functions";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setState(null);
    try {
      const r = await sendFeedback({ data: { message: msg, page: window.location.pathname, website: hp } });
      if (r.ok) { setMsg(""); setState({ ok: true, text: "Thank you! We read every message." }); }
      else setState({ ok: false, text: r.error });
    } catch { setState({ ok: false, text: "Couldn't send your feedback. Please try again." }); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed bottom-4 start-4 z-40 print:hidden">
      {open ? (
        <form onSubmit={submit} className="w-[min(20rem,calc(100vw-2rem))] rounded-3xl border border-border bg-popover p-4 text-popover-foreground shadow-lift">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">What should we build next?</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close feedback" className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
          </div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={FEEDBACK_MAX} rows={4} required aria-label="Your feedback"
            placeholder="An idea, a bug, anything..." className="mt-2 w-full rounded-2xl border border-input bg-background p-3 text-[16px] text-foreground outline-none focus:border-ring" />
          <input value={hp} onChange={(e) => setHp(e.target.value)} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <p className="text-xs text-muted-foreground">Please don't include personal details.</p>
          {state && <p role="status" className={`mt-2 text-sm ${state.ok ? "text-success" : "text-destructive"}`}>{state.text}</p>}
          <button disabled={busy || msg.trim().length < 3} className="mt-3 h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Sending..." : "Send feedback"}</button>
        </form>
      ) : (
        <button onClick={() => { setOpen(true); setState(null); }} className="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground shadow-soft">
          <MessageSquarePlus className="h-4 w-4" /> Feedback
        </button>
      )}
    </div>
  );
}

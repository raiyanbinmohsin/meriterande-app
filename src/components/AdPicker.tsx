import { useState } from "react";
import { History, KanbanSquare } from "lucide-react";
import { useJobs } from "@/lib/tracker";
import { useRecentAds } from "@/lib/recent-ads";

/** Lets compare mode fill an ad slot from saved tracker cards or recent decodes. */
export function AdPicker({ onPick }: { onPick: (text: string) => void }) {
  const jobs = useJobs();
  const recent = useRecentAds();
  const [open, setOpen] = useState<null | "tracker" | "recent">(null);
  const saved = jobs.filter((j) => j.adText && j.adText.trim().length >= 30);
  const items = open === "tracker"
    ? saved.map((j) => ({ key: j.id, title: j.title, sub: j.company, text: j.adText! }))
    : recent.map((r) => ({ key: r.at, title: r.title, sub: r.company, text: r.text }));
  const btn = (k: "tracker" | "recent") =>
    `inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${open === k ? "bg-primary text-primary-foreground" : "glass text-foreground"}`;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(open === "tracker" ? null : "tracker")} className={btn("tracker")} aria-expanded={open === "tracker"}>
          <KanbanSquare className="h-4 w-4" /> Pick from tracker
        </button>
        <button type="button" onClick={() => setOpen(open === "recent" ? null : "recent")} className={btn("recent")} aria-expanded={open === "recent"}>
          <History className="h-4 w-4" /> Use recent decodes
        </button>
      </div>
      {open && (
        <div className="glass mt-3 rounded-2xl p-2">
          {items.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {open === "tracker" ? "No saved ads with text yet. Ads you save to the tracker from now on can be picked here." : "No recent decodes yet. Decode an ad and it shows up here."}
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {items.map((it) => (
                <li key={it.key}>
                  <button type="button" onClick={() => { onPick(it.text); setOpen(null); }}
                    className="flex min-h-11 w-full flex-col items-start rounded-xl px-3 py-2 text-start hover:bg-secondary">
                    <span className="font-semibold text-foreground">{it.title}</span>
                    {it.sub && <span className="text-xs text-muted-foreground">{it.sub}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

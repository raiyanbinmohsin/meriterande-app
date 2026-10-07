import { useMemo } from "react";
import { TERM_RE, findTerm } from "@/lib/dictionary";

export function HighlightedAd({ text }: { text: string }) {
  const { parts, count } = useMemo(() => {
    const parts = text.split(TERM_RE);
    return { parts, count: Math.floor(parts.length / 2) };
  }, [text]);
  if (!count) return null;
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <p className="mb-2 text-sm font-semibold text-foreground">
        {count} Swedish job-ad term{count === 1 ? "" : "s"} spotted <span className="font-normal text-muted-foreground">— hover or tap to see what they mean</span>
      </p>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {parts.map((p, i) => {
          if (i % 2 === 0) return <span key={i}>{p}</span>;
          const t = findTerm(p);
          return (
            <span key={i} tabIndex={0} className="group relative cursor-help rounded bg-accent px-1 font-semibold text-accent-foreground outline-none">
              {p}
              {t && (
                <span role="tooltip" className="pointer-events-none absolute bottom-full start-0 z-30 mb-2 w-64 rounded-xl border border-border bg-popover p-3 text-left text-xs font-normal leading-snug text-popover-foreground opacity-0 shadow-lift transition group-hover:opacity-100 group-focus:opacity-100">
                  <strong className="block text-sm">{t.term}</strong>
                  <span className="block text-muted-foreground">{t.english}</span>
                  <span className="mt-1 block">{t.really}</span>
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

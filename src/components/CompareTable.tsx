import type { DecodeResult } from "@/lib/decode.functions";
import type { CompareResult } from "@/lib/compare.functions";

export function CompareTable({ results, rec }: { results: DecodeResult[]; rec: CompareResult | null }) {
  const best = rec?.best_index ?? -1;
  const rows: { label: string; get: (r: DecodeResult) => React.ReactNode }[] = [
    { label: "Fit score", get: (r) => <span className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>{r.fit?.score ?? "—"}</span> },
    { label: "Swedish required?", get: (r) => r.swedish.verdict },
    { label: "Must-haves met", get: (r) => `${r.fit?.must_haves_met ?? "—"} / ${r.must_haves.length}` },
    { label: "Time to close the gap", get: (r) => r.fit?.time_to_close ?? "not specified" },
  ];
  return (
    <div className="glass rounded-3xl p-5 sm:p-7">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>Side by side</h3>
      {rec && (
        <div className="mb-5 rounded-2xl bg-accent p-4 text-accent-foreground">
          <strong>Apply to Ad {best + 1} first, because </strong>{rec.reason}
        </div>
      )}
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-x-2 text-start">
          <thead>
            <tr>
              <th />
              {results.map((r, i) => (
                <th key={i} className={`rounded-t-2xl p-3 text-start align-top ${i === best ? "bg-primary/10" : ""}`}>
                  <span className="text-sm font-bold text-primary">Ad {i + 1}{i === best && " · top pick"}</span>
                  <p className="mt-1 line-clamp-3 text-sm font-normal text-muted-foreground">{r.role_summary}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border-t border-border py-3 pe-3 text-sm font-semibold text-foreground">{row.label}</td>
                {results.map((r, i) => (
                  <td key={i} className={`border-t border-border p-3 text-foreground ${i === best ? "bg-primary/10" : ""}`}>{row.get(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

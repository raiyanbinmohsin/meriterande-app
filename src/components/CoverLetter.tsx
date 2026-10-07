import { useState } from "react";
import { FileText, Copy, Download } from "lucide-react";
import { writeCoverLetter, type CoverLetter as CL } from "@/lib/tools.functions";

const chip = (on: boolean) => `h-11 rounded-full px-4 text-sm font-semibold transition ${on ? "bg-primary text-primary-foreground shadow-soft" : "glass text-foreground"}`;

export function CoverLetter({ ad, cv, localLang }: { ad: string; cv: string; localLang: string }) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<"formal" | "warm">("formal");
  const [length, setLength] = useState<"short" | "standard">("standard");
  const [language, setLanguage] = useState("English");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<CL | null>(null);
  const [copied, setCopied] = useState(false);

  async function go() {
    setBusy(true); setErr(null);
    try {
      const r = await writeCoverLetter({ data: { ad, cv, tone, length, language } });
      if (r.ok) setRes(r.result); else setErr(r.error);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong. Please try again."); } finally { setBusy(false); }
  }
  async function docx() {
    if (!res) return;
    const { Document, Packer, Paragraph, TextRun } = await import("docx");
    const doc = new Document({ sections: [{ children: res.letter.split(/\n/).map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 24, font: "Calibri" })], spacing: { after: 120 } })) }] });
    const blob = await Packer.toBlob(doc);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "cover-letter.docx"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="glass lift flex w-full items-center gap-4 rounded-3xl p-5 text-start">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary"><FileText className="h-6 w-6" /></span>
        <span><span className="block text-lg font-semibold text-foreground">Write my cover letter</span><span className="text-sm text-muted-foreground">Uses only facts from your CV and this ad.</span></span>
      </button>
    );
  }
  return (
    <div className="glass rounded-3xl p-6 sm:p-7">
      <h3 className="text-2xl font-semibold">Cover letter</h3>
      <p className="mb-4 text-sm text-muted-foreground">Built only from your CV and the ad — nothing invented.</p>
      <div className="flex flex-wrap gap-2">
        <button className={chip(tone === "formal")} onClick={() => setTone("formal")}>Formal</button>
        <button className={chip(tone === "warm")} onClick={() => setTone("warm")}>Warm</button>
        <span className="mx-1 hidden w-px bg-border sm:block" />
        <button className={chip(length === "short")} onClick={() => setLength("short")}>Short</button>
        <button className={chip(length === "standard")} onClick={() => setLength("standard")}>Standard</button>
        <span className="mx-1 hidden w-px bg-border sm:block" />
        <button className={chip(language === "English")} onClick={() => setLanguage("English")}>English</button>
        <button className={chip(language === localLang)} onClick={() => setLanguage(localLang)}>{localLang}</button>
      </div>
      <button onClick={go} disabled={busy} className="mt-4 h-12 rounded-full bg-primary px-7 font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
        {busy ? "Writing..." : res ? "Rewrite" : "Write it"}
      </button>
      {busy && <div className="mt-5 space-y-2.5">{[0, 1, 2, 3].map((k) => <div key={k} className="skeleton h-4 rounded-full" style={{ width: `${95 - k * 12}%` }} />)}</div>}
      {err && <p role="alert" className="mt-4 rounded-2xl bg-destructive/10 p-4 text-destructive">{err}</p>}
      {res && !busy && (
        <div className="mt-5">
          <p className="text-sm text-muted-foreground"><strong>Subject:</strong> {res.subject}</p>
          <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-border bg-background/70 p-5 leading-relaxed text-foreground">{res.letter}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={async () => { await navigator.clipboard.writeText(res.letter); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
              className="glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"><Copy className="h-4 w-4" />{copied ? "Copied ✓" : "Copy"}</button>
            <button onClick={docx} className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground"><Download className="h-4 w-4" />Download .docx</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from "react";

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const c = await (await pdf.getPage(i)).getTextContent();
      pages.push(c.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join(""));
    }
    return pages.join("\n\n");
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ arrayBuffer: buf })).value;
  }
  throw new Error("Please upload a PDF or DOCX file.");
}

export function CvUpload({ onText }: { onText: (t: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(f: File | undefined) {
    if (!f) return;
    setError(null); setFile(f.name); setBusy(true);
    try {
      const t = (await extractText(f)).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (t.length < 20) { setError("Couldn't read text from this file. Please paste your CV instead."); setFile(null); }
      else onText(t);
    } catch (e) {
      const msg = e instanceof Error && e.message.startsWith("Please upload") ? e.message : "Couldn't read text from this file. Please paste your CV instead.";
      setError(msg); setFile(null);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="mb-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition ${drag ? "border-primary bg-secondary" : "border-border"}`}
      >
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:opacity-90 disabled:opacity-60">
          Upload CV (PDF or DOCX)
        </button>
        {busy ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" /> Reading {file}...
          </span>
        ) : file ? (
          <span className="flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            {file}
            <button type="button" aria-label="Remove file" onClick={() => { setFile(null); onText(""); }} className="font-bold hover:opacity-70">×</button>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">or drag and drop a file here</span>
        )}
        <input ref={input} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

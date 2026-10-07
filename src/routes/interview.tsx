import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Send, RotateCcw } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { getInterviewSetup, setInterviewSetup, type InterviewSetup } from "@/lib/interview-store";
import { gradeAnswer, interviewQuestions, interviewSummary, type Grade } from "@/lib/tools.functions";
import { useCvText } from "@/lib/cv-store";

const T = "Mock interview — Meriterande";
const D = "Practise five interview questions one at a time, by typing or speaking, and get a score and a stronger answer based only on your CV.";
export const Route = createFileRoute("/interview")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Interview,
});

type SR = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const getSR = (): (new () => SR) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

function Interview() {
  const [setup, setSetup] = useState<InterviewSetup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cvShared] = useCvText();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grades, setGrades] = useState<(Grade & { question: string; answer: string })[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ improvements: string[]; verdict: string } | null>(null);
  const [srOk, setSrOk] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<SR | null>(null);
  const [ctx, setCtx] = useState("");

  useEffect(() => { setSetup(getInterviewSetup()); setSrOk(!!getSR()); setLoaded(true); }, []);

  function toggleMic() {
    if (listening) { rec.current?.stop(); return; }
    const C = getSR(); if (!C) return;
    const r = new C(); r.lang = "en-US"; r.continuous = true; r.interimResults = false;
    const base = answer ? answer.trim() + " " : "";
    let said = "";
    r.onresult = (e) => { said = Array.from(e.results).map((x) => x[0]?.transcript ?? "").join(" "); setAnswer(base + said); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  }

  async function start() {
    setBusy(true); setErr(null);
    try {
      const r = await interviewQuestions({ data: { context: ctx, cv: cvShared } });
      if (!r.ok) { setErr(r.error); return; }
      const s = { title: "Your role", context: ctx, cv: cvShared, questions: r.result.questions.slice(0, 5) };
      setInterviewSetup(s); setSetup(s);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); }
  }

  async function submit() {
    if (!setup) return;
    rec.current?.stop();
    const question = setup.questions[idx] ?? "";
    setBusy(true); setErr(null);
    try {
      const r = await gradeAnswer({ data: { question, answer, cv: setup.cv || cvShared, context: setup.context } });
      if (!r.ok) { setErr(r.error); return; }
      const next = [...grades, { ...r.result, question, answer }];
      setGrades(next);
      if (next.length === setup.questions.length) {
        const s = await interviewSummary({ data: { items: next.map((g) => ({ question: g.question, score: g.score, improve: g.improve })) } });
        if (s.ok) setSummary(s.result); else setErr(s.error);
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); }
  }
  function nextQ() { setIdx(idx + 1); setAnswer(""); }
  function restart() { setIdx(0); setAnswer(""); setGrades([]); setSummary(null); }

  const current = grades[idx];
  const done = setup && grades.length === setup.questions.length;
  const overall = grades.length ? Math.round((grades.reduce((n, g) => n + g.score, 0) / grades.length) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-5xl text-foreground sm:text-6xl">Mock <em className="text-primary">interview</em></h1>
        {setup && <p className="mt-3 text-muted-foreground">{setup.title} · {setup.questions.length} questions</p>}
        {!loaded ? null : !setup ? (
          <div className="glass mt-8 space-y-4 rounded-3xl p-6 sm:p-8">
            <p className="text-muted-foreground">Start from the <Link to="/thesis" className="text-primary underline-offset-4 hover:underline">interview prep cards</Link> on the Pitch a thesis tab — or describe the role here to get 5 questions.</p>
            <textarea value={ctx} onChange={(e) => setCtx(e.target.value)} rows={5} placeholder="Paste the job ad or describe the role..." aria-label="Role description"
              className="w-full rounded-2xl border border-input bg-background/70 p-4 text-[16px] outline-none focus:border-ring" />
            <p className="text-sm text-muted-foreground">{cvShared.trim() ? "✓ Using your CV from the decoder tab." : "Tip: add your CV on the decoder tab so stronger answers can use your real experience."}</p>
            {err && <p role="alert" className="text-destructive">{err}</p>}
            <button onClick={start} disabled={busy} className="h-12 rounded-full bg-primary px-7 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Preparing..." : "Start interview"}</button>
          </div>
        ) : (
          <>
            <div className="mt-6 flex gap-1.5" aria-label="Progress">
              {setup.questions.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < grades.length ? "bg-primary" : i === idx ? "bg-sun" : "bg-muted"}`} />)}
            </div>
            {!done || !summary ? (
              <AnimatePresence mode="wait">
                <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass mt-6 rounded-3xl p-6 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Question {idx + 1} of {setup.questions.length}</p>
                  <p className="mt-2 text-2xl leading-snug text-foreground sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>{setup.questions[idx]}</p>
                  {!current ? (
                    <>
                      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} placeholder={srOk ? "Type your answer, or tap the mic to speak..." : "Type your answer..."} aria-label="Your answer"
                        className="mt-5 w-full rounded-2xl border border-input bg-background/70 p-4 text-[16px] leading-relaxed outline-none focus:border-ring" />
                      {err && <p role="alert" className="mt-2 text-destructive">{err}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {srOk && (
                          <button onClick={toggleMic} aria-pressed={listening} className={`inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold ${listening ? "bg-destructive text-destructive-foreground" : "glass"}`}>
                            {listening ? <><MicOff className="h-5 w-5" /> Stop</> : <><Mic className="h-5 w-5" /> Speak</>}
                          </button>
                        )}
                        <button onClick={submit} disabled={busy || answer.trim().length < 3} className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60">
                          <Send className="h-4 w-4" /> {busy ? "Scoring..." : "Submit answer"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <div className="flex items-baseline gap-2"><span className="text-6xl text-primary" style={{ fontFamily: "var(--font-display)" }}>{current.score}</span><span className="text-muted-foreground">/ 10</span></div>
                      <p><strong className="text-success">What was strong: </strong>{current.strong}</p>
                      <p><strong className="text-warning">What to improve: </strong>{current.improve}</p>
                      <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground"><p className="mb-1 text-xs font-bold uppercase tracking-[0.12em]">Stronger version (from your CV)</p><p className="whitespace-pre-wrap">{current.stronger}</p></div>
                      {idx + 1 < setup.questions.length ? (
                        <button onClick={nextQ} className="h-12 rounded-full bg-primary px-7 font-semibold text-primary-foreground">Next question</button>
                      ) : busy ? <p className="text-muted-foreground">Preparing your summary...</p> : err ? <p className="text-destructive">{err}</p> : null}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass mt-6 rounded-3xl p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Overall score</p>
                <p className="text-7xl text-primary" style={{ fontFamily: "var(--font-display)" }}>{overall}<span className="text-2xl text-muted-foreground"> / 10</span></p>
                <p className="mt-2 text-foreground">{summary.verdict}</p>
                <h2 className="mt-6 text-2xl font-semibold">Top 3 improvements</h2>
                <ol className="mt-3 list-decimal space-y-2 ps-5">{summary.improvements.slice(0, 3).map((x, i) => <li key={i}>{x}</li>)}</ol>
                <ul className="mt-6 space-y-1 text-sm text-muted-foreground">{grades.map((g, i) => <li key={i}>Q{i + 1}: {g.score}/10 — {g.question}</li>)}</ul>
                <button onClick={restart} className="glass mt-6 inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold"><RotateCcw className="h-4 w-4" /> Try again</button>
              </motion.div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

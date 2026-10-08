import { createFileRoute, Link } from "@tanstack/react-router";
import { OG_IMAGE } from "@/lib/seo";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Volume2, Check, X, GraduationCap } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { microLesson, type Lesson } from "@/lib/tools.functions";
import { useProgress, markPhraseLearned, isLearned } from "@/lib/progress";

const T = "Swedish micro-lessons — Meriterande";
const D = "Short lessons on Swedish job-ad phrases: meaning, pronunciation, an example sentence and a quick quiz.";
export const Route = createFileRoute("/learn")({
  validateSearch: (s: Record<string, unknown>) => ({ phrase: typeof s["phrase"] === "string" && s["phrase"] ? s["phrase"].slice(0, 80) : undefined }),
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { property: "og:image", content: OG_IMAGE }, { name: "twitter:image", content: OG_IMAGE }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Learn,
});

export const STARTER_DECK = [
  "meriterande", "provanställning", "tillsvidareanställning", "visstidsanställning", "kollektivavtal", "löpande urval",
  "friskvårdsbidrag", "B-körkort", "tjänstepension", "heltid", "deltid", "tillträde enligt överenskommelse",
  "flexibla arbetstider", "personligt brev", "sista ansökningsdag", "krav", "önskvärt", "flytande svenska",
  "goda kunskaper i svenska", "lönesättning", "individuell lönesättning", "semester", "OB-tillägg", "registerutdrag", "fika",
];

function Chip({ t, active, learned }: { t: string; active: boolean; learned: boolean }) {
  return (
    <Link to="/learn" search={{ phrase: t }} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground" : "glass text-foreground"}`}>
      {learned && <Check className="h-4 w-4 text-success" />}{t}
    </Link>
  );
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "sv-SE"; u.rate = 0.85;
  const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith("sv"));
  if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}

function Learn() {
  const { phrase } = Route.useSearch();
  const prog = useProgress();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [tts, setTts] = useState(false);
  useEffect(() => setTts(typeof window !== "undefined" && "speechSynthesis" in window), []);

  useEffect(() => {
    if (!phrase) { setLesson(null); return; }
    setBusy(true); setErr(null); setLesson(null); setPicks({});
    microLesson({ data: { phrase } }).then((r) => { if (r.ok) setLesson(r.result); else setErr(r.error); })
      .catch(() => setErr("Couldn't load this lesson. Please try again.")).finally(() => setBusy(false));
  }, [phrase]);

  const answered = lesson ? Object.keys(picks).length : 0;
  const correct = lesson ? lesson.quiz.filter((q, i) => picks[i] === q.answer).length : 0;
  useEffect(() => { if (lesson && answered === lesson.quiz.length && correct >= 2) markPhraseLearned(lesson.phrase || phrase || ""); }, [answered, correct, lesson, phrase]);

  const targets = prog.phrasesSeen;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-5xl text-foreground sm:text-6xl">Swedish <em className="text-primary">micro-lessons</em></h1>
        <p className="mt-3 text-muted-foreground">Phrases from the ads you decode, plus a starter deck. {prog.phrasesLearned.length} learned so far.</p>

        {targets.length > 0 && (
          <>
            <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">From your ads</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {targets.map((t) => <Chip key={t} t={t} active={t === phrase} learned={isLearned(prog, t)} />)}
            </div>
          </>
        )}
        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Starter deck · 25 essential workplace phrases</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {STARTER_DECK.filter((t) => !targets.some((x) => x.toLowerCase() === t.toLowerCase())).map((t) => <Chip key={t} t={t} active={t === phrase} learned={isLearned(prog, t)} />)}
        </div>
        {targets.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Decode a Swedish job ad and its phrases appear on top — or pick one from the <Link to="/dictionary" className="text-primary underline-offset-4 hover:underline">dictionary</Link>.</p>}

        {!phrase && <div className="glass mt-8 rounded-3xl p-8 text-center"><GraduationCap className="mx-auto h-10 w-10 text-primary" /><p className="mt-3 text-muted-foreground">Pick a phrase to start a 2-minute lesson.</p></div>}
        {busy && <div className="glass mt-8 space-y-3 rounded-3xl p-6"><div className="skeleton h-8 w-1/2 rounded-full" /><div className="skeleton h-4 w-full rounded-full" /><div className="skeleton h-4 w-4/5 rounded-full" /></div>}
        {err && <p role="alert" className="mt-8 rounded-3xl bg-destructive/10 p-5 text-destructive">{err}</p>}
        {lesson && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-5">
            <div className="glass rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-4xl">{lesson.phrase || phrase}</h2>
                {tts && <button onClick={() => speak(lesson.phrase || phrase || "")} aria-label="Hear pronunciation" className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"><Volume2 className="h-5 w-5" /></button>}
                {isLearned(prog, lesson.phrase || phrase || "") && <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">Learned ✓</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Say it: <strong className="text-foreground">{lesson.pronunciation}</strong></p>
              <p className="mt-4 text-[17px]">{lesson.meaning}</p>
              <div className="mt-5 rounded-2xl bg-secondary p-4 text-secondary-foreground">
                <div className="flex items-start gap-2"><p className="flex-1 font-semibold" lang="sv">{lesson.example_sv}</p>
                  {tts && <button onClick={() => speak(lesson.example_sv)} aria-label="Hear example" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-background/60"><Volume2 className="h-4 w-4" /></button>}</div>
                <p className="mt-1 text-sm opacity-80">{lesson.example_en}</p>
              </div>
            </div>
            <div className="glass rounded-3xl p-6 sm:p-8">
              <h3 className="text-2xl font-semibold">Quick quiz</h3>
              <div className="mt-4 space-y-6">
                {lesson.quiz.map((q, i) => (
                  <div key={i}>
                    <p className="font-semibold">{i + 1}. {q.question}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {q.options.map((o, j) => {
                        const picked = picks[i] !== undefined, isAns = j === q.answer, mine = picks[i] === j;
                        return (
                          <button key={j} disabled={picked} onClick={() => setPicks({ ...picks, [i]: j })}
                            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2 text-start text-sm transition ${!picked ? "border-border hover:border-primary" : isAns ? "border-success bg-success/15" : mine ? "border-destructive bg-destructive/10" : "border-border opacity-60"}`}>
                            {picked && isAns && <Check className="h-4 w-4 shrink-0 text-success" />}{picked && mine && !isAns && <X className="h-4 w-4 shrink-0 text-destructive" />}{o}
                          </button>
                        );
                      })}
                    </div>
                    {picks[i] !== undefined && <p className="mt-2 text-sm text-muted-foreground">{q.why}</p>}
                  </div>
                ))}
              </div>
              {answered === lesson.quiz.length && (
                <p className={`mt-6 rounded-2xl p-4 font-semibold ${correct >= 2 ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"}`}>
                  {correct}/{lesson.quiz.length} correct. {correct >= 2 ? "Added to your learned phrases!" : "Try it again later to mark it learned."}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

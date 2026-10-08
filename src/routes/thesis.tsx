import { ThesisIllustration } from "@/components/illustrations";
import { OG_IMAGE } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Mail, Sparkles, X, Users, MessageSquare, Linkedin } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { CvUpload } from "@/components/CvUpload";
import { AdLinkFetch } from "@/components/AdLinkFetch";
import { CloseTheGap } from "@/components/CloseTheGap";
import { useCvText } from "@/lib/cv-store";
import { LANGS, COUNTRIES, countryOf } from "@/lib/decode.functions";
import { LongProgress, TaskError, withDeadline } from "@/components/LongTask";
import { generatePitch, pitchForIdea, extractSkills, type Pitch, type Idea, type Outreach } from "@/lib/thesis.functions";
import { addJob } from "@/lib/tracker";
import { setInterviewSetup } from "@/lib/interview-store";
import { downloadThesisCard } from "@/components/thesis-share";
import { track } from "@/lib/analytics.functions";

const TITLE = "Pitch a thesis — Meriterande";
const DESC = "Don't wait for a thesis ad. Generate tailored thesis ideas, a cold email and a LinkedIn note to pitch your own thesis to a company.";

export const Route = createFileRoute("/thesis")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { property: "og:image", content: OG_IMAGE }, { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThesisPage,
});

const LOADING = ["Reading between the job ads...", "Convincing a CTO you're worth it...", "Brewing a fika while we read...", "Sketching three ideas they can't ignore..."];

const EXAMPLE = {
  program: "MSc Data Science (Data Engineering), Uppsala University",
  start: "2027-01",
  length: "30 hp",
  skills: ["PySpark", "Apache Pulsar", "SQL", "Explainable AI"],
  company: "Spotify",
  cv: "MSc Data Science student (Data Engineering track), Uppsala University. Built a streaming pipeline with Apache Pulsar and PySpark for a course project; SQL for analytics; master's coursework in explainable AI (SHAP, LIME). Python, Git, Docker. English fluent.",
};

const input = "h-12 w-full rounded-full border border-input bg-background/70 px-4 text-[16px] text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15";
const area = "w-full resize-y rounded-2xl border border-input bg-background/70 p-4 text-[16px] leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15";

function ThesisPage() {
  const [cv, setCv] = useCvText();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [extracting, setExtracting] = useState(false);
  const extractedFor = useRef("");
  const [program, setProgram] = useState("");
  const [start, setStart] = useState("");
  const [length, setLength] = useState("30 hp");
  const [company, setCompany] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [tone, setTone] = useState("Formal");
  const [emailLang, setEmailLang] = useState("English");
  const [lang, setLang] = useState("English");
  const [country, setCountry] = useState("Sweden");
  const [roast, setRoast] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [sel, setSel] = useState(0);
  const [out, setOut] = useState<Outreach | null>(null);
  const [regen, setRegen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [used, setUsed] = useState({ lang: "English", country: "Sweden", roast: false });
  const rtl = used.lang === "Arabic" || used.lang === "Persian";

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsg((i) => (i + 1) % LOADING.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  // Auto-extract skills from the CV (debounced).
  useEffect(() => {
    const text = cv.trim();
    if (text.length < 50 || extractedFor.current === text) return;
    const t = setTimeout(async () => {
      extractedFor.current = text;
      setExtracting(true);
      try {
        const r = await extractSkills({ data: { cv: text } });
        if (r.ok) setSkills((prev) => [...new Set([...prev, ...r.result.skills])]);
      } catch {} finally { setExtracting(false); }
    }, 1200);
    return () => clearTimeout(t);
  }, [cv]);

  function addSkill() {
    const s = skillDraft.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillDraft("");
  }

  function tryExample() {
    setProgram(EXAMPLE.program); setStart(EXAMPLE.start); setLength(EXAMPLE.length);
    setCompany(EXAMPLE.company); setSkills(EXAMPLE.skills);
    extractedFor.current = EXAMPLE.cv; setCv(EXAMPLE.cv); setError(null);
  }

  const base = () => ({ cv, skills, program, start: fmtMonth(start), length, company, companyInfo, tone, emailLang: emailLang === "English" ? "English" : "local", lang, roast, country });

  async function onGenerate() {
    if (!company.trim()) { setError("Please enter a target company."); return; }
    if (cv.trim().length < 30 && !skills.length) { setError("Add your CV or a few skills first."); return; }
    setError(null); setPitch(null); setOut(null); setSaved(false); setLoading(true); setMsg(0);
    try {
      const r = await withDeadline(generatePitch({ data: base() }));
      if (r.ok) {
        track("thesis_pitch_generated");
        setUsed({ lang, country, roast });
        setPitch(r.result); setSel(r.result.best_index); setOut(r.result);
        setTimeout(() => document.getElementById("pitch")?.scrollIntoView({ behavior: "smooth" }), 50);
      } else setError(r.error);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function pick(i: number) {
    if (!pitch || i === sel || regen) return;
    setSel(i); setRegen(true); setSaved(false);
    try {
      const r = await pitchForIdea({ data: { ...base(), idea: pitch.ideas[i]! } });
      if (r.ok) setOut(r.result); else setError(r.error);
    } catch { setError("Couldn't rewrite the email for this idea. Please try again."); }
    finally { setRegen(false); }
  }

  const idea = pitch?.ideas[sel];
  const localLang = countryOf(country).lang;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="mesh pointer-events-none absolute -inset-20 -z-10" />
        <div className="mx-auto max-w-4xl px-5 pb-12 pt-16 text-center sm:pb-16 sm:pt-24">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-sun" /> For students looking for a thesis
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-[44px] leading-[0.98] text-foreground sm:text-7xl md:text-[84px]">
            Don't wait for a thesis ad. <em className="text-primary">Pitch one.</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Most companies never post their best thesis projects. Propose one they can't ignore.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
            <ThesisIllustration className="mx-auto mt-8 w-full max-w-xl" />
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-5">
        <section className="glass space-y-6 rounded-3xl p-5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl text-foreground sm:text-4xl">Pitch a thesis</h2>
              <p className="mt-1 text-muted-foreground">Tell us about you and the company you want to work with.</p>
            </div>
            <button onClick={tryExample} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:-translate-y-0.5">Try an example</button>
          </div>

          <div>
            <CvUpload onText={setCv} />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">Your CV</span>
              <textarea value={cv} onChange={(e) => setCv(e.target.value)} rows={5} placeholder="Your experience, skills, education..." className={area} />
            </label>
          </div>

          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              Skills {extracting && <span className="inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground"><span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />reading your CV...</span>}
            </span>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-input bg-background/70 p-3">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/12 py-1 ps-3 pe-1 text-sm font-semibold text-primary">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-primary/15"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
              <input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }} onBlur={addSkill}
                placeholder={skills.length ? "Add a skill..." : "Skills appear here from your CV — or type and press Enter"}
                className="h-8 min-w-[12rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-foreground">Programme and university</span>
              <input value={program} onChange={(e) => setProgram(e.target.value)} placeholder="MSc Data Science, Uppsala University" className={input} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">Thesis start</span>
              <input type="month" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
            </label>
            <div>
              <span className="mb-2 block text-sm font-semibold text-foreground">Thesis length</span>
              <Segmented options={["15 hp", "30 hp"]} value={length} onChange={setLength} />
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-foreground">Target company <span className="text-primary">*</span></span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Spotify" className={input} />
            </label>
          </div>

          <div className="space-y-3">
            <AdLinkFetchLabeled onText={(t) => setCompanyInfo(t)} />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">What you know about the company</span>
              <textarea value={companyInfo} onChange={(e) => setCompanyInfo(e.target.value)} rows={5} className={area}
                placeholder="Products, teams, tech blog posts, open roles... Leave empty and ideas will be framed as clear assumptions." />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-sm font-semibold text-foreground">Email tone</span>
              <Segmented options={["Formal", "Friendly"]} value={tone} onChange={setTone} />
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-foreground">Email language</span>
              <Segmented options={["English", localLang]} value={emailLang === "English" ? "English" : localLang} onChange={setEmailLang} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select label="Explain in" value={lang} onChange={setLang} options={[...LANGS]} />
            <Select label="Job market" value={country} onChange={(v) => { setCountry(v); setEmailLang("English"); }} options={COUNTRIES.map((c) => c.name)} />
            <button type="button" role="switch" aria-checked={roast} onClick={() => setRoast(!roast)}
              className={`flex h-12 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition ${roast ? "bg-primary text-primary-foreground shadow-soft" : "glass text-foreground"}`}>
              <span className={`relative h-5 w-9 rounded-full transition ${roast ? "bg-primary-foreground/30" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full shadow-soft transition-all ${roast ? "start-[18px] bg-primary-foreground" : "start-0.5 bg-muted-foreground"}`} />
              </span>
              Brutally honest 🔥
            </button>
          </div>

          <button onClick={onGenerate} disabled={loading}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground shadow-lift transition hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto">
            <Sparkles className="h-5 w-5" /> {loading ? "Generating..." : "Generate pitch"}
          </button>
        </section>

        {loading && (
          <div className="mt-10 space-y-4" aria-live="polite">
            <LongProgress steps={["Reading your profile", "Shaping thesis ideas", "Writing your outreach"]} expected="30–60 seconds" stepAt={15} />
            <AnimatePresence mode="wait">
              <motion.p key={msg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="px-2 text-sm text-muted-foreground">{LOADING[msg]}</motion.p>
            </AnimatePresence>
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((k) => <div key={k} className="glass rounded-3xl p-5"><div className="skeleton mx-auto h-20 w-20 rounded-full" /><div className="skeleton mt-4 h-4 w-4/5 rounded-full" /><div className="skeleton mt-2 h-3 w-full rounded-full" /><div className="skeleton mt-2 h-3 w-2/3 rounded-full" /></div>)}
            </div>
          </div>
        )}

        {error && !loading && <div className="mt-10"><TaskError message={error} onRetry={onGenerate} /></div>}

        {pitch && idea && out && (
          <motion.section id="pitch" dir={rtl ? "rtl" : "ltr"} className="mt-14 scroll-mt-24 space-y-5" initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
            <Item className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-4xl text-foreground">Your pitch</h2>
              <div className="flex flex-wrap gap-2">
                {saved ? (
                  <Link to="/tracker" className="inline-flex h-11 items-center rounded-full bg-success/15 px-5 text-sm font-semibold text-success">Saved ✓ View tracker</Link>
                ) : (
                  <button onClick={() => { addJob({ title: `Thesis pitch: ${idea.title}`, company, score: idea.readiness, verdict: "Thesis pitch", kind: "thesis" }); setSaved(true); }}
                    className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5">Save to tracker</button>
                )}
              </div>
            </Item>

            {pitch.assumptions && (
              <Item><p className="rounded-2xl border border-border bg-secondary p-4 text-sm text-secondary-foreground"><strong>Assumptions: </strong>{pitch.assumptions}</p></Item>
            )}

            <Item>
              <p className="mb-3 text-sm text-muted-foreground">Pick an idea — the email and LinkedIn note are rewritten around it.</p>
              <div className="grid gap-4 lg:grid-cols-3">
                {pitch.ideas.map((it, i) => (
                  <button key={i} onClick={() => pick(i)} aria-pressed={i === sel}
                    className={`glass lift flex h-full flex-col rounded-3xl p-5 text-start transition ${i === sel ? "ring-4 ring-primary/40" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Idea {i + 1}{i === pitch.best_index && " · strongest"}</span>
                      <Gauge value={it.readiness} />
                    </div>
                    <h3 className="mt-2 text-2xl leading-tight text-foreground">{it.title}</h3>
                    <p className="mt-2 text-sm text-foreground">{it.problem}</p>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div><dt className="font-semibold text-foreground">Approach</dt><dd className="text-muted-foreground">{it.approach}</dd></div>
                      <div><dt className="font-semibold text-foreground">Value to {company}</dt><dd className="text-muted-foreground">{it.value}</dd></div>
                      <div><dt className="font-semibold text-foreground">Feasibility ({length})</dt><dd className="text-muted-foreground">{it.feasibility}</dd></div>
                    </dl>
                    {it.skills_to_learn.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {it.skills_to_learn.map((s) => <span key={s} className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">{s}</span>)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Item>

            <Item>
              <div className={`glass rounded-3xl p-6 transition sm:p-7 ${regen ? "opacity-60" : ""}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}><Mail className="h-4 w-4" /> Cold email {regen && "· rewriting..."}</h3>
                  <div className="flex flex-wrap gap-2">
                    <CopyBtn text={`Subject: ${out.email.subject}\n\n${out.email.body}`} />
                    <a href={`mailto:?subject=${encodeURIComponent(out.email.subject)}&body=${encodeURIComponent(out.email.body)}`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Open in mail app</a>
                  </div>
                </div>
                <p className="font-semibold text-foreground">Subject: {out.email.subject}</p>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground">{out.email.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{out.email.body.trim().split(/\s+/).length} words</p>
              </div>
            </Item>

            <div className="grid gap-5 sm:grid-cols-2">
              <Item>
                <div className={`glass h-full rounded-3xl p-6 transition ${regen ? "opacity-60" : ""}`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}><Linkedin className="h-4 w-4" /> LinkedIn note</h3>
                    <CopyBtn text={out.linkedin_note} />
                  </div>
                  <p className="text-foreground">{out.linkedin_note}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{out.linkedin_note.length}/300 characters</p>
                </div>
              </Item>
              <Item>
                <div className="glass h-full rounded-3xl p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}><Users className="h-4 w-4" /> Who to contact</h3>
                  <ul className="space-y-2">{pitch.contacts.map((c) => <li key={c} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{c}</li>)}</ul>
                  <p className="mt-3 text-xs text-muted-foreground">Role titles only — find the actual person on the company's site or LinkedIn.</p>
                </div>
              </Item>
            </div>

            <Item>
              <div className="relative isolate overflow-hidden rounded-3xl bg-navy p-6 sm:p-8">
                <div className="mesh pointer-events-none absolute -inset-10 -z-10 opacity-70" />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun">Share</p>
                <p className="mt-2 text-3xl leading-tight text-primary-foreground dark:text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  I'm pitching a thesis to {company}: <em className="text-sun">{idea.title}</em>
                </p>
                <p className="mt-2 text-primary-foreground/75 dark:text-muted-foreground">Readiness {idea.readiness}/100</p>
                <p className="mt-4 rounded-2xl bg-card/90 p-4 text-sm text-foreground">{out.linkedin_post}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => { track("share_card_downloaded"); void downloadThesisCard(company, idea.title, idea.readiness, rtl); }}
                    className="inline-flex h-11 items-center rounded-full bg-sun px-5 text-sm font-semibold text-navy">Download image</button>
                  <CopyBtn text={out.linkedin_post} label="Copy LinkedIn post" />
                </div>
              </div>
            </Item>

            <Item>
              <div className={`glass rounded-3xl p-6 transition sm:p-7 ${regen ? "opacity-60" : ""}`}>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}><MessageSquare className="h-4 w-4" /> Interview prep</h3>
                <ol className="space-y-4">
                  {out.interview.map((q, i) => (
                    <li key={i}><p className="font-semibold text-foreground">{i + 1}. {q.question}</p><p className="mt-1 text-sm text-muted-foreground"><strong>Hint: </strong>{q.hint}</p></li>
                  ))}
                  <li className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-warning">Tough one</p>
                    <p className="mt-1 font-semibold text-foreground">{out.tough.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground"><strong>Hint: </strong>{out.tough.hint}</p>
                  </li>
                </ol>
                <Link to="/interview" onClick={() => setInterviewSetup({ title: `${company} · ${idea.title}`, context: prepBrief(idea, company, companyInfo, program, length, start), cv, questions: out.interview.map((q) => q.question).slice(0, 5) })}
                  className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5">
                  <MessageSquare className="h-4 w-4" /> Practise in a mock interview
                </Link>
              </div>
            </Item>

            <Item>
              <CloseTheGap key={`${sel}-${idea.title}`}
                title="Prep roadmap" subtitle={`Get ready to pitch and deliver "${idea.title}" — from a readiness of ${idea.readiness}/100.`}
                ad={prepBrief(idea, company, companyInfo, program, length, start)} cv={[cv, skills.length ? `Skills: ${skills.join(", ")}` : ""].filter(Boolean).join("\n\n")}
                score={idea.readiness} gaps={idea.skills_to_learn} lang={used.lang} roast={used.roast} country={used.country} />
            </Item>
          </motion.section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function fmtMonth(v: string) {
  if (!/^\d{4}-\d{2}$/.test(v)) return v;
  const [y, m] = v.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function prepBrief(i: Idea, company: string, info: string, program: string, length: string, start: string) {
  return `THESIS PITCH PREPARATION (not a job ad). The student wants to pitch and then deliver this self-proposed thesis to ${company}.
Programme: ${program || "not specified"}. Length: ${length}. Start: ${fmtMonth(start) || "not specified"}.
IDEA: ${i.title}
Problem: ${i.problem}
Approach: ${i.approach}
Value to company: ${i.value}
Skills still to learn: ${i.skills_to_learn.join(", ")}
Company info: ${info ? info.slice(0, 3000) : "not specified"}

Treat the "requirements" as: the skills to learn above, background reading for the topic, a small proof-of-concept to build before emailing, and points worth mentioning in the cold email. Milestone tasks must include what to read (use scholar and arxiv platforms in skill_gaps for literature — never write paper titles), a small proof-of-concept, and what to mention in the email. Treat "fit score" as readiness to pitch and deliver this thesis.`;
}

function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } } }}>{children}</motion.div>;
}

function AdLinkFetchLabeled({ onText }: { onText: (t: string) => void }) {
  return (
    <div className="[&>div>span:first-child]:hidden">
      <span className="mb-2 block text-sm font-semibold text-foreground">Paste the company's website or careers page</span>
      <AdLinkFetch onText={onText} />
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="glass flex h-12 rounded-full p-1">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
          className={`flex-1 rounded-full px-4 text-sm font-semibold transition ${value === o ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>{o}</button>
      ))}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="glass flex h-12 items-center gap-2 rounded-full ps-4 pe-2 text-sm font-semibold text-foreground">
      <span className="text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-9 rounded-full bg-transparent pe-1 font-semibold text-foreground outline-none">
        {options.map((o) => <option key={o} value={o} className="bg-popover text-popover-foreground">{o}</option>)}
      </select>
    </label>
  );
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1600); } catch {} }}
      className="glass inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-foreground">
      {ok ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />} {ok ? "Copied" : label}
    </button>
  );
}

function Gauge({ value }: { value: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 1200); setV(Math.round(value * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const r = 26, c = 2 * Math.PI * r;
  const color = value >= 70 ? "stroke-success" : value >= 45 ? "stroke-primary" : "stroke-warning";
  return (
    <div dir="ltr" className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} className={`fill-none ${color}`} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{v}</span>
    </div>
  );
}

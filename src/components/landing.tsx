import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ClipboardPaste, Sparkles, Route as RouteIcon, Moon, Sun, Languages, Compass, HeartHandshake, Mail } from "lucide-react";

export function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Meriterande home">
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <span className="font-display text-xl leading-none" style={{ fontFamily: "var(--font-display)" }}>M</span>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sun ring-2 ring-background" />
      </span>
      <span className="text-[22px] leading-none tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
        Meriterande
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  function toggle() {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {}
  }
  return (
    <button onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:scale-105">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "d" : "l"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

const pill = "rounded-full px-4 py-2 text-sm font-semibold transition";
const on = "bg-primary text-primary-foreground shadow-soft";
const off = "text-muted-foreground hover:text-foreground";

function Tabs({ mobile }: { mobile?: boolean }) {
  const f = mobile ? " flex-1 text-center px-2" : "";
  return (
    <>
      <Link to="/" className={pill + f} activeOptions={{ exact: true }} activeProps={{ className: on }} inactiveProps={{ className: off }}>
        {mobile ? "Decode" : "Decode a job ad"}
      </Link>
      <span title="Coming soon" aria-disabled="true" className={`${pill}${f} cursor-not-allowed text-muted-foreground/70`}>
        {mobile ? "Thesis · soon" : <>Pitch a thesis <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">soon</span></>}
      </span>
      <Link to="/dictionary" className={pill + f} activeProps={{ className: on }} inactiveProps={{ className: off }}>
        Dictionary
      </Link>
      <Link to="/tracker" className={pill + f} activeProps={{ className: on }} inactiveProps={{ className: off }}>
        Tracker
      </Link>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Sections" className="glass hidden rounded-full p-1 md:flex"><Tabs /></nav>
        <ThemeToggle />
      </div>
      <nav aria-label="Sections" className="px-4 pb-2 md:hidden">
        <div className="glass flex w-full rounded-full p-1"><Tabs mobile /></div>
      </nav>
    </header>
  );
}

const PREVIEW = [
  { sv: "Du har minst 3 års erfarenhet av Python", en: "3+ years of Python", tag: "Must-have", tone: "bg-primary/15 text-primary" },
  { sv: "Erfarenhet av Azure är meriterande", en: "Azure experience", tag: "Meriterande", tone: "bg-accent text-accent-foreground" },
  { sv: "Du uttrycker dig väl på svenska", en: "Swedish required", tag: "Swedish", tone: "bg-destructive/12 text-destructive" },
];

function DecodePreview() {
  const [i, setI] = useState(0);
  const [decoded, setDecoded] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setDecoded((d) => {
        if (d) setI((x) => (x + 1) % PREVIEW.length);
        return !d;
      });
    }, 1900);
    return () => clearInterval(t);
  }, []);
  const p = PREVIEW[i] ?? PREVIEW[0]!;
  return (
    <div aria-hidden className="glass relative mx-auto mt-12 w-full max-w-md overflow-hidden rounded-3xl p-5 text-left">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" /><span className="h-2.5 w-2.5 rounded-full bg-sun" /><span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{decoded ? "Decoded" : "Platsannons"}</span>
      </div>
      <div className="relative h-[92px]">
        <AnimatePresence mode="wait">
          {!decoded ? (
            <motion.p key={`sv${i}`} initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }} transition={{ duration: 0.45 }}
              className="text-2xl leading-snug text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              “{p.sv}”
            </motion.p>
          ) : (
            <motion.div key={`en${i}`} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.tone}`}>{p.tag}</span>
              <p className="mt-2 font-semibold text-foreground">{p.en}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div key={`${i}${decoded}`} className="h-full bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.9, ease: "linear" }} />
      </div>
    </div>
  );
}

export function Hero({ adj = "Swedish", country = "Sweden" }: { adj?: string; country?: string }) {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div className="mesh pointer-events-none absolute -inset-20 -z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-background" />
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-16 text-center sm:pb-24 sm:pt-28">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-sun" /> For international job seekers in {country}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-[44px] leading-[0.98] text-foreground sm:text-7xl md:text-[88px]">
          Decode any {adj} job ad <em className="text-primary">in 5 seconds.</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
          Know what's required, what's <em>'meriterande'</em>, and whether you actually need Swedish.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}>
          <a href="#decode" className="mt-9 inline-flex h-14 items-center justify-center rounded-full bg-primary px-9 text-base font-semibold text-primary-foreground shadow-lift transition hover:-translate-y-0.5">
            Start decoding
          </a>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35 }}>
          <DecodePreview />
        </motion.div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: ClipboardPaste, title: "Paste ad", text: "Paste text, drop a link, and add your CV if you want a fit score." },
  { icon: Sparkles, title: "Decode", text: "See must-haves, meriterande, the Swedish verdict and hidden signals." },
  { icon: RouteIcon, title: "Close the gap", text: "Get an honest roadmap with milestones sized to your week." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
        className="mb-8 text-center text-4xl text-foreground sm:text-5xl">How it works</motion.h2>
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {STEPS.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
            className="glass lift relative rounded-3xl p-6">
            <span className="absolute right-5 top-4 text-5xl text-muted-foreground/25" style={{ fontFamily: "var(--font-display)" }}>{i + 1}</span>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/12 text-primary"><s.icon className="h-6 w-6" /></span>
            <h3 className="mt-5 text-2xl text-foreground">{s.title}</h3>
            <p className="mt-1.5 text-muted-foreground">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const BENEFITS = [
  { icon: Languages, title: "A translator for every ad", text: "Students see what's required, what's a plus and whether the local language is really needed — in their own language." },
  { icon: Compass, title: "Honest, actionable plans", text: "Fit scores and gap roadmaps turn vague advice into concrete next steps your advisers can build on." },
  { icon: HeartHandshake, title: "Less repetition for advisers", text: "Free up appointments from decoding jargon so time goes to coaching, networking and interviews." },
];

export function CareerCentres() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
        className="relative isolate overflow-hidden rounded-[2rem] bg-navy p-7 text-center sm:p-12">
        <div className="mesh pointer-events-none absolute -inset-10 -z-10 opacity-60" />
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-sun">For career centres</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-4xl leading-tight text-primary-foreground sm:text-5xl dark:text-foreground">
          Give every international student a job-market translator.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/75 dark:text-muted-foreground">
          Bring Meriterande to your university's students and alumni, so local job ads stop being a barrier.
        </p>
        <div className="mt-10 grid gap-4 text-start sm:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="glass lift rounded-3xl p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun/20 text-sun"><b.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-2xl text-foreground">{b.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.text}</p>
            </motion.div>
          ))}
        </div>
        <a href="mailto:raiyanbinmohsinshishir@gmail.com?subject=Partnering%20with%20Meriterande"
          className="mt-10 inline-flex h-14 items-center gap-2 rounded-full bg-sun px-8 text-base font-semibold text-navy shadow-lift transition hover:-translate-y-0.5">
          <Mail className="h-5 w-5" /> Partner with us
        </a>
      </motion.div>
    </section>
  );
}

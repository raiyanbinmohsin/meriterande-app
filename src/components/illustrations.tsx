// Original flat SVG illustrations. Colors come from theme tokens (fill-*/stroke-* classes),
// so every illustration adapts to dark mode automatically.
import { motion } from "motion/react";

const float = (d = 0, y = 6) => ({
  animate: { y: [0, -y, 0] },
  transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: d },
});

export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 380" className={className} role="img" aria-label="A person at a laptop turning a Swedish job ad into clear cards and a rising chart">
      {/* floor shadow + blob */}
      <ellipse cx="250" cy="352" rx="200" ry="14" className="fill-foreground/5" />
      <path d="M70 230c-20-90 60-170 170-170s210 40 220 130-60 150-190 150S90 320 70 230z" className="fill-primary/10" />
      {/* desk */}
      <rect x="70" y="300" width="300" height="10" rx="5" className="fill-navy" />
      <rect x="95" y="310" width="8" height="40" rx="3" className="fill-navy/70" />
      <rect x="337" y="310" width="8" height="40" rx="3" className="fill-navy/70" />
      {/* person */}
      <path d="M150 300c0-48 22-82 62-82s62 34 62 82z" className="fill-primary" />
      <circle cx="212" cy="182" r="30" className="fill-sun/80" />
      <path d="M182 176c2-22 18-34 34-32 18 2 28 16 26 30-12-8-28-10-42-6-6 2-12 6-18 8z" className="fill-navy" />
      <path d="M248 262c18 8 36 18 44 32" className="stroke-sun/80" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* laptop */}
      <path d="M232 300l18-72h96l-18 72z" className="fill-navy" />
      <circle cx="296" cy="262" r="5" className="fill-sun" />
      <rect x="224" y="296" width="120" height="6" rx="3" className="fill-navy/80" />

      {/* Swedish ad -> cards */}
      <motion.g {...float(0, 5)}>
        <rect x="330" y="40" width="150" height="96" rx="14" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="346" y="56" width="70" height="8" rx="4" className="fill-foreground/70" />
        <rect x="346" y="74" width="118" height="5" rx="2.5" className="fill-muted-foreground/40" />
        <rect x="346" y="86" width="104" height="5" rx="2.5" className="fill-muted-foreground/40" />
        <rect x="346" y="98" width="86" height="5" rx="2.5" className="fill-muted-foreground/40" />
        <rect x="346" y="112" width="58" height="12" rx="6" className="fill-sun/60" />
        <text x="352" y="121.5" className="fill-navy" style={{ font: "600 8px Inter, sans-serif" }}>meriterande</text>
      </motion.g>
      <path d="M405 140c0 22-10 34-30 40" className="stroke-primary/60" strokeWidth="2.5" strokeDasharray="4 6" fill="none" strokeLinecap="round" />
      <motion.g {...float(0.8, 6)}>
        <rect x="380" y="176" width="118" height="44" rx="12" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="392" y="188" width="38" height="10" rx="5" className="fill-primary/25" />
        <rect x="392" y="204" width="90" height="5" rx="2.5" className="fill-foreground/60" />
      </motion.g>
      <motion.g {...float(1.4, 6)}>
        <rect x="396" y="232" width="104" height="40" rx="12" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="408" y="243" width="34" height="9" rx="4.5" className="fill-sun/60" />
        <rect x="408" y="258" width="76" height="5" rx="2.5" className="fill-foreground/60" />
      </motion.g>
      {/* rising chart */}
      <motion.g {...float(0.4, 4)}>
        <rect x="30" y="60" width="130" height="92" rx="14" className="fill-card stroke-border" strokeWidth="2" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={48 + i * 26} y={128 - i * 16} width="16" height={10 + i * 16} rx="4" className={i === 3 ? "fill-sun" : "fill-primary/50"} />
        ))}
        <path d="M50 118l26-14 26-12 26-20" className="stroke-primary" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="128" cy="72" r="5" className="fill-primary" />
      </motion.g>
      {/* sparkles */}
      <motion.path d="M300 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" className="fill-sun" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }} style={{ transformOrigin: "300px 84px" }} />
      <circle cx="190" cy="80" r="4" className="fill-primary/40" />
      <circle cx="480" cy="300" r="5" className="fill-sun/60" />
    </svg>
  );
}

export function StepIllustration({ step, className = "" }: { step: 0 | 1 | 2; className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <path d="M20 60c-6-30 20-50 60-50s66 16 64 44-24 40-64 40-54-8-60-34z" className="fill-primary/10" />
      {step === 0 && (
        <g>
          <rect x="44" y="18" width="62" height="74" rx="8" className="fill-card stroke-border" strokeWidth="2" />
          <rect x="56" y="12" width="38" height="12" rx="5" className="fill-navy" />
          {[34, 46, 58].map((y, i) => <rect key={y} x="54" y={y} width={42 - i * 8} height="5" rx="2.5" className="fill-muted-foreground/40" />)}
          <rect x="54" y="70" width="28" height="10" rx="5" className="fill-sun/70" />
          <path d="M112 50l16-8M112 62h18M112 74l16 8" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {step === 1 && (
        <g>
          <rect x="30" y="22" width="56" height="62" rx="8" className="fill-card stroke-border" strokeWidth="2" />
          {[34, 44, 54, 64].map((y) => <rect key={y} x="38" y={y} width="40" height="4" rx="2" className="fill-muted-foreground/40" />)}
          <path d="M90 54h14" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
          <path d="M100 48l6 6-6 6" className="stroke-primary" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="110" y="26" width="34" height="18" rx="6" className="fill-primary/30" />
          <rect x="110" y="48" width="34" height="18" rx="6" className="fill-sun/60" />
          <rect x="110" y="70" width="34" height="14" rx="6" className="fill-success/30" />
          <path d="M60 10l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" className="fill-sun" />
        </g>
      )}
      {step === 2 && (
        <g>
          <path d="M28 84h104" className="stroke-border" strokeWidth="2" />
          <path d="M34 78c20-4 30-20 44-24s24 6 34-6 16-26 20-30" className="stroke-primary" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeDasharray="1 0" />
          {[[34, 78], [78, 54], [112, 48]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" className="fill-card stroke-primary" strokeWidth="3" />)}
          <path d="M126 12v20" className="stroke-navy" strokeWidth="3" strokeLinecap="round" />
          <path d="M127 12h18l-5 6 5 6h-18z" className="fill-sun" />
        </g>
      )}
    </svg>
  );
}

export function EmptyBoardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 140" className={className} aria-hidden>
      <path d="M20 80c-6-40 30-66 90-66s96 22 94 60-36 56-94 56-84-14-90-50z" className="fill-primary/10" />
      {[30, 80, 130].map((x, i) => (
        <g key={x}>
          <rect x={x} y="30" width="44" height="86" rx="10" className="fill-card stroke-border" strokeWidth="2" />
          <rect x={x + 8} y="40" width="20" height="5" rx="2.5" className={i === 1 ? "fill-sun" : "fill-muted-foreground/40"} />
          {i !== 2 && <rect x={x + 6} y="54" width="32" height={i === 0 ? 22 : 16} rx="6" className="fill-muted stroke-border" strokeDasharray="3 3" />}
        </g>
      ))}
      <motion.g animate={{ y: [0, -5, 0], rotate: [-4, 2, -4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "182px 40px" }}>
        <rect x="166" y="22" width="40" height="28" rx="7" className="fill-card stroke-primary" strokeWidth="2" />
        <path d="M176 36h20M186 26v20" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

export function NoResultsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 130" className={className} aria-hidden>
      <path d="M20 74c-4-38 28-60 82-60s84 20 82 56-30 52-82 52-78-14-82-48z" className="fill-primary/10" />
      <rect x="40" y="30" width="80" height="70" rx="10" className="fill-card stroke-border" strokeWidth="2" />
      {[44, 56, 68].map((y, i) => <rect key={y} x="52" y={y} width={56 - i * 12} height="5" rx="2.5" className="fill-muted-foreground/30" />)}
      <motion.g animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "130px 70px" }}>
        <circle cx="130" cy="62" r="22" className="fill-background/60 stroke-primary" strokeWidth="5" />
        <path d="M146 78l18 18" className="stroke-navy" strokeWidth="8" strokeLinecap="round" />
        <path d="M124 56l12 12M136 56l-12 12" className="stroke-sun" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

export function ThesisIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 260" className={className} role="img" aria-label="A student sending a paper-plane email to a company building">
      <path d="M40 160c-10-70 60-120 210-120s250 40 240 110-90 100-240 100S50 230 40 160z" className="fill-primary/10" />
      <ellipse cx="260" cy="238" rx="220" ry="10" className="fill-foreground/5" />
      {/* student */}
      <path d="M70 236c0-40 18-66 50-66s50 26 50 66z" className="fill-primary" />
      <circle cx="120" cy="140" r="24" className="fill-sun/80" />
      <path d="M96 136c2-18 14-28 28-26 14 2 22 12 20 24-10-6-22-8-34-4-5 2-9 4-14 6z" className="fill-navy" />
      <path d="M150 196c18-10 30-26 34-44" className="stroke-sun/80" strokeWidth="11" strokeLinecap="round" fill="none" />
      {/* graduation cap */}
      <path d="M96 116l26-12 26 12-26 12z" className="fill-navy" />
      {/* flight path */}
      <path d="M190 140c60-70 160-80 230-40" className="stroke-primary/60" strokeWidth="2.5" strokeDasharray="5 8" fill="none" strokeLinecap="round" />
      <motion.g animate={{ x: [0, 14, 0], y: [0, -10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M282 72l64-26-28 62-12-22z" className="fill-card stroke-primary" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M306 86l40-40" className="stroke-primary" strokeWidth="2" />
      </motion.g>
      {/* building */}
      <rect x="400" y="96" width="84" height="140" rx="8" className="fill-navy" />
      <rect x="420" y="76" width="44" height="24" rx="6" className="fill-navy/80" />
      {Array.from({ length: 4 }).flatMap((_, r) => [0, 1, 2].map((c) => (
        <rect key={`${r}-${c}`} x={414 + c * 22} y={112 + r * 28} width="14" height="16" rx="3" className={(r + c) % 3 === 0 ? "fill-sun/80" : "fill-primary/40"} />
      )))}
      <rect x="432" y="212" width="20" height="24" rx="3" className="fill-sun" />
      <motion.circle cx="470" cy="70" r="8" className="fill-sun" animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ transformOrigin: "470px 70px" }} />
    </svg>
  );
}

export function CampusIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 120" className={className} aria-hidden>
      <path d="M30 100h200" className="stroke-sun/50" strokeWidth="2" />
      <path d="M70 46l60-28 60 28z" className="fill-sun" />
      <rect x="78" y="46" width="104" height="8" className="fill-sun/80" />
      {[86, 108, 130, 152, 172].map((x) => <rect key={x} x={x} y="56" width="8" height="40" rx="2" className="fill-primary-foreground/80 dark:fill-foreground/80" />)}
      <rect x="74" y="96" width="112" height="6" rx="2" className="fill-sun/80" />
      {[[40, 70], [214, 64]].map(([x, y], i) => (
        <motion.g key={x} animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i, ease: "easeInOut" }}>
          <rect x={x - 18} y={y - 14} width="36" height="26" rx="8" className="fill-primary/60" />
          <text x={x} y={y + 4} textAnchor="middle" className="fill-primary-foreground" style={{ font: "700 11px Inter, sans-serif" }}>{i ? "EN" : "SV"}</text>
        </motion.g>
      ))}
    </svg>
  );
}

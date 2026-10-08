import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, FileText, MousePointerClick, X, PlusSquare, Copy, Share2 } from "lucide-react";

export function BookmarkletButton({ variant = "header", onOpen }: { variant?: "header" | "menu"; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const [touch, setTouch] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const link = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    setTouch(window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0 && !window.matchMedia("(pointer: fine)").matches);
    const origin = window.location.origin;
    const c = `javascript:(function(){var s=String(window.getSelection()||'').slice(0,6000);window.open('${origin}/?url='+encodeURIComponent(location.href)+(s?'&text='+encodeURIComponent(s):''),'_blank');})();`;
    setCode(c);
    // Set via DOM: React blocks javascript: URLs in JSX href.
    link.current?.setAttribute("href", c);
  }, [open, touch]);

  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const steps = [
    { icon: Bookmark, title: "Drag to bookmarks bar", text: "Drag the button below onto your browser's bookmarks bar." },
    { icon: FileText, title: "Open any job ad", text: "Go to a job page. Optionally select the ad text." },
    { icon: MousePointerClick, title: "Click it", text: "Meriterande opens in a new tab with the ad ready to decode." },
  ];

  return (
    <>
      {variant === "menu" ? (
        <button onClick={() => { onOpen?.(); setOpen(true); }} className="flex min-h-12 w-full items-center gap-2 rounded-2xl px-4 font-semibold text-foreground hover:bg-secondary">
          <PlusSquare className="h-4 w-4" /> Add to browser
        </button>
      ) : <button onClick={() => setOpen(true)}
        className="glass hidden h-11 whitespace-nowrap items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 lg:inline-flex">
        <PlusSquare className="h-4 w-4" /> Add to browser
      </button>}
      {open && createPortal(<AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label="Add Meriterande to your browser"
              initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
              <button onClick={() => setOpen(false)} aria-label="Close" className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-4xl text-foreground">Decode this page</h2>
              <p className="mt-1 text-muted-foreground">A one-click button for any job ad you find online.</p>
              {touch ? (
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="font-semibold text-foreground">Easiest on a phone</p>
                    <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground"><Share2 className="mt-0.5 h-4 w-4 shrink-0" />On the job ad, tap <strong className="text-foreground">Share → Copy link</strong>, then paste it into the "Or paste a job ad link" field here.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Or create the bookmark yourself</p>
                    <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
                      <li>Copy the bookmark code below.</li>
                      <li>Bookmark any page (Share → Add bookmark / ☆).</li>
                      <li>Edit that bookmark: name it "Meriterande" and replace its address with the copied code.</li>
                      <li>On a job ad, tap the address bar, type "Meriterande" and pick the bookmark.</li>
                    </ol>
                    <button onClick={copyCode} className="mt-3 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                      <Copy className="h-4 w-4" /> {copied ? "Copied ✓" : "Copy bookmark code"}
                    </button>
                  </div>
                </div>
              ) : (<>
              <ol className="mt-6 space-y-4">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary"><s.icon className="h-5 w-5" /></span>
                    <div><p className="font-semibold text-foreground">{i + 1}. {s.title}</p><p className="text-sm text-muted-foreground">{s.text}</p></div>
                  </li>
                ))}
              </ol>
              <div className="mt-7 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-5">
                <a ref={link} href="#" onClick={(e) => { e.preventDefault(); }} draggable
                  className="inline-flex h-12 cursor-grab items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-lift active:cursor-grabbing">
                  <span className="h-2 w-2 rounded-full bg-sun" /> Decode with Meriterande
                </a>
                <p className="text-xs text-muted-foreground">Drag me — clicking here does nothing. Desktop browsers only.</p>
              </div>
              </>)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}

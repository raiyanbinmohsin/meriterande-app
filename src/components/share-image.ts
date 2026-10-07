import type { DecodeResult } from "@/lib/decode.functions";

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(/\s+/);
  let line = "", lines = 0;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(lines === maxLines - 1 ? line + "…" : line, x, y);
      y += lh; lines++; line = w;
      if (lines >= maxLines) return y;
    } else line = t;
  }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

/** Renders a 1080x1350 share card PNG. Colors read from the theme tokens. */
export async function downloadShareImage(r: DecodeResult, rtl: boolean) {
  await document.fonts?.ready;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  const W = 1080, H = r.roast ? 1350 : 1080;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.direction = rtl ? "rtl" : "ltr";
  const X = rtl ? W - 80 : 80;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = v("--background"); ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(200, 150, 0, 200, 150, 700);
  g.addColorStop(0, v("--mesh-1")); g.addColorStop(1, "transparent");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(950, 200, 0, 950, 200, 500);
  g2.addColorStop(0, v("--mesh-2")); g2.addColorStop(1, "transparent");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = v("--foreground");
  ctx.font = `64px "Instrument Serif", serif`; ctx.fillText("Meriterande", X, 140);
  ctx.fillStyle = v("--muted-foreground"); ctx.font = `28px Inter, sans-serif`;
  ctx.fillText("Job ad, decoded", X, 190);

  ctx.fillStyle = v("--card"); round(ctx, 60, 240, W - 120, 300, 36);
  ctx.fillStyle = v("--foreground"); ctx.font = `34px Inter, sans-serif`;
  wrap(ctx, r.role_summary, X, 310, W - 200, 46, 5);

  ctx.fillStyle = v("--card"); round(ctx, 60, 570, (W - 150) / 2, 300, 36); round(ctx, 90 + (W - 150) / 2, 570, (W - 150) / 2, 300, 36);
  const colA = rtl ? W - 100 : 100, colB = rtl ? (W - 150) / 2 - 10 : 130 + (W - 150) / 2;
  ctx.fillStyle = v("--muted-foreground"); ctx.font = `bold 24px Inter, sans-serif`;
  ctx.fillText("FIT SCORE", colA, 630); ctx.fillText("SWEDISH", colB, 630);
  ctx.fillStyle = v("--primary"); ctx.font = `150px "Instrument Serif", serif`;
  ctx.fillText(r.fit ? String(r.fit.score) : "—", colA, 790);
  ctx.fillStyle = v("--foreground"); ctx.font = `64px "Instrument Serif", serif`;
  ctx.fillText(r.swedish.verdict, colB, 740);

  if (r.roast) {
    ctx.fillStyle = v("--accent"); round(ctx, 60, 900, W - 120, 330, 36);
    ctx.fillStyle = v("--accent-foreground"); ctx.font = `bold 26px Inter, sans-serif`;
    ctx.fillText("ROAST CARD 🔥", X, 965);
    ctx.font = `italic 44px "Instrument Serif", serif`;
    wrap(ctx, r.roast, X, 1030, W - 200, 52, 4);
  }
  ctx.fillStyle = v("--muted-foreground"); ctx.font = `24px Inter, sans-serif`;
  ctx.fillText("Decoded with Meriterande", X, H - 50);

  const a = document.createElement("a");
  a.href = c.toDataURL("image/png"); a.download = "meriterande-decoded.png"; a.click();
}

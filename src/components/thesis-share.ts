function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(/\s+/);
  let line = "", n = 0;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(n === maxLines - 1 ? line + "…" : line, x, y);
      y += lh; n++; line = w;
      if (n >= maxLines) return y;
    } else line = t;
  }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}

export async function downloadThesisCard(company: string, title: string, readiness: number, rtl: boolean) {
  await document.fonts?.ready;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  const W = 1080, H = 1080;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  const X = rtl ? W - 90 : 90;
  ctx.fillStyle = v("--navy"); ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, col] of [[180, 160, 650, "--mesh-1"], [950, 260, 520, "--mesh-2"], [600, 1000, 600, "--mesh-3"]] as const) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, v(col)); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = v("--sun"); ctx.font = `bold 26px Inter, sans-serif`;
  ctx.fillText("THESIS PITCH", X, 150);
  ctx.fillStyle = "#ffffff"; ctx.font = `76px "Instrument Serif", serif`;
  let y = wrap(ctx, `I'm pitching a thesis to ${company}:`, X, 250, W - 180, 84, 2);
  ctx.font = `italic 64px "Instrument Serif", serif`; ctx.fillStyle = v("--sun");
  y = wrap(ctx, title, X, y + 10, W - 180, 74, 4);
  // gauge
  const cx = rtl ? 210 : W - 210, cy = 860, r = 110;
  ctx.lineWidth = 22; ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = v("--sun"); ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * readiness) / 100); ctx.stroke();
  ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.font = `90px "Instrument Serif", serif`; ctx.fillText(String(readiness), cx, cy + 30);
  ctx.font = `22px Inter, sans-serif`; ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText("readiness", cx, cy + 66);
  ctx.textAlign = rtl ? "right" : "left";
  ctx.font = `60px "Instrument Serif", serif`; ctx.fillStyle = "#ffffff"; ctx.fillText("Meriterande", X, H - 110);
  ctx.font = `24px Inter, sans-serif`; ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText("Don't wait for a thesis ad. Pitch one.", X, H - 70);
  const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "meriterande-thesis-pitch.png"; a.click();
}

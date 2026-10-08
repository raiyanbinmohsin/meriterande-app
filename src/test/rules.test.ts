import { describe, it, expect } from "vitest";
import { STORY_LIMITS } from "@/lib/stories.functions";
import { jobPostingFromJsonLd } from "@/lib/fetch-ad.functions";
import { LONG_TASK_LIMIT_MS, withDeadline } from "@/components/LongTask";

describe("story limits", () => {
  it("allows max 3 stories per day", () => expect(STORY_LIMITS.perDay).toBe(3));
  it("caps story at 1200 chars", () => expect(STORY_LIMITS.story).toBe(1200));
});

describe("long AI requests", () => {
  it("give up after 90 seconds", () => expect(LONG_TASK_LIMIT_MS).toBe(90_000));
  it("reject when the deadline passes", async () => {
    await expect(withDeadline(new Promise(() => {}), 10)).rejects.toThrow(/90 seconds/);
  });
});

describe("JobPosting JSON-LD", () => {
  it("extracts title, employer and description", () => {
    const html = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"JobPosting","title":"Data Engineer","hiringOrganization":{"name":"Acme AB"},"description":"<p>${"Vi söker en dataingenjör. ".repeat(6)}</p>"}</script>`;
    const t = jobPostingFromJsonLd(html)!;
    expect(t).toContain("Data Engineer");
    expect(t).toContain("Employer: Acme AB");
    expect(t).toContain("Vi söker");
  });
  it("returns null when no JobPosting exists", () => {
    expect(jobPostingFromJsonLd(`<script type="application/ld+json">{"@type":"Organization"}</script>`)).toBeNull();
  });
});

import { RATE_LIMITS, INPUT_LIMITS } from "@/lib/rate-limit";
import { TERMS } from "@/lib/dictionary";
import { EXAMPLES, slugOf, termBySlug } from "@/lib/dictionary-examples";

describe("launch limits", () => {
  it("allows 20 decodes per hour", () => expect(RATE_LIMITS.decode).toBe(20));
  it("caps job ads at 15,000 characters", () => expect(INPUT_LIMITS.ad).toBe(15000));
  it("caps CVs at 20,000 characters", () => expect(INPUT_LIMITS.cv).toBe(20000));
});

describe("dictionary pages", () => {
  it("every term has an example sentence", () => expect(TERMS.filter((t) => !EXAMPLES[t.term]).map((t) => t.term)).toEqual([]));
  it("slugs are unique and resolve", () => {
    expect(new Set(TERMS.map((t) => slugOf(t.term))).size).toBe(TERMS.length);
    expect(termBySlug("lopande-urval")?.term).toBe("löpande urval");
  });
});

// Curated, trusted learning platforms. The AI only picks platform ids + a search query;
// every URL is built here in code — the AI never writes URLs.

export type PlatformId =
  | "docs" | "mslearn" | "coursera" | "edx" | "freecodecamp" | "kaggle"
  | "mitocw" | "elementsofai" | "youtube" | "sfi" | "duolingo" | "scholar" | "arxiv";

export type ResourceType = "docs" | "course" | "video" | "practice" | "papers";

export type Platform = {
  id: PlatformId;
  name: string;
  short: string; // 1–2 letter mark for the icon
  type: ResourceType;
  cost: "Free" | "Free to audit";
  url: (q: string) => string;
};

const enc = encodeURIComponent;

export const PLATFORMS: Record<PlatformId, Platform> = {
  docs: { id: "docs", name: "Official docs", short: "Doc", type: "docs", cost: "Free", url: (q) => `https://www.google.com/search?q=${enc(q + " official documentation")}` },
  mslearn: { id: "mslearn", name: "Microsoft Learn", short: "MS", type: "course", cost: "Free", url: (q) => `https://learn.microsoft.com/en-us/search/?terms=${enc(q)}` },
  coursera: { id: "coursera", name: "Coursera", short: "C", type: "course", cost: "Free to audit", url: (q) => `https://www.coursera.org/search?query=${enc(q)}` },
  edx: { id: "edx", name: "edX", short: "eX", type: "course", cost: "Free to audit", url: (q) => `https://www.edx.org/search?q=${enc(q)}` },
  freecodecamp: { id: "freecodecamp", name: "freeCodeCamp", short: "fC", type: "practice", cost: "Free", url: (q) => `https://www.freecodecamp.org/news/search/?query=${enc(q)}` },
  kaggle: { id: "kaggle", name: "Kaggle Learn", short: "K", type: "practice", cost: "Free", url: () => "https://www.kaggle.com/learn" },
  mitocw: { id: "mitocw", name: "MIT OpenCourseWare", short: "MIT", type: "course", cost: "Free", url: (q) => `https://ocw.mit.edu/search/?q=${enc(q)}` },
  elementsofai: { id: "elementsofai", name: "Elements of AI", short: "AI", type: "course", cost: "Free", url: () => "https://www.elementsofai.com/" },
  youtube: { id: "youtube", name: "YouTube", short: "▶", type: "video", cost: "Free", url: (q) => `https://www.youtube.com/results?search_query=${enc(q)}` },
  sfi: { id: "sfi", name: "SFI — Swedish for Immigrants", short: "SFI", type: "course", cost: "Free", url: () => "https://www.skolverket.se/undervisning/vuxenutbildningen/komvux-svenska-for-invandrare-sfi" },
  scholar: { id: "scholar", name: "Google Scholar", short: "GS", type: "papers", cost: "Free", url: (q) => `https://scholar.google.com/scholar?q=${enc(q)}` },
  arxiv: { id: "arxiv", name: "arXiv", short: "arX", type: "papers", cost: "Free", url: (q) => `https://arxiv.org/search/?query=${enc(q)}&searchtype=all` },
  duolingo: { id: "duolingo", name: "Duolingo Swedish", short: "D", type: "practice", cost: "Free", url: () => "https://www.duolingo.com/course/sv/en/Learn-Swedish" },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

// Official documentation homepages for common tools (matched case-insensitively against the skill).
export const OFFICIAL_DOCS: { match: RegExp; name: string; url: string }[] = [
  { match: /\bspark\b|pyspark/i, name: "Apache Spark docs", url: "https://spark.apache.org/docs/latest/" },
  { match: /\bkafka\b/i, name: "Apache Kafka docs", url: "https://kafka.apache.org/documentation/" },
  { match: /\bairflow\b/i, name: "Apache Airflow docs", url: "https://airflow.apache.org/docs/" },
  { match: /\bdbt\b/i, name: "dbt docs", url: "https://docs.getdbt.com/" },
  { match: /\bdocker\b/i, name: "Docker docs", url: "https://docs.docker.com/" },
  { match: /kubernetes|\bk8s\b/i, name: "Kubernetes docs", url: "https://kubernetes.io/docs/home/" },
  { match: /postgres/i, name: "PostgreSQL docs", url: "https://www.postgresql.org/docs/" },
  { match: /\bpython\b/i, name: "Python docs", url: "https://docs.python.org/3/" },
  { match: /\baws\b|amazon web services/i, name: "AWS docs", url: "https://docs.aws.amazon.com/" },
  { match: /azure/i, name: "Azure docs", url: "https://learn.microsoft.com/en-us/azure/" },
  { match: /google cloud|\bgcp\b|bigquery/i, name: "Google Cloud docs", url: "https://cloud.google.com/docs" },
  { match: /snowflake/i, name: "Snowflake docs", url: "https://docs.snowflake.com/" },
  { match: /databricks/i, name: "Databricks docs", url: "https://docs.databricks.com/" },
  { match: /terraform/i, name: "Terraform docs", url: "https://developer.hashicorp.com/terraform/docs" },
  { match: /\bgit\b|github/i, name: "Git docs", url: "https://git-scm.com/doc" },
  { match: /power ?bi/i, name: "Power BI docs", url: "https://learn.microsoft.com/en-us/power-bi/" },
  { match: /\bsql\b/i, name: "PostgreSQL docs (SQL)", url: "https://www.postgresql.org/docs/current/sql.html" },
];

export type Resource = { key: string; name: string; url: string; type: ResourceType; cost: Platform["cost"]; short: string };

const isSwedish = (s: string) => /swedish|svenska|sfi/i.test(s);

/** Build trusted links for a skill gap. Falls back to search links when no official docs exist. */
export function buildResources(skill: string, query: string, platforms: string[]): Resource[] {
  const q = (query || skill).slice(0, 80);
  let ids = platforms.filter((p): p is PlatformId => p in PLATFORMS);
  if (isSwedish(skill)) ids = ["sfi", "duolingo", ...ids.filter((i) => i !== "sfi" && i !== "duolingo")];
  ids = [...new Set(ids)].slice(0, 3);
  const out: Resource[] = [];
  for (const id of ids) {
    const p = PLATFORMS[id];
    if (id === "docs") {
      const d = OFFICIAL_DOCS.find((x) => x.match.test(skill) || x.match.test(q));
      if (d) { out.push({ key: id, name: d.name, url: d.url, type: "docs", cost: "Free", short: p.short }); continue; }
      // No official docs mapped → fall back to search platforms below.
      continue;
    }
    out.push({ key: id, name: p.name, url: p.url(q), type: p.type, cost: p.cost, short: p.short });
  }
  if (out.length < 2) {
    for (const id of ["youtube", "coursera", "freecodecamp"] as PlatformId[]) {
      if (out.length >= 2) break;
      if (out.some((r) => r.key === id)) continue;
      const p = PLATFORMS[id];
      out.push({ key: id, name: p.name, url: p.url(q), type: p.type, cost: p.cost, short: p.short });
    }
  }
  return out;
}

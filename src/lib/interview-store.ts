// Hand-off of prepared interview questions to /interview (survives a reload in the same tab).
export type InterviewSetup = { title: string; context: string; cv: string; questions: string[] };
const KEY = "meriterande.interview";
export function setInterviewSetup(s: InterviewSetup) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
export function getInterviewSetup(): InterviewSetup | null {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? "null") as InterviewSetup | null; } catch { return null; }
}

// Last decoded ad's Swedish verdict — lets the mock interview default its speech language.
const SV = "meriterande.lastSwedish";
export function setLastSwedishVerdict(v: string) { try { sessionStorage.setItem(SV, v); } catch {} }
export function lastAdRequiresSwedish() { try { return sessionStorage.getItem(SV) === "Required"; } catch { return false; } }

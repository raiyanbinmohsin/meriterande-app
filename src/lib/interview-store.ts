// Hand-off of prepared interview questions to /interview (survives a reload in the same tab).
export type InterviewSetup = { title: string; context: string; cv: string; questions: string[] };
const KEY = "meriterande.interview";
export function setInterviewSetup(s: InterviewSetup) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
export function getInterviewSetup(): InterviewSetup | null {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? "null") as InterviewSetup | null; } catch { return null; }
}

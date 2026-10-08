// Hourly limits per signed-in user (or per connection when signed out). Shared by server and tests.
export const RATE_LIMITS = {
  decode: 20,
  plan: 10,
  compare: 20,
  thesis: 15,
  cover: 15,
  interview: 60,
  lesson: 40,
  employer: 15,
  find: 15,
  fetch: 30,
  feedback: 5,
} as const;
export type RateKind = keyof typeof RATE_LIMITS;

export const INPUT_LIMITS = { ad: 15000, cv: 20000 } as const;

export const limitMessage = (kind: RateKind) =>
  `You've hit the limit of ${RATE_LIMITS[kind]} per hour for this tool. Please take a short break and try again later.`;

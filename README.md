# Swedish Job Decoder

Build a web app called "Meriterande" — a job-ad decoder for international job seekers in Sweden.

Core flow (single page, no login):

1. Hero: headline "Decode any Swedish job ad in 5 seconds." Subline: "Know what's required, what's 'meriterande', and whether you actually need Swedish."

2. Two text areas: "Paste the job ad (Swedish or English)" (required) and "Paste your CV (optional, for a fit score)".

3. A "Decode" button. Use Lovable AI to analyze the input and return structured JSON, then render it as cards:

   - Role summary (2–3 sentences, plain English)

   - Must-haves (list)

   - Nice-to-haves / "meriterande" (list)

   - Swedish language verdict: one of "Required", "Helpful", "Not needed", with a one-line reason quoting the relevant phrase from the ad

   - Hidden signals: decoded Swedish workplace phrases found in the ad (e.g. "meriterande", "B-körkort", "tillsvidareanställning", "provanställning") with short explanations

   - If a CV is provided: fit score 0–100 shown as a big circular gauge, top 3 matching strengths, top 3 gaps, and one sentence on how to angle the application

4. A "Try an example" button that fills in a realistic sample Swedish job ad for a Data Engineer, so the demo works instantly.

5. A "Copy summary" button and a small footer: "Built at Lovable Buildathon, Uppsala University."

Design: clean, Scandinavian, lots of white space, a calm blue and yellow accent (subtle, not a flag), rounded cards, mobile-friendly. Show a loading state with rotating messages like "Translating Swedish bureaucracy..." Handle errors gracefully.

Tell the AI never to invent requirements that aren't in the ad, and to say "not specified" when it doesn't know.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://meriterande-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/656584ec-4603-4f5d-8529-970454020d2c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

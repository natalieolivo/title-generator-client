# title-generator-client

A small Next.js app that turns [title-generator](https://github.com/natalieolivo/title-generator)
(an AI-powered title/headline generator, originally a CLI/library package)
into a standalone web app — linked from [natalieolivo.tech](https://natalieolivo.tech)
rather than embedded into it.

## Why a separate project

`title-generator`'s `generateTitles()` calls the Claude API using a secret
`ANTHROPIC_API_KEY`, so it has to run server-side. This app wraps it in a
Next.js API route (`src/app/api/generate-titles/route.ts`) and adds a minimal
form UI, while leaving the original CLI/library package untouched.

## Dependency

`generateTitles` is imported from the published package
[`@natalieolivo/title-generator`](https://www.npmjs.com/package/@natalieolivo/title-generator)
(source: [github.com/natalieolivo/title-generator](https://github.com/natalieolivo/title-generator)),
installed like any other npm dependency — no vendoring or local linking.

## UI

Built with [Mantine](https://mantine.dev) (light theme, large playful buttons
and inputs, responsive layout) and customized through CSS Modules
(`src/theme.ts`, `src/theme.module.css`, `src/app/page.module.css`).

## Local development

```bash
cp .env.local.example .env.local
# then fill in ANTHROPIC_API_KEY in .env.local
npm install
npm run dev
```

This project pins Node via `.node-version` (see below) — if you use
[fnm](https://github.com/Schniz/fnm) or nvm, it'll pick this up automatically.

### Node version

Next.js 16+ requires Node ≥20.9.0. This repo pins a newer Node
(`.node-version`) independently of whatever Node version is active elsewhere
on the machine.

## Rate limiting

The API route includes a lightweight in-memory per-IP rate limit and hard
caps on input size, since this is a public, unauthenticated endpoint backed by
a paid API. The limit is counted in paid Claude calls: each request makes two
(title generation, then SEO scoring), so it consumes 2 of 6 units per minute,
i.e. 3 requests/minute per IP. It's best-effort only (resets on cold start,
not shared across concurrent serverless instances) — sufficient for a
portfolio demo, not meant to withstand a determined abuser.

## API: `POST /api/generate-titles`

Request: `{ subject: string, count?: number, tone?: string }`.

Response (200):

```json
{
  "titles": [
    { "title": "...", "score": { "total": 82, "rank": 1, "rationale": "..." } }
  ]
}
```

`titles` is an array of objects, not strings. `score` (`total` 0-100, `rank`
1 = best) is optional: if scoring fails or takes longer than 20 seconds, the
titles are returned without it. Scores are model estimates, not real search
data. The route has `maxDuration = 60`.

## Deployment

Deployed on [Vercel](https://vercel.com). `ANTHROPIC_API_KEY` must be set
under Project Settings → Environment Variables (Production + Preview) before
deploying — it's never committed to the repo.

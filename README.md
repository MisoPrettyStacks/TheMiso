# TheMiso — MISOCRYPTO // Global Situational Intelligence & Macro Transmission Platform

A full-stack React 19 + Vite 8 + Tailwind v4 frontend backed by an Express 4 server.
It combines a global OSINT/intelligence feed, an interactive geopolitical map, live
crypto price tracking, pipeline macro-transmission analysis, and Gemini-powered AI
briefings (dossiers, scenario simulation, pipeline forecasts).

## Project structure

```text
src/
  App.tsx                  Main layout
  components/              AIDossierModal, ApiVaultModal, CountryMonitor, DisclaimerModal,
                           GlobalMap, LiveCryptoTicker, LiveIntelligenceFeed, Navbar,
                           PipelinesBriefingView, ScenarioSimulator
  services/                apiVaultService, soundEffects, sourceDownloader
  data/                    osintEvents, pipelinesData (bundled datasets)
server.ts                  Express backend (42 KB) — AI routes, live-data aggregation,
                           API-key vault testing, source-zip downloads
index.html                 Vite entry
```

## Run the frontend (static)

```bash
bun install
bun run dev        # local dev
bun run build      # production build → dist/
```

The frontend builds to a fully static `dist/` and deploys to GitHub Pages on every
push to `main` via `.github/workflows/deploy.yml`. **The Pages deployment is
frontend-only.**

## Run the full stack (frontend + backend)

The backend needs a Gemini API key:

```bash
export GEMINI_API_KEY="your-key-here"   # never commit this
bun install
bun run start        # runs `tsx server.ts` — serves the built frontend + API on :3000
```

In dev, the Express server also serves Vite HMR middleware; in production it serves
`dist/` and the API on the same origin (`PORT` env, default 3000).

## Which features need the backend?

On GitHub Pages (static) the app still loads: the map, dashboards, bundled OSINT
data, and the crypto ticker (it falls back to Binance's **public** spot-price API
directly from the browser — read-only prices, no account or trading involved).

These features call the Express backend and will be limited/unavailable without it:

| Feature | Endpoint | Needs |
|---|---|---|
| AI Dossier / Briefing modal | `POST /api/ai/briefing` | Backend + `GEMINI_API_KEY` |
| Pipeline forecast | `POST /api/ai/pipeline-forecast` | Backend + `GEMINI_API_KEY` |
| Scenario simulator | `POST /api/ai/simulate-scenario` | Backend + `GEMINI_API_KEY` |
| Aggregated price oracle | `GET /api/live/prices` | Backend (browser falls back to Binance public API) |
| OSINT live feed | `GET /api/live/osint-feed` | Backend |
| API-key vault tester | `POST /api/vault/test-key` | Backend |
| Source-zip download | `GET /api/download-source-zip` | Backend |

To use the AI features in production, host `server.ts` on a Node host (e.g. Render,
Railway, Fly.io, a VPS) with `GEMINI_API_KEY` set, build the frontend with the API
base URL pointing at it, and serve `dist/` from the same server.

## Environment variables

| Variable | Required for | Description |
|---|---|---|
| `GEMINI_API_KEY` | Backend AI routes | Google Gemini API key — server-side only |
| `PORT` | Backend | Port the Express server listens on (default 3000) |

## Notes

- No secrets are committed to this repo. API keys users enter in the in-app
  "API Vault" are stored in the browser's localStorage only.
- Nothing in this project connects to live trading or places orders. Price feeds
  are read-only public market data.

# ⚠️ Personal Research Experiment Financial Disclaimer & Liability Waiver:
This is not Tool or Service: This is a private, experimental sandbox, not intended for outside or public use, replication or distribution. It is not a financial tool, software service, or product designed for public use. Not Financial Advice: The author is not a licensed financial advisor, accountant, or broker. Nothing in this repository constitutes professional financial, investment, or legal advice. No Warranties: This repository is provided "as-is" for display purposes only. The author makes no representations or warranties of any kind regarding the accuracy, completeness, or reliability of the data, code, or experimental models. Absolute Limitation of Liability: Under no circumstances shall the author be liable for any claims, damages, or financial losses (direct or indirect) if you violate these terms and attempt to use, replicate, or rely on any part of this experiment.

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

## Market-structure data layer (London Strategic Edge)

The **Market Structure** tab and several backend enrichments are powered by the
London Strategic Edge (LSE) market-data vault — a read-only provider. Get a free
key at https://londonstrategicedge.com/free-market-data-api/ (candles, reference
datasets and live stream, no tiers), then either:

- paste it into the in-app **Key Vault** under the **LSE** provider (stored in
  browser localStorage, sent as the `x-lse-key` header), or
- set `LSE_API_KEY` in the server environment.

What it adds, and where it lands in the system model:

| LSE dataset | Where it goes | System-model use |
|---|---|---|
| Deep historical candles (stocks→2003, forex→2009, crypto→2017) | `GET /api/lse/candles` | Backtest/validate scenario projections against real history instead of hypotheticals |
| Multi-asset benchmark pack (indices, FX, commodities, crypto, yields, CPI, Fed funds) | Market Structure tab → Benchmark Tape; injected into AI briefing + war-room prompts | Cross-asset regime calibration — the tape the transmission pipelines transmit *through* |
| Economic calendar | Market Structure tab → Policy Calendar; auto-injected as dispatches into `GET /api/live/osint-feed` | Scheduled macro catalysts treated as first-class intel events (CPI/FOMC flagged HOT) |
| COT positioning | Market Structure tab → COT Positioning | Speculative net-bias extremes feed pipeline forecasts (crowded-long = squeeze fuel) |
| Options flow (large prints, IV, greeks) | Market Structure tab → Smart-Money Flow | Institutional footprint telemetry alongside the on-chain signals |
| Insider trades (Form 4) | Market Structure tab → Insider Tape | Corporate-insider conviction signal for dossier context |
| Bond yields / macro series | `GET /api/lse/series` | Duration and policy-stance inputs for the macro-transmission analysis |

Without a key every LSE surface degrades gracefully (typed `LSE_KEY_MISSING`
responses, vault-gate UI) — nothing else breaks.

## Environment variables

| Variable | Required for | Description |
|---|---|---|
| `GEMINI_API_KEY` | Backend AI routes | Google Gemini API key — server-side only |
| `LSE_API_KEY` | Market-structure routes (optional) | London Strategic Edge vault key — server-side alternative to the in-app Key Vault |
| `PORT` | Backend | Port the Express server listens on (default 3000) |

## Notes

- No secrets are committed to this repo. API keys users enter in the in-app
  "API Vault" are stored in the browser's localStorage only.
- Nothing in this project connects to live trading or places orders. Price feeds
  are read-only public market data.


Made with 💖 by: @MisoPrettyStacks

@IGotGlitterOnMe on X




/**
 * server/lse.ts — London Strategic Edge (LSE) vault client for MISOCRYPTO.
 *
 * LSE is a read-only market-data provider. Its vault holds what this platform
 * was missing: deep historical candles (stocks to 2003, forex to 2009, crypto
 * to 2017), 14,640 macro series across 194 countries, government bond yields,
 * nine reference datasets (economic calendar, COT, insider trades, dividends,
 * stock splits, financial reports, company profiles, fundamentals) and an
 * options surface (chains, flow prints, contract candles).
 *
 * Key resolution order: `LSE_API_KEY` env var first, then the `x-lse-key`
 * request header (the user's free key pasted into the in-app Key Vault).
 * Everything degrades gracefully when no key is present — callers get a
 * typed LseError with `configured === false` instead of a crash.
 *
 * Docs: https://londonstrategicedge.com/api-documentation/
 * Free key: https://londonstrategicedge.com/free-market-data-api/
 */

const VAULT_URL = 'https://api.londonstrategicedge.com/vault';
const USER_AGENT = 'MISOCRYPTO-Platform (+https://github.com/MisoPrettyStacks/TheMiso)';
const FETCH_TIMEOUT_MS = 12000;

/** Reference datasets the platform is allowed to query through the proxy. */
export const LSE_REF_DATASETS = [
  'economic_calendar',
  'insider_trades',
  'dividends',
  'stock_splits',
  'cot',
  'financial_reports',
  'company_profiles',
  'stock_fundamentals',
  'bond_yields',
] as const;

export type LseRefDataset = (typeof LSE_REF_DATASETS)[number];

export class LseError extends Error {
  status: number;
  configured: boolean;
  constructor(message: string, status = 0, configured = true) {
    super(message);
    this.name = 'LseError';
    this.status = status;
    this.configured = configured;
  }
}

/** Resolve the LSE key: server env wins, then the per-request vault header. */
export function resolveLseKey(req: { header: (name: string) => string | undefined }): string | null {
  const envKey = (process.env.LSE_API_KEY || '').trim();
  if (envKey.length >= 8) return envKey;
  const headerKey = (req.header('x-lse-key') || '').trim();
  if (headerKey.length >= 8) return headerKey;
  return null;
}

// ── tiny TTL cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  exp: number;
  data: any;
}
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): any | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.exp) {
    cache.delete(key);
    return undefined;
  }
  return e.data;
}

function cacheSet(key: string, data: any, ttlMs: number): void {
  if (cache.size > 400) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { exp: Date.now() + ttlMs, data });
}

// ── core fetch ──────────────────────────────────────────────────────────────

async function lseFetch(
  path: string,
  key: string | null,
  params: Record<string, string | number | undefined> = {},
  ttlMs = 0
): Promise<any> {
  if (!key) {
    throw new LseError(
      'London Strategic Edge key not configured. Paste a free key into the Key Vault (LSE provider) or set LSE_API_KEY on the server.',
      503,
      false
    );
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && `${v}`.length > 0) qs.set(k, `${v}`);
  }
  const url = `${VAULT_URL}${path}${qs.toString() ? `?${qs}` : ''}`;
  const cacheKey = `lse:${url}`;
  if (ttlMs > 0) {
    const hit = cacheGet(cacheKey);
    if (hit !== undefined) return hit;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'x-api-key': key, 'User-Agent': USER_AGENT },
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 220);
      try {
        detail = (JSON.parse(text) as any).detail || detail;
      } catch {
        /* keep raw */
      }
      throw new LseError(`LSE vault ${res.status}: ${detail}`, res.status, true);
    }
    const data = text ? JSON.parse(text) : null;
    if (ttlMs > 0) cacheSet(cacheKey, data, ttlMs);
    return data;
  } catch (err: any) {
    if (err instanceof LseError) throw err;
    throw new LseError(`LSE vault unreachable: ${err.message || err}`, 0, true);
  } finally {
    clearTimeout(timer);
  }
}

// ── public surface ──────────────────────────────────────────────────────────

export async function lseTestKey(key: string): Promise<{ ok: boolean; message: string }> {
  const usage = await lseFetch('/usage', key, {}, 0);
  const capGb = usage.bytes_cap_month ? (usage.bytes_cap_month / 1073741824).toFixed(1) : '?';
  return {
    ok: true,
    message: `LSE vault key live — ${capGb} GB/mo allowance, ${usage.calls_per_minute || '?'} calls/min.`,
  };
}

export async function lseStatus(key: string | null): Promise<any> {
  if (!key) return { configured: false, key: null };
  try {
    const usage = await lseFetch('/usage', key, {}, 60_000);
    return { configured: true, usage };
  } catch (err: any) {
    return { configured: true, error: err.message, status: err.status };
  }
}

export async function lseCandles(
  key: string | null,
  symbol: string,
  timeframe = '1d',
  opts: { start?: string; end?: string; limit?: number; order?: 'asc' | 'desc'; dataset?: string } = {}
): Promise<any[]> {
  return lseFetch('/candles', key, { symbol, timeframe, ...opts }, 5 * 60_000);
}

export async function lseSeries(
  key: string | null,
  symbol: string,
  opts: { start?: string; end?: string; limit?: number; order?: 'asc' | 'desc'; dataset?: string } = {}
): Promise<any[]> {
  return lseFetch('/series', key, { symbol, ...opts }, 30 * 60_000);
}

export async function lseRef(
  key: string | null,
  dataset: string,
  params: Record<string, string | number | undefined> = {}
): Promise<any[]> {
  if (!(LSE_REF_DATASETS as readonly string[]).includes(dataset)) {
    throw new LseError(`Unknown reference dataset: ${dataset}`, 400, true);
  }
  return lseFetch(`/ref/${dataset}`, key, params, 15 * 60_000);
}

export async function lseOptionsFlow(
  key: string | null,
  params: Record<string, string | number | undefined> = {}
): Promise<any[]> {
  return lseFetch('/options/flow', key, { order: 'desc', ...params }, 5 * 60_000);
}

export async function lseOptionsChain(
  key: string | null,
  params: Record<string, string | number | undefined> = {}
): Promise<any[]> {
  return lseFetch('/options/chain', key, params, 5 * 60_000);
}

export async function lseCatalog(key: string | null, dataset?: string): Promise<any[]> {
  const rows: any[] = await lseFetch('/catalog', key, {}, 6 * 3600_000);
  return dataset ? rows.filter((r) => r.dataset === dataset) : rows;
}

// ── curated bundles for the MISOCRYPTO system model ─────────────────────────

/**
 * Self-configuring multi-asset benchmark pack. Discovers LSE's own catalog,
 * picks the benchmark instruments by name matching (no hardcoded symbols),
 * and returns last close + day change for each, plus key rates/macro series.
 * This is the cross-asset regime layer the war-room was missing.
 */
export async function lseMacroPack(key: string | null): Promise<any> {
  if (!key) throw new LseError('LSE key not configured', 503, false);
  const catalog = await lseCatalog(key);

  const WANT: Array<{ id: string; dataset?: string; match: RegExp; label: string }> = [
    { id: 'spx', dataset: 'indices', match: /s&p\s*500(?!.*equal)/i, label: 'S&P 500' },
    { id: 'ndx', dataset: 'indices', match: /nasdaq\s*100/i, label: 'Nasdaq 100' },
    { id: 'dxy', dataset: 'indices', match: /dollar index|dxy/i, label: 'Dollar Index' },
    { id: 'vix', dataset: 'indices', match: /\bvix\b/i, label: 'VIX' },
    { id: 'gold', dataset: 'commodities', match: /gold/i, label: 'Gold' },
    { id: 'wti', dataset: 'commodities', match: /wti|crude.*wti|light.*crude/i, label: 'WTI Crude' },
    { id: 'natgas', dataset: 'commodities', match: /natural gas/i, label: 'Natural Gas' },
    { id: 'copper', dataset: 'commodities', match: /copper/i, label: 'Copper' },
    { id: 'eurusd', dataset: 'forex', match: /^eur\/usd$/i, label: 'EUR/USD' },
    { id: 'usdjpy', dataset: 'forex', match: /^usd\/jpy$/i, label: 'USD/JPY' },
    { id: 'btc', dataset: 'crypto', match: /^btc\/usd$/i, label: 'Bitcoin' },
    { id: 'eth', dataset: 'crypto', match: /^eth\/usd$/i, label: 'Ethereum' },
  ];

  const assets: any[] = [];
  await Promise.all(
    WANT.map(async (w) => {
      const row = catalog.find(
        (r) => (!w.dataset || r.dataset === w.dataset) && w.match.test(`${r.symbol} ${r.name || ''}`)
      );
      if (!row) return;
      try {
        const candles: any[] = await lseCandles(key, row.symbol, '1d', {
          limit: 3,
          order: 'desc',
          dataset: row.dataset,
        });
        if (!candles.length) return;
        const last = candles[0];
        const prev = candles[1] || last;
        const close = Number(last.close);
        const prevClose = Number(prev.close);
        assets.push({
          id: w.id,
          label: w.label,
          symbol: row.symbol,
          dataset: row.dataset,
          price: close,
          changePct: prevClose ? +(((close - prevClose) / prevClose) * 100).toFixed(2) : 0,
          date: last.ts || last.date,
        });
      } catch {
        /* one missing instrument must not sink the pack */
      }
    })
  );

  const RATES = [
    { id: 'us10y', symbol: 'US10Y', label: 'US 10Y Yield' },
    { id: 'us02y', symbol: 'US02Y', label: 'US 2Y Yield' },
    { id: 'de10y', symbol: 'DE10Y', label: 'DE 10Y Yield' },
    { id: 'cpi', symbol: 'cpi_yoy', label: 'US CPI YoY' },
    { id: 'fedfunds', symbol: 'fdtr', label: 'Fed Funds Target' },
  ];
  const rates: any[] = [];
  await Promise.all(
    RATES.map(async (r) => {
      try {
        const rows: any[] = await lseSeries(key, r.symbol, { limit: 2, order: 'desc' });
        if (!rows.length) return;
        rates.push({ id: r.id, label: r.label, symbol: r.symbol, value: rows[0].value, date: rows[0].date });
      } catch {
        /* skip */
      }
    })
  );

  return { success: true, timestamp: new Date().toISOString(), assets, rates };
}

/** Upcoming economic-calendar events, soonest first. Feeds the OSINT wire. */
export async function lseUpcomingEvents(key: string | null, days = 14, limit = 25): Promise<any[]> {
  const now = new Date();
  const end = new Date(now.getTime() + days * 86400000);
  const rows: any[] = await lseRef(key, 'economic_calendar', {
    start: now.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    order: 'asc',
    limit,
  });
  return rows;
}

/** Latest COT positioning snapshot for major futures. */
export async function lseCotSnapshot(
  key: string | null,
  symbols: string[] = ['ES', 'NQ', 'GC', 'CL', 'ZW']
): Promise<any[]> {
  if (!key) throw new LseError('LSE key not configured', 503, false);
  const out: any[] = [];
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const rows: any[] = await lseRef(key, 'cot', { symbol, order: 'desc', limit: 1 });
        if (rows.length) out.push({ symbol, latest: rows[0] });
      } catch {
        /* skip */
      }
    })
  );
  return out;
}

/** Compact macro snapshot text, injected into AI briefing / scenario prompts. */
export async function lseMacroSnapshotText(key: string | null): Promise<string | null> {
  try {
    const mp = await lseMacroPack(key);
    const assetLine = mp.assets
      .map((a: any) => `${a.label} ${a.price} (${a.changePct >= 0 ? '+' : ''}${a.changePct}%)`)
      .join(' | ');
    const rateLine = mp.rates.map((r: any) => `${r.label}: ${r.value}`).join(' | ');
    return `LIVE CROSS-ASSET SNAPSHOT (${mp.timestamp}): ${assetLine}. RATES/MACRO: ${rateLine}.`;
  } catch {
    return null;
  }
}

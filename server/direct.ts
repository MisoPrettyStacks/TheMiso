/**
 * server/direct.ts — DIRECT primary-source clients for MISOCRYPTO.
 *
 * No middleman: these hit the originating agencies/exchanges themselves.
 * Everything is free, no API key, straight from where the data happens:
 *
 *   COT positioning  → CFTC Commitments of Traders text files (cftc.gov)
 *   Insider trades    → SEC EDGAR full-text search (efts.sec.gov)
 *   Bond yields       → U.S. Treasury daily par yield curve XML (home.treasury.gov)
 *   Stock/ETF history → Nasdaq historical API (api.nasdaq.com)
 *   Macro series      → FRED (already direct via the fred vault provider)
 *   Crypto prices     → Binance / Coinbase (already direct)
 *
 * Two LSE datasets have NO free primary equivalent, so they stay on the
 * LSE vault and are labeled as such in the UI: the economic calendar
 * (no unified free primary API exists) and options flow (OPRA tape is paid).
 */

const UA = 'MISOCRYPTO-Platform research (contact: research@localhost)';
const FETCH_TIMEOUT_MS = 15000;

// ── tiny TTL cache ──────────────────────────────────────────────────────────

const cache = new Map<string, { exp: number; data: any }>();

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
  if (cache.size > 200) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { exp: Date.now() + ttlMs, data });
}

async function directFetch(url: string, ttlMs: number, headers: Record<string, string> = {}): Promise<string> {
  const hit = cacheGet(url);
  if (hit !== undefined) return hit;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, ...headers },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
    const text = await res.text();
    cacheSet(url, text, ttlMs);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ── CFTC Commitments of Traders ─────────────────────────────────────────────

/**
 * Friendly symbol → market-name matchers, tried in order. Disaggregated
 * files carry the managed-money split; the legacy financial file carries
 * the noncommercial split (used for equity index futures).
 */
const COT_TARGETS: Array<{ symbol: string; label: string; match: RegExp; preferDisagg: boolean }> = [
  { symbol: 'ES', label: 'E-Mini S&P 500', match: /E-MINI S&P 500(?!.*CONSU)/i, preferDisagg: false },
  { symbol: 'NQ', label: 'E-Mini Nasdaq 100', match: /E-MINI NASDAQ/i, preferDisagg: false },
  { symbol: 'GC', label: 'Gold', match: /^"GOLD - COMMODITY EXCHANGE INC\.?"/i, preferDisagg: true },
  { symbol: 'CL', label: 'WTI Crude Oil', match: /CRUDE OIL, LIGHT SWEET/i, preferDisagg: true },
  { symbol: 'ZW', label: 'Wheat (SRW)', match: /^"WHEAT-SRW - CHICAGO BOARD OF TRADE"/i, preferDisagg: true },
  { symbol: 'DX', label: 'Dollar Index', match: /U\.S\. DOLLAR INDEX/i, preferDisagg: false },
];

interface CotRow {
  market: string;
  date: string;
  openInterest: number;
  long: number;
  short: number;
  spreads: number;
  longLabel: string;
  source: 'CFTC disaggregated' | 'CFTC legacy financial';
}

/** Parse one CFTC text line: "MARKET NAME",yyyymmdd,yyyy-mm-dd,code,...,numeric fields. */
function parseCotLine(line: string, cols: { long: number; short: number; spread: number }, longLabel: string, source: CotRow['source']): CotRow | null {
  const m = line.match(/^"([^"]*)",(.*)$/);
  if (!m) return null;
  const fields = m[2].split(',');
  const num = (i: number) => {
    const v = parseFloat((fields[i] || '').trim());
    return isNaN(v) ? 0 : v;
  };
  return {
    market: m[1],
    date: (fields[1] || '').trim(),
    openInterest: num(6),
    long: num(cols.long),
    short: num(cols.short),
    spreads: num(cols.spread),
    longLabel,
    source,
  };
}

async function fetchCotFile(name: string): Promise<string[]> {
  const text = await directFetch(`https://www.cftc.gov/dea/newcot/${name}`, 6 * 3600_000);
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('"'));
}

export interface DirectCotRow extends CotRow {
  symbol: string;
  label: string;
}

export async function directCot(symbols: string[]): Promise<DirectCotRow[]> {
  const out: DirectCotRow[] = [];
  // Disaggregated: idx 7=open interest, 12/13/14 = managed-money long/short/spread
  // (0-based within the post-name fields: 6=OI, 12=MM long, 13=MM short, 14=MM spread)
  const disagg = await fetchCotFile('f_disagg.txt').catch(() => [] as string[]);
  // Legacy financial: 6=OI, 7/8/9 = noncommercial long/short/spread
  const legacy = await fetchCotFile('FinFutWk.txt').catch(() => [] as string[]);

  for (const sym of symbols) {
    const target = COT_TARGETS.find((t) => t.symbol === sym.toUpperCase());
    if (!target) continue;
    let row: CotRow | null = null;
    if (target.preferDisagg) {
      const line = disagg.find((l) => target.match.test(l));
      if (line) row = parseCotLine(line, { long: 12, short: 13, spread: 14 }, 'Managed money', 'CFTC disaggregated');
    }
    if (!row) {
      const line = legacy.find((l) => target.match.test(l)) || disagg.find((l) => target.match.test(l));
      if (line) {
        const isLegacy = legacy.includes(line);
        row = isLegacy
          ? parseCotLine(line, { long: 7, short: 8, spread: 9 }, 'Noncommercial', 'CFTC legacy financial')
          : parseCotLine(line, { long: 12, short: 13, spread: 14 }, 'Managed money', 'CFTC disaggregated');
      }
    }
    if (row) out.push({ symbol: target.symbol, label: target.label, ...row });
  }
  return out;
}

// ── U.S. Treasury par yield curve (official XML feed) ────────────────────────

export interface YieldCurve {
  date: string;
  months1: number | null;
  months3: number | null;
  months6: number | null;
  year1: number | null;
  year2: number | null;
  year3: number | null;
  year5: number | null;
  year7: number | null;
  year10: number | null;
  year20: number | null;
  year30: number | null;
  source: string;
}

export async function directYields(): Promise<YieldCurve> {
  const year = new Date().getUTCFullYear();
  const xml = await directFetch(
    `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${year}`,
    6 * 3600_000
  );
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  // Tags carry attributes (e.g. <d:BC_2YEAR m:type="Edm.Double">), so match loosely.
  const grab = (entry: string, tag: string): number | null => {
    const m = entry.match(new RegExp(`<d:${tag}[^>]*>([^<]*)</d:${tag}>`));
    if (!m) return null;
    const v = parseFloat(m[1]);
    return isNaN(v) ? null : v;
  };
  let best: YieldCurve | null = null;
  for (const e of entries) {
    const dateM = e.match(/<d:NEW_DATE[^>]*>([^<]*)<\/d:NEW_DATE>/);
    if (!dateM) continue;
    const date = dateM[1].slice(0, 10);
    const curve: YieldCurve = {
      date,
      months1: grab(e, 'BC_1MONTH'),
      months3: grab(e, 'BC_3MONTH'),
      months6: grab(e, 'BC_6MONTH'),
      year1: grab(e, 'BC_1YEAR'),
      year2: grab(e, 'BC_2YEAR'),
      year3: grab(e, 'BC_3YEAR'),
      year5: grab(e, 'BC_5YEAR'),
      year7: grab(e, 'BC_7YEAR'),
      year10: grab(e, 'BC_10YEAR'),
      year20: grab(e, 'BC_20YEAR'),
      year30: grab(e, 'BC_30YEAR'),
      source: 'U.S. Treasury daily par yield curve',
    };
    if (!best || date > best.date) best = curve;
  }
  if (!best) throw new Error('Treasury yield feed returned no entries');
  return best;
}

// ── SEC EDGAR insider trades (Form 4 full-text search) ──────────────────────

export interface InsiderPrint {
  insider: string;
  issuer: string;
  ticker: string;
  filed: string;
  form: string;
  accession: string;
  link: string;
}

export async function directInsiderBuys(limit = 12): Promise<InsiderPrint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url =
    `https://efts.sec.gov/LATEST/search-index?q=%224%22&forms=4` +
    `&dateRange=custom&startdt=${fmt(start)}&enddt=${fmt(end)}`;
  const raw = await directFetch(url, 30 * 60_000, { Accept: 'application/json' });
  const data = JSON.parse(raw);
  const hits: any[] = data?.hits?.hits || [];
  const out: InsiderPrint[] = [];
  for (const h of hits.slice(0, limit)) {
    const s = h._source || {};
    const names: string[] = s.display_names || [];
    const ciks: string[] = s.ciks || [];
    const id: string = h._id || '';
    const [accDashes, doc] = id.split(':');
    const accession = (accDashes || '').replace(/-/g, '');
    const cik = (ciks[1] || ciks[0] || '').replace(/^0+/, '');
    // display_names[0] is usually the reporting person, [1] the issuer w/ ticker
    const insider = (names[0] || '').replace(/\s*\(CIK.*$/, '').trim();
    const issuerRaw = names[1] || names[0] || '';
    const tickerM = issuerRaw.match(/\(([A-Z]{1,6})\)/);
    out.push({
      insider: insider || '—',
      issuer: issuerRaw.replace(/\s*\(CIK.*$/, '').trim() || '—',
      ticker: tickerM ? tickerM[1] : '—',
      filed: s.file_date || s.period_ending || '—',
      form: (s.form || ['4'])[0] || '4',
      accession,
      link: accession && doc && cik ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accession}/${doc}` : 'https://www.sec.gov/cgi-bin/browse-edgar',
    });
  }
  return out;
}

// ── Nasdaq direct historical candles (stocks / ETFs / indices) ──────────────

export interface StockBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function directStockHistory(symbol: string, fromdate: string): Promise<{ symbol: string; bars: StockBar[]; source: string }> {
  const sym = symbol.toUpperCase().replace(/[^A-Z0-9.^]/g, '');
  if (!sym) throw new Error('symbol required');
  const url = `https://api.nasdaq.com/api/quote/${encodeURIComponent(sym)}/historical?assetclass=stocks&fromdate=${fromdate}&limit=9999`;
  const raw = await directFetch(url, 15 * 60_000, { Accept: 'application/json' });
  const data = JSON.parse(raw);
  const rows: any[] = data?.data?.tradesTable?.rows || [];
  const clean = (v: string) => parseFloat(`${v || ''}`.replace(/[$,]/g, ''));
  const bars: StockBar[] = rows
    .map((r) => ({
      date: r.date || '',
      open: clean(r.open),
      high: clean(r.high),
      low: clean(r.low),
      close: clean(r.close),
      volume: Math.round(clean(r.volume)),
    }))
    .filter((b) => b.date && !isNaN(b.close));
  // rows come newest-first; normalize oldest-first
  bars.reverse();
  return { symbol: sym, bars, source: 'Nasdaq historical API (direct)' };
}

/**
 * directService — frontend client for the direct primary-source layer.
 *
 * Same-origin proxy (/api/direct/*). No keys, no middleman: CFTC, SEC EDGAR,
 * U.S. Treasury, and Nasdaq, straight from the source.
 */

async function directGet<T = any>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && `${v}`.length > 0) qs.set(k, `${v}`);
  }
  const res = await fetch(`/api/direct${path}${qs.toString() ? `?${qs}` : ''}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Direct source request failed (${res.status})`);
  }
  return data as T;
}

export interface DirectCotRow {
  symbol: string;
  label: string;
  market: string;
  date: string;
  openInterest: number;
  long: number;
  short: number;
  spreads: number;
  longLabel: string;
  source: string;
}

export interface DirectYieldCurve {
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

export interface DirectInsiderPrint {
  insider: string;
  issuer: string;
  ticker: string;
  filed: string;
  form: string;
  accession: string;
  link: string;
}

export const directService = {
  /** CFTC Commitments of Traders — managed-money / noncommercial positioning. */
  getCot: (symbols = 'ES,NQ,GC,CL,ZW') =>
    directGet<{ rows: DirectCotRow[] }>('/cot', { symbols }),

  /** U.S. Treasury daily par yield curve, direct from home.treasury.gov. */
  getYields: () => directGet<DirectYieldCurve>('/yields'),

  /** Recent Form 4 insider filings, direct from SEC EDGAR. */
  getInsiderBuys: (limit = 12) =>
    directGet<{ rows: DirectInsiderPrint[] }>('/insider', { limit }),

  /** Stock/ETF/index daily history, direct from Nasdaq. */
  getHistory: (symbol: string, fromdate = '2024-01-01') =>
    directGet<{ symbol: string; bars: any[]; source: string }>('/history', { symbol, fromdate }),
};

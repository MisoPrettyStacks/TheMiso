/**
 * lseService — frontend client for the MISOCRYPTO London Strategic Edge layer.
 *
 * All calls go through the same-origin proxy (/api/lse/*) so the key never
 * touches a third party from the browser. The user's free LSE key is read
 * from the Key Vault ('lse' provider slots) and sent as the x-lse-key header;
 * the server also accepts LSE_API_KEY from its own environment.
 */
import { apiVaultService } from './apiVaultService';

function getVaultKey(): string | null {
  try {
    const summary = apiVaultService.getVaultSummaryForRequests();
    const keys = summary['lse'];
    return keys && keys.length > 0 ? keys[0] : null;
  } catch {
    return null;
  }
}

export function lseKeyConfigured(): boolean {
  return getVaultKey() !== null;
}

async function lseGet<T = any>(
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && `${v}`.length > 0) qs.set(k, `${v}`);
  }
  const headers: Record<string, string> = {};
  const key = getVaultKey();
  if (key) headers['x-lse-key'] = key;
  const res = await fetch(`/api/lse${path}${qs.toString() ? `?${qs}` : ''}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err: any = new Error(data.error || `LSE request failed (${res.status})`);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export interface LseAssetQuote {
  id: string;
  label: string;
  symbol: string;
  dataset: string;
  price: number;
  changePct: number;
  date: string;
}

export interface LseRateQuote {
  id: string;
  label: string;
  symbol: string;
  value: number | string;
  date: string;
}

export const lseService = {
  /** Vault key present in this browser? */
  hasKey: lseKeyConfigured,

  /** Key + usage/allowance status. */
  getStatus: () => lseGet('/status'),

  /** Curated cross-asset benchmark pack (indices, FX, commodities, crypto, rates). */
  getMacroPack: () =>
    lseGet<{ assets: LseAssetQuote[]; rates: LseRateQuote[]; timestamp: string }>('/macro-pack'),

  /** Upcoming economic-calendar events. */
  getCalendar: (days = 14, limit = 25, region?: string) =>
    lseGet<{ rows: any[]; count: number }>('/calendar', { days, limit, region }),

  /** Latest COT positioning snapshot (default: ES,NQ,GC,CL,ZW). */
  getCot: (symbols = 'ES,NQ,GC,CL,ZW') => lseGet<{ rows: any[] }>('/cot', { symbols }),

  /** Large options prints — the "smart money" tape. */
  getOptionsFlow: (params: Record<string, string | number | undefined> = {}) =>
    lseGet<{ rows: any[] }>('/options/flow', { min_premium: 250000, max_dte: 30, limit: 12, ...params }),

  /** Options chain for one underlying. */
  getOptionsChain: (underlying: string, params: Record<string, string | number | undefined> = {}) =>
    lseGet<{ rows: any[] }>('/options/chain', { underlying, ...params }),

  /** Recent open-market insider purchases. */
  getInsiderBuys: (limit = 12) =>
    lseGet<{ rows: any[] }>('/ref/insider_trades', { type: 'P-Purchase', order: 'desc', limit }),

  /** Generic reference-dataset read (economic_calendar, dividends, stock_splits, cot, …). */
  getRef: (dataset: string, params: Record<string, string | number | undefined> = {}) =>
    lseGet<{ rows: any[] }>(`/ref/${dataset}`, params),

  /** OHLCV candles for any symbol, any stored resolution. */
  getCandles: (
    symbol: string,
    timeframe = '1d',
    opts: Record<string, string | number | undefined> = {}
  ) => lseGet<{ rows: any[] }>('/candles', { symbol, timeframe, limit: 200, order: 'desc', ...opts }),

  /** Macro / bond-yield series. */
  getSeries: (symbol: string, opts: Record<string, string | number | undefined> = {}) =>
    lseGet<{ rows: any[] }>('/series', { symbol, limit: 500, order: 'desc', ...opts }),
};

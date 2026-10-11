import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Key,
  Landmark,
  CalendarClock,
  Radar,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { lseService, LseAssetQuote, LseRateQuote } from '../services/lseService';
import { soundEffects } from '../services/soundEffects';

interface MarketsViewProps {
  onOpenVault: () => void;
}

// ── small helpers ───────────────────────────────────────────────────────────

function pick(row: any, candidates: string[]): any {
  if (!row) return undefined;
  const keys = Object.keys(row);
  for (const c of candidates) {
    const hit = keys.find((k) => k.toLowerCase() === c.toLowerCase());
    if (hit && row[hit] !== null && row[hit] !== undefined && `${row[hit]}` !== '') return row[hit];
  }
  return undefined;
}

function fmtNum(v: any, digits = 2): string {
  const n = typeof v === 'number' ? v : parseFloat(`${v}`);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function Section({
  icon,
  title,
  subtitle,
  accent,
  children,
  onRefresh,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <section className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className={accent}>{icon}</span>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-100 tracking-wider">{title}</h3>
            <p className="text-[10px] font-mono text-slate-500">{subtitle}</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={() => {
              soundEffects.playTick();
              onRefresh();
            }}
            className="p-1.5 rounded border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh section"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono py-4 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex items-center space-x-2 text-slate-600 text-xs font-mono py-4 justify-center">
      <Minus className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
}

/** Adaptive table: renders whatever columns the vault returns. */
function RawTable({ rows, prefer = [] as string[], maxRows = 10 }: { rows: any[]; prefer?: string[]; maxRows?: number }) {
  if (!rows || rows.length === 0) return <EmptyRow label="No rows returned" />;
  const first = rows[0];
  const allKeys = Object.keys(first).filter((k) => {
    const v = first[k];
    return v !== null && typeof v !== 'object';
  });
  const ordered = [
    ...prefer.filter((p) => allKeys.some((k) => k.toLowerCase() === p.toLowerCase())),
    ...allKeys.filter((k) => !prefer.some((p) => p.toLowerCase() === k.toLowerCase())),
  ].slice(0, 7);
  const shown = rows.slice(0, maxRows);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            {ordered.map((k) => (
              <th key={k} className="py-1.5 pr-3 font-bold uppercase tracking-wider whitespace-nowrap">
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
              {ordered.map((k) => {
                const v = r[k];
                const disp = typeof v === 'number' ? fmtNum(v, Math.abs(v) < 10 ? 4 : 2) : `${v ?? '—'}`.slice(0, 42);
                return (
                  <td key={k} className="py-1.5 pr-3 text-slate-300 whitespace-nowrap">
                    {disp}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Net positioning bar for a COT row. */
function CotCard({ symbol, row }: { symbol: string; row: any }) {
  const keys = Object.keys(row);
  const numOf = (k: string) => {
    const v = row[k];
    const n = typeof v === 'number' ? v : parseFloat(`${v}`);
    return isNaN(n) ? null : n;
  };
  const longs = keys.filter((k) => /long/i.test(k));
  const shorts = keys.filter((k) => /short/i.test(k));
  const lKey = longs.find((k) => /non.?commercial|managed/i.test(k)) || longs[0];
  const sKey = shorts.find((k) => /non.?commercial|managed/i.test(k)) || shorts[0];
  const l = lKey ? numOf(lKey) : null;
  const s = sKey ? numOf(sKey) : null;
  const date = pick(row, ['date', 'report_date', 'as_of', 'timestamp']);

  if (l === null || s === null || l + s === 0) {
    return (
      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
        <div className="text-xs font-mono font-bold text-slate-200">{symbol}</div>
        <EmptyRow label="No long/short split in row" />
      </div>
    );
  }
  const netPct = ((l - s) / (l + s)) * 100;
  const longPct = (l / (l + s)) * 100;
  const bias = netPct > 15 ? 'LONG HEAVY' : netPct < -15 ? 'SHORT HEAVY' : 'BALANCED';
  const biasColor = netPct > 15 ? 'text-emerald-400' : netPct < -15 ? 'text-rose-400' : 'text-slate-400';
  return (
    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-slate-200">{symbol}</span>
        <span className={`text-[10px] font-mono font-bold ${biasColor}`}>{bias}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
        <div className="bg-emerald-500/80 h-full" style={{ width: `${longPct}%` }} />
        <div className="bg-rose-500/80 h-full" style={{ width: `${100 - longPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>L {Math.round(l).toLocaleString()}</span>
        <span>NET {netPct >= 0 ? '+' : ''}{netPct.toFixed(1)}%</span>
        <span>S {Math.round(s).toLocaleString()}</span>
      </div>
      {date && <div className="text-[10px] font-mono text-slate-600">as of {`${date}`.slice(0, 10)}</div>}
    </div>
  );
}

// ── main view ───────────────────────────────────────────────────────────────

export const MarketsView: React.FC<MarketsViewProps> = ({ onOpenVault }) => {
  const [keyOk, setKeyOk] = useState<boolean | null>(null);
  const [assets, setAssets] = useState<LseAssetQuote[]>([]);
  const [rates, setRates] = useState<LseRateQuote[]>([]);
  const [packTime, setPackTime] = useState('');
  const [calendar, setCalendar] = useState<any[]>([]);
  const [cot, setCot] = useState<any[]>([]);
  const [flow, setFlow] = useState<any[]>([]);
  const [insiders, setInsiders] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setL = (k: string, v: boolean) => setLoading((p) => ({ ...p, [k]: v }));
  const setE = (k: string, v: string | undefined) =>
    setErrors((p) => {
      const n = { ...p };
      if (v) n[k] = v;
      else delete n[k];
      return n;
    });

  const loadStatus = async () => {
    try {
      const s: any = await lseService.getStatus();
      setKeyOk(!!s.configured && !s.error);
    } catch {
      setKeyOk(false);
    }
  };

  const loadPack = async () => {
    setL('pack', true);
    setE('pack', undefined);
    try {
      const p = await lseService.getMacroPack();
      setAssets(p.assets || []);
      setRates(p.rates || []);
      setPackTime(p.timestamp || '');
    } catch (e: any) {
      setE('pack', e.code === 'LSE_KEY_MISSING' ? 'KEY_MISSING' : e.message);
    } finally {
      setL('pack', false);
    }
  };

  const loadCalendar = async () => {
    setL('cal', true);
    setE('cal', undefined);
    try {
      const c = await lseService.getCalendar(14, 25);
      setCalendar(c.rows || []);
    } catch (e: any) {
      setE('cal', e.code === 'LSE_KEY_MISSING' ? 'KEY_MISSING' : e.message);
    } finally {
      setL('cal', false);
    }
  };

  const loadCot = async () => {
    setL('cot', true);
    setE('cot', undefined);
    try {
      const c = await lseService.getCot();
      setCot(c.rows || []);
    } catch (e: any) {
      setE('cot', e.code === 'LSE_KEY_MISSING' ? 'KEY_MISSING' : e.message);
    } finally {
      setL('cot', false);
    }
  };

  const loadFlow = async () => {
    setL('flow', true);
    setE('flow', undefined);
    try {
      const f = await lseService.getOptionsFlow();
      setFlow(f.rows || []);
    } catch (e: any) {
      setE('flow', e.code === 'LSE_KEY_MISSING' ? 'KEY_MISSING' : e.message);
    } finally {
      setL('flow', false);
    }
  };

  const loadInsiders = async () => {
    setL('ins', true);
    setE('ins', undefined);
    try {
      const r = await lseService.getInsiderBuys(12);
      setInsiders(r.rows || []);
    } catch (e: any) {
      setE('ins', e.code === 'LSE_KEY_MISSING' ? 'KEY_MISSING' : e.message);
    } finally {
      setL('ins', false);
    }
  };

  useEffect(() => {
    loadStatus();
    loadPack();
    loadCalendar();
    loadCot();
    loadFlow();
    loadInsiders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needKey = keyOk === false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-slate-200 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-orange-400 mb-1">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span className="font-bold tracking-wider">MARKET STRUCTURE // MULTI-ASSET INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">Cross-Asset Regime Desk</h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
            Deep history, positioning, policy calendar, and smart-money flow — the market half of the
            situational picture, fed by the London Strategic Edge vault.
          </p>
        </div>
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
            keyOk ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300' : 'border-amber-700/60 bg-amber-950/40 text-amber-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${keyOk ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span>{keyOk === null ? 'CHECKING VAULT…' : keyOk ? 'LSE VAULT LINKED' : 'LSE KEY REQUIRED'}</span>
        </div>
      </div>

      {/* Key gate */}
      {needKey && (
        <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <Key className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <div className="text-sm font-mono font-bold text-amber-200">Connect the market-data vault</div>
              <p className="text-xs font-mono text-slate-400 mt-1 max-w-2xl">
                This desk reads the London Strategic Edge vault — free key, no tiers. Paste it into the
                Key Vault under the <span className="text-amber-300">LSE</span> provider (or set LSE_API_KEY on
                the server) and every section below lights up: benchmarks, COT, calendar, options flow, insider tape.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playTick();
              onOpenVault();
            }}
            className="px-4 py-2 rounded-lg bg-amber-600/30 hover:bg-amber-500/40 border border-amber-500/60 text-amber-100 text-xs font-mono font-bold transition-all whitespace-nowrap"
          >
            OPEN KEY VAULT
          </button>
        </div>
      )}

      {/* 1 — Benchmark tape */}
      <Section
        icon={<BarChart3 className="w-4 h-4" />}
        title="BENCHMARK TAPE"
        subtitle={`Indices · FX · Commodities · Crypto — daily closes${packTime ? ` · ${packTime.slice(0, 10)}` : ''}`}
        accent="text-orange-400"
        onRefresh={loadPack}
        loading={loading.pack}
      >
        {loading.pack && assets.length === 0 ? (
          <LoadingRow label="Pulling benchmark closes…" />
        ) : errors.pack ? (
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
            <AlertTriangle className="w-4 h-4" />
            <span>{errors.pack === 'KEY_MISSING' ? 'Vault key required — see above.' : errors.pack}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {assets.map((a) => {
              const up = a.changePct >= 0;
              return (
                <div key={a.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider truncate">{a.label}</div>
                  <div className="text-base font-mono font-bold text-slate-100 mt-1 truncate">{fmtNum(a.price)}</div>
                  <div className={`flex items-center space-x-1 text-xs font-mono font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{up ? '+' : ''}{a.changePct.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
            {assets.length === 0 && <EmptyRow label="No benchmarks resolved" />}
          </div>
        )}
        {/* Rates strip */}
        {rates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-x-6 gap-y-2">
            {rates.map((r) => (
              <div key={r.id} className="text-xs font-mono">
                <span className="text-slate-500">{r.label}: </span>
                <span className="text-cyan-300 font-bold">{fmtNum(r.value)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2 — COT positioning */}
        <Section
          icon={<Users className="w-4 h-4" />}
          title="COT POSITIONING"
          subtitle="Commitments of Traders — speculative net bias per future"
          accent="text-cyan-400"
          onRefresh={loadCot}
          loading={loading.cot}
        >
          {loading.cot && cot.length === 0 ? (
            <LoadingRow label="Reading positioning…" />
          ) : errors.cot ? (
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.cot === 'KEY_MISSING' ? 'Vault key required.' : errors.cot}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cot.map((c, i) => (
                <CotCard key={c.symbol || i} symbol={c.symbol} row={c.latest || {}} />
              ))}
              {cot.length === 0 && <EmptyRow label="No COT rows" />}
            </div>
          )}
        </Section>

        {/* 3 — Economic calendar */}
        <Section
          icon={<CalendarClock className="w-4 h-4" />}
          title="POLICY CALENDAR"
          subtitle="Scheduled macro catalysts — next 14 days"
          accent="text-amber-400"
          onRefresh={loadCalendar}
          loading={loading.cal}
        >
          {loading.cal && calendar.length === 0 ? (
            <LoadingRow label="Reading release schedule…" />
          ) : errors.cal ? (
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.cal === 'KEY_MISSING' ? 'Vault key required.' : errors.cal}</span>
            </div>
          ) : calendar.length === 0 ? (
            <EmptyRow label="No upcoming events" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {calendar.slice(0, 14).map((ev, i) => {
                const title = pick(ev, ['event', 'title', 'name']) || 'Release';
                const when = pick(ev, ['datetime', 'date', 'release_date']);
                const region = pick(ev, ['region', 'country', 'country_name']);
                const hot = /cpi|fomc|payroll|nonfarm|rate decision|gdp|pce|ppi/i.test(`${title}`);
                return (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold text-slate-200 truncate">{`${title}`}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {region ? `${region} · ` : ''}{when ? `${when}`.slice(0, 16).replace('T', ' ') : ''}
                      </div>
                    </div>
                    {hot && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 whitespace-nowrap">
                        HOT
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* 4 — Options flow */}
        <Section
          icon={<Radar className="w-4 h-4" />}
          title="SMART-MONEY FLOW"
          subtitle="Largest options prints — premium ≥ $250k, ≤ 30 DTE"
          accent="text-purple-400"
          onRefresh={loadFlow}
          loading={loading.flow}
        >
          {loading.flow && flow.length === 0 ? (
            <LoadingRow label="Scanning options tape…" />
          ) : errors.flow ? (
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.flow === 'KEY_MISSING' ? 'Vault key required.' : errors.flow}</span>
            </div>
          ) : (
            <RawTable rows={flow} prefer={['underlying', 'ticker', 'type', 'strike', 'expiry', 'expiration', 'premium', 'iv', 'volume', 'time', 'ts']} maxRows={10} />
          )}
        </Section>

        {/* 5 — Insider tape */}
        <Section
          icon={<Landmark className="w-4 h-4" />}
          title="INSIDER TAPE"
          subtitle="Recent open-market insider purchases (SEC Form 4)"
          accent="text-emerald-400"
          onRefresh={loadInsiders}
          loading={loading.ins}
        >
          {loading.ins && insiders.length === 0 ? (
            <LoadingRow label="Reading insider filings…" />
          ) : errors.ins ? (
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.ins === 'KEY_MISSING' ? 'Vault key required.' : errors.ins}</span>
            </div>
          ) : (
            <RawTable rows={insiders} prefer={['symbol', 'transaction_date', 'insider', 'reporting_owner', 'type', 'shares', 'price']} maxRows={10} />
          )}
        </Section>
      </div>

      <p className="text-[10px] font-mono text-slate-600 text-center">
        Market-structure data via the London Strategic Edge vault (read-only). Not investment advice — situational intelligence only.
      </p>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Landmark,
  Users,
  Minus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { directService, DirectCotRow, DirectYieldCurve } from '../services/directService';
import { soundEffects } from '../services/soundEffects';

interface MarketsViewProps {
  // no props — all data loads direct from primary sources, no key vault needed
}

// ── small helpers ───────────────────────────────────────────────────────────

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

/** Net positioning bar for a direct CFTC COT row. */
function DirectCotCard({ row }: { row: DirectCotRow }) {
  const total = row.long + row.short;
  const netPct = total ? ((row.long - row.short) / total) * 100 : 0;
  const longPct = total ? (row.long / total) * 100 : 50;
  const bias = netPct > 15 ? 'LONG HEAVY' : netPct < -15 ? 'SHORT HEAVY' : 'BALANCED';
  const biasColor = netPct > 15 ? 'text-emerald-400' : netPct < -15 ? 'text-rose-400' : 'text-slate-400';
  return (
    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-slate-200">
          {row.symbol} <span className="text-slate-500 font-normal">· {row.label}</span>
        </span>
        <span className={`text-[10px] font-mono font-bold ${biasColor}`}>{bias}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
        <div className="bg-emerald-500/80 h-full" style={{ width: `${longPct}%` }} />
        <div className="bg-rose-500/80 h-full" style={{ width: `${100 - longPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>L {Math.round(row.long).toLocaleString()}</span>
        <span>NET {netPct >= 0 ? '+' : ''}{netPct.toFixed(1)}%</span>
        <span>S {Math.round(row.short).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-600">
        <span>{row.longLabel}</span>
        <span>{row.date}</span>
      </div>
    </div>
  );
}

// ── main view ───────────────────────────────────────────────────────────────

export const MarketsView: React.FC<MarketsViewProps> = () => {
  const [cot, setCot] = useState<DirectCotRow[]>([]);
  const [insiders, setInsiders] = useState<any[]>([]);
  const [yields, setYields] = useState<DirectYieldCurve | null>(null);
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

  // DIRECT: CFTC Commitments of Traders — no key, no middleman.
  const loadCot = async () => {
    setL('cot', true);
    setE('cot', undefined);
    try {
      const c = await directService.getCot();
      setCot(c.rows || []);
    } catch (e: any) {
      setE('cot', e.message);
    } finally {
      setL('cot', false);
    }
  };

  // DIRECT: U.S. Treasury par yield curve — no key, no middleman.
  const loadYields = async () => {
    setL('yld', true);
    setE('yld', undefined);
    try {
      setYields(await directService.getYields());
    } catch (e: any) {
      setE('yld', e.message);
    } finally {
      setL('yld', false);
    }
  };

  // DIRECT: SEC EDGAR Form 4 filings — no key, no middleman.
  const loadInsiders = async () => {
    setL('ins', true);
    setE('ins', undefined);
    try {
      const r = await directService.getInsiderBuys(12);
      setInsiders(r.rows || []);
    } catch (e: any) {
      setE('ins', e.message);
    } finally {
      setL('ins', false);
    }
  };

  useEffect(() => {
    loadCot();
    loadYields();
    loadInsiders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Positioning, yields, and insider tape — the market half of the situational picture — all come{' '}
            <span className="text-emerald-400 font-bold">DIRECT</span> from the CFTC, U.S. Treasury, and SEC.
            No middleman, no key, no vault.
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold border-emerald-700/60 bg-emerald-950/40 text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>DIRECT SOURCES</span>
        </div>
      </div>

      {/* 1 — Yield curve (DIRECT from the U.S. Treasury) */}
      <Section
        icon={<BarChart3 className="w-4 h-4" />}
        title="YIELD CURVE"
        subtitle={`U.S. Treasury par yields${yields ? ` · ${yields.date}` : ''}`}
        accent="text-orange-400"
        onRefresh={loadYields}
        loading={loading.yld}
      >
        {loading.yld && !yields ? (
          <LoadingRow label="Reading Treasury curve…" />
        ) : yields ? (
          <div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(
                [
                  ['2Y', yields.year2],
                  ['5Y', yields.year5],
                  ['10Y', yields.year10],
                  ['30Y', yields.year30],
                ] as [string, number | null][]
              ).map(([label, v]) => (
                <div key={label as string} className="text-xs font-mono">
                  <span className="text-slate-500">{label}: </span>
                  <span className="text-cyan-300 font-bold">{v !== null ? `${v.toFixed(2)}%` : '—'}</span>
                </div>
              ))}
              {yields.year2 !== null && yields.year10 !== null && (
                <div className="text-xs font-mono">
                  <span className="text-slate-500">2s10s: </span>
                  <span className={`font-bold ${(yields.year10 - yields.year2) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {((yields.year10 - yields.year2) * 100).toFixed(0)}bp
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-600">
              Source: U.S. Treasury par yield XML · <span className="text-emerald-400 font-bold">DIRECT</span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono text-amber-400">{errors.yld || 'Yield curve unavailable'}</div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2 — COT positioning */}
        <Section
          icon={<Users className="w-4 h-4" />}
          title="COT POSITIONING"
          subtitle="Commitments of Traders — direct from the CFTC, no key"
          accent="text-cyan-400"
          onRefresh={loadCot}
          loading={loading.cot}
        >
          {loading.cot && cot.length === 0 ? (
            <LoadingRow label="Reading CFTC positioning…" />
          ) : errors.cot ? (
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.cot}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cot.map((c) => (
                <DirectCotCard key={c.symbol} row={c} />
              ))}
              {cot.length === 0 && <EmptyRow label="No COT rows" />}
            </div>
          )}
          <div className="mt-3 text-[10px] font-mono text-slate-600">
            Source: CFTC Commitments of Traders (cftc.gov) · <span className="text-emerald-400 font-bold">DIRECT</span> · updated weekly
          </div>
        </Section>

        {/* 3 — Insider tape */}
        <Section
          icon={<Landmark className="w-4 h-4" />}
          title="INSIDER TAPE"
          subtitle="Form 4 filings — direct from SEC EDGAR, no key"
          accent="text-emerald-400"
          onRefresh={loadInsiders}
          loading={loading.ins}
        >
          {loading.ins && insiders.length === 0 ? (
            <LoadingRow label="Reading SEC filings…" />
          ) : errors.ins ? (
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.ins}</span>
            </div>
          ) : insiders.length === 0 ? (
            <EmptyRow label="No recent filings" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {insiders.map((p, i) => (
                <a
                  key={i}
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold text-slate-200 truncate">
                        {p.insider} <span className="text-slate-500 font-normal">→</span>{' '}
                        <span className="text-emerald-300">{p.ticker}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">{p.issuer}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono text-slate-400">Form {p.form}</div>
                      <div className="text-[10px] font-mono text-slate-600">{p.filed}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="mt-3 text-[10px] font-mono text-slate-600">
            Source: SEC EDGAR full-text search (efts.sec.gov) · <span className="text-emerald-400 font-bold">DIRECT</span> · links open the actual filing
          </div>
        </Section>
      </div>

      <p className="text-[10px] font-mono text-slate-600 text-center">
        Market-structure data pulled direct from primary sources (CFTC, U.S. Treasury, SEC EDGAR). Not investment advice — situational intelligence only.
      </p>
    </div>
  );
};

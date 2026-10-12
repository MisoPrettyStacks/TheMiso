import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Landmark,
  Users,
  Minus,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Bitcoin,
} from 'lucide-react';
import { directService, DirectCotRow, DirectYieldCurve } from '../services/directService';
import { soundEffects } from '../services/soundEffects';

interface MarketsViewProps {
  // no props — all data loads direct from primary sources, no key vault needed
}

// ── small helpers ───────────────────────────────────────────────────────────

/** Expandable "Elaborate" explainer beneath a section subtitle. */
function Elaborate({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        onClick={() => {
          soundEffects.playTick();
          setOpen((o) => !o);
        }}
        className="flex items-center space-x-1 text-[10px] font-mono text-cyan-500/80 hover:text-cyan-300 transition-colors"
      >
        <span className="underline underline-offset-2">Elaborate</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="mt-2 text-[11px] font-mono leading-relaxed text-slate-400 whitespace-pre-line">
          {text}
        </p>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  accent,
  children,
  onRefresh,
  loading,
  explainer,
  updatedLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
  explainer?: string;
  updatedLabel?: string;
}) {
  return (
    <section className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className={accent}>{icon}</span>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-100 tracking-wider">{title}</h3>
            <p className="text-[10px] font-mono text-slate-500">{subtitle}</p>
            {explainer && <Elaborate text={explainer} />}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
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
          {updatedLabel && (
            <span className="text-[9px] font-mono text-slate-600">updated {updatedLabel}</span>
          )}
        </div>
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

// ── section explainers ──────────────────────────────────────────────────────

const BTC_COT_EXPLAINER = `CME Bitcoin futures COT — actual institutional BTC positioning. This is the CFTC's weekly Commitments of Traders report for CME Bitcoin futures specifically: not a proxy, not sentiment, but the real regulated futures positions held by institutional traders, broken into commercials (miners and merchants hedging actual BTC exposure), large speculators (hedge funds, CTAs), and small traders.

WHAT IT TELLS YOU: where the institutional crowd stands. When large speculators are record-long BTC futures, everyone is already all-in — contrarian caution, because who's left to buy? When commercials (often miners locking in production) are heavily short, they're hedging into strength, which tends to happen near local tops. The week-over-week change in net positioning matters most: sharp flips by managed money have preceded major BTC legs in both directions.

HOW IT RELATES TO CRYPTO: this IS crypto — the only CFTC-regulated window into institutional Bitcoin positioning. Spot BTC and CME futures are arbitraged tightly together, so futures positioning reflects the same institutional flows that move spot. Read it alongside the broader COT below: if specs are record-long both equities AND bitcoin futures, the entire risk complex is crowded on one side.`;

const COT_EXPLAINER = `The Commitments of Traders report is published by the CFTC every Friday (data as of the prior Tuesday). It shows exactly how trader groups are positioned in futures markets — who's long, who's short, and how it changed week over week. Commercials are the hedgers (producers, merchants — often treated as "smart money"); non-commercials are large speculators, mostly hedge funds and CTAs; non-reportables are small traders, often the contrarian "dumb money" signal.

WHAT IT TELLS YOU: where the crowded trades are. Record speculative longs mean everyone's already bought — tops form when there's nobody left to buy. Heavy commercial short hedging means producers are locking in prices, which also clusters near tops. Rising open interest with rising prices confirms a healthy trend; fading open interest means conviction is dying.

HOW IT RELATES TO CRYPTO: crypto trades as high-beta risk — it amplifies whatever equities do. Record-long ES/NQ specs = institutional risk-on, and BTC/ETH typically move 2–3x the equity leg. Specs flipping long the dollar index (DX) is a headwind for everything priced in dollars. Panic-long crude on geopolitical shock = inflation fear = risk-off, and crypto sells with stocks. Gold positioning shows the hard-money rotation between gold and BTC.`;

const YIELD_EXPLAINER = `The U.S. Treasury par yield curve — the price of money itself, direct from the Treasury, updated every business day. It plots what the U.S. government pays to borrow for 2, 5, 10, and 30 years.

WHAT IT TELLS YOU: the curve's shape is the market's verdict on growth and inflation. A normal upward slope means investors demand more yield for longer commitments. When short rates rise above long rates (inversion — the 2s10s spread goes negative), it's the most reliable recession predictor in markets; every U.S. recession in 50 years was preceded by one.

HOW IT RELATES TO CRYPTO: crypto is the longest-duration risk asset in existence — no cash flows to discount, so it lives and dies on liquidity. Falling long yields = cheaper money = risk-on = BTC rallies. A rapidly inverting curve means the Fed is tight and a slowdown is coming — that's when BTC drawdowns turn violent. Watch the 2s10s spread: when it snaps from deeply inverted back toward positive, liquidity is returning and crypto often bottoms there.`;

const INSIDER_EXPLAINER = `Form 4 filings, direct from SEC EDGAR. When a company's officers, directors, or 10%+ owners buy or sell company stock, Section 16 requires disclosure on Form 4 within two business days. This tape shows those filings as they're published.

WHAT IT TELLS YOU: insiders buy for one reason — they think the price is going up. They sell for many reasons (diversification, taxes, pre-planned 10b5-1 programs), so clustered BUYING, especially by CEOs and CFOs deploying real money, is the stronger signal. One sale means little; three executives buying in the same week means a lot.

HOW IT RELATES TO CRYPTO: this tape tracks the publicly traded crypto complex — miners (MARA, CLSK), exchanges and brokers (COIN), BTC treasury companies (MSTR), and crypto-adjacent tech. When miners' executives buy their own stock into weakness, they're signaling confidence in operations and in the BTC price that drives them. When they're all selling into strength, take note.`;

// ── main view ───────────────────────────────────────────────────────────────

export const MarketsView: React.FC<MarketsViewProps> = () => {
  const [cot, setCot] = useState<DirectCotRow[]>([]);
  const [btcCot, setBtcCot] = useState<DirectCotRow[]>([]);
  const [insiders, setInsiders] = useState<any[]>([]);
  const [yields, setYields] = useState<DirectYieldCurve | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updated, setUpdated] = useState<Record<string, number>>({});

  const setL = (k: string, v: boolean) => setLoading((p) => ({ ...p, [k]: v }));
  const setE = (k: string, v: string | undefined) =>
    setErrors((p) => {
      const n = { ...p };
      if (v) n[k] = v;
      else delete n[k];
      return n;
    });
  const stamp = (k: string) => setUpdated((p) => ({ ...p, [k]: Date.now() }));

  /** "3m ago" style label for a section's last successful refresh. */
  const ago = (k: string) => {
    const t = updated[k];
    if (!t) return '';
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  // DIRECT: CME Bitcoin futures COT — institutional BTC positioning.
  const loadBtcCot = async () => {
    setL('btc', true);
    setE('btc', undefined);
    try {
      const c = await directService.getCot('BTC');
      setBtcCot(c.rows || []);
      stamp('btc');
    } catch (e: any) {
      setE('btc', e.message);
    } finally {
      setL('btc', false);
    }
  };

  // DIRECT: CFTC Commitments of Traders — no key, no middleman.
  const loadCot = async () => {
    setL('cot', true);
    setE('cot', undefined);
    try {
      const c = await directService.getCot();
      setCot(c.rows || []);
      stamp('cot');
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
      stamp('yld');
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
      stamp('ins');
    } catch (e: any) {
      setE('ins', e.message);
    } finally {
      setL('ins', false);
    }
  };

  useEffect(() => {
    loadBtcCot();
    loadCot();
    loadYields();
    loadInsiders();
    // Auto-refresh: the desk never goes stale. Filings move fastest (5m),
    // yields update daily (15m check), COT is weekly (30m check).
    const tIns = setInterval(loadInsiders, 5 * 60 * 1000);
    const tYld = setInterval(loadYields, 15 * 60 * 1000);
    const tCot = setInterval(() => { loadCot(); loadBtcCot(); }, 30 * 60 * 1000);
    // Re-render the "updated Xs ago" labels every 30s.
    const tAgo = setInterval(() => setUpdated((p) => ({ ...p })), 30 * 1000);
    return () => { clearInterval(tIns); clearInterval(tYld); clearInterval(tCot); clearInterval(tAgo); };
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
            No middleman, no key, no vault. Sections auto-refresh on their own cadence — the desk never goes stale.
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
        explainer={YIELD_EXPLAINER}
        updatedLabel={ago('yld')}
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

      {/* 1b — CME Bitcoin futures COT (ABOVE the broad COT) */}
      <Section
        icon={<Bitcoin className="w-4 h-4" />}
        title="CME BITCOIN FUTURES COT"
        subtitle="Actual institutional BTC positioning — direct from the CFTC, no key"
        accent="text-amber-400"
        onRefresh={loadBtcCot}
        loading={loading.btc}
        explainer={BTC_COT_EXPLAINER}
        updatedLabel={ago('btc')}
      >
        {loading.btc && btcCot.length === 0 ? (
          <LoadingRow label="Reading CME Bitcoin positioning…" />
        ) : errors.btc ? (
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono py-4 justify-center">
            <AlertTriangle className="w-4 h-4" />
            <span>{errors.btc}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {btcCot.map((c) => (
              <DirectCotCard key={c.symbol} row={c} />
            ))}
            {btcCot.length === 0 && <EmptyRow label="No BTC COT rows" />}
          </div>
        )}
        <div className="mt-3 text-[10px] font-mono text-slate-600">
          Source: CFTC Commitments of Traders, CME Bitcoin futures (cftc.gov) · <span className="text-emerald-400 font-bold">DIRECT</span> · updated weekly
        </div>
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
          explainer={COT_EXPLAINER}
          updatedLabel={ago('cot')}
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
          explainer={INSIDER_EXPLAINER}
          updatedLabel={ago('ins')}
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
                  <p className="mt-1.5 text-[10px] font-mono leading-relaxed text-slate-500">
                    Form {p.form} filed {p.filed}: {p.insider} disclosed a change in beneficial ownership of {p.issuer} ({p.ticker}) securities. Section 16 insiders must report within two business days — open-market buys are the stronger bullish signal; sales are often pre-planned.
                  </p>
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

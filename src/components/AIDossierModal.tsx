import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  Copy, 
  FileDown, 
  AlertCircle,
  Key,
  Cpu
} from 'lucide-react';
import { PipelineItem } from '../data/pipelinesData';
import { soundEffects } from '../services/soundEffects';
import { apiVaultService } from '../services/apiVaultService';

interface AIDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'BRIEFING' | 'PIPELINE_FORECAST';
  pipeline?: PipelineItem | null;
  shockMultiplier?: number;
}

export const AIDossierModal: React.FC<AIDossierModalProps> = ({
  isOpen,
  onClose,
  mode,
  pipeline,
  shockMultiplier = 1.0,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [sourceEngine, setSourceEngine] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setData(null);
      setSourceEngine('');

      try {
        const vaultKeys = apiVaultService.getVaultSummaryForRequests();

        if (mode === 'BRIEFING') {
          const res = await fetch('/api/ai/briefing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              category: 'Macro Transmission Squeezes',
              vaultKeys
            }),
          });
          if (res.ok) {
            const json = await res.json();
            setData(json.briefing);
            setSourceEngine(json.source || 'gemini');
          }
        } else if (mode === 'PIPELINE_FORECAST' && pipeline) {
          const res = await fetch('/api/ai/pipeline-forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pipelineName: pipeline.title,
              horizon: pipeline.horizon,
              transmissionSequence: pipeline.transmissionSequence,
              shockMultiplier,
              vaultKeys
            }),
          });
          if (res.ok) {
            const json = await res.json();
            setData(json.forecast);
            setSourceEngine(json.source || 'gemini');
          }
        }
      } catch (e) {
        console.error('AI modal fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, mode, pipeline, shockMultiplier]);

  if (!isOpen) return null;

  const handleCopy = () => {
    soundEffects.playTick();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">
              {mode === 'BRIEFING' ? 'EXECUTIVE CRYPTO &amp; ON-CHAIN INTELLIGENCE DOSSIER' : 'QUANTITATIVE CRYPTO &amp; BLOCKCHAIN ARBITRAGE BRIEF'}
            </span>
            {sourceEngine && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                sourceEngine.includes('gemini') 
                  ? 'bg-cyan-950 border border-cyan-800 text-cyan-300' 
                  : sourceEngine.includes('groq')
                  ? 'bg-amber-950 border border-amber-800 text-amber-300'
                  : sourceEngine.includes('openrouter')
                  ? 'bg-purple-950 border border-purple-800 text-purple-300'
                  : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
              }`}>
                SOURCE: {sourceEngine.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {data && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY MEMO'}</span>
              </button>
            )}
            <button
              onClick={() => {
                soundEffects.playTick();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs text-slate-300">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-slate-300 font-bold">
                SYNTHESIZING ON-CHAIN TRANSMISSION LAG EQUATIONS &amp; TOKEN DATA...
              </p>
              <span className="text-slate-500 text-[11px]">
                Querying quantitative crypto models and server-side intelligence framework
              </span>
            </div>
          ) : data ? (
            mode === 'BRIEFING' ? (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                    {data.classification}
                  </span>
                  <h2 className="text-xl font-bold text-slate-100 mt-2">
                    {data.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">{data.timestamp}</p>
                </div>

                {/* Situation Overview */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-cyan-400 font-bold uppercase tracking-wider">
                    Situational Awareness Summary:
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {data.situationOverview}
                  </p>
                </div>

                {/* Critical Vulnerabilities */}
                <div className="space-y-2">
                  <h4 className="text-red-400 font-bold uppercase tracking-wider">
                    Critical Sovereign Vulnerabilities:
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {data.criticalVulnerabilities?.map((vuln: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2 text-slate-300">
                        <span className="text-red-400">•</span>
                        <span>{vuln}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tactical Opportunities */}
                <div className="space-y-2">
                  <h4 className="text-emerald-400 font-bold uppercase tracking-wider">
                    Tactical Arbitrage Opportunities:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.tacticalArbitrageOpportunities?.map((opp: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-amber-400 font-bold block">{opp.pipeline}</span>
                        <span className="text-slate-200 block font-semibold">{opp.direction}</span>
                        <div className="flex justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800 mt-1">
                          <span>HORIZON: {opp.timeHorizon}</span>
                          <span className="text-cyan-300">{opp.mathForecast}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analyst Note */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                  <span className="text-purple-400 font-bold block mb-1">ANALYST POSITIONING NOTE:</span>
                  <p>{data.analystNote}</p>
                </div>
              </div>
            ) : (
              /* Pipeline Forecast Mode */
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                    EXHAUSTIVE QUANTITATIVE ARBITRAGE REPORT
                  </span>
                  <h2 className="text-xl font-bold text-slate-100 mt-2">
                    {data.pipeline}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    SQUEEZE MULTIPLIER: {shockMultiplier.toFixed(2)}x
                  </p>
                </div>

                {/* Key Price Targets Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">BEST ENTRY RANGE</span>
                    <span className="text-cyan-300 font-bold text-sm">{data.recommendedEntryRange}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">EXIT TARGET</span>
                    <span className="text-emerald-400 font-bold text-sm">{data.recommendedExitTarget} (+{data.expectedReturnPct}%)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">STOP-LOSS LEVEL</span>
                    <span className="text-rose-400 font-bold text-sm">{data.recommendedStopLoss}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">RISK:REWARD</span>
                    <span className="text-amber-400 font-bold text-sm">{data.riskRewardRatio}</span>
                  </div>
                </div>

                {/* Mathematics of Forecasted Prices */}
                <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                    <Calculator className="w-4 h-4" />
                    <span>MATHEMATICS OF FORECASTED PRICES:</span>
                  </div>
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 text-amber-300 overflow-x-auto text-center font-bold">
                    {data.mathematicalFormula}
                  </div>
                  <div className="space-y-1 pl-2 border-l-2 border-cyan-500/40 text-slate-300 text-[11px]">
                    {data.mathDerivation?.map((step: string, idx: number) => (
                      <div key={idx}>{step}</div>
                    ))}
                  </div>
                </div>

                {/* Ticker Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-slate-300 font-bold uppercase tracking-wider">
                    Affected Crypto Assets &amp; Relative Expected Move:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>STRUCTURAL LONGS (BENEFICIARIES)</span>
                      </span>
                      {data.affectedTickers?.long?.map((t: any) => (
                        <div key={t.ticker} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-200">{t.ticker} ({t.name})</span>
                          <span className="text-emerald-400 font-bold">{t.expectedMove}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-2">
                      <span className="text-rose-400 font-bold flex items-center space-x-1">
                        <TrendingDown className="w-4 h-4" />
                        <span>STRUCTURAL SHORTS (EXPOSED)</span>
                      </span>
                      {data.affectedTickers?.short?.map((t: any) => (
                        <div key={t.ticker} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-200">{t.ticker} ({t.name})</span>
                          <span className="text-rose-400 font-bold">{t.expectedMove}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Historical Precedents */}
                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block text-[11px]">HISTORICAL PRECEDENTS &amp; REGRESSION WEIGHT:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {data.historicalPrecedents?.map((hp: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                        <span className="text-slate-300 block font-semibold">{hp.event}</span>
                        <div className="flex justify-between text-slate-400 mt-1">
                          <span>Correlation: {hp.correlation}</span>
                          <span className="text-amber-400">{hp.impactObserved}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="py-12 text-center text-slate-400">
              No data returned.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

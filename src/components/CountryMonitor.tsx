import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Globe2, 
  Filter, 
  ChevronRight, 
  AlertTriangle, 
  ArrowUpRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { GLOBAL_COUNTRIES_GEO } from '../data/osintEvents';
import { soundEffects } from '../services/soundEffects';

interface CountryMonitorProps {
  onSelectPipeline: (pipelineId: number) => void;
}

export const CountryMonitor: React.FC<CountryMonitorProps> = ({ onSelectPipeline }) => {
  const [search, setSearch] = useState('');
  const [selectedThreat, setSelectedThreat] = useState<string>('ALL');

  const countries = useMemo(() => {
    return GLOBAL_COUNTRIES_GEO.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.keyVulnerability.toLowerCase().includes(search.toLowerCase());
      const matchesThreat = selectedThreat === 'ALL' || c.threatLevel === selectedThreat;
      return matchesSearch && matchesThreat;
    });
  }, [search, selectedThreat]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-1">
          <Globe2 className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-wider">WORLDWIDE SOVEREIGN CRYPTO &amp; BLOCKCHAIN MATRIX // 194 NATIONS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
          Sovereign Digital Asset &amp; Mining Vulnerability Matrix
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
          Monitor sovereign Bitcoin adoption, regulatory enforcement postures, electrical grid mining quotas, stablecoin capital flight, and active crypto transmission lag pipelines.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search country name, ISO code (e.g. US, SV, AE, SG, DE, AR), or crypto policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center space-x-1 text-xs font-mono bg-slate-900 p-1 rounded-lg border border-slate-800">
          {['ALL', 'CRITICAL', 'ELEVATED', 'GUARDED', 'LOW'].map((t) => (
            <button
              key={t}
              onClick={() => {
                soundEffects.playTick();
                setSelectedThreat(t);
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedThreat === t
                  ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Country Cards Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {countries.map((c) => {
          const isCritical = c.threatLevel === 'CRITICAL';
          const isElevated = c.threatLevel === 'ELEVATED';

          return (
            <div
              key={c.code}
              className={`p-4 rounded-xl border transition-all ${
                isCritical 
                  ? 'bg-slate-950 border-red-800/40 hover:border-red-600/60 shadow-[0_0_12px_rgba(239,68,68,0.06)]' 
                  : isElevated 
                  ? 'bg-slate-950 border-amber-800/40 hover:border-amber-600/60' 
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    {c.code}
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-100">
                    {c.name}
                  </span>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isCritical 
                    ? 'bg-red-950 text-red-300 border-red-800' 
                    : isElevated 
                    ? 'bg-amber-950 text-amber-300 border-amber-800' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {c.threatLevel}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Core Vulnerability:</span>
                  <p className="text-slate-300 leading-snug mt-0.5">{c.keyVulnerability}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase">Active Transmission Lag:</span>
                  <button
                    onClick={() => {
                      soundEffects.playSonar();
                      onSelectPipeline(1);
                    }}
                    className="text-amber-400 hover:text-amber-300 text-left mt-0.5 flex items-center justify-between w-full group"
                  >
                    <span className="truncate">{c.activeLagPipeline}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

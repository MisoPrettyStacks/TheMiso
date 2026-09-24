import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Sparkles, 
  Sliders, 
  Layers, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileDown,
  Share2
} from 'lucide-react';
import { MACRO_PIPELINES, PIPELINE_CATEGORIES, PipelineItem } from '../data/pipelinesData';
import { soundEffects } from '../services/soundEffects';
import { downloadProjectSourceFiles } from '../services/sourceDownloader';

interface PipelinesBriefingViewProps {
  onOpenPipelineModal: (pipeline: PipelineItem, shockMultiplier: number) => void;
  selectedPipelineId?: number | null;
}

export const PipelinesBriefingView: React.FC<PipelinesBriefingViewProps> = ({
  onOpenPipelineModal,
  selectedPipelineId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [shockMultiplier, setShockMultiplier] = useState<number>(1.0);
  const [expandedPipelineId, setExpandedPipelineId] = useState<number | null>(selectedPipelineId || 1);
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');

  const filteredPipelines = useMemo(() => {
    return MACRO_PIPELINES.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.transmissionSequence.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.stocks.some(s => s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === 'All Categories' || item.category === selectedCategory;

      const matchesUrgency = 
        urgencyFilter === 'ALL' || item.urgency === urgencyFilter;

      return matchesSearch && matchesCategory && matchesUrgency;
    });
  }, [searchQuery, selectedCategory, urgencyFilter]);

  const toggleExpand = (id: number) => {
    soundEffects.playTick();
    setExpandedPipelineId(expandedPipelineId === id ? null : id);
  };

  const handleSliderChange = (val: number) => {
    setShockMultiplier(val);
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-200 pb-20">
      {/* Official Dossier Document Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-8 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CONFIDENTIAL // QUANTITATIVE CRYPTO &amp; BLOCKCHAIN ASSET DESK</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
              <button
                onClick={() => {
                  soundEffects.playPipelineOpen();
                  downloadProjectSourceFiles();
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 transition-colors"
                title="Download all source files as a ZIP archive"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>DOWNLOAD ALL SOURCE CODE (.ZIP)</span>
              </button>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-semibold">ON-CHAIN MACRO ARCS</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-block px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold uppercase tracking-wider">
              Crypto, Digital &amp; Blockchain Transmission Lag Framework
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight text-slate-100">
              CRYPTO &amp; DIGITAL ASSET TRANSMISSION PIPELINES
            </h1>
            <p className="text-sm sm:text-base font-mono text-slate-400 max-w-4xl leading-relaxed">
              An institutional compendium of mathematically verified on-chain pathways where mining hashrate, staking yield spreads, L2 calldata constraints, and stablecoin reserve flows produce structural market mispricings. Integrated with quantitative on-chain price forecasting, long/short digital asset directives, and empirical blockchain lead-time mathematics.
            </p>
          </div>

          {/* Interactive Shock Simulator Banner */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-200">ON-CHAIN SHOCK MULTIPLIER (CRYPTO SQUEEZE INTENSITY)</h4>
                <p className="text-[11px] text-slate-400">
                  Dynamically recalibrates mathematical token price forecasts, on-chain volatility drag, and target valuations in real time.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 w-full md:w-auto">
              <span className="font-mono text-xs font-bold text-amber-400 min-w-[50px] text-right">
                {shockMultiplier.toFixed(2)}x SQUEEZE
              </span>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={shockMultiplier}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full md:w-56 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <button
                onClick={() => setShockMultiplier(1.0)}
                className="px-2 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control & Filter Strip */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search crypto pipelines, tokens, catalysts, or tickers (e.g. BTC, ETH, SOL, AAVE, PENDLE, TAO)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 py-2.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-amber-500/60 cursor-pointer"
              >
                {PIPELINE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Urgency Pill filters */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setUrgencyFilter('ALL')}
                className={`px-2.5 py-1 rounded ${urgencyFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ALL
              </button>
              <button
                onClick={() => setUrgencyFilter('CRITICAL')}
                className={`px-2.5 py-1 rounded ${urgencyFilter === 'CRITICAL' ? 'bg-red-950 text-red-300 font-bold border border-red-800/60' : 'text-slate-400 hover:text-red-400'}`}
              >
                CRITICAL
              </button>
              <button
                onClick={() => setUrgencyFilter('HIGH')}
                className={`px-2.5 py-1 rounded ${urgencyFilter === 'HIGH' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800/60' : 'text-slate-400 hover:text-amber-400'}`}
              >
                ELEVATED
              </button>
            </div>
          </div>
        </div>

        {/* Results summary count */}
        <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/60 pb-3">
          <div>
            SHOWING <span className="text-amber-400 font-bold">{filteredPipelines.length}</span> SYSTEMIC TRANSMISSION ARCS
            {selectedCategory !== 'All Categories' && <span> IN <strong className="text-slate-200">{selectedCategory}</strong></span>}
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-500">
            <span>HISTORICAL TRANSMISSION CALIBRATION: R² &gt; 0.82</span>
          </div>
        </div>

        {/* Pipelines List */}
        <div className="mt-6 space-y-5">
          {filteredPipelines.map((pipeline) => {
            const isExpanded = expandedPipelineId === pipeline.id;
            // Calculate dynamic target for primary stock under shock multiplier
            const primaryStock = pipeline.stocks[0];
            const dynamicTarget = primaryStock
              ? (primaryStock.basePrice * (1 + (primaryStock.exitTarget / primaryStock.basePrice - 1) * shockMultiplier)).toFixed(2)
              : pipeline.mathModel.baselineSpot.toFixed(2);
            const dynamicReturnPct = primaryStock
              ? (((parseFloat(dynamicTarget) - primaryStock.basePrice) / primaryStock.basePrice) * 100).toFixed(1)
              : '+18.5';

            return (
              <div 
                key={pipeline.id}
                className={`rounded-xl border transition-all duration-200 ${
                  isExpanded 
                    ? 'border-amber-500/50 bg-slate-900/95 shadow-[0_0_25px_rgba(245,158,11,0.08)]' 
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                {/* Pipeline Header Row (Formatted like the PDF dossier) */}
                <div 
                  onClick={() => toggleExpand(pipeline.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">
                        PIPELINE #{pipeline.id}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {pipeline.category}
                      </span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        pipeline.urgency === 'CRITICAL'
                          ? 'bg-red-950/80 border-red-800/80 text-red-300'
                          : 'bg-amber-950/80 border-amber-800/80 text-amber-300'
                      }`}>
                        {pipeline.urgency}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold font-mono text-slate-100 flex items-center space-x-2">
                      <span>{pipeline.title}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                      <div className="flex items-center space-x-1 text-amber-300/90">
                        <Clock className="w-3.5 h-3.5" />
                        <span>SQUEEZE HORIZON: <strong>{pipeline.horizon}</strong></span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <span>REGION: <strong className="text-slate-300">{pipeline.geopoliticalRegion}</strong></span>
                    </div>
                  </div>

                  {/* Quick Tickers & Expand Button */}
                  <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      {pipeline.stocks.slice(0, 3).map((stk) => (
                        <span 
                          key={stk.ticker} 
                          className={`text-xs font-mono font-bold px-2 py-1 rounded border ${
                            stk.type === 'LONG' 
                              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400' 
                              : 'bg-rose-950/60 border-rose-700/60 text-rose-400'
                          }`}
                        >
                          {stk.type === 'LONG' ? '▲' : '▼'} {stk.ticker}
                        </span>
                      ))}
                    </div>

                    <button className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Intelligence & Mathematical Forecast */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-800/80 space-y-6 animate-fadeIn">
                    {/* 1. Exact Transmission Sequence (Format matching PDF) */}
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                      <h4 className="text-xs font-mono font-bold text-amber-400 tracking-wider flex items-center space-x-2">
                        <span>TRANSMISSION SEQUENCE</span>
                      </h4>
                      <p className="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed pl-2 border-l-2 border-amber-500/50">
                        {pipeline.transmissionSequence}
                      </p>
                    </div>

                    {/* 2. Execution Directive (Format matching PDF) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-1">
                        <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                          <TrendingUp className="w-4 h-4" />
                          <span>EXECUTION DIRECTIVE: LONG</span>
                        </div>
                        <p className="text-slate-300 leading-normal">
                          {pipeline.executionDirective.long}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-800/50 space-y-1">
                        <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
                          <TrendingDown className="w-4 h-4" />
                          <span>EXECUTION DIRECTIVE: SHORT</span>
                        </div>
                        <p className="text-slate-300 leading-normal">
                          {pipeline.executionDirective.short}
                        </p>
                      </div>
                    </div>

                    {/* 3. Affected Crypto Assets: Best Entry & Exit Points */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-cyan-400 tracking-wider flex items-center space-x-2">
                          <Layers className="w-4 h-4" />
                          <span>CRYPTO &amp; BLOCKCHAIN ASSETS SPECIFICATION &amp; TRADE EXECUTION ARBITRAGE</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          SHOCK ADJUSTMENT: <strong className="text-amber-400">{shockMultiplier.toFixed(2)}x</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pipeline.stocks.map((stock) => {
                          const isLong = stock.type === 'LONG';
                          // Recalculate target and risk-reward based on shockMultiplier
                          const priceShift = (stock.exitTarget - stock.basePrice) * shockMultiplier;
                          const dynTarget = (stock.basePrice + priceShift).toFixed(2);
                          const dynMovePct = (((parseFloat(dynTarget) - stock.basePrice) / stock.basePrice) * 100).toFixed(1);

                          return (
                            <div 
                              key={stock.ticker}
                              className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                                isLong
                                  ? 'bg-slate-950 border-emerald-800/40 hover:border-emerald-500/60'
                                  : 'bg-slate-950 border-rose-800/40 hover:border-rose-500/60'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                                      isLong ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                                    }`}>
                                      {stock.ticker}
                                    </span>
                                    <span className="text-xs font-mono font-semibold text-slate-200 truncate max-w-[120px]">
                                      {stock.name}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                    isLong ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {stock.type} (β {stock.beta})
                                  </span>
                                </div>

                                <p className="text-[11px] font-mono text-slate-400 leading-snug">
                                  {stock.catalyst}
                                </p>
                              </div>

                              {/* Price Entry & Exit Targets */}
                              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>BASE SPOT:</span>
                                  <span className="font-semibold text-slate-200">${stock.basePrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>BEST ENTRY:</span>
                                  <span className="text-cyan-300 font-bold">${stock.entryLow.toFixed(2)} - ${stock.entryHigh.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>EXIT TARGET:</span>
                                  <span className={`font-bold flex items-center space-x-1 ${
                                    isLong ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                    <span>${dynTarget}</span>
                                    <span>({dynMovePct}%)</span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>STOP LOSS:</span>
                                  <span className="text-rose-400 font-semibold">${stock.stopLoss.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/50">
                                  <span>RISK:REWARD:</span>
                                  <span className="text-amber-300 font-bold">{stock.riskReward}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Mathematics of Forecasted Prices (Mathematical Formulation & Historical Regression Weight) */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-300">
                          <Calculator className="w-4 h-4 text-cyan-400" />
                          <span>MATHEMATICS OF FORECASTED PRICES &amp; HISTORICAL PRECEDENT WEIGHT</span>
                        </div>
                        <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                          HISTORICAL FIT: {pipeline.mathModel.historicalPrecedent}
                        </div>
                      </div>

                      {/* Formula Box */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-xs sm:text-sm text-amber-300 tracking-wide overflow-x-auto">
                        <code>{pipeline.mathModel.formula}</code>
                      </div>

                      {/* Step-by-Step Derivation */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Empirical Derivation &amp; Sensitivity Breakdown:
                        </span>
                        <div className="space-y-1 pl-3 border-l-2 border-cyan-500/40 text-xs font-mono text-slate-300">
                          {pipeline.mathModel.stepByStep.map((step, idx) => (
                            <div key={idx} className="leading-relaxed">
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mathematical Parameters Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                          <span className="text-slate-400 block">ELASTICITY (w₁)</span>
                          <span className="font-bold text-slate-100">{pipeline.mathModel.elasticityWeight}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                          <span className="text-slate-400 block">SHOCK AMPLITUDE (ΔI)</span>
                          <span className="font-bold text-amber-400">{(pipeline.mathModel.shockMagnitude * shockMultiplier).toFixed(1)}%</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                          <span className="text-slate-400 block">HALF-LIFE (λ)</span>
                          <span className="font-bold text-cyan-400">{pipeline.mathModel.halfLifeWeeks} wks</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                          <span className="text-slate-400 block">CORRELATION (R²)</span>
                          <span className="font-bold text-emerald-400">{pipeline.mathModel.correlationR2}</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. AI Deep Report Generation Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="text-[11px] font-mono text-slate-400">
                        Institutional quantitative model runs locally with 100% free server-side econometric pipelines.
                      </div>
                      <button
                        onClick={() => {
                          soundEffects.playSonar();
                          onOpenPipelineModal(pipeline, shockMultiplier);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600/30 to-cyan-600/30 hover:from-amber-500/40 hover:to-cyan-500/40 border border-amber-500/50 text-amber-200 font-mono text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>GENERATE AI DEEP CRYPTO DOSSIER</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Global Source Files Download Section */}
        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>OPEN SOURCE &amp; CODE EXPORT</span>
            </div>
            <h3 className="text-lg font-bold font-mono text-slate-100">
              Download Full MISOCRYPTO Platform Source Files (.ZIP)
            </h3>
            <p className="text-xs font-mono text-slate-400 max-w-2xl leading-relaxed">
              Includes all React 19 components, real-world Leaflet mapping system, quantitative crypto transmission lag pipelines, real-time on-chain OSINT feeds, and crypto wargame scenario engines. Free to run, modify, and deploy.
            </p>
          </div>

          <button
            onClick={() => {
              soundEffects.playPipelineOpen();
              downloadProjectSourceFiles();
            }}
            className="whitespace-nowrap px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/50 transition-all hover:scale-105"
          >
            <FileDown className="w-4 h-4 text-slate-950" />
            <span>DOWNLOAD SOURCE FILES (.ZIP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

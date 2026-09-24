import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Flame, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ChevronRight,
  ShieldAlert,
  Play,
  Sliders,
  Key
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { apiVaultService } from '../services/apiVaultService';

interface ScenarioSimulatorProps {
  onSelectPipeline: (pipelineId: number) => void;
}

const PRESET_SCENARIOS = [
  {
    title: "Texas ERCOT Deep Freeze: 3.5 GW Bitcoin Hashrate Emergency Load Shedding",
    details: "Freezing grid reserves trigger emergency 4CP demand response, shutting down 120 EH/s of North American BTC hashrate. Block intervals stretch to 14.5 minutes, mempool fills with 280,000 txs, and miner treasury selling begins.",
    defaultLevel: 4
  },
  {
    title: "Global ISO 20022 Interbank Settlement Migration & ODL Nostro Squeeze ($XRP, $XLM, $XDC)",
    details: "Swift pacs.008 mandate deadline causes tier-2 regional banks to face nostro liquidity freeze. Financial institutions divert $24B in daily cross-border flows into XRP Ledger ODL and Stellar Soroban liquidity corridors.",
    defaultLevel: 4
  },
  {
    title: "Latin America Sovereign Hyperinflation & Decentralized Dollar Flight ($RSR, $AAVE, $MKR)",
    details: "Rapid currency devaluation in Argentina and Colombia sparks an unprecedented surge in peer-to-peer dollar RToken mints. Staked RSR overcollateralization auctions surge while Aave lending rates spike to 14%.",
    defaultLevel: 5
  },
  {
    title: "Autonomous AI Software Agent Compute Swarm & Pay-per-Token Inference ($FET, $TAO, $RENDER)",
    details: "Enterprise multi-agent AI swarms saturate decentralized GPU clusters with 10M daily pay-per-token micro-transactions. Traditional bank payment rails fail on latency, forcing 100% on-chain settlement on the ASI Alliance network.",
    defaultLevel: 4
  },
  {
    title: "EU AMLR & MiCA Travel Rule Enforcement: Zero-Knowledge Proof-of-Innocence (POI) Migration",
    details: "European VASPs freeze unhosted wallet transfers lacking cryptographic verification. Institutional capital routes into compliant ZK-SNARK identity and Proof-of-Innocence layers (Polygon zkEVM, Mina, ZKsync).",
    defaultLevel: 4
  },
  {
    title: "Tier-1 Liquid Restaking AVS Slashing Anomaly & Lending Bad Debt Cascade",
    details: "A critical consensus slashing bug depegs ezETH and eETH by 4.5% on Curve pools. Automated liquidation bots on Aave trigger cascading debt auctions across $380M in levered loop collateral.",
    defaultLevel: 5
  },
  {
    title: "Offshore Dollar Stablecoin Custody Freeze & Cross-Chain Bridge Lockup",
    details: "Regulatory inquiries into non-bank offshore reserves spark whale flight from USDT into USDC and DAI. Curve 3pool ratio skews past 75% while cross-chain bridge collateral liquidity dries up.",
    defaultLevel: 4
  },
  {
    title: "Ethereum EIP-4844 Blob Space Exhaustion & L2 Sequencer Margin Squeeze",
    details: "Inscriptions and high-frequency rollup data spam saturate Ethereum blob capacity. Blob base fees surge 1,000x, forcing L2 execution gas fees up 30x and halving micro-transaction throughput.",
    defaultLevel: 3
  },
  {
    title: "Global Enterprise GPU Foundry Rationing: DePIN Crypto AI Capacity Squeeze",
    details: "TSMC CoWoS packaging bottlenecks cut commercial cloud GPU allocations by 40%. AI startups migrate batch inference workloads to decentralized compute networks, driving 5x token staking volume.",
    defaultLevel: 4
  }
];

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ onSelectPipeline }) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [customTitle, setCustomTitle] = useState(PRESET_SCENARIOS[0].title);
  const [customDetails, setCustomDetails] = useState(PRESET_SCENARIOS[0].details);
  const [escalationLevel, setEscalationLevel] = useState<number>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulationSource, setSimulationSource] = useState<string>('');

  const handleSelectPreset = (idx: number) => {
    soundEffects.playTick();
    setSelectedPreset(idx);
    setCustomTitle(PRESET_SCENARIOS[idx].title);
    setCustomDetails(PRESET_SCENARIOS[idx].details);
    setEscalationLevel(PRESET_SCENARIOS[idx].defaultLevel);
  };

  const runSimulation = async () => {
    setIsLoading(true);
    soundEffects.playSonar();
    try {
      const vaultKeys = apiVaultService.getVaultSummaryForRequests();
      const res = await fetch('/api/ai/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitle: customTitle,
          scenarioDetails: customDetails,
          escalationLevel,
          vaultKeys
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data.simulation);
        setSimulationSource(data.source || 'gemini');
      }
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 mb-1">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span className="font-bold tracking-wider">CRYPTO &amp; BLOCKCHAIN WAR-GAME &amp; SHOCK SIMULATOR</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
          On-Chain Domino Escalation Lab
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
          Test sovereign and protocol shocks, simulate cascading domino effects across DeFi liquidity pools, mining grids, and L1/L2 networks, and project token price deviations.
        </p>
      </div>

      {/* Preset Scenario Cards */}
      <div className="mt-6">
        <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-3">
          Select Strategic Scenario Preset:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_SCENARIOS.map((scenario, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectPreset(idx)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedPreset === idx
                  ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <h4 className="text-xs font-mono font-bold text-slate-200 line-clamp-1">
                {scenario.title}
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mt-1.5 line-clamp-2">
                {scenario.details}
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                <span className="text-purple-300 font-bold">STAGE {scenario.defaultLevel}/5</span>
                <span className="text-slate-500">CLICK TO LOAD</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Scenario Configurator */}
      <div className="mt-8 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Scenario Headline / Event:
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Escalation Parameters &amp; Details:
          </label>
          <textarea
            rows={3}
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Severity Slider */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-slate-300">
              ESCALATION TIER (1 - 5):
            </span>
            <div className="text-[11px] font-mono text-amber-400">
              {escalationLevel === 5 ? 'STAGE 5: COMPLETE SYSTEMIC DISLOCATION' : `STAGE ${escalationLevel}: ELEVATED ASYMMETRIC FRICTION`}
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={escalationLevel}
              onChange={(e) => setEscalationLevel(parseInt(e.target.value, 10))}
              className="w-full sm:w-48 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="font-mono text-sm font-bold text-purple-400 min-w-[30px] text-center">
              {escalationLevel}/5
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={runSimulation}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>PROCESSING SYSTEMIC DOMINO EQUATIONS...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>EXECUTE AI WAR-ROOM SIMULATION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Result Dossier */}
      {simulationResult && (
        <div className="mt-8 p-6 rounded-xl bg-slate-950 border border-purple-500/40 space-y-6 animate-fadeIn">
          <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                  WARGAME SIMULATION OUTPUT
                </span>
                {simulationSource && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                    simulationSource.includes('gemini')
                      ? 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                      : simulationSource.includes('groq')
                      ? 'bg-amber-950 border border-amber-800 text-amber-300'
                      : simulationSource.includes('openrouter')
                      ? 'bg-purple-950 border border-purple-800 text-purple-300'
                      : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                  }`}>
                    SOURCE: {simulationSource.replace('_', ' ')}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold font-mono text-slate-100 mt-2">
                {simulationResult.scenario}
              </h2>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="text-slate-400 block">SEVERITY LEVEL</span>
              <span className="text-red-400 font-bold">{simulationResult.escalationStage}</span>
            </div>
          </div>

          {/* Timeline Progression */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Cascading Transmission Timeline:</span>
            </h4>
            <div className="space-y-2.5">
              {simulationResult.timelineProgression.map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-slate-800 text-amber-300 font-bold whitespace-nowrap min-w-[130px]">
                    {item.phase}
                  </span>
                  <span className="text-slate-300 leading-relaxed">
                    {item.event}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Projected Asset Price Swings */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Projected Asset Price Swings:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              {simulationResult.projectedAssetSwings.map((asset: any, idx: number) => {
                const isPositive = asset.projectedChange.startsWith('+');
                return (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block truncate">{asset.asset}</span>
                    <span className={`text-base font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.projectedChange}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Confidence: {asset.confidence}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activated Transmission Lag Pipelines */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Activated Systemic Transmission Pipelines:
            </h4>
            <div className="space-y-2">
              {simulationResult.transmissionPipelinesActivated.map((pipeName: string, idx: number) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono hover:border-emerald-500/50 transition-colors"
                >
                  <span className="text-slate-200">{pipeName}</span>
                  <button 
                    onClick={() => {
                      soundEffects.playSonar();
                      onSelectPipeline(1);
                    }}
                    className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 whitespace-nowrap pl-4"
                  >
                    <span>View Crypto &amp; Math</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Advice */}
          <div className="p-4 rounded-lg bg-slate-900 border border-purple-500/30 text-xs font-mono">
            <span className="font-bold text-purple-300 uppercase block mb-1">Analyst Positioning Directive:</span>
            <p className="text-slate-300 leading-relaxed">
              {simulationResult.analystTakeaways}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

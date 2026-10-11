export interface OsintEvent {
  id: string;
  title: string;
  category: 'Mining & Energy' | 'DeFi & Protocol' | 'Sovereign & Regulatory' | 'Infrastructure & MEV' | 'Crypto AI & Compute' | 'Stablecoin & Liquidity' | 'ETF & Institutional' | 'Trade Finance & Logistics' | 'Natural Disaster';
  sourceType: 'PRIMARY' | 'SECONDARY';
  country: string;
  region: string;
  lat: number;
  lon: number;
  timestamp: string;
  tier: 'CRITICAL' | 'ELEVATED' | 'ADVISORY' | 'INFORMATIONAL';
  source: string;
  sourceUrl?: string;
  rawTelemetry?: string;
  summary: string;
  affectedTickers: string[];
  pipelineId?: number;
  pipelineRef?: string;
  verified: boolean;
}

export const STRATEGIC_CHOKEPOINTS = [
  {
    name: "Texas ERCOT Mining Grid",
    lat: 31.96,
    lon: -99.90,
    dailyFlow: "3.5 GW Bitcoin Mining Capacity (~28% of global BTC hashrate)",
    status: "CRITICAL LOAD WATCH",
    delayAvg: "+18 min Block Intervals (during load shedding)",
    primaryThreat: "Winter freeze & summer peak demand emergency grid curtailment mandates",
    pipelineRef: "Pipeline 1: Bitcoin Hashrate Regional Grid Curtailment -> Miner Treasury Depletion Lag",
    pipelineId: 1
  },
  {
    name: "Ethereum Validator Node Basin (Ashburn & Frankfurt)",
    lat: 39.04,
    lon: -77.48,
    dailyFlow: "1.05M Active Validators ($118B staked ETH value)",
    status: "NORMAL // HIGH CONCENTRATION",
    delayAvg: "< 12 sec Slot Time",
    primaryThreat: "Cloud provider (AWS / Hetzner) geographic hosting clustering and ISP route de-peering",
    pipelineRef: "Pipeline 2: EigenLayer AVS Slashing Anomaly -> LRT Depeg -> DeFi Liquidation",
    pipelineId: 2
  },
  {
    name: "Solana RPC & Jito MEV Relay Conduit",
    lat: 50.11,
    lon: 8.68,
    dailyFlow: "2,800 TPS Average + 65,000 Peak Compute Units",
    status: "ELEVATED CONGESTION",
    delayAvg: "+250ms Slot Propagation",
    primaryThreat: "DEX priority auction spam & validator leader memory pool saturation",
    pipelineRef: "Pipeline 5: Solana MEV Priority Fee Auction Wars -> DEX Congestion",
    pipelineId: 5
  },
  {
    name: "TSMC Hsinchu Crypto ASIC Foundry",
    lat: 24.78,
    lon: 120.99,
    dailyFlow: "94% of Global Next-Gen 3nm/4nm Bitcoin ASIC and AI GPU Wafers",
    status: "HIGH GEOPOLITICAL FRICTION",
    delayAvg: "+6 Months Foundry Lead Time",
    primaryThreat: "Cross-strait military exercises and advanced semiconductor lithography export controls",
    pipelineRef: "Pipeline 6: Enterprise GPU Allocation Squeeze -> Decentralized Compute Token Rationing",
    pipelineId: 6
  },
  {
    name: "Curve 3pool & Ethena USDe Collateral Basin",
    lat: 47.37,
    lon: 8.54,
    dailyFlow: "$4.2B Daily On-Chain Stablecoin Liquidity & Collateral Settlement",
    status: "PEG MONITORING",
    delayAvg: "Instant Arbitrage Rebalance",
    primaryThreat: "Whale de-risking, negative perpetual funding spreads, and algorithmic invariant drain",
    pipelineRef: "Pipeline 3: Offshore Stablecoin Custody Friction -> Curve 3pool Skew",
    pipelineId: 3
  },
  {
    name: "Subsea Inter-Validator Transatlantic Fiber Cables",
    lat: 44.50,
    lon: -35.00,
    dailyFlow: "Over 80% of Transatlantic High-Frequency Crypto Cross-DEX Arbitrage Packets",
    status: "LATENCY OPTIMIZED",
    delayAvg: "+38ms RTT (during physical cable detours)",
    primaryThreat: "Deep-sea fiber cuts and seismic shelf disruptions elevating cross-CEX latency arbitrage",
    pipelineRef: "Pipeline 8: Spot Bitcoin ETF T+1 Window -> Weekend CME Gap & Binance Funding Arbitrage",
    pipelineId: 8
  },
  {
    name: "Tether Deltec & Cantor Reserve Nexus",
    lat: 25.04,
    lon: -77.39,
    dailyFlow: "$120B+ Liquid US Treasury Bills & Reverse Repo Custodial Backing",
    status: "AUDIT SCRUTINY",
    delayAvg: "T+1 Redemption Window",
    primaryThreat: "Federal sovereign banking regulations and non-bank stablecoin reserve compliance friction",
    pipelineRef: "Pipeline 3: Offshore Stablecoin Custody Friction -> Curve 3pool Skew",
    pipelineId: 3
  }
];

export const GLOBAL_COUNTRIES_GEO: { 
  code: string; 
  name: string; 
  lat: number; 
  lon: number; 
  threatLevel: 'CRITICAL' | 'ELEVATED' | 'GUARDED' | 'LOW'; 
  keyVulnerability: string; 
  activeLagPipeline: string 
}[] = [
  { 
    code: "US", 
    name: "United States", 
    lat: 37.09, 
    lon: -95.71, 
    threatLevel: "GUARDED", 
    keyVulnerability: "SEC 5-year Tokenized Securities exemption, CFTC KalshiEX review, Texas ERCOT mining grid stability, and spot ETF creation settlement windows", 
    activeLagPipeline: "Pipeline 8: Spot Bitcoin ETF T+1 Window -> Weekend CME Gap" 
  },
  { 
    code: "SV", 
    name: "El Salvador", 
    lat: 13.79, 
    lon: -88.89, 
    threatLevel: "LOW", 
    keyVulnerability: "Sovereign Bitcoin treasury reserve volatility and geothermal volcano mining infrastructure expansion", 
    activeLagPipeline: "Pipeline 1: Bitcoin Hashrate Regional Grid Curtailment -> Miner Treasury Depletion Lag" 
  },
  { 
    code: "AE", 
    name: "United Arab Emirates", 
    lat: 23.42, 
    lon: 53.84, 
    threatLevel: "LOW", 
    keyVulnerability: "VARA institutional licensing demand outstripping compliance capacity; global web3 capital flight hub", 
    activeLagPipeline: "Pipeline 3: Offshore Stablecoin Custody Friction -> Curve 3pool Skew" 
  },
  { 
    code: "CH", 
    name: "Switzerland", 
    lat: 46.81, 
    lon: 8.22, 
    threatLevel: "LOW", 
    keyVulnerability: "Zug Crypto Valley banking integration with FINMA digital asset custody regulations", 
    activeLagPipeline: "Pipeline 7: US Treasury Yield Inversion -> Tokenized T-Bill Flight" 
  },
  { 
    code: "SG", 
    name: "Singapore", 
    lat: 1.35, 
    lon: 103.81, 
    threatLevel: "LOW", 
    keyVulnerability: "MAS Project Guardian institutional tokenization standards vs strict retail leverage prohibitions", 
    activeLagPipeline: "Pipeline 7: US Treasury Yield Inversion -> Tokenized T-Bill Flight" 
  },
  { 
    code: "HK", 
    name: "Hong Kong", 
    lat: 22.31, 
    lon: 114.16, 
    threatLevel: "GUARDED", 
    keyVulnerability: "SFC licensed retail digital asset exchanges acting as capital conduit for Asian institutional wealth", 
    activeLagPipeline: "Pipeline 8: Spot Bitcoin ETF T+1 Window -> Weekend CME Gap" 
  },
  { 
    code: "DE", 
    name: "Germany", 
    lat: 51.16, 
    lon: 10.45, 
    threatLevel: "GUARDED", 
    keyVulnerability: "BaFin crypto custody licensing enforcement and Frankfurt Ethereum validator node concentration", 
    activeLagPipeline: "Pipeline 2: EigenLayer AVS Slashing Anomaly -> LRT Depeg" 
  },
  { 
    code: "AR", 
    name: "Argentina", 
    lat: -38.41, 
    lon: -63.61, 
    threatLevel: "CRITICAL", 
    keyVulnerability: "Hyperinflationary currency flight into peer-to-peer USDT stablecoins; informal blue-dollar crypto liquidity reliance", 
    activeLagPipeline: "Pipeline 3: Offshore Stablecoin Custody Friction -> Curve 3pool Skew" 
  },
  { 
    code: "NG", 
    name: "Nigeria", 
    lat: 9.08, 
    lon: 8.67, 
    threatLevel: "CRITICAL", 
    keyVulnerability: "World's highest per-capita P2P crypto velocity bypassing central bank foreign exchange capital controls; Naira inflation hedging via decentralized dollar RTokens", 
    activeLagPipeline: "Pipeline 12: Latin America Sovereign Currency Flight -> RToken Overcollateralization Burn" 
  },
  { 
    code: "CN", 
    name: "China", 
    lat: 35.86, 
    lon: 104.19, 
    threatLevel: "ELEVATED", 
    keyVulnerability: "State crypto trading bans coexisting with massive underground OTC clearing desks and ASIC manufacturing dominance", 
    activeLagPipeline: "Pipeline 6: Enterprise GPU Allocation Squeeze -> Decentralized Compute Token Rationing" 
  },
  { 
    code: "KZ", 
    name: "Kazakhstan", 
    lat: 48.01, 
    lon: 66.92, 
    threatLevel: "ELEVATED", 
    keyVulnerability: "Coal-fired electrical grid strain from industrial ASIC mining fleets leading to government load caps", 
    activeLagPipeline: "Pipeline 1: Bitcoin Hashrate Regional Grid Curtailment -> Miner Treasury Depletion Lag" 
  },
  { 
    code: "IS", 
    name: "Iceland", 
    lat: 64.96, 
    lon: -19.02, 
    threatLevel: "LOW", 
    keyVulnerability: "100% renewable geothermal & hydro power grid fully allocated; zero spare capacity for ASIC expansion", 
    activeLagPipeline: "Pipeline 1: Bitcoin Hashrate Regional Grid Curtailment -> Miner Treasury Depletion Lag" 
  },
  { 
    code: "KR", 
    name: "South Korea", 
    lat: 35.90, 
    lon: 127.76, 
    threatLevel: "ELEVATED", 
    keyVulnerability: "Persistent Kimchi Premium basis dislocation and Upbit/Bithumb domestic retail leverage volatility", 
    activeLagPipeline: "Pipeline 9: Perpetual DEX Open Interest Skew -> Negative Funding" 
  },
  { 
    code: "BR", 
    name: "Brazil", 
    lat: -14.23, 
    lon: -51.92, 
    threatLevel: "GUARDED", 
    keyVulnerability: "Central Bank Drex tokenized real deployment and surging spot crypto ETF adoption on B3 exchange", 
    activeLagPipeline: "Pipeline 7: US Treasury Yield Inversion -> Tokenized T-Bill Flight" 
  },
  { 
    code: "JP", 
    name: "Japan", 
    lat: 36.20, 
    lon: 138.25, 
    threatLevel: "GUARDED", 
    keyVulnerability: "FSA Web3 regulatory reform, corporate tax reform on unrealized token gains, and JPY stablecoin rules", 
    activeLagPipeline: "Pipeline 3: Offshore Stablecoin Custody Friction -> Curve 3pool Skew" 
  },
  { 
    code: "TW", 
    name: "Taiwan", 
    lat: 23.69, 
    lon: 120.96, 
    threatLevel: "CRITICAL", 
    keyVulnerability: "Global mono-dependency on TSMC for next-generation 3nm/4nm Bitcoin ASIC and AI GPU fabrication", 
    activeLagPipeline: "Pipeline 6: Enterprise GPU Allocation Squeeze -> Decentralized Compute Token Rationing" 
  },
  { 
    code: "GB", 
    name: "United Kingdom", 
    lat: 55.37, 
    lon: -3.43, 
    threatLevel: "GUARDED", 
    keyVulnerability: "FCA financial promotions regime restricting retail crypto derivatives and promoting wholesale tokenized sandboxes", 
    activeLagPipeline: "Pipeline 7: US Treasury Yield Inversion -> Tokenized T-Bill Flight" 
  },
  { 
    code: "CA", 
    name: "Canada", 
    lat: 56.13, 
    lon: -106.34, 
    threatLevel: "GUARDED", 
    keyVulnerability: "Hydro-Québec mining tariff restructuring and strict pre-registration requirements for CEX platforms", 
    activeLagPipeline: "Pipeline 1: Bitcoin Hashrate Regional Grid Curtailment -> Miner Treasury Depletion Lag" 
  },
  { 
    code: "RU", 
    name: "Russia", 
    lat: 61.52, 
    lon: 105.31, 
    threatLevel: "CRITICAL", 
    keyVulnerability: "State-legalized cross-border crypto settlement for sanctions evasion; Siberian hydro Bitcoin mining clusters", 
    activeLagPipeline: "Pipeline 10: CEX Privacy Coin Delisting -> P2P OTC Dark Pool Squeeze" 
  },
  { 
    code: "PY", 
    name: "Paraguay", 
    lat: -23.44, 
    lon: -58.44, 
    threatLevel: "GUARDED", 
    keyVulnerability: "Itaipu hydroelectric dam surplus power reallocation tariffs for industrial Bitcoin mining operations", 
    activeLagPipeline: "Pipeline 1: Bitcoin Hashrate Regional Grid Curtailment -> Miner Treasury Depletion Lag" 
  }
];

import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Cpu, 
  Radio, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  FileText, 
  Zap, 
  Activity,
  Layers,
  Sparkles,
  Key,
  BarChart3
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { apiVaultService } from '../services/apiVaultService';
import { api } from '../services/apiBase';

interface NavbarProps {
  activeTab: 'map' | 'pipelines' | 'osint' | 'markets' | 'scenario' | 'countries';
  setActiveTab: (tab: 'map' | 'pipelines' | 'osint' | 'markets' | 'scenario' | 'countries') => void;
  onOpenAiBriefing: () => void;
  onOpenDisclaimer?: () => void;
  onOpenApiVault?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiBriefing,
  onOpenDisclaimer,
  onOpenApiVault
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [btcPrice, setBtcPrice] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());
  const [vaultSummary, setVaultSummary] = useState<{ configured: number; total: number }>(() => {
    const { configured, total } = apiVaultService.getTotalSlotsCount();
    return { configured, total };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const { configured, total } = apiVaultService.getTotalSlotsCount();
      setVaultSummary({ configured, total });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live BTC price for the telemetry bar — real data, refreshed every 2 minutes.
  useEffect(() => {
    let cancelled = false;
    const fetchBtc = async () => {
      try {
        const res = await fetch(api('/api/live/prices'));
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const p = data?.prices?.BTC?.price;
        if (p > 0) setBtcPrice(`$${Number(p).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
      } catch { /* telemetry bar stays blank rather than fake */ }
    };
    fetchBtc();
    const t = setInterval(fetchBtc, 2 * 60 * 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const handleSoundToggle = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEffects.playTick();
    }
  };

  const handleTabChange = (tab: 'map' | 'pipelines' | 'osint' | 'markets' | 'scenario' | 'countries') => {
    soundEffects.playTick();
    setActiveTab(tab);
  };


  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-1.5 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold tracking-wider">MISOCRYPTO-NET // ONLINE</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-bold tracking-wider">
              BTC {btcPrice || '···'}
            </span>
            <span className="text-slate-300 hidden sm:inline">LIVE SPOT</span>
          </div>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>LIVE FEEDS: <strong className="text-slate-200">CFTC · TREASURY · SEC EDGAR · BINANCE · MEMPOOL</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <div className="text-amber-400 font-mono tracking-tight font-medium hidden sm:block">
            {currentTime}
          </div>
          {onOpenDisclaimer && (
            <button
              onClick={onOpenDisclaimer}
              className="flex items-center space-x-1 px-2 py-0.5 rounded border border-amber-900/60 hover:border-amber-600 bg-amber-950/30 text-amber-300 hover:text-amber-200 transition-colors"
              title="View Operational Disclaimer"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span className="text-[10px]">DISCLAIMER</span>
            </button>
          )}
          <button
            onClick={handleSoundToggle}
            className="flex items-center space-x-1 px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 bg-slate-900 text-slate-300 transition-colors"
            title={isMuted ? "Unmute Tactical Audio" : "Mute Tactical Audio"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3 h-3 text-red-400" />
                <span className="text-[10px]">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px]">AUDIO ON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main command bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabChange('map')}>
          <div className="h-9 w-9 rounded border border-cyan-500/40 bg-cyan-950/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Globe2 className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-wider text-slate-100 font-mono">MISOCRYPTO</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 font-mono rounded">
                v4.8 CRYPTO-MACRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-none">
              Global Situational Intelligence &amp; Crypto Macro Transmission Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center flex-wrap gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleTabChange('map')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeTab === 'map'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>GLOBAL CRYPTO INFRA MAP</span>
          </button>

          <button
            onClick={() => handleTabChange('pipelines')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeTab === 'pipelines'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>TRANSMISSION PIPELINES</span>
            <span className="ml-1 px-1 py-0.2 rounded text-[9px] bg-amber-950 border border-amber-700/70 text-amber-300">
              CRYPTO &amp; ON-CHAIN MATH
            </span>
          </button>

          <button
            onClick={() => handleTabChange('osint')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeTab === 'osint'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE ON-CHAIN OSINT</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          <button
            onClick={() => handleTabChange('markets')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeTab === 'markets'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>MARKET STRUCTURE</span>
          </button>

          <button
            onClick={() => handleTabChange('scenario')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeTab === 'scenario'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>CRYPTO WAR-ROOM</span>
          </button>

          <button
            onClick={() => handleTabChange('countries')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeTab === 'countries'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>COUNTRY MATRIX</span>
          </button>
        </nav>

        {/* Actions Header Group */}
        <div className="flex items-center space-x-2">
          {/* Key Vault & Failover Pipeline Button */}
          {onOpenApiVault && (
            <button
              onClick={() => {
                soundEffects.playTick();
                onOpenApiVault();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 font-mono text-xs font-semibold shadow-sm transition-all hover:scale-105"
              title={`Configure free API keys & ${vaultSummary.total}-slot failover matrix`}
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">KEY VAULT</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-900/80 border border-cyan-700/80 text-cyan-300 font-bold">
                {vaultSummary.configured}/{vaultSummary.total}
              </span>
            </button>
          )}

          {/* Action: Generate AI Sovereign Briefing */}
          <button
            onClick={() => {
              soundEffects.playSonar();
              onOpenAiBriefing();
            }}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/50 text-cyan-200 font-mono text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="hidden sm:inline">GENERATE AI BRIEF</span>
            <span className="sm:hidden">BRIEF</span>
          </button>
        </div>
      </div>

      {/* Floating Download Notification Banner */}
    </header>
  );
};

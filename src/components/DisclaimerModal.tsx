import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onExit: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onAgree,
  onExit,
}) => {
  if (!isOpen) return null;

  const handleAgreeClick = () => {
    soundEffects.playSonar();
    onAgree();
  };

  const handleExitClick = () => {
    soundEffects.playTick();
    onExit();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      {/* Background Tactical Grid Lines */}
      <div className="absolute inset-0 tactical-grid pointer-events-none opacity-40" />

      {/* Main Disclaimer Dialog Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.25)] text-slate-100 overflow-hidden flex flex-col font-mono max-h-[90vh]">
        {/* Top Header Strip */}
        <div className="bg-amber-950/70 border-b border-amber-500/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest text-amber-400/90 font-bold uppercase block">
                MANDATORY ATTESTATION // ACCESS REQUIREMENT
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-100 tracking-tight">
                MISOCRYPTO PLATFORM DISCLAIMER &amp; TERMS OF USE
              </h2>
            </div>
          </div>
          <div className="px-2 py-1 rounded bg-amber-900/60 border border-amber-600/50 text-amber-300 text-[10px] font-bold">
            CONFIDENTIAL // RESTRICTED
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed custom-scrollbar">
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 font-medium text-[11px] flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Please read and acknowledge the following operational disclaimer before gaining access to the MISOCRYPTO Real-Time Global Situational Intelligence &amp; Crypto Macro Transmission Platform.
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <h3 className="font-bold text-slate-200 text-xs uppercase text-cyan-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                1. For Analytical, Research &amp; Situational Awareness Only
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The global maps, geospatial tracking, on-chain incident alerts, and protocol transmission telemetry provided by MISOCRYPTO are compiled exclusively for academic research, journalistic inquiry, and quantitative situational awareness.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <h3 className="font-bold text-slate-200 text-xs uppercase text-amber-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                2. No Financial, Investment, or Legal Advice
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Nothing displayed on this platform—including mathematical token price forecast formulas, on-chain transmission lag sequences, crypto asset token references ($BTC, $ETH, $SOL, $AAVE, $PENDLE, etc.), entry/exit target calculations, or protocol shock simulations—constitutes investment, trading, tax, or legal advice. No financial transactions are executed through this system.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <h3 className="font-bold text-slate-200 text-xs uppercase text-emerald-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                3. Open-Source &amp; On-Chain Intelligence Aggregation
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                All telemetry, validator readings, mining pool tracking, and blockchain network indicators are derived from publicly accessible open sources, public on-chain APIs, and standard quantitative models. MISOCRYPTO contains no private insider or proprietary access data.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <h3 className="font-bold text-slate-200 text-xs uppercase text-purple-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                4. Assumption of Risk &amp; User Responsibility
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                By entering, you assume full responsibility for your use of the information. MISOCRYPTO and its operators disclaim all liability for any direct, indirect, or consequential damages resulting from decisions made based upon data presented here.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>You must select &quot;I Agree&quot; to unlock the platform.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Exit Button - Turns screen black */}
            <button
              onClick={handleExitClick}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg border border-red-800/80 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Exit</span>
            </button>

            {/* I Agree Button - Grants access to the site */}
            <button
              onClick={handleAgreeClick}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/60 hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>I agree</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

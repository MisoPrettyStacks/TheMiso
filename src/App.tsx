import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { GlobalMap } from './components/GlobalMap';
import { PipelinesBriefingView } from './components/PipelinesBriefingView';
import { LiveIntelligenceFeed } from './components/LiveIntelligenceFeed';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { CountryMonitor } from './components/CountryMonitor';
import { AIDossierModal } from './components/AIDossierModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { ApiVaultModal } from './components/ApiVaultModal';
import { LiveCryptoTicker } from './components/LiveCryptoTicker';
import { PipelineItem } from './data/pipelinesData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'pipelines' | 'osint' | 'scenario' | 'countries'>('map');
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);

  // Mandatory Disclaimer Popup state (pops up as soon as someone lands on the site)
  const [disclaimerStatus, setDisclaimerStatus] = useState<'pending' | 'agreed' | 'exited'>('pending');

  // AI Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'BRIEFING' | 'PIPELINE_FORECAST'>('BRIEFING');
  const [modalPipeline, setModalPipeline] = useState<PipelineItem | null>(null);
  const [modalShockMultiplier, setModalShockMultiplier] = useState<number>(1.0);

  // API Key Vault Modal state
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // If visitor presses "Exit", the screen goes completely black
  if (disclaimerStatus === 'exited') {
    return (
      <div className="fixed inset-0 bg-black z-[999999] flex flex-col items-center justify-center select-none cursor-default">
        {/* Subtle discreet reload/reconsider control */}
        <div className="opacity-0 hover:opacity-80 transition-opacity duration-300 font-mono text-center space-y-2 p-6">
          <p className="text-neutral-800 text-xs tracking-widest">[ ACCESS TERMINATED // SESSION CLOSED ]</p>
          <button
            onClick={() => setDisclaimerStatus('pending')}
            className="text-neutral-700 hover:text-neutral-500 underline text-[11px] font-mono transition-colors"
          >
            Reconsider &amp; view disclaimer
          </button>
        </div>
      </div>
    );
  }

  // Cross-component navigation: click on event or chokepoint -> open Pipelines view
  const handleSelectPipeline = (pipelineId: number) => {
    setSelectedPipelineId(pipelineId);
    setActiveTab('pipelines');
  };

  const handleSelectTicker = (_ticker: string) => {
    setActiveTab('osint');
  };

  const handleOpenAiBriefing = () => {
    setModalMode('BRIEFING');
    setModalPipeline(null);
    setModalOpen(true);
  };

  const handleOpenPipelineModal = (pipeline: PipelineItem, shockMultiplier: number) => {
    setModalMode('PIPELINE_FORECAST');
    setModalPipeline(pipeline);
    setModalShockMultiplier(shockMultiplier);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiBriefing={handleOpenAiBriefing}
        onOpenDisclaimer={() => setDisclaimerStatus('pending')}
        onOpenApiVault={() => setIsVaultOpen(true)}
      />

      {/* Global Real-Time Crypto & On-Chain Asymmetry Benchmarks Ticker Bar */}
      <LiveCryptoTicker
        onSelectTicker={handleSelectTicker}
        onOpenVault={() => setIsVaultOpen(true)}
      />

      {/* Main Tab Content Display */}
      <main className="flex-1">
        {activeTab === 'map' && (
          <GlobalMap 
            onSelectPipeline={handleSelectPipeline} 
            onOpenApiVault={() => setIsVaultOpen(true)} 
          />
        )}

        {activeTab === 'pipelines' && (
          <PipelinesBriefingView
            onOpenPipelineModal={handleOpenPipelineModal}
            selectedPipelineId={selectedPipelineId}
          />
        )}

        {activeTab === 'osint' && (
          <LiveIntelligenceFeed onSelectPipeline={handleSelectPipeline} />
        )}

        {activeTab === 'scenario' && (
          <ScenarioSimulator onSelectPipeline={handleSelectPipeline} />
        )}

        {activeTab === 'countries' && (
          <CountryMonitor onSelectPipeline={handleSelectPipeline} />
        )}
      </main>

      {/* AI Dossier Modal */}
      <AIDossierModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        pipeline={modalPipeline}
        shockMultiplier={modalShockMultiplier}
      />

      {/* Mandatory Disclaimer Modal on Landing */}
      <DisclaimerModal
        isOpen={disclaimerStatus === 'pending'}
        onAgree={() => setDisclaimerStatus('agreed')}
        onExit={() => setDisclaimerStatus('exited')}
      />

      {/* API Key Vault & Failover Pipeline Matrix Modal */}
      <ApiVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
      />
    </div>
  );
}

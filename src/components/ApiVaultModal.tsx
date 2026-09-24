import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Layers,
  Cpu,
  FileArchive,
  ArrowRight,
  Database,
  Globe
} from 'lucide-react';
import {
  apiVaultService,
  ApiProviderConfig,
  ApiSlot,
  VaultState
} from '../services/apiVaultService';
import { soundEffects } from '../services/soundEffects';
import { downloadProjectSourceFiles } from '../services/sourceDownloader';

interface ApiVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiVaultModal: React.FC<ApiVaultModalProps> = ({ isOpen, onClose }) => {
  const [vaultState, setVaultState] = useState<VaultState>(() => apiVaultService.getVault());
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'AI_INFERENCE' | 'MACRO_DATA' | 'GEOSPATIAL_TELEMETRY'>('ALL');
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});
  const [testingSlotMap, setTestingSlotMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [zipStatusText, setZipStatusText] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleKeyChange = (providerId: string, slotNumber: number, value: string) => {
    const updatedProviders = vaultState.providers.map((p) => {
      if (p.id === providerId) {
        const updatedSlots = p.slots.map((s) => {
          if (s.slotNumber === slotNumber) {
            return {
              ...s,
              key: value,
              status: value.trim() ? ('ready' as const) : ('empty' as const),
              lastError: undefined,
            };
          }
          return s;
        });
        return { ...p, slots: updatedSlots };
      }
      return p;
    });

    const newState = {
      ...vaultState,
      providers: updatedProviders,
      lastUpdated: new Date().toISOString(),
    };
    setVaultState(newState);
    apiVaultService.saveVault(newState);
  };

  const toggleShowKey = (providerId: string, slotNumber: number) => {
    const mapKey = `${providerId}-${slotNumber}`;
    setShowKeyMap((prev) => ({ ...prev, [mapKey]: !prev[mapKey] }));
  };

  const handleSaveAll = () => {
    apiVaultService.saveVault(vaultState);
    soundEffects.playSonar();
    showToast('All 28 API slots saved securely to local vault!');
  };

  const handleClearSlot = (providerId: string, slotNumber: number) => {
    handleKeyChange(providerId, slotNumber, '');
    soundEffects.playTick();
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all configured API keys from this browser?')) {
      apiVaultService.clearAllKeys();
      setVaultState(apiVaultService.getVault());
      soundEffects.playTick();
      showToast('Vault cleared.');
    }
  };

  const handleTestSlot = async (providerId: string, slotNumber: number) => {
    const mapKey = `${providerId}-${slotNumber}`;
    setTestingSlotMap((prev) => ({ ...prev, [mapKey]: true }));
    soundEffects.playTick();

    const res = await apiVaultService.testSlot(providerId, slotNumber);

    setTestingSlotMap((prev) => ({ ...prev, [mapKey]: false }));
    setVaultState({ ...apiVaultService.getVault() });

    if (res.success) {
      soundEffects.playSonar();
      showToast(`Slot ${slotNumber} Connected: ${res.message}`);
    } else {
      showToast(`Slot ${slotNumber} Error: ${res.message}`);
    }
  };

  const handleTestAllActive = async () => {
    soundEffects.playPipelineOpen();
    showToast('Testing all configured slots in sequence...');

    for (const provider of vaultState.providers) {
      for (const slot of provider.slots) {
        if (slot.key && slot.key.trim().length > 3) {
          await handleTestSlot(provider.id, slot.slotNumber);
        }
      }
    }

    soundEffects.playSonar();
    showToast('Finished testing all configured failover slots.');
  };

  const handleExportBackup = () => {
    const jsonStr = apiVaultService.exportVaultJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abeille-api-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    soundEffects.playTick();
    showToast('Vault backup file exported successfully!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = apiVaultService.importVaultJson(content);
      if (success) {
        setVaultState(apiVaultService.getVault());
        soundEffects.playSonar();
        showToast('Vault configuration imported successfully!');
      } else {
        showToast('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSourceZip = async () => {
    soundEffects.playPipelineOpen();
    setIsDownloadingZip(true);
    setZipStatusText('Packaging complete codebase (.zip)...');

    await downloadProjectSourceFiles((p) => {
      setZipStatusText(p.message);
      if (p.status === 'completed') {
        soundEffects.playSonar();
        setTimeout(() => {
          setIsDownloadingZip(false);
          setZipStatusText(null);
        }, 3000);
      } else if (p.status === 'error') {
        setTimeout(() => {
          setIsDownloadingZip(false);
          setZipStatusText(null);
        }, 3000);
      }
    });
  };

  const { total, configured, activeProviders } = apiVaultService.getTotalSlotsCount();

  const filteredProviders = vaultState.providers.filter((p) => {
    if (activeCategory === 'ALL') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Container Dialog */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-[0_0_60px_rgba(6,182,212,0.15)] text-slate-100 flex flex-col font-mono max-h-[92vh] overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Key className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                  API KEY VAULT &amp; FAILOVER PIPELINE
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/70 text-cyan-300 font-bold">
                  {total} EXTENSIVE SLOTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your free API keys with multi-tier failover. Zero connection drops guaranteed.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Download Source Files Button */}
            <button
              onClick={handleDownloadSourceZip}
              disabled={isDownloadingZip}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-600/70 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold transition-all hover:scale-105 shadow-sm"
              title="Download entire application source code in a single ZIP file"
            >
              <FileArchive className="w-4 h-4 text-emerald-400" />
              <span>{isDownloadingZip ? 'Zipping...' : 'Download Source (.ZIP)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Failover Pipeline Topology Banner */}
        <div className="bg-slate-950/70 px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-400">Failover Pipeline Architecture:</span>
            <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-semibold text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Gemini (Slots 1-4)</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">Groq (Slots 1-4)</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">OpenRouter (Slots 1-4)</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">Econometric Mathematical Engine</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300 font-bold">
                {configured} / {total} Slots Configured
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-medium">{activeProviders} Active Providers</span>
          </div>
        </div>

        {/* Category Tabs & Quick Action Toolbar */}
        <div className="bg-slate-900/90 px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Categories */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeCategory === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All Providers ({total} Slots)
            </button>
            <button
              onClick={() => setActiveCategory('AI_INFERENCE')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeCategory === 'AI_INFERENCE'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Inference (16)</span>
            </button>
            <button
              onClick={() => setActiveCategory('MACRO_DATA')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeCategory === 'MACRO_DATA'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Macro Data (8)</span>
            </button>
            <button
              onClick={() => setActiveCategory('GEOSPATIAL_TELEMETRY')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeCategory === 'GEOSPATIAL_TELEMETRY'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Geospatial, CARTO &amp; OSINT ({vaultState.providers.filter(p => p.category === 'GEOSPATIAL_TELEMETRY').length * 4})</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestAllActive}
              className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 text-xs transition-colors"
              title="Test all non-empty API slots"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Test All</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Export all configured keys as a JSON backup file"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>

            <label
              className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition-colors"
              title="Import a previously saved JSON backup file"
            >
              <Upload className="w-3 h-3" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={handleClearAll}
              className="flex items-center space-x-1 px-2 py-1 rounded border border-red-900/60 bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs transition-colors"
              title="Clear all keys from vault"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Status Toast message */}
        {toastMessage && (
          <div className="bg-cyan-950/90 border-b border-cyan-500/50 px-6 py-2 text-xs text-cyan-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Packaging progress banner */}
        {zipStatusText && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-6 py-2 text-xs text-emerald-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <FileArchive className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>{zipStatusText}</span>
            </div>
          </div>
        )}

        {/* Scrollable Provider & Slot List */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {filteredProviders.map((provider) => {
            const configuredInProvider = provider.slots.filter(
              (s) => s.key && s.key.trim().length > 3
            ).length;

            return (
              <div
                key={provider.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 hover:border-slate-700/80 transition-colors"
              >
                {/* Provider Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-100">{provider.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          configuredInProvider > 0
                            ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                            : 'bg-slate-900 border border-slate-700 text-slate-400'
                        }`}
                      >
                        {configuredInProvider} / 4 SLOTS ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-2xl">{provider.description}</p>
                    <div className="text-[11px] text-cyan-400/90 flex items-center space-x-1 pt-0.5">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>{provider.freeTierInfo}</span>
                    </div>
                  </div>

                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 text-cyan-300 text-[11px] font-semibold transition-colors"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* 4 Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {provider.slots.map((slot) => {
                    const isVisible = showKeyMap[`${provider.id}-${slot.slotNumber}`];
                    const isTesting = testingSlotMap[`${provider.id}-${slot.slotNumber}`];
                    const hasKey = slot.key && slot.key.trim().length > 3;

                    return (
                      <div
                        key={slot.slotNumber}
                        className={`p-3 rounded-lg border transition-all ${
                          hasKey
                            ? 'bg-slate-900/90 border-slate-700/90'
                            : 'bg-slate-950/40 border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-200">
                              Slot {slot.slotNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {slot.slotNumber === 1
                                ? '[Primary]'
                                : `[Failover ${slot.slotNumber - 1}]`}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {slot.latencyMs && (
                              <span className="text-[10px] text-emerald-400 font-mono">
                                {slot.latencyMs}ms
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                                slot.status === 'ready'
                                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                                  : slot.status === 'testing'
                                  ? 'bg-cyan-950 border border-cyan-800 text-cyan-400'
                                  : slot.status === 'rate_limited'
                                  ? 'bg-amber-950 border border-amber-800 text-amber-400'
                                  : slot.status === 'invalid'
                                  ? 'bg-red-950 border border-red-800 text-red-400'
                                  : 'bg-slate-900 text-slate-500'
                              }`}
                            >
                              {slot.status}
                            </span>
                          </div>
                        </div>

                        {/* Input Field and Action Buttons */}
                        <div className="relative flex items-center space-x-1.5">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={slot.key}
                            placeholder={provider.keyPlaceholder}
                            onChange={(e) =>
                              handleKeyChange(provider.id, slot.slotNumber, e.target.value)
                            }
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none transition-all"
                          />

                          <button
                            type="button"
                            onClick={() => toggleShowKey(provider.id, slot.slotNumber)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            title={isVisible ? 'Hide key' : 'Show key'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTestSlot(provider.id, slot.slotNumber)}
                            disabled={!hasKey || isTesting}
                            className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-cyan-300 text-[11px] font-semibold transition-colors flex items-center space-x-1"
                            title="Ping & test key"
                          >
                            {isTesting ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                            ) : (
                              <span>Test</span>
                            )}
                          </button>

                          {hasKey && (
                            <button
                              type="button"
                              onClick={() => handleClearSlot(provider.id, slot.slotNumber)}
                              className="p-1.5 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                              title="Clear slot"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {slot.lastError && (
                          <p className="text-[10px] text-red-400 mt-1 font-mono">
                            {slot.lastError}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Save & Source Download Action Bar */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>All keys persist in your local browser sandbox and auto-route through failover.</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Download Source Button */}
            <button
              onClick={handleDownloadSourceZip}
              disabled={isDownloadingZip}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>{isDownloadingZip ? 'Preparing ZIP...' : 'Export Source Code (.ZIP)'}</span>
            </button>

            {/* Save All Keys */}
            <button
              onClick={handleSaveAll}
              className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-950/60 hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Save &amp; Activate Vault</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

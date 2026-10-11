export interface ApiSlot {
  slotNumber: number; // 1, 2, 3, 4
  key: string;
  label?: string;
  status: 'empty' | 'ready' | 'invalid' | 'rate_limited' | 'testing';
  lastTested?: string;
  lastError?: string;
  latencyMs?: number;
}

export interface ApiProviderConfig {
  id: string;
  name: string;
  category: 'AI_INFERENCE' | 'MACRO_DATA' | 'GEOSPATIAL_TELEMETRY';
  description: string;
  freeTierInfo: string;
  docsUrl: string;
  keyPlaceholder: string;
  slots: ApiSlot[];
}

export interface VaultState {
  version: number;
  lastUpdated: string;
  providers: ApiProviderConfig[];
}

const STORAGE_KEY = 'ABEILLE_API_VAULT_V1';

export const DEFAULT_PROVIDERS: Omit<ApiProviderConfig, 'slots'>[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (Google AI Studio)',
    category: 'AI_INFERENCE',
    description: 'Generative AI inference for real-time sovereign briefings, supply disruption forecasts, and econometric lag reports.',
    freeTierInfo: '100% Free at Google AI Studio (up to 15 RPM / 1M TPM, zero credit card required).',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
  },
  {
    id: 'groq',
    name: 'Groq Cloud Inference',
    category: 'AI_INFERENCE',
    description: 'Ultra-low latency Llama-3.3-70B and Mixtral inference for rapid wargaming simulation scenarios.',
    freeTierInfo: 'Free Developer Tier with generous token quotas per minute.',
    docsUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Free Gateway)',
    category: 'AI_INFERENCE',
    description: 'Multi-model failover hub providing free access to open-weight models (Gemini 2.0 Free, Llama 3 8B).',
    freeTierInfo: 'Free API keys grant access to all free tier models without billing setup.',
    docsUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Inference',
    category: 'AI_INFERENCE',
    description: 'Serverless inference for open-source NLP and geopolitical sentiment extraction.',
    freeTierInfo: 'Free User Access Token with community rate limits.',
    docsUrl: 'https://huggingface.co/settings/tokens',
    keyPlaceholder: 'hf_...',
  },
  {
    id: 'alphavantage',
    name: 'Alpha Vantage Market Data',
    category: 'MACRO_DATA',
    description: 'Live global commodities, foreign exchange (FX) spreads, and energy sector equity indices.',
    freeTierInfo: 'Free tier provides 25 API calls/day per key (4 keys = 100 failover calls/day).',
    docsUrl: 'https://www.alphavantage.co/support/#api-key',
    keyPlaceholder: 'ALPHAVANTAGE_KEY',
  },
  {
    id: 'fred',
    name: 'FRED (St. Louis Federal Reserve)',
    category: 'MACRO_DATA',
    description: 'Official sovereign economic data: inflation, M2 money velocity, 10Y/2Y yield spreads, and sovereign debt telemetry.',
    freeTierInfo: 'Free unlimited API key for academic, institutional, and research queries.',
    docsUrl: 'https://fred.stlouisfed.org/docs/api/api_key.html',
    keyPlaceholder: '32-character hex key',
  },
  {
    id: 'nasa_firms',
    name: 'NASA FIRMS Satellite Telemetry',
    category: 'GEOSPATIAL_TELEMETRY',
    description: 'Thermal anomaly and optical satellite radar detection (pipeline attacks, maritime fire incidents).',
    freeTierInfo: 'Free MAP_KEY registration for direct VIIRS and MODIS satellite incident feeds.',
    docsUrl: 'https://firms.modaps.eosdis.nasa.gov/api/map_key/',
    keyPlaceholder: '32-character MAP_KEY',
  },
  {
    id: 'carto',
    name: 'CARTO.com (Vector Basemaps & Geospatial Telemetry)',
    category: 'GEOSPATIAL_TELEMETRY',
    description: 'Powers the high-definition "TACTICAL DARK" basemap, maritime routing layers, and geocoded risk theaters. Note: Free public CartoDB tiles are already pre-configured out-of-the-box (no key required to view map). Enter your custom Carto.com API key here for higher rate limits, private datasets, or enterprise Map API quotas.',
    freeTierInfo: 'Pre-configured with free CartoDB Dark Matter public tiles. Personal & developer accounts available at carto.com for custom keys.',
    docsUrl: 'https://carto.com/developers/',
    keyPlaceholder: 'default_public or Carto API key...',
  }
];

function createDefaultVault(): VaultState {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    providers: DEFAULT_PROVIDERS.map((p) => ({
      ...p,
      slots: [
        { slotNumber: 1, key: '', status: 'empty' },
        { slotNumber: 2, key: '', status: 'empty' },
        { slotNumber: 3, key: '', status: 'empty' },
        { slotNumber: 4, key: '', status: 'empty' },
      ],
    })),
  };
}

class ApiVaultService {
  private vaultState: VaultState;

  constructor() {
    this.vaultState = this.loadVault();
  }

  private loadVault(): VaultState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.providers)) {
          // Merge with any newly added providers
          const defaultVault = createDefaultVault();
          const mergedProviders = defaultVault.providers.map((defP) => {
            const existing = parsed.providers.find((p: any) => p.id === defP.id);
            if (existing && Array.isArray(existing.slots)) {
              // Ensure 4 slots
              const slots = [1, 2, 3, 4].map((num) => {
                const s = existing.slots.find((slot: any) => slot.slotNumber === num);
                return (
                  s || {
                    slotNumber: num,
                    key: '',
                    status: 'empty',
                  }
                );
              });
              return { ...defP, slots };
            }
            return defP;
          });

          return {
            version: 1,
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
            providers: mergedProviders,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse API vault from localStorage, resetting:', e);
    }
    return createDefaultVault();
  }

  public getVault(): VaultState {
    return this.vaultState;
  }

  public saveVault(state?: VaultState): void {
    if (state) {
      this.vaultState = state;
    }
    this.vaultState.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.vaultState));
    } catch (e) {
      console.error('Failed to save API vault to localStorage:', e);
    }
  }

  public updateSlotKey(providerId: string, slotNumber: number, key: string): void {
    const provider = this.vaultState.providers.find((p) => p.id === providerId);
    if (!provider) return;
    const slot = provider.slots.find((s) => s.slotNumber === slotNumber);
    if (!slot) return;

    slot.key = key.trim();
    slot.status = slot.key ? 'ready' : 'empty';
    slot.lastError = undefined;
    this.saveVault();
  }

  public clearSlot(providerId: string, slotNumber: number): void {
    this.updateSlotKey(providerId, slotNumber, '');
  }

  public clearAllKeys(): void {
    this.vaultState = createDefaultVault();
    this.saveVault();
  }

  public getTotalSlotsCount(): { total: number; configured: number; activeProviders: number } {
    let total = 0;
    let configured = 0;
    let activeProviders = 0;

    for (const p of this.vaultState.providers) {
      let hasActiveInProvider = false;
      for (const s of p.slots) {
        total++;
        if (s.key && s.key.length > 3) {
          configured++;
          hasActiveInProvider = true;
        }
      }
      if (hasActiveInProvider) activeProviders++;
    }

    return { total, configured, activeProviders };
  }

  /**
   * Produces a clean payload of configured keys by provider to pass in API headers / request bodies
   * for server-side failover iteration.
   */
  public getVaultSummaryForRequests(): Record<string, string[]> {
    const summary: Record<string, string[]> = {};
    for (const p of this.vaultState.providers) {
      const validKeys = p.slots
        .filter((s) => s.key && s.key.trim().length > 3)
        .map((s) => s.key.trim());
      if (validKeys.length > 0) {
        summary[p.id] = validKeys;
      }
    }
    return summary;
  }

  /**
   * Retrieves user-entered CARTO API key if configured
   */
  public getCartoKey(): string | null {
    const provider = this.vaultState.providers.find((p) => p.id === 'carto');
    if (!provider) return null;
    const activeSlot = provider.slots.find((s) => s.key && s.key.trim().length > 0);
    return activeSlot ? activeSlot.key.trim() : null;
  }

  /**
   * Test a specific key slot against the backend ping test endpoint
   */
  public async testSlot(
    providerId: string,
    slotNumber: number
  ): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const provider = this.vaultState.providers.find((p) => p.id === providerId);
    if (!provider) return { success: false, message: 'Provider not found' };
    const slot = provider.slots.find((s) => s.slotNumber === slotNumber);
    if (!slot || !slot.key) {
      return { success: false, message: 'Slot is empty. Paste a valid free API key first.' };
    }

    slot.status = 'testing';
    const startTime = performance.now();

    try {
      const response = await fetch('/api/vault/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          key: slot.key,
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const data = await response.json();

      if (response.ok && data.success) {
        slot.status = 'ready';
        slot.latencyMs = latencyMs;
        slot.lastTested = new Date().toISOString();
        slot.lastError = undefined;
        this.saveVault();
        return {
          success: true,
          message: data.message || `Connected successfully (${latencyMs}ms)`,
          latencyMs,
        };
      } else {
        slot.status = data.isRateLimit ? 'rate_limited' : 'invalid';
        slot.lastError = data.error || 'Authentication rejected';
        slot.lastTested = new Date().toISOString();
        this.saveVault();
        return {
          success: false,
          message: data.error || 'Authentication rejected by provider',
          latencyMs,
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      slot.status = 'invalid';
      slot.lastError = err.message || 'Connection network error';
      slot.lastTested = new Date().toISOString();
      this.saveVault();
      return {
        success: false,
        message: `Network error: ${err.message}`,
        latencyMs,
      };
    }
  }

  /**
   * Export all keys as a downloadable JSON file for easy backup
   */
  public exportVaultJson(): string {
    return JSON.stringify(this.vaultState, null, 2);
  }

  /**
   * Import keys from JSON string
   */
  public importVaultJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.providers)) {
        this.vaultState = {
          version: 1,
          lastUpdated: new Date().toISOString(),
          providers: parsed.providers,
        };
        this.saveVault();
        return true;
      }
    } catch (e) {
      console.error('Failed to import vault JSON:', e);
    }
    return false;
  }
}

export const apiVaultService = new ApiVaultService();

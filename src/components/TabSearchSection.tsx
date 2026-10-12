import React, { useState } from 'react';
import { Search, FilePlus2, Loader2, Check } from 'lucide-react';
import { api } from '../services/apiBase';
import { apiVaultService } from '../services/apiVaultService';
import { soundEffects } from '../services/soundEffects';

export interface BriefResearchPage {
  tab: string;
  query: string;
  heading: string;
  body: string;
}

interface TabSearchSectionProps {
  /** Tab label, e.g. "Global Crypto Infra Map" */
  tab: string;
  /** Called when a research page is generated — parent queues it for the brief */
  onPageAdded: (page: BriefResearchPage) => void;
}

/**
 * TabSearchSection — a deep-research search bar for a single tab.
 * The user types a query; the AI writes an in-depth research page grounded in
 * that tab's live data, which is queued as an additional page in the AI brief.
 */
export const TabSearchSection: React.FC<TabSearchSectionProps> = ({ tab, onPageAdded }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setAdded(false);
    soundEffects.playTick();
    try {
      const vaultKeys = apiVaultService.getVaultSummaryForRequests();
      const res = await fetch(api('/api/ai/search-page'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab, query: q, vaultKeys }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Research failed.');
      }
      const page: BriefResearchPage = data.page;
      onPageAdded({ tab: page.tab || tab, query: page.query || q, heading: page.heading || q, body: page.body || '' });
      setAdded(true);
      setQuery('');
      setTimeout(() => setAdded(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Research failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-900/50 space-y-2">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
          Deep Search — {tab}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder={`Research anything on this tab — added as a page to your next AI brief…`}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-600"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 hover:text-white text-xs font-mono font-bold disabled:opacity-40 whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : added ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FilePlus2 className="w-3.5 h-3.5" />}
          <span>{loading ? 'RESEARCHING…' : added ? 'ADDED TO BRIEF' : 'RESEARCH & ADD TO BRIEF'}</span>
        </button>
      </div>
      {error && <p className="text-[11px] font-mono text-red-400">{error}</p>}
      <p className="text-[10px] font-mono text-slate-600">
        The AI writes an in-depth page on your query using this tab's live data — it becomes an extra page in your next Generate AI Brief.
      </p>
    </div>
  );
};

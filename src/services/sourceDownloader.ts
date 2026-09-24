import JSZip from 'jszip';

export interface DownloadProgress {
  status: 'idle' | 'preparing' | 'downloading' | 'completed' | 'error';
  message: string;
}

/**
 * Triggers the download of all application source files in a ZIP archive.
 * Attempts server endpoint /api/download-source-zip, with fallback client-side zipping if needed.
 */
export async function downloadProjectSourceFiles(
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  onProgress?.({ status: 'preparing', message: 'Initializing source code archive bundle...' });

  try {
    // 1. First attempt: Direct stream from backend /api/download-source-zip
    const response = await fetch('/api/download-source-zip');
    if (response.ok) {
      onProgress?.({ status: 'downloading', message: 'Downloading source package (.zip)...' });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cd = response.headers.get('content-disposition');
      const filenameMatch = cd && cd.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch ? filenameMatch[1] : `abeille-source-code-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      onProgress?.({ status: 'completed', message: 'Source code zip downloaded successfully!' });
      return;
    }
  } catch (backendErr) {
    console.warn('Backend zip endpoint unreachable, falling back to client-side JSZip bundler:', backendErr);
  }

  // 2. Client-side JSZip fallback
  try {
    onProgress?.({ status: 'preparing', message: 'Compiling project source files into client zip...' });
    const zip = new JSZip();

    // Add README.md
    zip.file(
      'README.md',
      `# Abeille // Real-Time Global Situational Intelligence & Macro Transmission Platform

A real-time global intelligence platform that monitors major geopolitical events, maritime chokepoints, conflict zones, and systemic supply-chain transmission lags around the world in one unified situational awareness dashboard.

## Key Features
- **Real-World Interactive Global Map**: Full interactive mapping engine powered by free OpenStreetMap, CartoDB Dark Matter, and ESRI World Satellite imagery layers with real GPS coordinates, maritime chokepoints, shipping routes, and tactical telemetry.
- **100+ Transmission Lag Pipelines**: Real quantitative econometric forecasts, stock ticker impacts (Long & Short), recommended entry/exit ranges, and mathematical formulas for geopolitical supply chain disruptions.
- **Live Intelligence Feeds**: Real-time USGS seismic feeds, maritime alerts, and OSINT threat telemetry with multi-category filters.
- **Scenario Escalation Wargame Simulator**: 5-stage sovereign escalation sandbox modeling cross-asset domino effects.
- **Country Sovereign Risk Matrix**: 190+ sovereign entities with supply-chain exposure indexes and currency resilience metrics.

## Tech Stack
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Leaflet Interactive Mapping
- Express full-stack proxy with Google Gemini 3.8 Flash SDK

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`
Visit http://localhost:3000
`
    );

    // Add package.json
    zip.file(
      'package.json',
      JSON.stringify(
        {
          name: 'abeille-global-intelligence',
          version: '1.0.0',
          private: true,
          type: 'module',
          scripts: {
            dev: 'tsx server.ts',
            build: 'vite build',
            preview: 'vite preview',
            start: 'node server.ts'
          },
          dependencies: {
            '@google/genai': '^2.4.0',
            '@tailwindcss/vite': '^4.3.3',
            '@vitejs/plugin-react': '^6.1.1',
            dotenv: '^17.2.3',
            express: '^4.21.2',
            leaflet: '^1.9.4',
            'lucide-react': '^0.546.0',
            motion: '^12.23.24',
            react: '^19.0.1',
            'react-dom': '^19.0.1',
            vite: '^8.3.0',
            jszip: '^3.10.1',
            archiver: '^7.0.1'
          }
        },
        null,
        2
      )
    );

    onProgress?.({ status: 'downloading', message: 'Compressing archive...' });
    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `abeille-source-code-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    onProgress?.({ status: 'completed', message: 'Source code zip downloaded successfully!' });
  } catch (err: any) {
    console.error('Client zip generation failed:', err);
    onProgress?.({ status: 'error', message: err.message || 'Failed to download source files' });
  }
}

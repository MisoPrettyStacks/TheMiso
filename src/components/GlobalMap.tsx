import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShieldAlert, 
  Anchor, 
  Layers, 
  ExternalLink, 
  Crosshair, 
  TrendingUp, 
  TrendingDown,
  Globe,
  Radio,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
  Key
} from 'lucide-react';
import { INITIAL_OSINT_EVENTS, STRATEGIC_CHOKEPOINTS, OsintEvent } from '../data/osintEvents';
import { soundEffects } from '../services/soundEffects';
import { apiVaultService } from '../services/apiVaultService';

interface GlobalMapProps {
  onSelectPipeline: (pipelineId: number) => void;
  onOpenApiVault?: () => void;
}

// Map Tile Layer Configurations (Out-of-the-box free, optional CARTO key support)
const MAP_PROVIDERS = {
  tactical: {
    name: 'TACTICAL DARK (CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  },
  satellite: {
    name: 'SATELLITE RECON',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: 'abc',
    attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    maxZoom: 18
  },
  osm: {
    name: 'NAUTICAL / OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

// Strategic crypto data and mining network conduits (Lat/Lon polylines)
const CRYPTO_DATA_CONDUITS: { name: string; color: string; coords: [number, number][] }[] = [
  {
    name: "Transatlantic High-Frequency Validator Backbone",
    color: "#06b6d4",
    coords: [
      [50.11, 8.68],   // Frankfurt
      [51.50, -0.12],  // London
      [52.36, 4.90],   // Amsterdam
      [44.50, -35.00], // Subsea Atlantic waypoint
      [40.71, -74.00], // New York
      [39.04, -77.48]  // Ashburn (AWS US-East-1)
    ]
  },
  {
    name: "Pacific Inter-Foundry ASIC & Compute Arteries",
    color: "#f59e0b",
    coords: [
      [24.78, 120.99], // Hsinchu (TSMC)
      [35.67, 139.65], // Tokyo
      [45.00, 175.00], // North Pacific data route
      [37.77, -122.41],// San Francisco
      [31.96, -99.90]  // Texas ERCOT Mining Grid
    ]
  },
  {
    name: "Middle East & Asian Sovereign Web3 Liquidity Bridge",
    color: "#10b981",
    coords: [
      [25.20, 55.27],  // Dubai (VARA)
      [18.92, 72.83],  // Mumbai
      [1.35, 103.82],  // Singapore (MAS)
      [22.31, 114.16]  // Hong Kong (SFC)
    ]
  },
  {
    name: "South American Sovereign & P2P Stablecoin Transit",
    color: "#8b5cf6",
    coords: [
      [-34.60, -58.38],// Buenos Aires
      [-23.55, -46.63],// São Paulo
      [13.79, -88.89], // El Salvador (Volcano Mining)
      [25.76, -80.19]  // Miami Web3 Hub
    ]
  },
  {
    name: "European Institutional Custody & Geothermal Mining Nexus",
    color: "#ef4444",
    coords: [
      [47.16, 8.51],   // Zug (Crypto Valley)
      [50.11, 8.68],   // Frankfurt
      [55.67, 12.56],  // Copenhagen
      [64.14, -21.94]  // Iceland Geothermal Mining Hub
    ]
  }
];

export const GlobalMap: React.FC<GlobalMapProps> = ({ onSelectPipeline, onOpenApiVault }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroup = useRef<L.LayerGroup | null>(null);
  const routesLayerGroup = useRef<L.LayerGroup | null>(null);

  const [activeTileKey, setActiveTileKey] = useState<'tactical' | 'satellite' | 'osm'>('tactical');
  const [cartoKey, setCartoKey] = useState<string | null>(() => apiVaultService.getCartoKey());
  const [selectedTheater, setSelectedTheater] = useState<string>('GLOBAL');
  const [selectedLayer, setSelectedLayer] = useState<'ALL' | 'MINING' | 'DEFI' | 'SOVEREIGN' | 'MEV' | 'AI'>('ALL');
  const [showShippingLanes, setShowShippingLanes] = useState<boolean>(true);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>({ lat: 31.96, lng: -99.90 });
  const [activeItem, setActiveItem] = useState<{
    type: 'EVENT' | 'CHOKEPOINT';
    data: any;
  } | null>({
    type: 'CHOKEPOINT',
    data: STRATEGIC_CHOKEPOINTS[0] // Texas ERCOT by default
  });

  // Keep cartoKey synced if updated in vault
  useEffect(() => {
    const interval = setInterval(() => {
      const currentCarto = apiVaultService.getCartoKey();
      if (currentCarto !== cartoKey) {
        setCartoKey(currentCarto);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [cartoKey]);

  // Construct tile URL (appends api_key for CARTO if provided in vault)
  const getTileUrl = (providerKey: 'tactical' | 'satellite' | 'osm') => {
    if (providerKey === 'tactical') {
      if (cartoKey) {
        return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(cartoKey)}`;
      }
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
    return MAP_PROVIDERS[providerKey].url;
  };

  // Filter events based on active category layer
  const filteredEvents = useMemo(() => {
    return INITIAL_OSINT_EVENTS.filter((evt) => {
      if (selectedLayer === 'MINING' && evt.category !== 'Mining & Energy') return false;
      if (selectedLayer === 'DEFI' && evt.category !== 'DeFi & Protocol' && evt.category !== 'Stablecoin & Liquidity') return false;
      if (selectedLayer === 'SOVEREIGN' && evt.category !== 'Sovereign & Regulatory') return false;
      if (selectedLayer === 'MEV' && evt.category !== 'Infrastructure & MEV') return false;
      if (selectedLayer === 'AI' && evt.category !== 'Crypto AI & Compute') return false;
      return true;
    });
  }, [selectedLayer]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    // Create real interactive world map instance
    const map = L.map(mapContainerRef.current, {
      center: [20, 15],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false, // We'll put custom tactical zoom controls
      attributionControl: true,
      worldCopyJump: true
    });

    // Add initial base tile layer (CartoDB Dark Matter)
    const provider = MAP_PROVIDERS[activeTileKey];
    const tileUrl = getTileUrl(activeTileKey);
    tileLayerRef.current = L.tileLayer(tileUrl, {
      subdomains: provider.subdomains,
      attribution: provider.attribution,
      maxZoom: provider.maxZoom
    }).addTo(map);

    // Create layer groups for markers and polylines
    markersLayerGroup.current = L.layerGroup().addTo(map);
    routesLayerGroup.current = L.layerGroup().addTo(map);

    // Track mouse coordinates for tactical HUD
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4))
      });
    });

    mapInstance.current = map;

    // Force map to re-calculate container size to prevent gray tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // 2. Handle Tile Layer switching (Tactical Dark vs Real Satellite vs OSM)
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const provider = MAP_PROVIDERS[activeTileKey];
    const tileUrl = getTileUrl(activeTileKey);

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      subdomains: provider.subdomains,
      attribution: provider.attribution,
      maxZoom: provider.maxZoom
    }).addTo(map);
  }, [activeTileKey, cartoKey]);

  // 3. Render Shipping Lanes & Maritime Routes
  useEffect(() => {
    if (!mapInstance.current || !routesLayerGroup.current) return;
    routesLayerGroup.current.clearLayers();

    if (showShippingLanes) {
      CRYPTO_DATA_CONDUITS.forEach((lane) => {
        const polyline = L.polyline(lane.coords, {
          color: lane.color,
          weight: 2.5,
          opacity: 0.75,
          dashArray: '6, 8',
          lineCap: 'round'
        });

        polyline.bindTooltip(
          `<div class="text-[11px] font-mono font-bold text-slate-100 px-2 py-0.5">${lane.name}</div>`,
          { sticky: true, className: 'leaflet-tactical-tooltip' }
        );

        routesLayerGroup.current?.addLayer(polyline);
      });
    }
  }, [showShippingLanes]);

  // 4. Render Markers for Strategic Chokepoints and OSINT Events
  useEffect(() => {
    if (!mapInstance.current || !markersLayerGroup.current) return;
    markersLayerGroup.current.clearLayers();

    // A. Render Strategic Chokepoints
    STRATEGIC_CHOKEPOINTS.forEach((choke) => {
      const isCritical = choke.status.includes('CRITICAL');
      const isHigh = choke.status.includes('HIGH') || choke.status.includes('ELEVATED');
      const pulseColor = isCritical ? 'rgba(239, 68, 68, 0.9)' : isHigh ? 'rgba(245, 158, 11, 0.9)' : 'rgba(6, 182, 212, 0.9)';
      const badgeBg = isCritical ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-cyan-500';

      const customIcon = L.divIcon({
        className: 'custom-chokepoint-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
            <div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${pulseColor};"></div>
            <div class="relative w-7 h-7 rounded-full border-2 border-white/80 ${badgeBg} flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-125">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="3"></circle>
                <line x1="12" y1="22" x2="12" y2="8"></line>
                <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
              </svg>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-slate-950/90 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700 text-cyan-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              ${choke.name}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([choke.lat, choke.lon], { icon: customIcon });

      marker.on('click', () => {
        soundEffects.playTick();
        setActiveItem({ type: 'CHOKEPOINT', data: choke });
      });

      marker.bindPopup(`
        <div class="p-3 font-mono text-xs max-w-[280px]">
          <div class="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
            <span class="text-cyan-400 font-bold tracking-wider uppercase text-[11px] flex items-center gap-1">
              <span class="w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-cyan-500'} animate-pulse"></span>
              MARITIME CHOKEPOINT
            </span>
            <span class="px-1.5 py-0.5 text-[9px] font-bold rounded ${isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">
              ${choke.status}
            </span>
          </div>
          <div class="font-bold text-sm text-slate-100 mb-1">${choke.name}</div>
          <div class="text-slate-400 text-[11px] mb-2">${choke.dailyFlow}</div>
          <div class="bg-slate-900/90 p-2 rounded border border-slate-800 space-y-1 mb-2">
            <div class="text-slate-300"><span class="text-slate-500">AVG DELAY:</span> <span class="text-amber-300 font-semibold">${choke.delayAvg}</span></div>
            <div class="text-slate-300"><span class="text-slate-500">PRIMARY THREAT:</span> ${choke.primaryThreat}</div>
          </div>
          <div class="text-[10px] text-cyan-400 underline cursor-pointer hover:text-cyan-300">Click to view transmission pipeline &amp; crypto models &rarr;</div>
        </div>
      `);

      markersLayerGroup.current?.addLayer(marker);
    });

    // B. Render Filtered OSINT Events
    filteredEvents.forEach((evt) => {
      const isCritical = evt.tier === 'CRITICAL';
      const isElevated = evt.tier === 'ELEVATED';
      const markerColor = isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#06b6d4';

      const customIcon = L.divIcon({
        className: 'custom-event-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 26px; height: 26px;">
            <div class="absolute inset-0 rounded-full animate-ping opacity-40" style="background-color: ${markerColor};"></div>
            <div class="w-5 h-5 rounded-full border border-slate-950 flex items-center justify-center shadow-md transition-transform transform group-hover:scale-125" style="background-color: ${markerColor};">
              <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-slate-950/90 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              ${evt.title.slice(0, 24)}...
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([evt.lat, evt.lon], { icon: customIcon });

      marker.on('click', () => {
        soundEffects.playTick();
        setActiveItem({ type: 'EVENT', data: evt });
      });

      marker.bindPopup(`
        <div class="p-3 font-mono text-xs max-w-[280px]">
          <div class="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
            <span class="text-xs font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'} uppercase">
              ${evt.category} // ${evt.tier}
            </span>
            <span class="text-[9px] text-slate-400">${evt.country}</span>
          </div>
          <div class="font-bold text-sm text-slate-100 mb-1.5">${evt.title}</div>
          <p class="text-slate-300 text-[11px] mb-2 leading-relaxed">${evt.summary.slice(0, 140)}...</p>
          <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>SOURCE: ${evt.source}</span>
            <span class="text-cyan-400 font-bold">Select for Intel &rarr;</span>
          </div>
        </div>
      `);

      markersLayerGroup.current?.addLayer(marker);
    });
  }, [filteredEvents]);

  // 5. Theater Quick Fly-To
  const flyToTheater = (theater: string) => {
    setSelectedTheater(theater);
    soundEffects.playTick();

    if (!mapInstance.current) return;

    switch (theater) {
      case 'MIDDLE EAST':
        mapInstance.current.flyTo([25.0, 52.0], 5, { duration: 1.5 });
        break;
      case 'INDO-PACIFIC':
        mapInstance.current.flyTo([16.0, 115.0], 4, { duration: 1.5 });
        break;
      case 'EUROPE':
        mapInstance.current.flyTo([48.0, 24.0], 4, { duration: 1.5 });
        break;
      case 'AMERICAS':
        mapInstance.current.flyTo([16.0, -82.0], 4, { duration: 1.5 });
        break;
      case 'RED SEA / HORN':
        mapInstance.current.flyTo([14.0, 44.0], 6, { duration: 1.5 });
        break;
      case 'GLOBAL':
      default:
        mapInstance.current.flyTo([20, 15], 3, { duration: 1.5 });
        break;
    }
  };

  const handleZoom = (delta: number) => {
    soundEffects.playTick();
    if (!mapInstance.current) return;
    mapInstance.current.setZoom(mapInstance.current.getZoom() + delta);
  };

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-100px)] min-h-[720px] bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Main Map Viewport */}
      <div className="flex-1 flex flex-col relative border-r border-slate-800">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Theater Quick Select */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono pointer-events-auto shadow-xl">
            <span className="px-2 py-1 text-slate-400 font-bold flex items-center space-x-1">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>THEATER:</span>
            </span>
            {['GLOBAL', 'MIDDLE EAST', 'INDO-PACIFIC', 'EUROPE', 'AMERICAS'].map((theater) => (
              <button
                key={theater}
                onClick={() => flyToTheater(theater)}
                className={`px-2 py-1 rounded transition-colors text-[11px] font-semibold ${
                  selectedTheater === theater
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {theater}
              </button>
            ))}
          </div>

          {/* Right Controls: Tile Type Switcher & Layer Filters */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Tile Provider Selector (Real Maps) */}
            <div className="flex items-center space-x-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono shadow-xl">
              <span className="px-2 py-1 text-slate-400 font-bold flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>MAP TILE:</span>
              </span>
              {(['tactical', 'satellite', 'osm'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    soundEffects.playTick();
                    setActiveTileKey(key);
                  }}
                  className={`px-2 py-1 rounded transition-colors text-[11px] font-semibold uppercase ${
                    activeTileKey === key
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {MAP_PROVIDERS[key].name}
                </button>
              ))}

              {/* Carto.com Key Badge & Direct Key Vault Launcher */}
              {onOpenApiVault && (
                <button
                  onClick={() => {
                    soundEffects.playTick();
                    onOpenApiVault();
                  }}
                  className={`ml-1 flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-semibold border transition-all hover:scale-105 ${
                    cartoKey
                      ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 hover:bg-cyan-900'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200'
                  }`}
                  title={
                    cartoKey
                      ? `Custom CARTO Key Active (${cartoKey.slice(0, 5)}...). Click to manage in Key Vault.`
                      : 'CARTO Dark Matter Free Public Basemap is active out-of-the-box (no key required). Click to enter a custom carto.com API key.'
                  }
                >
                  <Key className="w-3 h-3 text-cyan-400" />
                  <span>{cartoKey ? 'CARTO: CUSTOM KEY' : 'CARTO: FREE PUBLIC'}</span>
                </button>
              )}
            </div>

            {/* Layer Filter Toggles */}
            <div className="flex items-center space-x-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono shadow-xl">
              <span className="px-2 py-1 text-slate-400 font-bold flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>LAYER:</span>
              </span>
              {(['ALL', 'MINING', 'DEFI', 'SOVEREIGN', 'MEV', 'AI'] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => {
                    soundEffects.playTick();
                    setSelectedLayer(layer);
                  }}
                  className={`px-2 py-1 rounded transition-colors text-[11px] font-semibold ${
                    selectedLayer === layer
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real World Map Container */}
        <div 
          ref={mapContainerRef} 
          className="flex-1 w-full h-full relative z-0" 
          style={{ minHeight: '500px' }}
        />

        {/* Tactical Overlay Controls (Left Floating HUD) */}
        <div className="absolute left-4 bottom-12 z-[500] flex flex-col space-y-2 pointer-events-auto">
          {/* Zoom controls */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 flex flex-col space-y-1 shadow-lg font-mono">
            <button
              onClick={() => handleZoom(1)}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-800 w-full" />
            <button
              onClick={() => handleZoom(-1)}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-800 w-full" />
            <button
              onClick={() => flyToTheater('GLOBAL')}
              title="Reset Global View"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Conduit Toggle Button */}
          <button
            onClick={() => {
              soundEffects.playTick();
              setShowShippingLanes(!showShippingLanes);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium backdrop-blur-md flex items-center space-x-1.5 shadow-lg transition-colors ${
              showShippingLanes 
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' 
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>CONDUITS: {showShippingLanes ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Bottom Tactical Telemetry Bar */}
        <div className="h-8 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between px-4 text-[11px] font-mono text-slate-400 z-10">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 font-bold">GLOBAL CRYPTO INFRA ENGINE</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>PROVIDER: <span className="text-emerald-400">{MAP_PROVIDERS[activeTileKey].name}</span></span>
            <span className="text-slate-600">|</span>
            <span>CHOKEPOINTS: <span className="text-cyan-400 font-bold">{STRATEGIC_CHOKEPOINTS.length} MONITORED</span></span>
            <span className="text-slate-600">|</span>
            <span>ON-CHAIN OSINT: <span className="text-amber-400 font-bold">{filteredEvents.length} ACTIVE</span></span>
          </div>

          <div className="flex items-center space-x-4">
            {cursorCoords && (
              <span className="text-cyan-400 font-medium">
                GPS: {cursorCoords.lat.toFixed(4)}°N, {cursorCoords.lng.toFixed(4)}°E
              </span>
            )}
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">DEFCON 2 STATUS: <span className="text-red-400 font-bold">ELEVATED CRYPTO SHOCK</span></span>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Strategic Intelligence Dossier */}
      <div className="w-full xl:w-96 bg-slate-900/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto border-t xl:border-t-0 border-slate-800 shadow-2xl z-20">
        {activeItem ? (
          <div className="p-5 space-y-5">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold flex items-center space-x-1">
                  {activeItem.type === 'CHOKEPOINT' ? <Anchor className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>{activeItem.type === 'CHOKEPOINT' ? 'STRATEGIC CRYPTO INFRA CHOKEPOINT' : 'ON-CHAIN INTELLIGENCE EVENT'}</span>
                </span>
                <span className="text-slate-400 text-[10px] font-mono">
                  {activeItem.type === 'CHOKEPOINT' ? 'MONITORED REAL-TIME' : activeItem.data.tier}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 font-mono tracking-tight">
                {activeItem.type === 'CHOKEPOINT' ? activeItem.data.name : activeItem.data.title}
              </h2>
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mt-1">
                <span>LAT: {activeItem.data.lat}°</span>
                <span>•</span>
                <span>LON: {activeItem.data.lon}°</span>
                <span>•</span>
                <span className="text-cyan-400">
                  {activeItem.type === 'CHOKEPOINT' ? activeItem.data.status : activeItem.data.country}
                </span>
              </div>
            </div>

            {/* Chokepoint Specifics */}
            {activeItem.type === 'CHOKEPOINT' && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">THROUGHPUT / FLOW:</span>
                    <span className="text-slate-200 font-semibold">{activeItem.data.dailyFlow}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">AVERAGE LATENCY JITTER:</span>
                    <span className="text-amber-400 font-bold">{activeItem.data.delayAvg}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-400 block mb-1">PRIMARY THREAT VECTOR:</span>
                    <span className="text-red-400 font-medium">{activeItem.data.primaryThreat}</span>
                  </div>
                </div>

                {/* Quantitative Pipeline Action */}
                <div className="bg-cyan-950/30 p-4 rounded-lg border border-cyan-800/50 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-300">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>ASSOCIATED CRYPTO TRANSMISSION PIPELINE</span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    {activeItem.data.pipelineRef}
                  </p>
                  <button
                    onClick={() => {
                      soundEffects.playPipelineOpen();
                      onSelectPipeline(activeItem.data.pipelineId);
                    }}
                    className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/40"
                  >
                    <span>ANALYZE SQUEEZE PIPELINE #{activeItem.data.pipelineId}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Event Specifics */}
            {activeItem.type === 'EVENT' && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">SOURCE TIER:</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      activeItem.data.sourceType === 'PRIMARY' ? 'text-emerald-400' : 'text-cyan-400'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {activeItem.data.sourceType === 'PRIMARY' ? 'RAW PRIMARY (SEC/CFTC/RPC)' : 'SECONDARY MARKET INTEL'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">CATEGORY:</span>
                    <span className="text-cyan-300 font-bold">{activeItem.data.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">SOURCE:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{activeItem.data.source}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">TIMESTAMP:</span>
                    <span className="text-amber-400">{activeItem.data.timestamp}</span>
                  </div>
                </div>

                {activeItem.data.rawTelemetry && (
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-emerald-900/40 text-[10px] font-mono space-y-1">
                    <div className="text-emerald-400 uppercase font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>RAW PROTOCOL / REGULATORY AUDIT</span>
                    </div>
                    <p className="text-slate-300 break-all">{activeItem.data.rawTelemetry}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    SITUATIONAL SUMMARY
                  </h4>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded border border-slate-800">
                    {activeItem.data.summary}
                  </p>
                </div>

                {/* Affected Crypto Assets */}
                {activeItem.data.affectedTickers && activeItem.data.affectedTickers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                      DIRECTLY AFFECTED DIGITAL ASSETS &amp; TOKENS
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeItem.data.affectedTickers.map((t: string) => (
                        <span
                          key={t}
                          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono font-bold text-slate-200"
                        >
                          ${t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeItem.data.sourceUrl && (
                  <a
                    href={activeItem.data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs rounded transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Direct Primary Source Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {activeItem.data.pipelineId && (
                  <button
                    onClick={() => {
                      soundEffects.playPipelineOpen();
                      onSelectPipeline(activeItem.data.pipelineId);
                    }}
                    className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/40"
                  >
                    <span>OPEN LINKED CRYPTO TRANSMISSION MODEL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center h-full space-y-3">
            <Crosshair className="w-8 h-8 text-slate-600" />
            <p>Select any mining grid hub, validator node, or on-chain OSINT node on the map to inspect tactical telemetry.</p>
          </div>
        )}

        {/* Global Chokepoints Quick Jump Strip */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
            <span>CRYPTO INFRASTRUCTURE CHOKEPOINTS</span>
            <span className="text-cyan-400">7 KEY CONDUITS</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {STRATEGIC_CHOKEPOINTS.map((choke) => (
              <button
                key={choke.name}
                onClick={() => {
                  soundEffects.playTick();
                  setActiveItem({ type: 'CHOKEPOINT', data: choke });
                  if (mapInstance.current) {
                    mapInstance.current.flyTo([choke.lat, choke.lon], 7, { duration: 1.2 });
                  }
                }}
                className={`p-1.5 text-left rounded text-[10px] border transition-colors truncate ${
                  activeItem?.data?.name === choke.name
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {choke.name.split(' ')[0]} {choke.name.split(' ')[1] || ''}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

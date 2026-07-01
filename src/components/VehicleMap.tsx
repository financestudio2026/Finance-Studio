import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Vehicle } from "../types";
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw, Key, Info, Radio, Settings } from "lucide-react";

interface VehicleMapProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onRefresh: () => void;
}

// Extract the Google Maps API Key securely mapped in the Vite config
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.trim() !== "";

export default function VehicleMap({ vehicles, selectedVehicle, onRefresh }: VehicleMapProps) {
  // Center defaults to India center if no vehicle selected
  const defaultCenter = { lat: 20.5937, lng: 78.9629 };
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(5);
  const [simulatedVehicles, setSimulatedVehicles] = useState<Vehicle[]>(vehicles);
  const [activeSimId, setActiveSimId] = useState<string | null>(null);

  // Update center when selected vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      setCenter({ lat: selectedVehicle.lat, lng: selectedVehicle.lng });
      setZoom(13);
      setActiveSimId(selectedVehicle.id);
    }
  }, [selectedVehicle]);

  // Real-time GPS location simulation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedVehicles((prev) =>
        prev.map((v) => {
          // Add small random offset to simulate active vehicle driving
          const deltaLat = (Math.random() - 0.5) * 0.0008;
          const deltaLng = (Math.random() - 0.5) * 0.0008;
          
          return {
            ...v,
            lat: v.lat + deltaLat,
            lng: v.lng + deltaLng,
            lastUpdated: new Date().toISOString()
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Update simulation whenever fresh Firestore vehicles are loaded
  useEffect(() => {
    setSimulatedVehicles((prev) => {
      return vehicles.map((v) => {
        const existing = prev.find((p) => p.id === v.id);
        return existing ? { ...v, lat: existing.lat, lng: existing.lng, lastUpdated: existing.lastUpdated } : v;
      });
    });
  }, [vehicles]);

  const activeVehicle = simulatedVehicles.find((v) => v.id === activeSimId) || selectedVehicle || simulatedVehicles[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-4" id="vehicle_tracking_map_container">
      {/* Live tracking sidebar list */}
      <div className="p-5 border-r border-slate-200 flex flex-col justify-between h-[500px] lg:h-[600px] bg-slate-50/50">
        <div className="space-y-4 overflow-y-auto max-h-[85%]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                Live Tracking
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">वाहन लाइव लोकेशन ट्रैकिंग</p>
            </div>
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Refresh GPS positions"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {simulatedVehicles.map((v) => {
              const isActive = activeSimId === v.id;
              
              return (
                <button
                  key={v.id}
                  id={`map_sidebar_item_${v.id}`}
                  onClick={() => {
                    setActiveSimId(v.id);
                    setCenter({ lat: v.lat, lng: v.lng });
                    setZoom(14);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? "bg-white border-indigo-500/30 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{v.type}</span>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">{v.regNo}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px] font-semibold">{v.model}</p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${v.status === "Active" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`}></span>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-slate-150 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Compass className="h-3 w-3 text-slate-400" />
                    <span>Lat: {v.lat.toFixed(4)}, Lng: {v.lng.toFixed(4)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Vehicle Panel */}
        {activeVehicle && (
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-auto">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 border border-indigo-100">
                <Navigation className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Selected Tracker</span>
                <span className="text-xs font-black text-slate-800">{activeVehicle.regNo}</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              GPS Online • Last: Just now
            </p>
          </div>
        )}
      </div>

      {/* Map visualizer canvas */}
      <div className="lg:col-span-3 h-[500px] lg:h-[600px] relative bg-slate-100">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              center={center}
              zoom={zoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: "100%", height: "100%" }}
            >
              {simulatedVehicles.map((v) => (
                <AdvancedMarker
                  key={v.id}
                  position={{ lat: v.lat, lng: v.lng }}
                  onClick={() => {
                    setActiveSimId(v.id);
                    setCenter({ lat: v.lat, lng: v.lng });
                    setZoom(14);
                  }}
                >
                  <Pin 
                    background={v.status === "Active" ? "#10B981" : "#F59E0B"} 
                    glyphColor="#FFF" 
                    borderColor="#FFF"
                  />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        ) : (
          /* High-polish mock visual map fallback with GMP setup guide */
          <div className="w-full h-full relative overflow-hidden bg-slate-900 font-sans" id="fallback_gps_map">
            {/* Mock Vector Map Graphics */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              {/* Map grids and roads */}
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              
              {/* Diagonal mock highway */}
              <div className="absolute top-1/4 left-0 w-full h-12 bg-slate-800 -rotate-12 border-y border-slate-700"></div>
              <div className="absolute top-2/3 left-0 w-full h-10 bg-slate-800 rotate-45 border-y border-slate-700"></div>
              
              {/* Central city ring */}
              <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border border-slate-800"></div>
              </div>
            </div>

            {/* Displaying Mock Live Location Pins in real-time */}
            {simulatedVehicles.map((v) => {
              const isActive = activeSimId === v.id;
              
              // Scale coordinates to fit visual mock map bounds gracefully
              // We'll normalize coordinates relative to active viewport
              const xPos = 10 + ((v.lng - 70) * 8) % 80;
              const yPos = 80 - ((v.lat - 10) * 4) % 70;

              return (
                <div
                  key={v.id}
                  onClick={() => setActiveSimId(v.id)}
                  style={{ left: `${xPos}%`, top: `${yPos}%` }}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 z-10"
                >
                  <div className="relative">
                    {/* Ring ripple */}
                    {v.status === "Active" && (
                      <span className="absolute -inset-2 rounded-full bg-indigo-500/20 animate-ping"></span>
                    )}
                    
                    {/* Location Pin */}
                    <div className={`p-2 rounded-full border shadow-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isActive
                        ? "bg-indigo-600 border-white text-white scale-125"
                        : v.status === "Active"
                        ? "bg-emerald-500 border-white text-white"
                        : "bg-amber-500 border-white text-white"
                    }`}>
                      <MapPin className="h-4 w-4" />
                    </div>

                    {/* Popover label */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-950/90 text-[10px] text-white px-2 py-0.5 rounded-md font-bold whitespace-nowrap z-20 shadow-md">
                      {v.regNo} ({v.type})
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Setup Instructions Overlay (Constitution Rule 1C) */}
            <div className="absolute inset-x-4 top-4 bg-slate-950/85 backdrop-blur-md p-4 rounded-xl border border-slate-800 max-w-xl mx-auto z-20 text-xs shadow-2xl text-slate-300">
              <div className="flex gap-3 items-start">
                <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400 shrink-0 border border-indigo-500/30">
                  <Key className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Google Maps Platform API Key Required
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/15 text-yellow-500 rounded font-normal">Mock Mode Active</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    To track vehicle fleet locations accurately on actual Google Maps, follow these steps to add your API Key:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px] mt-1.5 font-mono">
                    <li>
                      <a 
                        href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-400 underline hover:text-indigo-300 inline-flex items-center gap-0.5"
                      >
                        Get an API Key from Google Cloud Console
                      </a>
                    </li>
                    <li>Open <b>Settings</b> (⚙️ gear icon, top-right corner) → <b>Secrets</b>.</li>
                    <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as secret name, press Enter.</li>
                    <li>Paste your API key value, press Enter.</li>
                  </ol>
                  <p className="text-[10px] text-slate-500 pt-1">
                    * The app will rebuild automatically. Currently showing live-simulation tracking.
                  </p>
                </div>
              </div>
            </div>

            {/* Simulated Live GPS Terminal Monitor */}
            <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 max-w-xs text-[10px] font-mono text-emerald-400 z-20 shadow-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-white font-bold font-sans">
                <Radio className="h-3 w-3 text-rose-500 animate-pulse" />
                <span>Simulated GPS Receiver Feed</span>
              </div>
              <div className="space-y-0.5 text-emerald-500/95 leading-tight">
                <p>&gt; CONN: GPS-Receiver-M1 established</p>
                {simulatedVehicles.map(v => (
                  <p key={v.id}>
                    &gt; {v.regNo} : LAT={v.lat.toFixed(4)} LNG={v.lng.toFixed(4)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

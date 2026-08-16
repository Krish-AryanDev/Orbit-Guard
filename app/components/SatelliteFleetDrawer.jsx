"use client";

import { X, Orbit } from 'lucide-react';

export function SatelliteFleetDrawer({
  isOpen,
  onClose,
  satellites = [],
  selectedSatellite,
  onSelectSatellite,
  threatActive,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 font-mono"
    >
      <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Orbit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                MONITORED SATELLITE FLEET
              </h2>
              <p className="text-xs font-mono text-slate-400">
                10 Active Constellation Assets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Satellite List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {satellites.map((sat) => {
            const isSelected = selectedSatellite?.id === sat.id;
            const isTargeted = threatActive && sat.id === 'sat-4';

            return (
              <div
                key={sat.id}
                onClick={() => onSelectSatellite?.(sat)}
                className={`p-4 rounded-xl border transition-all cursor-pointer font-mono ${
                  isTargeted
                    ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{sat.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sat.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      NORAD ID: #{sat.noradId} | {sat.purpose}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      isTargeted
                        ? 'bg-red-900 text-red-200 border border-red-500 animate-pulse'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {isTargeted ? 'CRITICAL' : sat.status}
                  </span>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ALTITUDE</span>
                    <span className="text-slate-200">{sat.altitudeKm} km</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">VELOCITY</span>
                    <span className="text-slate-200">{sat.velocityKmS} km/s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">FUEL LEVEL</span>
                    <span className="text-cyan-400 font-bold">{sat.fuelPct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

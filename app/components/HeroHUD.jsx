"use client";
import { Rocket, Terminal, RotateCcw } from 'lucide-react';

export function HeroHUD({ threatLevel, onLaunchDebris, onResetSimulation, onEnterMissionControl }) {
  const isThreat = threatLevel === 'CRITICAL';
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-10 lg:p-14">
      <div className="pointer-events-auto max-w-sm pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {!isThreat ? (
            <button
              onClick={onLaunchDebris}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-mono font-medium text-xs tracking-wider border border-orange-500/60 shadow-[0_2px_16px_rgba(234,88,12,0.35)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>LAUNCH DEBRIS</span>
            </button>
          ) : (
            <button
              onClick={onResetSimulation}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-medium text-xs tracking-wider border border-red-500/60 shadow-[0_2px_16px_rgba(220,38,38,0.4)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET SIMULATION</span>
            </button>
          )}
          <button
            onClick={onEnterMissionControl}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white border border-white/15 text-xs font-mono tracking-wider backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>ENTER MISSION CONTROL</span>
          </button>
        </div>
      </div>
    </div>
  );
}

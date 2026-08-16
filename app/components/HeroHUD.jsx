"use client";
import { Rocket, RotateCcw } from 'lucide-react';

export function HeroHUD({ threatLevel, onLaunchDebris, onResetSimulation }) {
  const isThreat = threatLevel === 'CRITICAL';
  return (
    <div
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      className="pointer-events-none absolute bottom-8 sm:bottom-12 left-6 sm:left-12 lg:left-16 z-30 font-mono"
    >
      <div
        onWheel={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="pointer-events-auto flex items-center gap-3"
      >
        {!isThreat ? (
          <button
            onClick={onLaunchDebris}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs tracking-wider border border-orange-500/60 shadow-[0_4px_20px_rgba(234,88,12,0.4)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>LAUNCH DEBRIS</span>
          </button>
        ) : (
          <button
            onClick={onResetSimulation}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs tracking-wider border border-red-500/60 shadow-[0_4px_20px_rgba(220,38,38,0.4)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET SIMULATION</span>
          </button>
        )}
      </div>
    </div>
  );
}

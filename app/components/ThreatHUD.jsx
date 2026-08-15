"use client";
import { useEffect, useState } from 'react';
import { AlertOctagon, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function ThreatHUD({ threatActive, onExecuteManeuver }) {
  const [countdown, setCountdown] = useState(222);

  useEffect(() => {
    if (!threatActive) { setCountdown(222); return; }
    const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [threatActive]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <aside className="pointer-events-none absolute top-20 right-6 sm:right-10 lg:right-14 z-30 w-[92%] sm:w-80">
      {threatActive ? (
        <div className="pointer-events-auto p-4 rounded-lg bg-black/85 border border-red-500/60 backdrop-blur-xl font-mono text-xs shadow-[0_8px_32px_rgba(0,0,0,0.8)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 font-bold tracking-wider text-[11px]">
              <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
              <span>THREAT DETECTED</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-500/40">CRITICAL</span>
          </div>

          <div className="p-2.5 rounded bg-red-950/40 border border-red-500/30">
            <div className="text-[10px] text-slate-400">CONJUNCTION PAIR</div>
            <div className="text-sm font-bold text-white tracking-wide mt-0.5">
              <span className="text-orange-400">DEB-047</span>
              <span className="text-slate-400 mx-1.5">→</span>
              <span className="text-cyan-300">SAT-04</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-400"><span>VELOCITY:</span><span className="text-white font-medium">10.42 km/s</span></div>
            <div className="flex justify-between text-slate-400"><span>TIME TO CLOSEST APPROACH:</span><span className="text-amber-300 font-bold">{timeFormatted}</span></div>
            <div className="flex justify-between text-slate-400"><span>MISS DISTANCE:</span><span className="text-white font-bold">142 m</span></div>
            <div className="flex justify-between text-slate-400"><span>COLLISION RISK:</span><span className="text-red-400 font-bold">8.42 × 10⁻³</span></div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-white/10">
              <span>STATUS:</span>
              <span className="text-red-400 font-bold uppercase tracking-wider">ACTION REQUIRED</span>
            </div>
          </div>

          <button
            onClick={onExecuteManeuver}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-medium text-xs tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>EXECUTE EVASIVE MANEUVER</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="pointer-events-auto p-3.5 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md font-mono text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-semibold tracking-wide">THREAT ANALYSIS</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-emerald-400 font-medium">NOMINAL</span>
          </div>
          <div className="space-y-1 text-[10px] text-slate-400 pt-1 border-t border-white/5">
            <div className="flex justify-between"><span>CONJUNCTION RISK:</span><span className="text-emerald-400 font-medium">0.00%</span></div>
            <div className="flex justify-between"><span>MONITORED SATS:</span><span className="text-slate-200">10 / 10 Active</span></div>
            <div className="flex justify-between"><span>STATUS:</span><span className="text-emerald-400">ALL ASSETS SAFE</span></div>
          </div>
        </div>
      )}
    </aside>
  );
}

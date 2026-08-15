"use client";

import { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Orbit, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

export function Navbar({ threatLevel, onOpenFleet }) {
  const [time, setTime] = useState('');
  const isThreat = threatLevel === 'CRITICAL';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-5 sm:px-10 py-3 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-black/60 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold font-mono tracking-widest text-white">ORBITGUARD</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">v1.0</span>
          </div>
        </div>

        {/* Center: live UTC + sys status */}
        <div className="hidden md:flex items-center gap-6 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>UTC:</span>
            <span className="text-slate-200">{time || '2026-08-16 04:00:00 UTC'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>SYS:</span>
            <span className={isThreat ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {isThreat ? 'ALERT' : 'NOMINAL'}
            </span>
          </div>
        </div>

        {/* Right: asset badge + fleet button */}
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px] border ${
            isThreat ? 'bg-red-950/40 border-red-500/40 text-red-400' : 'bg-black/40 border-white/10 text-slate-300'
          }`}>
            {isThreat ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            <span>10 / 10 ASSETS</span>
          </div>

          <button
            onClick={onOpenFleet}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-mono transition-all cursor-pointer"
          >
            <Orbit className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Fleet</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
}

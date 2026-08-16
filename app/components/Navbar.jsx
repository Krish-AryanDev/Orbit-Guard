"use client";

import { useState, useEffect } from 'react';
import { Shield, Clock, Activity, AlertTriangle, CheckCircle2, Globe2 } from 'lucide-react';

export function Navbar({ threatLevel }) {
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('2026-08-16');
  const isThreat = threatLevel === 'CRITICAL';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s}`);
      setDateStr(now.toISOString().substring(0, 10));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 sm:px-12 lg:px-16 py-4 sm:py-5 bg-black/90 backdrop-blur-2xl border-b border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
      <div className="w-full flex items-center justify-between gap-6">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-slate-900 to-black border border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span
                style={{ fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif" }}
                className="text-lg sm:text-xl font-black tracking-[0.2em] text-white leading-none drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
              >
                ORBITGUARD
              </span>
              <span
                style={{ fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif" }}
                className="text-[9px] text-cyan-400 font-semibold tracking-[0.15em] mt-1.5 uppercase"
              >
                AEROSPACE DEFENSE SYSTEM
              </span>
            </div>
            <span
              style={{ fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif" }}
              className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hidden sm:inline"
            >
              v1.0
            </span>
          </div>
        </div>

        {/* Right: Crystal Clear Live Earth Clock & System Status */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono">
          {/* High-Contrast Crystal Clear Earth Time Box */}
          <div className="flex items-center gap-3.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-black/95 border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            {/* Globe Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
              <Globe2 className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: '40s' }} />
            </div>

            {/* Time Typography */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>EARTH TIME (UTC)</span>
                <span className="text-slate-400 font-normal hidden md:inline">• {dateStr}</span>
              </div>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-white font-black text-lg sm:text-xl tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                  {timeStr}
                </span>
                <span className="text-cyan-400 font-bold text-xs sm:text-sm tracking-wider">
                  UTC
                </span>
              </div>
            </div>
          </div>

          {/* System Status Pill */}
          <div className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border font-mono text-xs ${
            isThreat
              ? 'bg-red-950/80 border-2 border-red-500 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : 'bg-black/90 border border-white/20 text-slate-200'
          }`}>
            {isThreat ? (
              <AlertTriangle className="w-4 h-4 text-red-400 animate-ping" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-[10px] text-slate-400">STATUS:</span>
            <span className={`font-black tracking-wider text-xs ${isThreat ? 'text-red-400' : 'text-emerald-400'}`}>
              {isThreat ? 'CRITICAL_ALERT' : 'NOMINAL'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

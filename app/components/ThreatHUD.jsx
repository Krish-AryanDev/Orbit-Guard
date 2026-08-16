"use client";
import { useState, useEffect, useMemo } from 'react';
import { AlertOctagon, ArrowRight, ShieldCheck, Zap, Flame, RotateCcw, CheckCircle2, Terminal, ShieldAlert, Activity, TrendingDown } from 'lucide-react';

// ─── Real-Time Conjunction & Proximity Dynamic Graph ─────────────────────────
function RealTimeConjunctionGraph({ threatActive, countdown, isBlasted, maneuverSuccess }) {
  const seconds = Math.max(0, countdown);
  const timeElapsed = 10 - seconds; // 0s to 10s

  // Compute live current distance & collision probability
  const currentDistance = isBlasted
    ? 0
    : maneuverSuccess
    ? 18450
    : Math.max(0, Math.round((seconds / 10) * 3200));

  const collisionRiskPct = isBlasted
    ? 100
    : maneuverSuccess
    ? 0.0
    : !threatActive
    ? 0.0
    : Math.min(99.9, Math.max(0.01, Math.pow((10 - seconds) / 10, 2.5) * 100));

  // Generate SVG curve points across 10-second timeline (Width: 300, Height: 80)
  const svgWidth = 300;
  const svgHeight = 80;
  const padding = { top: 8, bottom: 18, left: 30, right: 12 };
  const graphW = svgWidth - padding.left - padding.right;
  const graphH = svgHeight - padding.top - padding.bottom;

  // Build real-time path points
  const points = useMemo(() => {
    const pts = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 10; // 0 to 10s
      let d;
      if (t <= timeElapsed) {
        // Elapsed curve
        d = maneuverSuccess && t > 5 ? 18450 : Math.max(0, 3200 * ((10 - t) / 10));
      } else {
        // Projected curve
        d = Math.max(0, 3200 * ((10 - t) / 10));
      }
      const x = padding.left + (t / 10) * graphW;
      const normalizedD = Math.min(3200, d) / 3200; // 1.0 (far) to 0.0 (close)
      const y = padding.top + (1 - normalizedD) * graphH; // y increases downwards
      pts.push({ x, y, t, d });
    }
    return pts;
  }, [timeElapsed, maneuverSuccess, graphW, graphH, padding.left, padding.top]);

  // Current active blip coordinate
  const currentX = padding.left + (Math.min(10, timeElapsed) / 10) * graphW;
  const normalizedCurrD = Math.min(3200, currentDistance) / 3200;
  const currentY = padding.top + (1 - normalizedCurrD) * graphH;

  // Build SVG path string
  const pathString = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  const areaPath = `${pathString} L ${padding.left + graphW} ${padding.top + graphH} L ${padding.left} ${padding.top + graphH} Z`;

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="p-3.5 rounded-xl bg-black/95 border border-cyan-500/50 backdrop-blur-2xl font-mono text-xs shadow-[0_8px_30px_rgba(0,0,0,0.85)] space-y-2.5"
    >
      {/* Graph Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/30">
        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider text-[11px]">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>PROXIMITY & CONJUNCTION TRAJECTORY</span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 border border-cyan-500/30 text-[10px]">
          <span className="text-slate-400">P(c):</span>
          <span className={`font-bold ${collisionRiskPct > 50 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {collisionRiskPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Real-time Telemetry Stats Pill */}
      <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/80 p-2 rounded-lg border border-white/10 shadow-inner">
        <div className="flex flex-col">
          <span className="text-slate-400">CLOSING RATE:</span>
          <span className="text-white font-bold tracking-wider text-xs">
            {threatActive && !isBlasted && !maneuverSuccess ? '-10.42 km/s' : '0.00 km/s'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400">CURRENT DISTANCE:</span>
          <span className={`font-bold tracking-wider text-xs ${currentDistance < 800 ? 'text-red-400' : 'text-cyan-300'}`}>
            {currentDistance.toLocaleString()} m
          </span>
        </div>
      </div>

      {/* SVG Real-Time Dynamic Compact Graph Canvas */}
      <div className="relative w-full overflow-hidden rounded-lg bg-slate-950/90 border border-cyan-500/30 p-1 shadow-inner">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-24 sm:h-28">
          <defs>
            <linearGradient id="cyanAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="redAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Guidelines */}
          <line x1={padding.left} y1={padding.top} x2={padding.left + graphW} y2={padding.top} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={padding.left} y1={padding.top + graphH * 0.5} x2={padding.left + graphW} y2={padding.top + graphH * 0.5} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={padding.left} y1={padding.top + graphH} x2={padding.left + graphW} y2={padding.top + graphH} stroke="#334155" strokeWidth="1.5" />

          {/* Left Y-Axis Distance Labels */}
          <text x="3" y={padding.top + 4} fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">3.2k</text>
          <text x="3" y={padding.top + graphH * 0.5 + 3} fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">1.6k</text>
          <text x="5" y={padding.top + graphH + 2} fill="#ef4444" fontSize="7" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">0m</text>

          {/* Area Fill Under Dynamic Curve */}
          <path d={areaPath} fill={threatActive && currentDistance < 1000 ? "url(#redAreaGradient)" : "url(#cyanAreaGradient)"} />

          {/* Main Trajectory Curve */}
          <path
            d={pathString}
            fill="none"
            stroke={threatActive && currentDistance < 1000 ? "#ef4444" : "#00f0ff"}
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Bottom X-Axis Timeline Markers */}
          <text x={padding.left} y={svgHeight - 4} fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">T-10s</text>
          <text x={padding.left + graphW * 0.5 - 8} y={svgHeight - 4} fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">T-5s</text>
          <text x={padding.left + graphW - 14} y={svgHeight - 4} fill="#ef4444" fontSize="7" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">IMPACT</text>

          {/* Real-time Ticking Radar Blip */}
          {threatActive && !isBlasted && (
            <g>
              <circle cx={currentX} cy={currentY} r="6" fill="#ef4444" opacity="0.3" className="animate-ping" />
              <circle cx={currentX} cy={currentY} r="3.5" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      </div>

      {/* Footer Telemetry Chips */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/10 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>RADAR SAMPLING: 50 Hz</span>
        </div>
        <span className="text-cyan-400 font-bold">LIVE TELEMETRY STREAM</span>
      </div>
    </div>
  );
}

export function ThreatHUD({
  threatActive,
  threatData,
  countdown = 10,
  isBlasted = false,
  maneuverSuccess = false,
  onExecuteManeuver,
  onLaunchDebris,
  onResetSimulation
}) {
  const seconds = Math.max(0, Math.floor(countdown));
  const timeFormatted = `00:${String(seconds).padStart(2, '0')}`;

  const debrisName = threatData?.debrisName || "DEB-047 (HIGH-VELOCITY FRAG)";
  const satName = threatData?.targetSatelliteName || threatData?.targetSatelliteCode || "SAT-04 Delta";
  const debrisSpeed = threatData?.relativeSpeed ? `${threatData.relativeSpeed} km/s` : "10.42 km/s";
  const debrisAltitude = threatData?.altitudeKm ? `${threatData.altitudeKm} km` : "840 km";
  
  // Miss distance counts down towards 0 at 10s
  const currentDistanceM = isBlasted
    ? 0
    : Math.max(15, Math.round((seconds / 10) * 3200));
  const missDistance = `${currentDistanceM} m`;

  return (
    <aside
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute top-28 sm:top-32 right-4 sm:right-8 lg:right-12 z-30 w-[94%] sm:w-88 space-y-3 font-mono"
    >
      {/* ─── 1. THREAT ANALYSIS HUD ─── */}
      {isBlasted ? (
        /* CRITICAL BLAST / IMPACT HUD */
        <div className="pointer-events-auto p-4 rounded-xl bg-red-950/95 border-2 border-red-500 backdrop-blur-2xl font-mono text-xs shadow-[0_0_40px_rgba(239,68,68,0.6)] space-y-3 animate-bounce">
          <div className="flex items-center justify-between pb-2 border-b border-red-500/40">
            <div className="flex items-center gap-2 text-red-300 font-bold tracking-wider text-[11px]">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>SATELLITE DESTROYED</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-red-900 text-red-100 font-black border border-red-400 animate-ping">
              BLAST IMPACT
            </span>
          </div>

          <div className="p-3 rounded-lg bg-black/70 border border-red-500/40 space-y-1">
            <div className="text-[10px] text-red-300 uppercase tracking-wide">COLLISION TARGET</div>
            <div className="text-sm font-black text-white">{satName}</div>
            <p className="text-[11px] text-red-200 mt-1">
              Catastrophic hypervelocity collision occurred at T+10s. Asset destroyed.
            </p>
          </div>

          <button
            onClick={onResetSimulation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs tracking-wider transition-all shadow-lg cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET ORBITAL SIMULATION</span>
          </button>
        </div>
      ) : maneuverSuccess ? (
        /* MANEUVER EXECUTED SUCCESS HUD */
        <div className="pointer-events-auto p-4 rounded-xl bg-emerald-950/95 border-2 border-emerald-500 backdrop-blur-2xl font-mono text-xs shadow-[0_0_36px_rgba(16,185,129,0.4)] space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/40">
            <div className="flex items-center gap-2 text-emerald-300 font-bold tracking-wider text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>LASER STRIKE COMPLETE</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-100 font-bold border border-emerald-400">
              DESTROYED
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">TARGET ASSET:</span>
              <span className="text-emerald-300 font-bold">{satName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DIRECTED LASER:</span>
              <span className="text-cyan-300 font-bold">100 kW PULSE (HIT)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DEBRIS STATUS:</span>
              <span className="text-emerald-400 font-bold">VAPORIZED IN BLAST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ORBIT STATUS:</span>
              <span className="text-emerald-300 font-bold">SAFE & SECURED</span>
            </div>
          </div>

          <button
            onClick={onResetSimulation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs tracking-wider transition-all border border-slate-600 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET SIMULATION</span>
          </button>
        </div>
      ) : threatActive ? (
        /* ACTIVE 10S THREAT ANALYSIS HUD */
        <div className="pointer-events-auto p-4 rounded-xl bg-black/95 border-2 border-red-500/80 backdrop-blur-2xl font-mono text-xs shadow-[0_8px_36px_rgba(239,68,68,0.4)] space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 font-bold tracking-wider text-[11px]">
              <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
              <span>THREAT ANALYSIS</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-red-950 text-red-200 font-bold border border-red-500/60 uppercase animate-ping">
              CRITICAL
            </span>
          </div>

          {/* Conjunction Target Banner */}
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30">
            <div className="text-[10px] text-slate-400">INCOMING INTERCEPT PAIR</div>
            <div className="text-xs font-bold text-white tracking-wide mt-1 flex items-center justify-between">
              <span className="text-orange-400 truncate max-w-[130px]">{debrisName}</span>
              <span className="text-slate-400 mx-1">→</span>
              <span className="text-cyan-300 truncate max-w-[130px]">{satName}</span>
            </div>
          </div>

          {/* Debris Telemetry Grid */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>DEBRIS SPEED:</span>
              <span className="text-white font-bold">{debrisSpeed}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>DEBRIS ALTITUDE:</span>
              <span className="text-cyan-300 font-bold">{debrisAltitude}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>EST. MISS DISTANCE:</span>
              <span className="text-white font-bold">{missDistance}</span>
            </div>
            
            {/* 10s Countdown Indicator */}
            <div className="pt-2 pb-1 border-t border-red-500/20 flex items-center justify-between">
              <span className="text-red-300 font-medium">COUNTDOWN TO IMPACT:</span>
              <span className={`text-base font-black tracking-widest ${
                seconds <= 3 ? 'text-red-400 animate-ping' : 'text-amber-300'
              }`}>
                {timeFormatted}
              </span>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 ease-linear"
                style={{ width: `${Math.max(0, Math.min(100, (seconds / 10) * 100))}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onExecuteManeuver}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs tracking-wider transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 cursor-pointer mt-1"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>FIRE LASER & EVADE DEBRIS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* NOMINAL / SAFE STATUS HUD */
        <div className="pointer-events-auto p-4 rounded-xl bg-black/90 border border-cyan-500/40 backdrop-blur-2xl font-mono text-[11px] space-y-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-bold tracking-wide">THREAT ANALYSIS</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/60">
              NOMINAL
            </span>
          </div>
          <div className="space-y-1.5 text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>CONJUNCTION RISK:</span>
              <span className="text-emerald-400 font-bold">0.00%</span>
            </div>
            <div className="flex justify-between">
              <span>MONITORED ASSETS:</span>
              <span className="text-slate-200 font-bold">10 / 10 Active</span>
            </div>
            <div className="flex justify-between">
              <span>ORBIT STATUS:</span>
              <span className="text-emerald-400 font-bold">ALL ASSETS SAFE</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. MISSION CONTROL SECTION (MATCHING THEME) ─── */}
      <div className="pointer-events-auto p-3.5 rounded-xl bg-black/90 border border-cyan-500/40 backdrop-blur-2xl font-mono text-xs shadow-[0_8px_30px_rgba(0,0,0,0.8)] space-y-2.5">
        {/* Mission Control Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider text-[11px]">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>MISSION CONTROL</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40 uppercase">
            ACTIVE PIPELINE
          </span>
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-1.5 text-[11px]">
          {/* Stage 1: Ingestion */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium text-[10px]">01 ORBITAL INGESTION</span>
            </div>
            <span className="text-[9px] text-emerald-400 font-bold">10 LEO ASSETS</span>
          </div>

          {/* Stage 2: Conjunction Threat Scan */}
          <div
            onClick={onLaunchDebris}
            className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
              threatActive
                ? 'bg-red-950/40 border-red-500/60 text-red-200'
                : 'bg-black/60 border-white/10 hover:border-orange-500/50 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${threatActive ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
              <span className="font-medium text-[10px]">02 THREAT DETECTION</span>
            </div>
            <span className={`text-[9px] font-bold ${threatActive ? 'text-red-400' : 'text-slate-400'}`}>
              {threatActive ? 'CONJUNCTION' : 'SCAN'}
            </span>
          </div>

          {/* Stage 3: Defense Protocol */}
          <div
            onClick={threatActive ? onExecuteManeuver : onLaunchDebris}
            className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
              maneuverSuccess
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                : threatActive
                ? 'bg-red-950/40 border-red-500/60 hover:bg-emerald-950/40 hover:border-emerald-500/60'
                : 'bg-black/60 border-white/10 hover:border-cyan-500/40 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${maneuverSuccess ? 'bg-emerald-400' : threatActive ? 'bg-orange-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span className="font-medium text-[10px]">03 LASER DEFENSE</span>
            </div>
            <span className={`text-[9px] font-bold ${maneuverSuccess ? 'text-emerald-400' : threatActive ? 'text-orange-400' : 'text-cyan-400'}`}>
              {maneuverSuccess ? 'RESOLVED' : threatActive ? 'READY' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={onLaunchDebris}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-500/40 font-bold text-[10px] transition-all cursor-pointer active:scale-95"
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>TEST THREAT</span>
          </button>

          <button
            onClick={onResetSimulation}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 font-bold text-[10px] transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>RESET SIM</span>
          </button>
        </div>
      </div>

      {/* ─── 3. REAL-TIME DYNAMIC TELEMETRY GRAPH ─── */}
      <div className="pointer-events-auto">
        <RealTimeConjunctionGraph
          threatActive={threatActive}
          countdown={countdown}
          isBlasted={isBlasted}
          maneuverSuccess={maneuverSuccess}
        />
      </div>
    </aside>
  );
}

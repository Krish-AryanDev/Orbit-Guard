"use client";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 px-6 sm:px-10 py-8 text-xs font-mono text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            OG
          </div>
          <span>ORBITGUARD — Space Debris Collision Avoidance System Prototype</span>
        </div>

        <div className="flex items-center gap-6">
          <span>TLE / SGP4 Orbital Propagator</span>
          <span className="text-slate-700">|</span>
          <span>J2 Perturbation Model</span>
        </div>
      </div>
    </footer>
  );
}

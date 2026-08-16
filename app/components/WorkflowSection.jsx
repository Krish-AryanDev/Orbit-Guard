"use client";

import { WORKFLOW_STEPS } from '../Data/mockData';
import { Shield, Play } from 'lucide-react';

export function WorkflowSection({ onSimulateStep }) {
  return (
    <section
      id="workflow-section"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      className="relative py-20 px-6 sm:px-10 lg:px-14 bg-[#030712] border-t border-slate-800 font-mono"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-xs text-cyan-400 uppercase tracking-widest mb-2 font-bold">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>SYSTEM PIPELINE & MISSION CONTROL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Autonomous Collision Avoidance Workflow
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Click any step in the pipeline below to test and simulate real-time ingestion, conjunction prediction, radar detection, and evasive maneuver execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_STEPS.map((step) => {
            const isAlert = step.status === 'alert';
            const isComplete = step.status === 'complete';
            const isActive = step.status === 'active';

            return (
              <div
                key={step.id}
                onClick={() => onSimulateStep?.(step.id)}
                className={`group relative p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isAlert
                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                    : isComplete
                    ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                    : isActive
                    ? 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-slate-600 group-hover:text-slate-400 transition-colors">
                    {step.stepNumber}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isAlert
                        ? 'bg-red-900/80 text-red-200 border border-red-500/40'
                        : isComplete
                        ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40'
                        : isActive
                        ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {step.tag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 flex items-center justify-between">
                  <span>{step.title}</span>
                  <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                </h3>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {step.description}
                </p>

                <ul className="space-y-2 border-t border-slate-800/80 pt-4 text-[11px] text-slate-300">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-500 mt-0.5 font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

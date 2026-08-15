"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './components/Navbar';
import { HeroHUD } from './components/HeroHUD';
import { ThreatHUD } from './components/ThreatHUD';
import { WorkflowSection } from './components/WorkflowSection';
import { SatelliteFleetDrawer } from './components/SatelliteFleetDrawer';
import { Footer } from './components/Footer';
import { INITIAL_SATELLITES, INITIAL_METRICS } from './Data/mockData';
import { ChevronDown } from 'lucide-react';

const API_BASE = "http://localhost:4000/api";

const OrbitScene = dynamic(() => import('./components/OrbitScene').then(mod => mod.OrbitScene), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#000000] text-cyan-400 font-mono">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs tracking-widest">INITIALIZING ORBITAL ENGINE...</p>
    </div>
  ),
});

export default function Home() {
  const [satellites, setSatellites] = useState(INITIAL_SATELLITES);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [threatActive, setThreatActive] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  // Sync state with backend if available
  const fetchBackendState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/satellites`);
      if (res.ok) {
        const data = await res.json();
        if (data.satellites && data.satellites.length > 0) {
          setSatellites((prev) =>
            prev.map((s, idx) => {
              const bSat = data.satellites.find((b) => b.id === idx + 1);
              if (bSat) {
                return {
                  ...s,
                  status: bSat.status || s.status,
                  fuelPct: bSat.fuel !== undefined ? bSat.fuel : s.fuelPct,
                };
              }
              return s;
            })
          );
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    fetchBackendState();
  }, [fetchBackendState]);

  const handleLaunchDebris = async () => {
    setThreatActive(true);
    setMetrics({
      ...INITIAL_METRICS,
      conjunctionEvents24h: 1,
      collisionProbabilityMax: 0.00842,
      systemStatus: 'CONJUNCTION_ALERT',
      defconLevel: 2,
      threatLevel: 'CRITICAL',
    });

    const targetSat = satellites.find((s) => s.id === 'sat-4') || satellites[3];
    setSelectedSatellite(targetSat);

    try {
      await fetch(`${API_BASE}/debris/risky`, { method: 'POST' });
    } catch (e) {}
  };

  const handleResetSimulation = async () => {
    setThreatActive(false);
    setMetrics(INITIAL_METRICS);
    setSelectedSatellite(null);
    setSatellites(INITIAL_SATELLITES);

    try {
      await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    } catch (e) {}
  };

  const handleExecuteManeuver = async () => {
    setSatellites((prev) =>
      prev.map((s) =>
        s.id === 'sat-4'
          ? {
              ...s,
              status: 'NOMINAL',
              altitudeKm: 583.5,
              fuelPct: parseFloat((s.fuelPct - 0.4).toFixed(1)),
            }
          : s
      )
    );
    setThreatActive(false);
    setMetrics({
      ...INITIAL_METRICS,
      collisionProbabilityMax: 0.000002,
      systemStatus: 'ACTIVE_TRACKING',
      threatLevel: 'SAFE',
    });

    try {
      const targetSatId = 4;
      const manRes = await fetch(`${API_BASE}/maneuver/${targetSatId}`, { method: 'POST' });
      if (manRes.ok) {
        const manData = await manRes.json();
        if (manData.maneuver) {
          await fetch(`${API_BASE}/maneuver/${targetSatId}/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maneuver: manData.maneuver }),
          });
        }
      }
    } catch (e) {}
  };

  const scrollToWorkflow = () => {
    const el = document.getElementById('workflow-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-slate-100 selection:bg-orange-500 selection:text-black overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        threatLevel={metrics.threatLevel}
        onOpenFleet={() => setIsFleetOpen(true)}
      />

      {/* Main 3D Viewport Hero Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OrbitScene
            satellites={satellites}
            selectedSatellite={selectedSatellite}
            onSelectSatellite={setSelectedSatellite}
            threatActive={threatActive}
          />
        </div>

        {/* Hero HUD Action Controls */}
        <HeroHUD
          threatLevel={metrics.threatLevel}
          onLaunchDebris={handleLaunchDebris}
          onResetSimulation={handleResetSimulation}
          onEnterMissionControl={scrollToWorkflow}
        />

        {/* Threat Alert Panel */}
        <ThreatHUD
          threatActive={threatActive}
          onExecuteManeuver={handleExecuteManeuver}
        />

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            onClick={scrollToWorkflow}
            className="flex flex-col items-center gap-0.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <span>SYSTEM FLOW</span>
            <ChevronDown className="w-4 h-4 text-slate-500 animate-bounce" />
          </button>
        </div>
      </section>

      {/* Mission Control Workflow Section */}
      <WorkflowSection
        onSimulateStep={(stepId) => {
          if (stepId === 'step-2' || stepId === 'step-3') {
            handleLaunchDebris();
          } else if (stepId === 'step-4') {
            handleExecuteManeuver();
          } else {
            handleResetSimulation();
          }
        }}
      />

      {/* Monitored Fleet Drawer */}
      <SatelliteFleetDrawer
        isOpen={isFleetOpen}
        onClose={() => setIsFleetOpen(false)}
        satellites={satellites}
        selectedSatellite={selectedSatellite}
        onSelectSatellite={(sat) => {
          setSelectedSatellite(sat);
          setIsFleetOpen(false);
        }}
        threatActive={threatActive}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
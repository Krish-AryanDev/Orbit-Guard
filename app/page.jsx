"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './components/Navbar';
import { HeroHUD } from './components/HeroHUD';
import { ThreatHUD } from './components/ThreatHUD';
import { SatelliteFleetDrawer } from './components/SatelliteFleetDrawer';
import { INITIAL_SATELLITES, INITIAL_METRICS } from './Data/mockData';

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
  const [selectedDebris, setSelectedDebris] = useState(null);
  const [threatActive, setThreatActive] = useState(false);
  const [threatData, setThreatData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [isBlasted, setIsBlasted] = useState(false);
  const [zoomTrigger, setZoomTrigger] = useState(null);
  const [maneuverTrigger, setManeuverTrigger] = useState(null);
  const [maneuverSuccess, setManeuverSuccess] = useState(false);
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
              const bSat = data.satellites.find((b) => b.id === idx + 1 || b.id === s.id);
              if (bSat) {
                return {
                  ...s,
                  status: bSat.status || s.status,
                  fuelPct: bSat.fuel !== undefined ? bSat.fuel : s.fuelPct,
                  position: bSat.position || s.position,
                  velocity: bSat.velocity || s.velocity,
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

  // 10-Second Countdown Timer & Blast Impact Trigger
  useEffect(() => {
    if (!threatActive || isBlasted) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Impact occurred at 10s! Satellite is destroyed/blasted
          setIsBlasted(true);
          setSatellites((sats) =>
            sats.map((s) =>
              s.id === 'sat-4' || s.id === 4
                ? { ...s, status: 'DESTROYED' }
                : s
            )
          );
          setMetrics((m) => ({
            ...m,
            threatLevel: 'CRITICAL',
            systemStatus: 'ASSET_DESTROYED_IMPACT',
          }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [threatActive, isBlasted]);

  const handleLaunchDebris = async () => {
    setThreatActive(true);
    setCountdown(10);
    setIsBlasted(false);
    setManeuverSuccess(false);
    setSelectedDebris(null);
    setZoomTrigger(Date.now()); // Triggers camera zoom in OrbitScene

    const targetSat = satellites.find((s) => s.id === 'sat-4' || s.id === 4) || satellites[3];
    setSelectedSatellite(targetSat);

    try {
      const res = await fetch(`${API_BASE}/debris/risky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSatelliteId: 4 })
      });

      if (res.ok) {
        const data = await res.json();
        const bTarget = data.targetSatellite;
        const bThreat = data.threat;

        setThreatData({
          debrisName: data.riskyDebris?.name || "DEB-047 (HIGH-VELOCITY FRAG)",
          targetSatelliteName: bTarget?.name || targetSat.name,
          targetSatelliteCode: bTarget?.code || targetSat.code,
          missDistance: "142 m",
          altitudeKm: targetSat.altitudeKm || 840,
          relativeSpeed: bThreat?.risk?.relativeSpeed || 10.42,
          collisionProbability: bThreat?.risk?.collisionProbability || 0.00842,
          riskScore: bThreat?.risk?.score || 85
        });

        setSatellites((prev) =>
          prev.map((s) =>
            s.id === targetSat.id || s.id === 'sat-4'
              ? { ...s, status: 'CRITICAL' }
              : s
          )
        );

        setMetrics({
          ...INITIAL_METRICS,
          conjunctionEvents24h: 1,
          collisionProbabilityMax: bThreat?.risk?.collisionProbability || 0.00842,
          systemStatus: 'CONJUNCTION_ALERT',
          defconLevel: 2,
          threatLevel: 'CRITICAL',
        });
        return;
      }
    } catch (e) {
      // Fallback
    }

    // Default simulation fallback
    setThreatData({
      debrisName: "DEB-047 (HIGH-VELOCITY FRAG)",
      targetSatelliteName: targetSat.name,
      targetSatelliteCode: targetSat.code,
      missDistance: "142 m",
      altitudeKm: targetSat.altitudeKm || 840,
      relativeSpeed: 10.42,
      collisionProbability: 0.00842,
      riskScore: 85
    });

    setSatellites((prev) =>
      prev.map((s) => (s.id === targetSat.id ? { ...s, status: 'CRITICAL' } : s))
    );

    setMetrics({
      ...INITIAL_METRICS,
      conjunctionEvents24h: 1,
      collisionProbabilityMax: 0.00842,
      systemStatus: 'CONJUNCTION_ALERT',
      defconLevel: 2,
      threatLevel: 'CRITICAL',
    });
  };

  const handleResetSimulation = async () => {
    setThreatActive(false);
    setIsBlasted(false);
    setManeuverSuccess(false);
    setManeuverTrigger(null);
    setCountdown(10);
    setSelectedDebris(null);
    setThreatData(null);
    setMetrics(INITIAL_METRICS);
    setSelectedSatellite(null);
    setSatellites(INITIAL_SATELLITES);

    try {
      await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    } catch (e) {}
  };

  const handleExecuteManeuver = async () => {
    const targetSatId = 4;
    let fuelDeduction = 0.4;
    let newAlt = 960.0;

    // Trigger Thruster Plume & Avoidance Animation in OrbitScene
    setManeuverTrigger(Date.now());
    setManeuverSuccess(true);

    try {
      const manRes = await fetch(`${API_BASE}/maneuver/${targetSatId}`, { method: 'POST' });
      if (manRes.ok) {
        const manData = await manRes.json();
        if (manData.maneuver) {
          const applyRes = await fetch(`${API_BASE}/maneuver/${targetSatId}/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maneuver: manData.maneuver }),
          });
          if (applyRes.ok) {
            const applyData = await applyRes.json();
            if (applyData.satellite) {
              fuelDeduction = parseFloat(((manData.maneuver.deltaV || 1) * 0.4).toFixed(1));
            }
          }
        }
      }
    } catch (e) {}

    setSatellites((prev) =>
      prev.map((s) =>
        s.id === 'sat-4' || s.id === 4
          ? {
              ...s,
              status: 'NOMINAL',
              altitudeKm: newAlt,
              fuelPct: parseFloat(Math.max(0, s.fuelPct - fuelDeduction).toFixed(1)),
            }
          : s
      )
    );

    setThreatActive(false);
    setIsBlasted(false);
    setCountdown(10);
    setSelectedDebris(null);
    setMetrics({
      ...INITIAL_METRICS,
      collisionProbabilityMax: 0.000002,
      systemStatus: 'ACTIVE_TRACKING',
      threatLevel: 'SAFE',
    });
  };

  const scrollToWorkflow = () => {
    const el = document.getElementById('workflow-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-screen w-screen bg-[#000000] text-slate-100 selection:bg-orange-500 selection:text-black overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar threatLevel={metrics.threatLevel} />

      {/* Main 3D Viewport Hero Section */}
      <main className="relative w-full h-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OrbitScene
            satellites={satellites}
            selectedSatellite={selectedSatellite}
            onSelectSatellite={setSelectedSatellite}
            selectedDebris={selectedDebris}
            onSelectDebris={setSelectedDebris}
            threatActive={threatActive}
            targetSatellite={selectedSatellite || satellites.find((s) => s.id === 'sat-4' || s.id === 4)}
            isBlasted={isBlasted}
            zoomTrigger={zoomTrigger}
            maneuverTrigger={maneuverTrigger}
          />
        </div>

        {/* Hero HUD Action Controls */}
        <HeroHUD
          threatLevel={metrics.threatLevel}
          onLaunchDebris={handleLaunchDebris}
          onResetSimulation={handleResetSimulation}
        />

        {/* Small Rectangular Threat Analysis HUD + Mission Control Section + Real-Time Graph */}
        <ThreatHUD
          threatActive={threatActive}
          threatData={threatData}
          countdown={countdown}
          isBlasted={isBlasted}
          maneuverSuccess={maneuverSuccess}
          onExecuteManeuver={handleExecuteManeuver}
          onLaunchDebris={handleLaunchDebris}
          onResetSimulation={handleResetSimulation}
        />
      </main>

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
    </div>
  );
}
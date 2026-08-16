/**
 * Simulation Orchestrator & State Management
 * Maintains 10 satellites, background debris, and deterministic collision scenarios.
 */

const Satellite = require("../models/Satellite");
const Debris = require("../models/Debris");
const { updateSimulation } = require("./movement");
const { calculateCollisionRisk } = require("./risk");
const { checkCollision } = require("./collision");
const { calculateBestManeuver, applyManeuver } = require("./maneuver");

// 10 Initial Satellites matching the frontend constellation
const INITIAL_SATELLITE_CONFIGS = [
  { id: 1, name: "SAT-01 Alpha", code: "SENTINEL-EO", noradId: 49201, altitudeKm: 480, inclinationDeg: 52, radius: 2.75, tiltAngle: 0.45, speed: 0.65, fuel: 94.2, purpose: "SAR Earth Observation" },
  { id: 2, name: "SAT-02 Bravo", code: "AEGIS-COMMS", noradId: 49202, altitudeKm: 600, inclinationDeg: 65, radius: 3.00, tiltAngle: -0.50, speed: 0.60, fuel: 88.7, purpose: "Ka-Band Telemetry Relay" },
  { id: 3, name: "SAT-03 Charlie", code: "ASTRO-MET", noradId: 49203, altitudeKm: 720, inclinationDeg: 80, radius: 3.25, tiltAngle: 0.65, speed: 0.56, fuel: 91.5, purpose: "Atmospheric Sounder" },
  { id: 4, name: "SAT-04 Delta", code: "OPTICAL-SURV", noradId: 49204, altitudeKm: 840, inclinationDeg: 45, radius: 3.50, tiltAngle: -0.35, speed: 0.52, fuel: 96.0, purpose: "High-Res Optical Imaging" },
  { id: 5, name: "SAT-05 Echo", code: "HYPERION-NAV", noradId: 49205, altitudeKm: 960, inclinationDeg: 58, radius: 3.75, tiltAngle: 0.55, speed: 0.48, fuel: 82.3, purpose: "Precision Positioning" },
  { id: 6, name: "SAT-06 Foxtrot", code: "TERRA-SCAN", noradId: 49206, altitudeKm: 1080, inclinationDeg: 98, radius: 4.00, tiltAngle: -0.75, speed: 0.45, fuel: 93.8, purpose: "Hyperspectral Monitor" },
  { id: 7, name: "SAT-07 Golf", code: "ORBITAL-RADAR", noradId: 49207, altitudeKm: 1200, inclinationDeg: 35, radius: 4.25, tiltAngle: 0.40, speed: 0.42, fuel: 79.1, purpose: "Situational Radar" },
  { id: 8, name: "SAT-08 Hotel", code: "QUANTUM-QKD", noradId: 49208, altitudeKm: 1350, inclinationDeg: 72, radius: 4.50, tiltAngle: -0.60, speed: 0.39, fuel: 90.4, purpose: "Quantum Cryptography" },
  { id: 9, name: "SAT-09 India", code: "HELIOS-GUARD", noradId: 49209, altitudeKm: 1500, inclinationDeg: 88, radius: 4.75, tiltAngle: 0.70, speed: 0.36, fuel: 87.9, purpose: "Solar Particle Monitor" },
  { id: 10, name: "SAT-10 Juliet", code: "KESTREL-TAC", noradId: 49210, altitudeKm: 1700, inclinationDeg: 28, radius: 5.05, tiltAngle: -0.30, speed: 0.33, fuel: 95.1, purpose: "Rapid Response Beacon" }
];

// Initial baseline positions & velocities
function createInitialSatellites() {
  return INITIAL_SATELLITE_CONFIGS.map((cfg, idx) => {
    const angle = (idx / 10) * Math.PI * 2;
    const r = cfg.radius * 30; // Synthetic coordinate scaling
    const pos = {
      x: parseFloat((Math.cos(angle) * r).toFixed(2)),
      y: parseFloat((Math.sin(angle * 0.5) * (r * 0.3)).toFixed(2)),
      z: parseFloat((Math.sin(angle) * r).toFixed(2))
    };
    // Tangential orbital velocity
    const speed = 7.5;
    const vel = {
      x: parseFloat((-Math.sin(angle) * speed * 0.2).toFixed(3)),
      y: parseFloat((Math.cos(angle * 0.5) * speed * 0.05).toFixed(3)),
      z: parseFloat((Math.cos(angle) * speed * 0.2).toFixed(3))
    };
    return new Satellite(cfg.id, cfg.name, pos, vel, cfg.fuel, 1.0, cfg);
  });
}

function createInitialDebris() {
  return [
    new Debris(1, "DEB-101 (UPPER STAGE)", { x: 45, y: -20, z: 80 }, { x: -0.5, y: 0.1, z: -0.8 }, 0.4),
    new Debris(2, "DEB-205 (SOLAR PANEL FRAG)", { x: -90, y: 40, z: -50 }, { x: 0.8, y: -0.3, z: 0.4 }, 0.6),
    new Debris(3, "DEB-312 (PAYLOAD ADAPTER)", { x: 120, y: 15, z: -70 }, { x: -0.6, y: 0.2, z: 0.5 }, 0.5),
    new Debris(4, "DEB-408 (COLLISION SHARD)", { x: -60, y: -50, z: 110 }, { x: 0.4, y: 0.6, z: -0.7 }, 0.3),
    new Debris(5, "DEB-519 (BATTERY CASING)", { x: 30, y: 70, z: -40 }, { x: -0.2, y: -0.8, z: 0.3 }, 0.5),
    new Debris(6, "DEB-602 (FAIRING PIECE)", { x: -110, y: 25, z: 75 }, { x: 0.3, y: -0.4, z: -0.6 }, 0.4),
    new Debris(7, "DEB-714 (ANTENNA BOOM)", { x: 80, y: -65, z: -90 }, { x: -0.4, y: 0.5, z: 0.3 }, 0.35),
    new Debris(8, "DEB-822 (THRUST NOZZLE)", { x: -40, y: 90, z: -85 }, { x: 0.7, y: -0.2, z: 0.5 }, 0.55),
    new Debris(9, "DEB-931 (TITANIUM BOLT CLOUD)", { x: 95, y: 35, z: 120 }, { x: -0.5, y: -0.3, z: -0.7 }, 0.3),
    new Debris(10, "DEB-047 (HIGH-VELOCITY FRAG)", { x: -130, y: 60, z: 140 }, { x: 0.6, y: -0.5, z: -0.8 }, 0.7)
  ];
}

class SimulationState {
  constructor() {
    this.satellites = createInitialSatellites();
    this.debrisList = createInitialDebris();
    this.activeThreat = null;
    this.simTick = 0;
  }

  reset() {
    this.satellites = createInitialSatellites();
    this.debrisList = createInitialDebris();
    this.activeThreat = null;
    this.simTick = 0;
    return {
      satellites: this.satellites.map((s) => s.toJSON()),
      debris: this.debrisList.map((d) => d.toJSON()),
      activeThreat: null,
      status: "NOMINAL"
    };
  }

  addRiskyDebris(targetSatelliteId = null) {
    let targetSat;
    if (targetSatelliteId) {
      targetSat = this.satellites.find((s) => s.id === Number(targetSatelliteId) || s.id === targetSatelliteId);
    }
    if (!targetSat) {
      const randomIndex = Math.floor(Math.random() * this.satellites.length);
      targetSat = this.satellites[randomIndex];
    }

    const collisionTime = 10; // Exactly 10 simulation seconds to impact
    const satPos = targetSat.position;
    const satVel = targetSat.velocity;

    // Predicted target satellite position at 10 seconds
    const impactPosition = {
      x: satPos.x + satVel.x * collisionTime,
      y: satPos.y + satVel.y * collisionTime,
      z: satPos.z + satVel.z * collisionTime
    };

    // Place debris starting point away from target
    const startOffset = {
      x: -85.0 + (Math.random() - 0.5) * 8,
      y: 50.0 + (Math.random() - 0.5) * 8,
      z: 70.0 + (Math.random() - 0.5) * 8
    };

    const debrisStartPos = {
      x: parseFloat((impactPosition.x + startOffset.x).toFixed(2)),
      y: parseFloat((impactPosition.y + startOffset.y).toFixed(2)),
      z: parseFloat((impactPosition.z + startOffset.z).toFixed(2))
    };

    // Velocity calibrated so it reaches impact position at exactly 45 seconds
    const debrisVel = {
      x: parseFloat(((impactPosition.x - debrisStartPos.x) / collisionTime).toFixed(3)),
      y: parseFloat(((impactPosition.y - debrisStartPos.y) / collisionTime).toFixed(3)),
      z: parseFloat(((impactPosition.z - debrisStartPos.z) / collisionTime).toFixed(3))
    };

    const riskyDebrisId = 10; // Use DEB-047 or append
    let riskyDebris = this.debrisList.find((d) => d.name.includes("DEB-047"));
    if (riskyDebris) {
      riskyDebris.position = debrisStartPos;
      riskyDebris.velocity = debrisVel;
      riskyDebris.targetSatelliteId = targetSat.id;
      riskyDebris.isRisky = true;
    } else {
      riskyDebris = new Debris(
        this.debrisList.length + 1,
        "DEB-047 (HIGH-VELOCITY FRAG)",
        debrisStartPos,
        debrisVel,
        0.85,
        targetSat.id,
        true
      );
      this.debrisList.push(riskyDebris);
    }

    targetSat.status = "CRITICAL";

    const riskInfo = calculateCollisionRisk(targetSat, riskyDebris);

    this.activeThreat = {
      targetSatelliteId: targetSat.id,
      targetSatelliteName: targetSat.name,
      debrisId: riskyDebris.id,
      debrisName: riskyDebris.name,
      timeToClosestApproachSec: collisionTime,
      risk: riskInfo,
      status: "CONJUNCTION_ALERT"
    };

    return {
      riskyDebris: riskyDebris.toJSON(),
      targetSatellite: targetSat.toJSON(),
      threat: this.activeThreat
    };
  }

  getSatellite(id) {
    return this.satellites.find((s) => s.id === Number(id) || s.id === id);
  }

  getCollisionStatus(satelliteId) {
    const sat = this.getSatellite(satelliteId);
    if (!sat) return null;

    let maxRisk = { score: 0, level: "LOW", distance: Infinity, relativeSpeed: 0 };
    let worstDebris = null;

    for (const deb of this.debrisList) {
      const risk = calculateCollisionRisk(sat, deb);
      if (risk.score > maxRisk.score) {
        maxRisk = risk;
        worstDebris = deb;
      }
    }

    const collisionStatus = worstDebris ? checkCollision(sat, worstDebris) : "SAFE";

    return {
      satellite: sat.toJSON(),
      nearestDebris: worstDebris ? worstDebris.toJSON() : null,
      risk: maxRisk,
      collisionStatus
    };
  }

  recommendManeuver(satelliteId) {
    const sat = this.getSatellite(satelliteId);
    if (!sat) return null;

    // Find the threat debris targeting this satellite or nearest debris
    const threatDebris =
      this.debrisList.find((d) => d.targetSatelliteId === sat.id && d.isRisky) ||
      this.debrisList[0];

    if (!threatDebris) return null;

    return calculateBestManeuver(sat, threatDebris);
  }

  applySatelliteManeuver(satelliteId, maneuver) {
    const sat = this.getSatellite(satelliteId);
    if (!sat) return null;

    applyManeuver(sat, maneuver);

    if (this.activeThreat && this.activeThreat.targetSatelliteId === sat.id) {
      this.activeThreat.status = "MANEUVER_EXECUTED";
    }

    return sat.toJSON();
  }

  tick(deltaTime = 1) {
    this.simTick += deltaTime;
    updateSimulation(this.satellites, this.debrisList, deltaTime);

    // Update statuses
    this.satellites.forEach((sat) => {
      let isThreatened = false;
      for (const deb of this.debrisList) {
        const risk = calculateCollisionRisk(sat, deb);
        if (risk.score >= 70) {
          sat.status = "CRITICAL";
          isThreatened = true;
          break;
        } else if (risk.score >= 30 && sat.status !== "CRITICAL") {
          sat.status = "WARNING";
          isThreatened = true;
        }
      }
      if (!isThreatened && sat.status !== "CRITICAL") {
        sat.status = "SAFE";
      }
    });

    return {
      tick: this.simTick,
      satellites: this.satellites.map((s) => s.toJSON()),
      debris: this.debrisList.map((d) => d.toJSON()),
      activeThreat: this.activeThreat
    };
  }
}

const simulationInstance = new SimulationState();

module.exports = {
  simulationInstance,
  SimulationState
};

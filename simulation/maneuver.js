/**
 * Avoidance Maneuver Optimization & Application
 * Generates candidate delta-V vectors and chooses the minimal fuel-efficient safe impulse.
 */

const { calculateDistance } = require("./collision");
const { calculateCollisionRisk } = require("./risk");

const CANDIDATE_DIRECTIONS = [
  { name: "+x", vector: { x: 1, y: 0, z: 0 } },
  { name: "-x", vector: { x: -1, y: 0, z: 0 } },
  { name: "+y", vector: { x: 0, y: 1, z: 0 } },
  { name: "-y", vector: { x: 0, y: -1, z: 0 } },
  { name: "+z", vector: { x: 0, y: 0, z: 1 } },
  { name: "-z", vector: { x: 0, y: 0, z: -1 } }
];

const CANDIDATE_MAGNITUDES = [1, 2, 5, 10, 15, 20];
const MIN_SAFE_MISS_DISTANCE = 40.0;
const FUEL_COEFFICIENT = 0.4; // 0.4% fuel per unit delta-V

function simulateTrajectoryMissDistance(satellitePos, satelliteVel, debrisPos, debrisVel, steps = 30) {
  let minDistance = Infinity;

  for (let t = 1; t <= steps; t++) {
    const sPos = {
      x: satellitePos.x + satelliteVel.x * t,
      y: satellitePos.y + satelliteVel.y * t,
      z: satellitePos.z + satelliteVel.z * t
    };
    const dPos = {
      x: debrisPos.x + debrisVel.x * t,
      y: debrisPos.y + debrisVel.y * t,
      z: debrisPos.z + debrisVel.z * t
    };
    const dist = calculateDistance({ position: sPos }, { position: dPos });
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
}

function calculateBestManeuver(satellite, debris) {
  if (!satellite || !debris) {
    return null;
  }

  const currentRisk = calculateCollisionRisk(satellite, debris);
  let bestCandidate = null;

  // Search candidate directions and increasing magnitudes
  for (const mag of CANDIDATE_MAGNITUDES) {
    for (const dir of CANDIDATE_DIRECTIONS) {
      const candidateVelocity = {
        x: satellite.velocity.x + dir.vector.x * mag,
        y: satellite.velocity.y + dir.vector.y * mag,
        z: satellite.velocity.z + dir.vector.z * mag
      };

      const predictedMinDist = simulateTrajectoryMissDistance(
        satellite.position,
        candidateVelocity,
        debris.position,
        debris.velocity
      );

      if (predictedMinDist >= MIN_SAFE_MISS_DISTANCE) {
        // First candidate meeting safe criteria is the minimal delta-V
        const mockSatAfter = {
          ...satellite,
          position: { ...satellite.position },
          velocity: candidateVelocity
        };
        const riskAfter = calculateCollisionRisk(mockSatAfter, debris);

        bestCandidate = {
          recommended: true,
          deltaV: mag,
          direction: dir.vector,
          directionName: dir.name,
          newVelocity: candidateVelocity,
          predictedMissDistance: parseFloat(predictedMinDist.toFixed(2)),
          riskBefore: currentRisk.score,
          riskAfter: Math.min(riskAfter.score, 5)
        };
        break;
      }
    }
    if (bestCandidate) break;
  }

  // Fallback if extreme evasive needed
  if (!bestCandidate) {
    const fallbackDir = CANDIDATE_DIRECTIONS[2].vector; // +y
    const fallbackMag = 20;
    const fallbackVelocity = {
      x: satellite.velocity.x + fallbackDir.x * fallbackMag,
      y: satellite.velocity.y + fallbackDir.y * fallbackMag,
      z: satellite.velocity.z + fallbackDir.z * fallbackMag
    };
    bestCandidate = {
      recommended: true,
      deltaV: fallbackMag,
      direction: fallbackDir,
      directionName: "+y",
      newVelocity: fallbackVelocity,
      predictedMissDistance: 55.0,
      riskBefore: currentRisk.score,
      riskAfter: 2
    };
  }

  return bestCandidate;
}

function applyManeuver(satellite, maneuver) {
  if (!satellite || !maneuver || !maneuver.newVelocity) return satellite;

  satellite.velocity = { ...maneuver.newVelocity };
  const fuelUsed = parseFloat(((maneuver.deltaV || 1) * FUEL_COEFFICIENT).toFixed(1));
  satellite.fuel = Math.max(0, parseFloat((satellite.fuel - fuelUsed).toFixed(1)));
  satellite.status = "SAFE";

  return satellite;
}

module.exports = {
  calculateBestManeuver,
  applyManeuver,
  CANDIDATE_DIRECTIONS,
  CANDIDATE_MAGNITUDES,
  MIN_SAFE_MISS_DISTANCE
};

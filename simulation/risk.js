/**
 * Prototype Collision Risk Calculation Module
 * Evaluates proximity, relative velocity, and size factors.
 */

const { calculateDistance } = require("./collision");

function calculateCollisionRisk(satellite, debris) {
  if (!satellite || !debris) {
    return {
      score: 0,
      level: "LOW",
      distance: Infinity,
      relativeSpeed: 0,
      timeToClosestApproachSec: 999,
      collisionProbability: 0.0
    };
  }

  const distance = calculateDistance(satellite, debris);
  const relVx = (debris.velocity?.x || 0) - (satellite.velocity?.x || 0);
  const relVy = (debris.velocity?.y || 0) - (satellite.velocity?.y || 0);
  const relVz = (debris.velocity?.z || 0) - (satellite.velocity?.z || 0);
  const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy + relVz * relVz) || 10.42;

  const collisionDistance = (satellite.size || 1.0) + (debris.size || 0.5);
  const dangerRadius = 80.0;

  let score = 0;
  if (distance <= collisionDistance) {
    score = 100;
  } else if (distance < dangerRadius) {
    const proximityRatio = Math.max(0, (dangerRadius - distance) / dangerRadius);
    const proximityScore = Math.pow(proximityRatio, 1.2) * 85;
    const velocityWeight = Math.min(15, (relSpeed / 15) * 15);
    score = Math.min(100, Math.round(proximityScore + velocityWeight));
  } else {
    score = Math.max(0, Math.round((1 / (distance + 1)) * 100));
  }

  let level = "LOW";
  if (score >= 70) {
    level = "HIGH";
  } else if (score >= 30) {
    level = "MEDIUM";
  }

  // Estimated time to closest approach
  const tcaSec = relSpeed > 0 ? Math.max(0, Math.round((distance / relSpeed) * 10)) : 0;
  const collisionProbability = parseFloat((score / 10000).toFixed(5));

  return {
    score,
    level,
    distance: parseFloat(distance.toFixed(2)),
    relativeSpeed: parseFloat(relSpeed.toFixed(2)),
    timeToClosestApproachSec: tcaSec,
    collisionProbability
  };
}

module.exports = {
  calculateCollisionRisk
};

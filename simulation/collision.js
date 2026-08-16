/**
 * Collision Detection & Euclidean Distance Module
 */

const DEFAULT_THRESHOLDS = {
  dangerThreshold: 25,
  warningThreshold: 60
};

function calculateDistance(objectA, objectB) {
  if (!objectA || !objectB || !objectA.position || !objectB.position) {
    return Infinity;
  }
  const dx = objectB.position.x - objectA.position.x;
  const dy = objectB.position.y - objectA.position.y;
  const dz = objectB.position.z - objectA.position.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function checkCollision(satellite, debris, thresholds = DEFAULT_THRESHOLDS) {
  if (!satellite || !debris) return "SAFE";

  const distance = calculateDistance(satellite, debris);
  const collisionDistance = (satellite.size || 1.0) + (debris.size || 0.5);
  const dangerThreshold = thresholds.dangerThreshold || DEFAULT_THRESHOLDS.dangerThreshold;
  const warningThreshold = thresholds.warningThreshold || DEFAULT_THRESHOLDS.warningThreshold;

  if (distance <= collisionDistance) {
    return "CRITICAL";
  } else if (distance <= dangerThreshold) {
    return "CRITICAL";
  } else if (distance <= warningThreshold) {
    return "WARNING";
  }
  return "SAFE";
}

module.exports = {
  calculateDistance,
  checkCollision,
  DEFAULT_THRESHOLDS
};

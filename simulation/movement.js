/**
 * Movement & Position Integration (Synthetic Physics Model)
 * newPosition = oldPosition + velocity * deltaTime
 */

function updateSatellitePosition(satellite, deltaTime = 1) {
  if (!satellite || !satellite.position || !satellite.velocity) return;
  satellite.position.x += satellite.velocity.x * deltaTime;
  satellite.position.y += satellite.velocity.y * deltaTime;
  satellite.position.z += satellite.velocity.z * deltaTime;
}

function updateDebrisPosition(debris, deltaTime = 1) {
  if (!debris || !debris.position || !debris.velocity) return;
  debris.position.x += debris.velocity.x * deltaTime;
  debris.position.y += debris.velocity.y * deltaTime;
  debris.position.z += debris.velocity.z * deltaTime;
}

function updateSimulation(satellites = [], debrisList = [], deltaTime = 1) {
  satellites.forEach((sat) => updateSatellitePosition(sat, deltaTime));
  debrisList.forEach((deb) => updateDebrisPosition(deb, deltaTime));
}

module.exports = {
  updateSatellitePosition,
  updateDebrisPosition,
  updateSimulation
};

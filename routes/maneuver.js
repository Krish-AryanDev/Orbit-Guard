const express = require("express");
const router = express.Router();
const { simulationInstance } = require("../simulation/simulation");

// POST /api/maneuver/:satelliteId - Calculate optimal delta-V avoidance maneuver
router.post("/:satelliteId", (req, res) => {
  const satelliteId = req.params.satelliteId;
  const sat = simulationInstance.getSatellite(satelliteId);

  if (!sat) {
    return res.status(404).json({ ok: false, error: "Satellite not found" });
  }

  const maneuver = simulationInstance.recommendManeuver(satelliteId);

  if (!maneuver) {
    return res.status(400).json({
      ok: false,
      error: "No active conjunction threat detected for this satellite"
    });
  }

  res.json({
    ok: true,
    satelliteId: sat.id,
    satelliteName: sat.name,
    maneuver
  });
});

// POST /api/maneuver/:satelliteId/apply - Apply the calculated avoidance maneuver
router.post("/:satelliteId/apply", (req, res) => {
  const satelliteId = req.params.satelliteId;
  const maneuver = req.body?.maneuver;

  if (!maneuver || !maneuver.newVelocity) {
    // If not supplied in body, calculate and apply automatically
    const recommended = simulationInstance.recommendManeuver(satelliteId);
    if (!recommended) {
      return res.status(400).json({ ok: false, error: "No maneuver recommendation available" });
    }
    const updatedSat = simulationInstance.applySatelliteManeuver(satelliteId, recommended);
    return res.json({
      ok: true,
      message: "Avoidance burn applied successfully",
      appliedManeuver: recommended,
      satellite: updatedSat
    });
  }

  const updatedSat = simulationInstance.applySatelliteManeuver(satelliteId, maneuver);
  if (!updatedSat) {
    return res.status(404).json({ ok: false, error: "Satellite not found" });
  }

  res.json({
    ok: true,
    message: "Avoidance burn applied successfully",
    appliedManeuver: maneuver,
    satellite: updatedSat
  });
});

module.exports = router;

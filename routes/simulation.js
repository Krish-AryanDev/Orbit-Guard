const express = require("express");
const router = express.Router();
const { simulationInstance } = require("../simulation/simulation");

// GET /api/simulation - Get full current simulation state
router.get("/", (req, res) => {
  res.json({
    ok: true,
    tick: simulationInstance.simTick,
    satellites: simulationInstance.satellites.map((s) => s.toJSON()),
    debris: simulationInstance.debrisList.map((d) => d.toJSON()),
    activeThreat: simulationInstance.activeThreat
  });
});

// POST /api/simulation/tick - Advance simulation by deltaTime ticks
router.post("/tick", (req, res) => {
  const deltaTime = Number(req.body?.deltaTime) || 1;
  const result = simulationInstance.tick(deltaTime);
  res.json({
    ok: true,
    ...result
  });
});

// POST /api/simulation/reset - Reset simulation to nominal baseline
router.post("/reset", (req, res) => {
  const result = simulationInstance.reset();
  res.json({
    ok: true,
    message: "Simulation successfully reset to nominal tracking state",
    ...result
  });
});

// GET /api/collision/:satelliteId - Evaluate collision risk for a satellite
router.get("/collision/:satelliteId", (req, res) => {
  const result = simulationInstance.getCollisionStatus(req.params.satelliteId);
  if (!result) {
    return res.status(404).json({ ok: false, error: "Satellite not found" });
  }
  res.json({
    ok: true,
    ...result
  });
});

module.exports = router;

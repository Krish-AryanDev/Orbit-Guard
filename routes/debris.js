const express = require("express");
const router = express.Router();
const { simulationInstance } = require("../simulation/simulation");

// GET /api/debris - List all active debris objects
router.get("/", (req, res) => {
  const data = simulationInstance.debrisList.map((d) => d.toJSON());
  res.json({
    ok: true,
    count: data.length,
    debris: data
  });
});

// POST /api/debris/risky - Add risky debris targeting a satellite
router.post("/risky", (req, res) => {
  const targetSatelliteId = req.body?.targetSatelliteId || null;
  const result = simulationInstance.addRiskyDebris(targetSatelliteId);

  res.status(201).json({
    ok: true,
    message: "Risky debris spawned and incoming trajectory computed",
    ...result
  });
});

module.exports = router;

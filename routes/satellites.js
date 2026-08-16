const express = require("express");
const router = express.Router();
const { simulationInstance } = require("../simulation/simulation");

// GET /api/satellites - List all 10 monitored satellites
router.get("/", (req, res) => {
  const data = simulationInstance.satellites.map((s) => s.toJSON());
  res.json({
    ok: true,
    count: data.length,
    satellites: data
  });
});

// GET /api/satellites/:id - Get single satellite by ID
router.get("/:id", (req, res) => {
  const sat = simulationInstance.getSatellite(req.params.id);
  if (!sat) {
    return res.status(404).json({ ok: false, error: "Satellite not found" });
  }
  res.json({
    ok: true,
    satellite: sat.toJSON()
  });
});

module.exports = router;

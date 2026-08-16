const express = require("express");
const satellitesRouter = require("./routes/satellites");
const debrisRouter = require("./routes/debris");
const maneuverRouter = require("./routes/maneuver");
const simulationRouter = require("./routes/simulation");

const app = express();
const port = process.env.PORT || 4000;

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// JSON Body Parser
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "space-debris-collision-avoidance-system",
    status: "ONLINE",
    timestamp: new Date().toISOString()
  });
});

// Target telemetry route for legacy compatibility
app.get("/api/targets", (req, res) => {
  res.json({
    ok: true,
    satellites: [
      { id: "SAT-204", altitudeKm: 410, velocityKms: 7.8, risk: 0.22 },
      { id: "SAT-118", altitudeKm: 540, velocityKms: 7.5, risk: 0.18 }
    ],
    debris: [
      { id: "DBR-441", altitudeKm: 400, velocityKms: 7.1, risk: 0.74 },
      { id: "DBR-973", altitudeKm: 520, velocityKms: 7.9, risk: 0.81 }
    ],
    status: "Nominal tracking"
  });
});

// Mount Routes
app.use("/api/satellites", satellitesRouter);
app.use("/api/debris", debrisRouter);
app.use("/api/maneuver", maneuverRouter);
app.use("/api/simulation", simulationRouter);

// Collision risk shortcut route
app.use("/api/collision", (req, res, next) => {
  if (req.path !== "/") {
    return simulationRouter(req, res, next);
  }
  res.status(400).json({ ok: false, error: "Please specify satellite ID: /api/collision/:satelliteId" });
});

app.listen(port, () => {
  console.log(`Orbital Guardian Express API running on http://localhost:${port}`);
});

module.exports = app;

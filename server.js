const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "space-debris-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/targets", (req, res) => {
  res.json({
    satellites: [
      { id: "SAT-204", altitudeKm: 410, velocityKms: 7.8, risk: 0.22 },
      { id: "SAT-118", altitudeKm: 540, velocityKms: 7.5, risk: 0.18 },
    ],
    debris: [
      { id: "DBR-441", altitudeKm: 400, velocityKms: 7.1, risk: 0.74 },
      { id: "DBR-973", altitudeKm: 520, velocityKms: 7.9, risk: 0.81 },
    ],
    status: "Nominal tracking",
  });
});

app.listen(port, () => {
  console.log(`Express API running on http://localhost:${port}`);
});

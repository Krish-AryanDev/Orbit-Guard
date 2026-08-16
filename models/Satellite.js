class Satellite {
  constructor(id, name, position, velocity, fuel = 100, size = 1.0, metadata = {}) {
    this.id = id;
    this.name = name;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.velocity = velocity || { x: 0, y: 0, z: 0 };
    this.fuel = fuel;
    this.status = "SAFE"; // SAFE | WARNING | CRITICAL
    this.size = size;
    this.code = metadata.code || `SAT-${id}`;
    this.noradId = metadata.noradId || 49200 + id;
    this.altitudeKm = metadata.altitudeKm || 500 + id * 50;
    this.inclinationDeg = metadata.inclinationDeg || 50;
    this.speed = metadata.speed || 0.6;
    this.radius = metadata.radius || 2.8 + id * 0.2;
    this.tiltAngle = metadata.tiltAngle || 0.4;
    this.color = metadata.color || "#38BDF8";
    this.purpose = metadata.purpose || "Earth Observation & Communications";
  }

  updatePosition(deltaTime = 1) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      noradId: this.noradId,
      position: { ...this.position },
      velocity: { ...this.velocity },
      fuel: this.fuel,
      fuelPct: this.fuel,
      status: this.status,
      size: this.size,
      altitudeKm: this.altitudeKm,
      inclinationDeg: this.inclinationDeg,
      speed: this.speed,
      radius: this.radius,
      tiltAngle: this.tiltAngle,
      color: this.color,
      purpose: this.purpose,
      velocityKmS: parseFloat(
        Math.sqrt(
          this.velocity.x * this.velocity.x +
          this.velocity.y * this.velocity.y +
          this.velocity.z * this.velocity.z
        ).toFixed(2)
      ) || 7.55
    };
  }
}

module.exports = Satellite;

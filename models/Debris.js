class Debris {
  constructor(id, name, position, velocity, size = 0.5, targetSatelliteId = null, isRisky = false) {
    this.id = id;
    this.name = name;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.velocity = velocity || { x: 0, y: 0, z: 0 };
    this.size = size;
    this.targetSatelliteId = targetSatelliteId;
    this.isRisky = isRisky;
    this.createdAt = new Date().toISOString();
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
      position: { ...this.position },
      velocity: { ...this.velocity },
      size: this.size,
      targetSatelliteId: this.targetSatelliteId,
      isRisky: this.isRisky,
      speedKmS: parseFloat(
        Math.sqrt(
          this.velocity.x * this.velocity.x +
          this.velocity.y * this.velocity.y +
          this.velocity.z * this.velocity.z
        ).toFixed(2)
      ) || 10.42,
      createdAt: this.createdAt
    };
  }
}

module.exports = Debris;

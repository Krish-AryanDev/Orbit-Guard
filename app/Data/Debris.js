export class Debris {
  constructor(id, name, position, velocity, size = 0.5, targetSatelliteId = null) {
    this.id = id;
    this.name = name;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.velocity = velocity || { x: 0, y: 0, z: 0 };
    this.size = size;
    this.targetSatelliteId = targetSatelliteId;
  }
}

export const Debrislist = [
  new Debris(1, "debris 1", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
  new Debris(2, "debris 2", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
  new Debris(3, "debris 3", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
  new Debris(4, "debris 4", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
  new Debris(5, "debris 5", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
];

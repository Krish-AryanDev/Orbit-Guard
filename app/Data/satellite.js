export class Satellite {
  constructor(id, name, position, velocity, fuel = 100, size = 1.0) {
    this.id = id;
    this.name = name;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.velocity = velocity || { x: 0, y: 0, z: 0 };
    this.fuel = fuel;
    this.status = "SAFE";
    this.size = size;
  }
}

export const satellites = [
  new Satellite(1, "Satellite 1", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(2, "Satellite 2", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(3, "Satellite 3", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(4, "Satellite 4", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(5, "Satellite 5", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(6, "Satellite 6", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(7, "Satellite 7", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(8, "Satellite 8", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(9, "Satellite 9", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
  new Satellite(10, "Satellite 10", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 100, 1),
];

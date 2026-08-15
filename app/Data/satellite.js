class Satallite {
    constructor(id, name, position, velocity, fuel, size){
        this.id = id;
        this.name = name;

        this.position = position;
        this.velocity = velocity;
        
        this.fuel = fuel;
        this.status = "SAFE";

        this.size = size;
    }


}

const satellites = []

const s1 = new Satallite(1, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s2 = new Satallite(2, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s3 = new Satallite(3, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s4 = new Satallite(4, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s5 = new Satallite(5, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s6 = new Satallite(6, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s7 = new Satallite(7, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s8 = new Satallite(8, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s9 = new Satallite(9, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);
const s10 = new Satallite(10, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, 1);

satellites.push(s1);
satellites.push(s2);
satellites.push(s3);
satellites.push(s4);
satellites.push(s5);
satellites.push(s6);
satellites.push(s7);
satellites.push(s8);
satellites.push(s9);
satellites.push(s10);

console.log(satellites);

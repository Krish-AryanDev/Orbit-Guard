class Debris{
    constructor(id, name, position, velocity, size){
        this.id = id;
        this.name = name;  

        this.position = position;
        this.velocity = velocity;

        this.size = size;

    }
}

const Debrislist = []

const d1 = new Debris(1, "debris 1", {x: 0, y: 0, z: 0}, {x:0, y: 0, z: 0}, 1)
const d2 = new Debris(2, "debris 1", {x: 0, y: 0, z: 0}, {x:0, y: 0, z: 0}, 1)
const d3 = new Debris(3, "debris 1", {x: 0, y: 0, z: 0}, {x:0, y: 0, z: 0}, 1)
const d4 = new Debris(4, "debris 1", {x: 0, y: 0, z: 0}, {x:0, y: 0, z: 0}, 1)
const d5 = new Debris(5, "debris 1", {x: 0, y: 0, z: 0}, {x:0, y: 0, z: 0}, 1)

Debrislist.push(d1);
Debrislist.push(d2);
Debrislist.push(d3);
Debrislist.push(d4);
Debrislist.push(d5);

console.log(Debrislist);

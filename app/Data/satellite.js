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

const s1 = new Satallite(1, "Satellite 1", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 100, "SAFE", 1);
satellites.push(s1);

console.log(satellites);

"use client";

import { Canvas } from "@react-three/fiber";

function Satellite({ position }) {
    return (
        <mesh position={[position.x, position.y, position.z]}>
            <boxGeometry args={[1, 0.5, 0.5]} />
            <meshStandardMaterial color="#4f46e5" />
        </mesh>
    );
}

export default function SpaceScene() {
    const satellite = {
        position: { x: 0, y: 0, z: 0 }
    };

    return (
        <Canvas camera={{ position: [5, 5, 5] }}>
            <ambientLight intensity={2} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <Satellite position={satellite.position} />
        </Canvas>
    );
}
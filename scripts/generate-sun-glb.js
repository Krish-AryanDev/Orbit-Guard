import fs from 'fs';
import path from 'path';

// Polyfill FileReader for Node.js
if (!globalThis.FileReader) {
  class FileReader {
    readAsArrayBuffer(blob) {
      setTimeout(async () => {
        try {
          const buf = await blob.arrayBuffer();
          this.result = buf;
          if (this.onload) this.onload({ target: this });
          if (this.onloadend) this.onloadend({ target: this });
        } catch (err) {
          if (this.onerror) this.onerror(err);
        }
      }, 0);
    }
    readAsDataURL(blob) {
      setTimeout(async () => {
        try {
          const buf = await blob.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
          if (this.onload) this.onload({ target: this });
          if (this.onloadend) this.onloadend({ target: this });
        } catch (err) {
          if (this.onerror) this.onerror(err);
        }
      }, 0);
    }
  }
  globalThis.FileReader = FileReader;
}

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const modelsDir = path.join(process.cwd(), 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const scene = new THREE.Scene();

// 1. Photosphere Core
const coreGeom = new THREE.SphereGeometry(2.8, 64, 64);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0xfffaea,
  emissive: 0xff7700,
  emissiveIntensity: 4.5,
  roughness: 0.1,
  metalness: 0.0,
});
const coreMesh = new THREE.Mesh(coreGeom, coreMat);
coreMesh.name = 'Sun_Photosphere_Core';
scene.add(coreMesh);

// 2. Chromosphere Solar Granulation Layer
const chromoGeom = new THREE.SphereGeometry(2.98, 48, 48);
const chromoMat = new THREE.MeshStandardMaterial({
  color: 0xffaa00,
  emissive: 0xff4400,
  emissiveIntensity: 2.5,
  transparent: true,
  opacity: 0.7,
  roughness: 0.4,
});
const chromoMesh = new THREE.Mesh(chromoGeom, chromoMat);
chromoMesh.name = 'Sun_Chromosphere_Shell';
scene.add(chromoMesh);

// 3. Solar Corona Outflow Shell
const coronaGeom = new THREE.SphereGeometry(3.6, 36, 36);
const coronaMat = new THREE.MeshStandardMaterial({
  color: 0xff3300,
  emissive: 0xee1100,
  emissiveIntensity: 1.8,
  transparent: true,
  opacity: 0.35,
});
const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
coronaMesh.name = 'Sun_Corona_Shell';
scene.add(coronaMesh);

// Export to .gltf
const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (gltf) => {
    const gltfPath = path.join(modelsDir, 'sun.gltf');
    const output = typeof gltf === 'string' ? gltf : JSON.stringify(gltf, null, 2);
    fs.writeFileSync(gltfPath, output);
    console.log(`Successfully generated Sun GLTF model at: ${gltfPath}`);
  },
  (err) => {
    console.error('Error generating GLTF:', err);
  },
  { binary: false }
);

// Also export to binary .glb
exporter.parse(
  scene,
  (glb) => {
    const glbPath = path.join(modelsDir, 'sun.glb');
    fs.writeFileSync(glbPath, Buffer.from(glb));
    console.log(`Successfully generated Sun GLB model at: ${glbPath}`);
  },
  (err) => {
    console.error('Error generating GLB:', err);
  },
  { binary: true }
);

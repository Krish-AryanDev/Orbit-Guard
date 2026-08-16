"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html, useTexture, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ─── Cinematic Star Shader ────────────────────────────────────────────────────
const CinematicStarShader = {
  vertexShader: `
    attribute float aSize;
    attribute float aBrightness;
    attribute float aPhase;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vBrightness;

    uniform float uTime;

    void main() {
      vColor = aColor;
      float twinkle = 0.82 + 0.18 * sin(uTime * 1.8 + aPhase);
      vBrightness = aBrightness * twinkle;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * (380.0 / -mvPosition.z) * (0.9 + 0.1 * twinkle);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vBrightness;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      float core = exp(-dist * dist * 38.0);
      float halo = exp(-dist * 9.0) * 0.45;
      float spikeX = exp(-abs(coord.x) * 40.0) * exp(-abs(coord.y) * 6.0);
      float spikeY = exp(-abs(coord.y) * 40.0) * exp(-abs(coord.x) * 6.0);
      float spikes = max(spikeX, spikeY) * 0.25;

      float alpha = clamp((core + halo + spikes) * vBrightness, 0.0, 1.0);
      vec3 finalColor = vColor + vec3(core * 0.6);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

// ─── Star Field ───────────────────────────────────────────────────────────────
function StarField() {
  const pointsRef = useRef();
  const materialRef = useRef();

  const { positions, colors, sizes, brightnesses, phases } = useMemo(() => {
    const starCount = 3600;
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    const sz = new Float32Array(starCount);
    const br = new Float32Array(starCount);
    const ph = new Float32Array(starCount);

    const spectralColors = [
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#f8fafc'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#fed7aa'),
      new THREE.Color('#93c5fd'),
      new THREE.Color('#cbd5e1'),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 65 + Math.random() * 220;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const roll = Math.random();
      let color = spectralColors[2];
      let size = 1.0, brightness = 0.5;

      if (roll < 0.65) {
        color = spectralColors[6];
        size = 0.65 + Math.random() * 0.4;
        brightness = 0.3 + Math.random() * 0.3;
      } else if (roll < 0.92) {
        color = spectralColors[Math.floor(Math.random() * 5)];
        size = 1.2 + Math.random() * 0.6;
        brightness = 0.65 + Math.random() * 0.3;
      } else {
        color = spectralColors[Math.floor(Math.random() * 6)];
        size = 2.0 + Math.random() * 1.2;
        brightness = 0.95 + Math.random() * 0.35;
      }

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
      sz[i] = size;
      br[i] = brightness;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, brightnesses: br, phases: ph };
  }, []);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }, delta) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.0004;
      pointsRef.current.rotation.x += delta * 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aBrightness" args={[brightnesses, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={CinematicStarShader.vertexShader}
        fragmentShader={CinematicStarShader.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Photorealistic Earth with Textures ──────────────────────────────────────
function Earth() {
  const earthMeshRef = useRef();
  const cloudsMeshRef = useRef();

  const [earthDayMap, earthNormalMap, earthSpecularMap, earthCloudsMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png',
  ]);

  useMemo(() => {
    earthDayMap.colorSpace = THREE.SRGBColorSpace;
    earthCloudsMap.colorSpace = THREE.SRGBColorSpace;
  }, [earthDayMap, earthCloudsMap]);

  const sunPosition = useMemo(() => new THREE.Vector3(50, 15, 30).normalize(), []);

  const earthMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: earthDayMap,
      normalMap: earthNormalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughnessMap: earthSpecularMap,
      roughness: 0.7,
      metalness: 0.1,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDirection = { value: sunPosition };
      shader.fragmentShader = `
        uniform vec3 uSunDirection;
        ${shader.fragmentShader}
      `;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        vec3 worldNorm = normalize(vNormal);
        float sunDot = max(dot(worldNorm, uSunDirection), 0.0);
        float rim = 1.0 - abs(dot(normalize(worldNorm), vec3(0.0, 0.0, 1.0)));
        vec3 subtleAtmosphere = vec3(0.2, 0.5, 0.8) * pow(rim, 4.0) * sunDot * 0.5;
        gl_FragColor.rgb += subtleAtmosphere;
        `
      );
    };

    return mat;
  }, [earthDayMap, earthNormalMap, earthSpecularMap, sunPosition]);

  const cloudMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: earthCloudsMap,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
      roughness: 1.0,
    });
  }, [earthCloudsMap]);

  useFrame((_, delta) => {
    if (earthMeshRef.current) earthMeshRef.current.rotation.y += 0.04 * delta;
    if (cloudsMeshRef.current) cloudsMeshRef.current.rotation.y += 0.055 * delta;
  });

  return (
    <group rotation={[0, 0, (23.5 * Math.PI) / 180]}>
      <mesh ref={earthMeshRef} material={earthMaterial} castShadow receiveShadow>
        <sphereGeometry args={[2.0, 128, 128]} />
      </mesh>
      <mesh ref={cloudsMeshRef} material={cloudMaterial}>
        <sphereGeometry args={[2.008, 128, 128]} />
      </mesh>
    </group>
  );
}

// ─── Light Blue Sleek Orbit Path Ring ────────────────────────────────────────
function OrbitPath({ radius, tiltAngle, isThreatened = false, isSelected = false }) {
  const points = useMemo(() => {
    const segments = 180;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
    }
    return pts;
  }, [radius]);

  // Light blue orbit lines
  const lineColor = isThreatened ? '#ef4444' : isSelected ? '#00f0ff' : '#38bdf8';
  const lineOpacity = isThreatened ? 0.85 : isSelected ? 0.8 : 0.4;
  const lineWidth = isThreatened ? 1.4 : isSelected ? 1.3 : 0.85;

  return (
    <group rotation={[tiltAngle, 0, tiltAngle * 0.35]}>
      <Line points={points} color={lineColor} lineWidth={lineWidth} transparent opacity={lineOpacity} />
    </group>
  );
}

// ─── Photorealistic Hypervelocity Collision Blast Explosion ─────────────────
function BlastExplosion({ position }) {
  const groupRef = useRef();
  const lightRef = useRef();
  const shockwaveRef = useRef();
  const shockwave2Ref = useRef();
  const coreRef = useRef();
  const startTimeRef = useRef(null);

  const fragments = useMemo(() => {
    const list = [];
    const count = 75;
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      
      const speed = 0.4 + Math.random() * 2.4;
      const size = 0.02 + Math.random() * 0.06;
      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      
      const type = Math.floor(Math.random() * 4);
      let color = '#ff4500';
      if (type === 1) color = '#d97706';
      else if (type === 2) color = '#334155';
      else if (type === 3) color = '#0284c7';
      else color = '#ff7700';

      list.push({
        dir,
        speed,
        size,
        rotSpeed,
        type,
        color,
        pos: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      });
    }
    return list;
  }, []);

  useFrame(() => {
    if (!startTimeRef.current) startTimeRef.current = performance.now();
    const elapsed = (performance.now() - startTimeRef.current) / 1000.0;

    if (lightRef.current) {
      lightRef.current.intensity = Math.max(0, 45.0 * Math.exp(-elapsed * 3.5));
    }

    if (coreRef.current) {
      const scale = Math.min(3.5, 0.2 + elapsed * 2.8);
      coreRef.current.scale.set(scale, scale, scale);
      if (coreRef.current.material) {
        coreRef.current.material.opacity = Math.max(0, 0.95 * Math.exp(-elapsed * 2.2));
      }
    }

    if (shockwaveRef.current) {
      const ringScale = 0.1 + elapsed * 4.2;
      shockwaveRef.current.scale.set(ringScale, ringScale, ringScale);
      if (shockwaveRef.current.material) {
        shockwaveRef.current.material.opacity = Math.max(0, 0.8 * Math.exp(-elapsed * 1.8));
      }
    }
    if (shockwave2Ref.current) {
      const ringScale = 0.05 + elapsed * 3.2;
      shockwave2Ref.current.scale.set(ringScale, ringScale, ringScale);
      if (shockwave2Ref.current.material) {
        shockwave2Ref.current.material.opacity = Math.max(0, 0.7 * Math.exp(-elapsed * 1.5));
      }
    }

    fragments.forEach((f) => {
      f.pos.copy(f.dir).multiplyScalar(f.speed * elapsed * (1.0 - Math.min(0.7, elapsed * 0.15)));
    });
  });

  return (
    <group ref={groupRef} position={position || [0, 0, 0]}>
      <pointLight ref={lightRef} color="#ffedd5" intensity={45} distance={18} />

      <mesh ref={coreRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial color="#ff4500" transparent opacity={0.95} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={shockwaveRef} rotation={[Math.PI / 4, Math.PI / 3, 0]}>
        <torusGeometry args={[0.35, 0.018, 16, 48]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={shockwave2Ref} rotation={[-Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[0.28, 0.014, 16, 48]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
      </mesh>

      {fragments.map((f, idx) => (
        <mesh
          key={idx}
          position={[f.pos.x, f.pos.y, f.pos.z]}
          rotation={[f.rot.x, f.rot.y, f.rot.z]}
        >
          {f.type === 0 && <sphereGeometry args={[f.size * 0.6, 8, 8]} />}
          {f.type === 1 && <boxGeometry args={[f.size, f.size * 0.2, f.size * 1.4]} />}
          {f.type === 2 && <dodecahedronGeometry args={[f.size * 0.8, 0]} />}
          {f.type === 3 && <boxGeometry args={[f.size * 1.2, f.size * 0.1, f.size * 0.8]} />}
          <meshStandardMaterial
            color={f.color}
            metalness={0.9}
            roughness={0.2}
            emissive={f.color}
            emissiveIntensity={f.type === 0 ? 1.5 : 0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── High-Power Directed Energy Laser Beam ───────────────────────────────────
function DirectedLaserBeam({ startPos, endPos }) {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current || !startPos || !endPos) return;

    const start = new THREE.Vector3().copy(startPos);
    const end = new THREE.Vector3().copy(endPos);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();

    if (len < 0.01) return;

    // Center midpoint
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    meshRef.current.position.copy(mid);

    // Orient cylinder (default aligned with Y) to point along dir
    meshRef.current.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    meshRef.current.scale.set(1, len, 1);

    const t = clock.getElapsedTime();
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.85 + 0.15 * Math.sin(t * 45.0);
    }
  });

  if (!startPos || !endPos) return null;

  return (
    <group ref={meshRef}>
      {/* Intense White/Cyan Laser Core */}
      <mesh>
        <cylinderGeometry args={[0.022, 0.022, 1, 16, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.98} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Outer Cyan Plasma Energy Sleeve */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[0.07, 0.07, 1, 16, 1, true]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Directed Energy Laser Light */}
      <pointLight color="#00f0ff" intensity={25} distance={12} />
    </group>
  );
}

// ─── Satellite Laser Muzzle Flash ───────────────────────────────────────────
function LaserMuzzleFlash({ position }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 35 + 15 * Math.sin(clock.getElapsedTime() * 50);
    }
  });

  if (!position) return null;

  return (
    <group position={position}>
      <pointLight ref={lightRef} color="#00f0ff" intensity={35} distance={8} />
      <mesh>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ─── Thruster Exhaust Plume on Avoidance Maneuver ─────────────────────────────
function ThrusterPlume() {
  const plumeRef = useRef();
  const lightRef = useRef();

  const sparks = useMemo(() => {
    const list = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        dir: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, -(1.2 + Math.random() * 1.5)),
        size: 0.015 + Math.random() * 0.02,
        speed: 1.2 + Math.random() * 1.5,
      });
    }
    return list;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (plumeRef.current) {
      const flicker = 0.85 + 0.15 * Math.sin(t * 40.0);
      plumeRef.current.scale.set(flicker, flicker, flicker * (1.0 + 0.25 * Math.cos(t * 30.0)));
    }
    if (lightRef.current) {
      lightRef.current.intensity = 10.0 + 5.0 * Math.sin(t * 35.0);
    }
  });

  return (
    <group position={[0, -0.06, -0.08]} rotation={[Math.PI, 0, 0]}>
      {/* Thruster Plume Light */}
      <pointLight ref={lightRef} color="#00f0ff" intensity={12} distance={6} />

      {/* Primary Ion Plasma Flame Jet */}
      <group ref={plumeRef}>
        <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.04, 0.2, 16, 1, true]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.9} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.022, 0.13, 16, 1, true]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Plasma Sparks Burst */}
      {sparks.map((s, idx) => (
        <mesh key={idx} position={[s.dir.x * 0.12, s.dir.y * 0.12, s.dir.z * 0.1]}>
          <sphereGeometry args={[s.size, 6, 6]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Maneuver Delta-V Ring Flare */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.13, 24]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.85} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Slightly Enlarged Satellite Model (Names Only On Click) ───────────────
function SatelliteMesh({
  satellite,
  isSelected = false,
  isThreatened = false,
  isBlasted = false,
  isManeuvering = false,
  onSelect,
  onPositionUpdate
}) {
  const groupRef = useRef();
  const modelRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = satellite.speed || 0.52;
    const t = clock.getElapsedTime() * speed * 0.12 + (satellite.phaseOffset || 0);
    const radius = satellite.radius || 3.5;

    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    groupRef.current.position.set(x, 0, z);

    if (onPositionUpdate && isThreatened) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      onPositionUpdate(worldPos);
    }

    if (modelRef.current) {
      modelRef.current.rotation.y = t + Math.PI / 2;
      modelRef.current.rotation.x = Math.sin(t * 1.5) * 0.06;
    }
  });

  if (isBlasted && isThreatened) {
    return (
      <group rotation={[satellite.tiltAngle || 0.4, 0, (satellite.tiltAngle || 0.4) * 0.35]}>
        <group ref={groupRef}>
          <BlastExplosion position={[0, 0, 0]} />
        </group>
      </group>
    );
  }

  // Slightly increased base scale (1.18x)
  const baseScale = isSelected ? 1.5 : 1.18;

  return (
    <group rotation={[satellite.tiltAngle || 0.4, 0, (satellite.tiltAngle || 0.4) * 0.35]}>
      <group
        ref={groupRef}
        onClick={(e) => { e.stopPropagation(); onSelect?.(satellite); }}
      >
        <group ref={modelRef} scale={baseScale}>
          {/* Beacon Marker */}
          <mesh>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial
              color={isThreatened ? '#ef4444' : isManeuvering ? '#10b981' : isSelected ? '#00f0ff' : '#38bdf8'}
              transparent
              opacity={isThreatened ? 0.95 : isManeuvering ? 0.9 : isSelected ? 0.85 : 0.35}
            />
          </mesh>

          {/* Spacecraft bus body */}
          <mesh castShadow>
            <boxGeometry args={[0.082, 0.082, 0.11]} />
            <meshStandardMaterial
              color={isThreatened ? '#e11d48' : isManeuvering ? '#059669' : isSelected ? '#0284c7' : '#334155'}
              metalness={0.9}
              roughness={0.25}
              emissive={isThreatened ? '#9f1239' : isManeuvering ? '#047857' : isSelected ? '#0369a1' : '#0f172a'}
              emissiveIntensity={isThreatened ? 1.0 : isManeuvering ? 0.8 : isSelected ? 0.7 : 0.2}
            />
          </mesh>

          {/* Golden thermal blanket */}
          <mesh position={[0, 0.043, 0]}>
            <boxGeometry args={[0.07, 0.003, 0.1]} />
            <meshStandardMaterial color="#d97706" metalness={0.92} roughness={0.2} />
          </mesh>

          {/* Solar wings */}
          <group position={[-0.15, 0, 0]}>
            <mesh position={[0.045, 0, 0]}>
              <boxGeometry args={[0.07, 0.005, 0.005]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.14, 0.003, 0.08]} />
              <meshStandardMaterial color="#0f2942" metalness={0.95} roughness={0.1} emissive="#0284c7" emissiveIntensity={0.4} />
            </mesh>
          </group>

          <group position={[0.15, 0, 0]}>
            <mesh position={[-0.045, 0, 0]}>
              <boxGeometry args={[0.07, 0.005, 0.005]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.14, 0.003, 0.08]} />
              <meshStandardMaterial color="#0f2942" metalness={0.95} roughness={0.1} emissive="#0284c7" emissiveIntensity={0.4} />
            </mesh>
          </group>

          {/* Antenna horn & Directed Laser Emitter */}
          <group position={[0, 0.058, 0]} rotation={[0.3, 0, 0]}>
            <mesh>
              <coneGeometry args={[0.028, 0.035, 12, 1, true]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Thruster Plume when Maneuvering */}
          {isManeuvering && <ThrusterPlume />}

          {/* Threat beacon */}
          {isThreatened && !isManeuvering && (
            <mesh position={[0, 0.105, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          )}
        </group>

        {/* Floating Label: ONLY SHOWN WHEN CLICKED / SELECTED */}
        {isSelected && (
          <Html position={[0, 0.32, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="px-2.5 py-1 rounded-md bg-black/90 border border-cyan-400 font-mono text-[10px] whitespace-nowrap shadow-xl backdrop-blur-sm text-cyan-200">
              <div className="flex items-center gap-1.5 font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="font-bold">{satellite.name}</span>
                <span className="text-slate-400 font-mono">({satellite.altitudeKm} km)</span>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ─── Realistic Space Debris Model (Red Space Debris Shard & Hull) ────────────
function RealisticThreatDebrisModel() {
  return (
    <group scale={1.25}>
      {/* Fractured Rocket Hull / Battered Titanium Cylinder in Red */}
      <mesh position={[0, 0, 0]} rotation={[0.4, 0.2, 0.6]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.18, 8]} />
        <meshStandardMaterial
          color="#dc2626"
          metalness={0.92}
          roughness={0.3}
          emissive="#ef4444"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Jagged Fractured Metal Shard in Red */}
      <mesh position={[0.035, 0.08, 0.02]} rotation={[0.9, -0.5, 0.3]}>
        <dodecahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial
          color="#ef4444"
          metalness={0.95}
          roughness={0.25}
          emissive="#b91c1c"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Torn Crumpled MLI Thermal Foil in Amber-Red */}
      <mesh position={[-0.04, -0.05, 0.03]} rotation={[-0.6, 0.7, 0.4]}>
        <boxGeometry args={[0.07, 0.005, 0.06]} />
        <meshStandardMaterial
          color="#ea580c"
          metalness={0.9}
          roughness={0.2}
          emissive="#c2410c"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Bent Structural Alloy Strut */}
      <mesh position={[0.03, -0.08, -0.02]} rotation={[0.3, 0.9, -0.6]}>
        <cylinderGeometry args={[0.007, 0.007, 0.12, 6]} />
        <meshStandardMaterial color="#f87171" metalness={0.88} />
      </mesh>

      {/* Pulsing Collision Hazard Red Beacon */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

// ─── Realistic Roaming Debris Field & 10s Exact Contact Intercept ────────────
function RoamingDebrisField({
  threatActive,
  targetSatellite,
  isBlasted,
  debrisBlasted,
  selectedDebris,
  onSelectDebris,
  onThreatDebrisPosUpdate
}) {
  const threatDebrisRef = useRef();
  const threatStartTimeRef = useRef(null);

  // 70 realistic procedural space debris fragments in vivid red tones
  const roamingDebris = useMemo(() => {
    const list = [];
    const count = 70;
    const redPalette = ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#ea580c', '#991b1b'];
    for (let i = 0; i < count; i++) {
      const radius = 2.45 + Math.random() * 3.2;
      const tilt = (Math.random() - 0.5) * 2.4;
      const speed = 0.12 + Math.random() * 0.35;
      const phase = Math.random() * Math.PI * 2;
      const size = 0.035 + Math.random() * 0.055;
      const type = i % 5; // 0: fractured block, 1: rocket tube, 2: jagged shard, 3: solar truss, 4: ring fragment
      const color = redPalette[i % redPalette.length];
      list.push({ id: `DEB-${100 + i}`, name: `DEB-${100 + i} (FRAG)`, radius, tilt, speed, phase, size, type, color });
    }
    return list;
  }, []);

  // 240 surrounding orbital red micro-debris particles
  const microDebris = useMemo(() => {
    const particleCount = 240;
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 2.4 + Math.random() * 3.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.85;
      pos[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi);
      pos[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);
    }
    return pos;
  }, []);

  const targetRadius = targetSatellite?.radius || 3.5;
  const targetTilt = targetSatellite?.tiltAngle || -0.35;
  const targetSpeed = targetSatellite?.speed || 0.52;
  const targetPhase = targetSatellite?.phaseOffset || 2.75;

  useEffect(() => {
    if (threatActive) {
      threatStartTimeRef.current = performance.now();
    } else {
      threatStartTimeRef.current = null;
    }
  }, [threatActive]);

  const spawnPos = useMemo(() => {
    const startAngle = targetPhase + 1.6;
    const startR = targetRadius + 2.8;
    return new THREE.Vector3(
      Math.cos(startAngle) * startR,
      1.4,
      Math.sin(startAngle) * startR
    );
  }, [targetPhase, targetRadius]);

  useFrame(({ clock }) => {
    if (threatActive && threatDebrisRef.current && !isBlasted && !debrisBlasted) {
      const now = performance.now();
      const startTime = threatStartTimeRef.current || now;
      const elapsedSec = (now - startTime) / 1000.0;

      // Exact 10.0 seconds progress factor u in [0, 1]
      const u = Math.min(1.0, elapsedSec / 10.0);

      // Compute exact current target satellite world position at this instant
      const currentClock = clock.getElapsedTime();
      const satTime = currentClock * targetSpeed * 0.12 + targetPhase;
      const localSatX = Math.cos(satTime) * targetRadius;
      const localSatZ = Math.sin(satTime) * targetRadius;

      // Apply satellite orbital plane inclination transform
      const satPos = new THREE.Vector3(localSatX, 0, localSatZ);
      const euler = new THREE.Euler(targetTilt, 0, targetTilt * 0.35, 'XYZ');
      satPos.applyEuler(euler);

      // Interpolate smoothly: at u=1.0 (10s), debris position EQUALS exact satellite position
      const currentDebrisPos = new THREE.Vector3().lerpVectors(spawnPos, satPos, u);

      threatDebrisRef.current.position.copy(currentDebrisPos);

      // Realistic tumbling rotation
      threatDebrisRef.current.rotation.x += 0.05;
      threatDebrisRef.current.rotation.y += 0.06;
      threatDebrisRef.current.rotation.z += 0.04;

      if (onThreatDebrisPosUpdate) {
        onThreatDebrisPosUpdate(currentDebrisPos);
      }
    }
  });

  const isThreatSelected = selectedDebris === 'DEB-047' || selectedDebris?.id === 'DEB-047';

  return (
    <group>
      {/* 240 Orbital Red Micro-Debris Field */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[microDebris, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#ef4444" transparent opacity={0.45} sizeAttenuation />
      </points>

      {/* Background roaming red debris meshes */}
      {roamingDebris.map((deb) => {
        const isDebSelected = selectedDebris === deb.id || selectedDebris?.id === deb.id;
        return (
          <group key={deb.id} rotation={[deb.tilt, 0, deb.tilt * 0.4]}>
            <group
              position={[
                Math.cos(deb.phase) * deb.radius,
                0,
                Math.sin(deb.phase) * deb.radius
              ]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDebris?.(deb);
              }}
            >
              {deb.type === 0 && (
                <mesh>
                  <dodecahedronGeometry args={[deb.size * 0.7, 0]} />
                  <meshStandardMaterial
                    color={deb.color}
                    metalness={0.92}
                    roughness={0.3}
                    emissive={deb.color}
                    emissiveIntensity={0.25}
                  />
                </mesh>
              )}
              {deb.type === 1 && (
                <mesh>
                  <cylinderGeometry args={[deb.size * 0.35, deb.size * 0.45, deb.size * 1.5, 7]} />
                  <meshStandardMaterial
                    color={deb.color}
                    metalness={0.9}
                    roughness={0.35}
                    emissive={deb.color}
                    emissiveIntensity={0.2}
                  />
                </mesh>
              )}
              {deb.type === 2 && (
                <mesh>
                  <octahedronGeometry args={[deb.size * 0.8, 0]} />
                  <meshStandardMaterial
                    color={deb.color}
                    metalness={0.95}
                    roughness={0.25}
                    emissive={deb.color}
                    emissiveIntensity={0.3}
                  />
                </mesh>
              )}
              {deb.type === 3 && (
                <mesh>
                  <boxGeometry args={[deb.size * 1.3, deb.size * 0.15, deb.size * 0.6]} />
                  <meshStandardMaterial
                    color="#ea580c"
                    metalness={0.9}
                    roughness={0.2}
                    emissive="#c2410c"
                    emissiveIntensity={0.25}
                  />
                </mesh>
              )}
              {deb.type === 4 && (
                <mesh>
                  <torusGeometry args={[deb.size * 0.6, deb.size * 0.15, 8, 16]} />
                  <meshStandardMaterial
                    color={deb.color}
                    metalness={0.9}
                    roughness={0.3}
                    emissive={deb.color}
                    emissiveIntensity={0.2}
                  />
                </mesh>
              )}

              {/* ONLY SHOW DEBRIS NAME ON CLICK */}
              {isDebSelected && (
                <Html position={[0, 0.22, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                  <div className="px-2 py-0.5 rounded bg-red-950/95 border border-red-500 text-red-200 font-mono text-[9px] whitespace-nowrap shadow-lg">
                    {deb.name}
                  </div>
                </Html>
              )}
            </group>
          </group>
        );
      })}

      {/* Tracked Threat Debris (DEB-047) Hurdling Towards Target in 10s */}
      {threatActive && !isBlasted && !debrisBlasted && (
        <group
          ref={threatDebrisRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelectDebris?.({ id: 'DEB-047', name: 'DEB-047 (HIGH-VELOCITY FRAG)' });
          }}
        >
          <RealisticThreatDebrisModel />

          {/* ONLY SHOW THREAT DEBRIS NAME ON CLICK */}
          {isThreatSelected && (
            <Html position={[0, 0.26, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
              <div className="px-2.5 py-0.5 rounded bg-red-950/95 border border-red-500 text-red-300 font-mono text-[9px] whitespace-nowrap shadow-xl">
                DEB-047 (HIGH-VELOCITY FRAG)
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  );
}

// ─── Camera Controller (Stable, preserves user viewing angle on launch) ───
function CameraController() {
  return null;
}

// ─── Exported OrbitScene Component ───────────────────────────────────────────
export function OrbitScene({
  satellites = [],
  selectedSatellite = null,
  onSelectSatellite,
  selectedDebris = null,
  onSelectDebris,
  threatActive = false,
  targetSatellite = null,
  isBlasted = false,
  zoomTrigger = null,
  maneuverTrigger = null,
}) {
  const targetedId = targetSatellite?.id || 'sat-4';
  const [threatDebrisPos, setThreatDebrisPos] = useState(null);
  const [targetSatPos, setTargetSatPos] = useState(null);
  const [isManeuvering, setIsManeuvering] = useState(false);
  const [laserFiring, setLaserFiring] = useState(false);
  const [debrisBlasted, setDebrisBlasted] = useState(false);
  const [blastPos, setBlastPos] = useState(null);

  useEffect(() => {
    if (maneuverTrigger) {
      setIsManeuvering(true);
      setLaserFiring(true);

      // Snapshot position of debris at the moment laser strikes
      if (threatDebrisPos) {
        setBlastPos(new THREE.Vector3().copy(threatDebrisPos));
      }
      setDebrisBlasted(true);

      // Laser fires for 1.4s
      const laserTimer = setTimeout(() => {
        setLaserFiring(false);
      }, 1400);

      // Maneuver animation duration
      const maneuverTimer = setTimeout(() => {
        setIsManeuvering(false);
      }, 3500);

      return () => {
        clearTimeout(laserTimer);
        clearTimeout(maneuverTimer);
      };
    } else {
      setLaserFiring(false);
      setDebrisBlasted(false);
      setBlastPos(null);
    }
  }, [maneuverTrigger]);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [1.8, 1.3, 10.2], fov: 40, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onPointerMissed={() => {
          onSelectSatellite?.(null);
          onSelectDebris?.(null);
        }}
      >
        <color attach="background" args={['#000000']} />

        {/* Lights */}
        <ambientLight intensity={0.55} color="#1c2842" />
        <directionalLight position={[50, 15, 30]} intensity={2.8} color="#ffffff" castShadow />
        <directionalLight position={[-30, -8, -20]} intensity={0.35} color="#475569" />

        <Suspense fallback={null}>
          <CameraController zoomTrigger={zoomTrigger} threatDebrisPos={threatDebrisPos} />
          <StarField />
          <Earth />

          {/* Directed Energy Laser Beam when Maneuvering */}
          {laserFiring && targetSatPos && threatDebrisPos && (
            <>
              <DirectedLaserBeam startPos={targetSatPos} endPos={threatDebrisPos} />
              <LaserMuzzleFlash position={targetSatPos} />
            </>
          )}

          {/* Hypervelocity Explosion at Debris Position when Hit by Laser */}
          {debrisBlasted && (
            <BlastExplosion position={blastPos || threatDebrisPos || [0, 0, 0]} />
          )}

          {/* Light Blue Orbit Path Rings */}
          {satellites.map((sat) => {
            const isTarget = threatActive && (sat.id === targetedId || String(sat.id) === String(targetedId) || (targetedId === 4 && sat.id === 'sat-4'));
            return (
              <OrbitPath
                key={`orbit-${sat.id}`}
                radius={sat.radius || 3.5}
                tiltAngle={sat.tiltAngle || 0.45}
                isThreatened={isTarget}
                isSelected={selectedSatellite?.id === sat.id}
              />
            );
          })}

          {/* Satellite Models (Directed Laser Emitter & Thruster Plume) */}
          {satellites.map((sat) => {
            const isTarget = (sat.id === targetedId || String(sat.id) === String(targetedId) || (targetedId === 4 && sat.id === 'sat-4'));
            return (
              <SatelliteMesh
                key={`sat-${sat.id}`}
                satellite={sat}
                isSelected={selectedSatellite?.id === sat.id}
                isThreatened={threatActive && isTarget}
                isBlasted={isBlasted && isTarget}
                isManeuvering={isManeuvering && isTarget}
                onSelect={onSelectSatellite}
                onPositionUpdate={isTarget ? setTargetSatPos : undefined}
              />
            );
          })}

          {/* Realistic Roaming Debris Cloud & 10s Threat Intercept */}
          <RoamingDebrisField
            threatActive={threatActive}
            targetSatellite={targetSatellite || satellites.find(s => s.id === 'sat-4' || s.id === 4)}
            isBlasted={isBlasted}
            debrisBlasted={debrisBlasted}
            selectedDebris={selectedDebris}
            onSelectDebris={onSelectDebris}
            onThreatDebrisPosUpdate={setThreatDebrisPos}
          />
        </Suspense>

        <OrbitControls
          target={[0.4, 0, 0]}
          enablePan={false}
          enableZoom={true}
          minDistance={3.5}
          maxDistance={85.0}
          zoomSpeed={0.85}
          rotateSpeed={0.45}
          dampingFactor={0.05}
          enableDamping
          maxPolarAngle={Math.PI * 0.95}
          minPolarAngle={Math.PI * 0.05}
        />
      </Canvas>
    </div>
  );
}

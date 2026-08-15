"use client";

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html, useTexture } from '@react-three/drei';
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
    const starCount = 4200;
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
      pointsRef.current.rotation.y += delta * 0.0005;
      pointsRef.current.rotation.x += delta * 0.00015;
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
      {/* High-res Earth (radius 2.0) */}
      <mesh ref={earthMeshRef} material={earthMaterial} castShadow receiveShadow>
        <sphereGeometry args={[2.0, 128, 128]} />
      </mesh>
      {/* Cloud layer (radius 2.008) */}
      <mesh ref={cloudsMeshRef} material={cloudMaterial}>
        <sphereGeometry args={[2.008, 128, 128]} />
      </mesh>
    </group>
  );
}

// ─── Orbit Path Ring ─────────────────────────────────────────────────────────
function OrbitPath({ radius, tiltAngle, color = '#38bdf8', isThreatened = false, isSelected = false }) {
  const points = useMemo(() => {
    const segments = 160;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
    }
    return pts;
  }, [radius]);

  const lineColor = isThreatened ? '#ef4444' : isSelected ? '#38bdf8' : color;
  const lineOpacity = isThreatened ? 0.7 : isSelected ? 0.35 : 0.1;
  const lineWidth = isThreatened ? 1.3 : isSelected ? 1.0 : 0.65;

  return (
    <group rotation={[tiltAngle, 0, tiltAngle * 0.45]}>
      <Line points={points} color={lineColor} lineWidth={lineWidth} transparent opacity={lineOpacity} />
    </group>
  );
}

// ─── Detailed Satellite Model ─────────────────────────────────────────────────
function SatelliteMesh({ satellite, isSelected = false, isThreatened = false, onSelect }) {
  const groupRef = useRef();
  const modelRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = satellite.speed || 0.6;
    const t = clock.getElapsedTime() * speed * 0.1 + (satellite.phaseOffset || 0);
    const radius = satellite.radius || 2.8;

    groupRef.current.position.set(Math.cos(t) * radius, 0, Math.sin(t) * radius);

    if (modelRef.current) {
      modelRef.current.rotation.y = t + Math.PI / 2;
      modelRef.current.rotation.x = Math.sin(t * 1.5) * 0.06;
    }
  });

  return (
    <group rotation={[satellite.tiltAngle || 0.4, 0, (satellite.tiltAngle || 0.4) * 0.45]}>
      <group
        ref={groupRef}
        onClick={(e) => { e.stopPropagation(); onSelect?.(satellite); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <group ref={modelRef} scale={hovered || isSelected ? 1.5 : 1.0}>
          {/* Spacecraft bus body */}
          <mesh castShadow>
            <boxGeometry args={[0.06, 0.06, 0.085]} />
            <meshStandardMaterial
              color={isThreatened ? '#e11d48' : isSelected ? '#38bdf8' : '#334155'}
              metalness={0.9}
              roughness={0.25}
              emissive={isThreatened ? '#9f1239' : isSelected ? '#0369a1' : '#0f172a'}
              emissiveIntensity={isThreatened ? 0.9 : isSelected ? 0.6 : 0.1}
            />
          </mesh>

          {/* Golden thermal blanket (MLI) */}
          <mesh position={[0, 0.031, 0]}>
            <boxGeometry args={[0.05, 0.003, 0.075]} />
            <meshStandardMaterial color="#d97706" metalness={0.92} roughness={0.2} />
          </mesh>

          {/* Left solar array wing */}
          <group position={[-0.11, 0, 0]}>
            <mesh position={[0.035, 0, 0]}>
              <boxGeometry args={[0.05, 0.005, 0.005]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.1, 0.003, 0.06]} />
              <meshStandardMaterial color="#0f2942" metalness={0.95} roughness={0.1} emissive="#0284c7" emissiveIntensity={0.35} />
            </mesh>
          </group>

          {/* Right solar array wing */}
          <group position={[0.11, 0, 0]}>
            <mesh position={[-0.035, 0, 0]}>
              <boxGeometry args={[0.05, 0.005, 0.005]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.1, 0.003, 0.06]} />
              <meshStandardMaterial color="#0f2942" metalness={0.95} roughness={0.1} emissive="#0284c7" emissiveIntensity={0.35} />
            </mesh>
          </group>

          {/* Earth-facing antenna horn */}
          <group position={[0, 0.045, 0]} rotation={[0.3, 0, 0]}>
            <mesh>
              <coneGeometry args={[0.022, 0.025, 12, 1, true]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Threat beacon */}
          {isThreatened && (
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          )}
        </group>

        {/* Label: only on select or threat */}
        {(isSelected || isThreatened) && (
          <Html position={[0, 0.22, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div className={`px-2 py-0.5 rounded bg-black/85 border font-mono text-[9px] whitespace-nowrap shadow-md ${
              isThreatened ? 'border-red-500/70 text-red-300' : 'border-cyan-400 text-cyan-200'
            }`}>
              <div className="flex items-center gap-1.5 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${isThreatened ? 'bg-red-500 animate-ping' : 'bg-cyan-400'}`} />
                <span>{satellite.name}</span>
                <span className="text-slate-400">({satellite.altitudeKm}km)</span>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ─── Debris Field + Animated Threat Projectile ───────────────────────────────
function DebrisField({ threatActive }) {
  const pointsRef = useRef();
  const threatMeshRef = useRef();

  const { positions, colors } = useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const slate = new THREE.Color('#64748b');
    const faintAmber = new THREE.Color('#78716c');

    for (let i = 0; i < count; i++) {
      const radius = 2.45 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;

      positions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      const color = Math.random() > 0.85 ? faintAmber : slate;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, []);

  const threatTrajectoryPoints = useMemo(() => {
    const pts = [];
    const segments = 60;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 1.5;
      const r = 2.85 + Math.sin(t * 2) * 0.3;
      pts.push([Math.cos(t + 0.8) * r, Math.sin(t * 1.2) * 0.9, Math.sin(t + 0.8) * r]);
    }
    return pts;
  }, []);

  useFrame(({ clock }, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.006;
      pointsRef.current.rotation.x += delta * 0.002;
    }
    if (threatActive && threatMeshRef.current) {
      const time = clock.getElapsedTime() * 0.75;
      const r = 2.85 + Math.sin(time * 2) * 0.3;
      threatMeshRef.current.position.set(Math.cos(time + 0.8) * r, Math.sin(time * 1.2) * 0.9, Math.sin(time + 0.8) * r);
      threatMeshRef.current.rotation.x += delta * 2.2;
      threatMeshRef.current.rotation.y += delta * 3.0;
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} vertexColors transparent opacity={0.35} sizeAttenuation />
      </points>

      {threatActive && (
        <group>
          <Line
            points={threatTrajectoryPoints}
            color="#ef4444"
            lineWidth={1.2}
            transparent
            opacity={0.65}
            dashed
            dashScale={4}
            dashSize={0.15}
            gapSize={0.08}
          />
          <group ref={threatMeshRef}>
            <mesh castShadow>
              <dodecahedronGeometry args={[0.035, 0]} />
              <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.3} />
            </mesh>
            <mesh position={[0.015, -0.008, 0.01]} rotation={[0.5, 0.3, 0.4]}>
              <boxGeometry args={[0.035, 0.003, 0.02]} />
              <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshBasicMaterial color="#f97316" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}

// ─── Exported OrbitScene Component ───────────────────────────────────────────
export function OrbitScene({
  satellites = [],
  selectedSatellite = null,
  onSelectSatellite,
  threatActive = false,
}) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [1.8, 1.2, 8.5], fov: 36, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onPointerMissed={() => onSelectSatellite?.(null)}
      >
        <color attach="background" args={['#000000']} />

        {/* Ambient fill */}
        <ambientLight intensity={0.55} color="#1c2842" />
        {/* Directional sunlight */}
        <directionalLight position={[50, 15, 30]} intensity={2.8} color="#ffffff" castShadow />
        {/* Shadow fill */}
        <directionalLight position={[-30, -8, -20]} intensity={0.35} color="#475569" />

        <Suspense fallback={null}>
          <StarField />
          <Earth />

          {/* Orbit path rings */}
          {satellites.map((sat) => (
            <OrbitPath
              key={`orbit-${sat.id}`}
              radius={sat.radius || 2.85}
              tiltAngle={sat.tiltAngle || 0.45}
              color={sat.color || '#38bdf8'}
              isThreatened={threatActive && sat.id === 'sat-4'}
              isSelected={selectedSatellite?.id === sat.id}
            />
          ))}

          {/* Satellite models */}
          {satellites.map((sat) => (
            <SatelliteMesh
              key={`sat-${sat.id}`}
              satellite={sat}
              isSelected={selectedSatellite?.id === sat.id}
              isThreatened={threatActive && sat.id === 'sat-4'}
              onSelect={onSelectSatellite}
            />
          ))}

          <DebrisField threatActive={threatActive} />
        </Suspense>

        <OrbitControls
          target={[0.6, 0, 0]}
          enablePan={false}
          enableZoom={true}
          minDistance={4.5}
          maxDistance={14.0}
          rotateSpeed={0.35}
          dampingFactor={0.05}
          enableDamping
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
        />
      </Canvas>
    </div>
  );
}

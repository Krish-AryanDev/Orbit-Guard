'use client';

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./page.module.css";

export default function Home() {
  const mountRef = useRef(null);
  const [apiStatus, setApiStatus] = useState("Checking backend...");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();
        setApiStatus(data.ok ? `${data.service} online` : "Backend unavailable");
      } catch (error) {
        setApiStatus("Backend unavailable");
      }
    };

    fetchStatus();
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020b1a);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 1.5, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x9bbdff, 1.4);
    const pointLight = new THREE.PointLight(0xffc68a, 2.2, 100);
    pointLight.position.set(4, 5, 6);
    scene.add(ambientLight, pointLight);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x66ccff,
        emissive: 0x1a4d80,
        metalness: 0.25,
        roughness: 0.7,
      }),
    );
    orbitGroup.add(planet);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.12, 20, 180),
      new THREE.MeshBasicMaterial({
        color: 0x8ef0ff,
        transparent: true,
        opacity: 0.8,
      }),
    );
    ring.rotation.x = Math.PI / 2.6;
    orbitGroup.add(ring);

    const debrisGroup = new THREE.Group();
    for (let i = 0; i < 120; i += 1) {
      const debris = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + Math.random() * 0.08, 12, 12),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xffd166 : 0xff6b6b,
        }),
      );

      const radius = 3 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      debris.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3.5,
        Math.sin(angle) * radius,
      );
      debrisGroup.add(debris);
    }
    scene.add(debrisGroup);

    const animate = () => {
      orbitGroup.rotation.y += 0.004;
      debrisGroup.rotation.y -= 0.0025;
      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!mount) {
        return;
      }

      const { clientWidth, clientHeight } = mount;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>PS2 // Collision Awareness</p>
          <h1>Space Debris Avoidance System</h1>
          <p className={styles.subtitle}>
            Monitoring orbital risk, validating close-pass geometry, and
            prioritizing collision mitigation actions in real time.
          </p>

          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <span>System status</span>
              <strong>{apiStatus}</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Risk window</span>
              <strong>Low</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Track count</span>
              <strong>24</strong>
            </div>
          </div>
        </div>

        <div className={styles.sceneWrap}>
          <div ref={mountRef} className={styles.scene} aria-label="3D orbital visualization" />
        </div>
      </section>
    </main>
  );
}

// frontend/src/components/ParticleCanvas.jsx
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { createSun, createPlanets } from "../utils/solarSystem";

export default function ParticleCanvas({ userid, stage, status, startSimulation, pauseSimulation, changeStage }) {
  const mountRef = useRef();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 50000);
    camera.position.set(0, 2500, 10000);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // --- CSS2DRenderer for Labels ---
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    mount.appendChild(labelRenderer.domElement);

    // --- Controls ---
    const controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    let stageObject = null;
    let sun = null;
    let planets = [];

    const setupStage = () => {
      scene.children.filter((obj) => obj.userData.isStageObject).forEach((obj) => scene.remove(obj));
      stageObject = null;
      sun = null;
      planets = [];

      // --- Solar System ---
      if (stage === "solar_system") {
        sun = createSun();
        sun.userData.isStageObject = true;
        scene.add(sun);

        planets = createPlanets(scene, CSS2DObject);
        planets.forEach((p) => { p.mesh.userData.isStageObject = true; });

        camera.position.set(0, 500, 2500);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // --- BigBang ---
      if (stage === "bigbang") {
        const geometry = new THREE.BufferGeometry();
        const numParticles = 800000;
        const positions = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);
        const color = new THREE.Color();

        for (let i = 0; i < numParticles; i++) {
          const r = Math.random() * 3000;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);
          const c = Math.random();
          color.setRGB(c, c, c);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        stageObject = new THREE.Points(
          geometry,
          new THREE.PointsMaterial({ size: 2, vertexColors: true })
        );
        stageObject.userData.isStageObject = true;
        scene.add(stageObject);

        camera.position.set(0, 0, 1000);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // --- Galaxy Formation ---
      if (stage === "galaxy_formation") {
        const group = new THREE.Group();
        const numParticles = 400000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);
        const color = new THREE.Color();

        for (let i = 0; i < numParticles; i++) {
          const r = Math.random() * 5000;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3;
          positions[i * 3 + 2] = r * Math.cos(phi);
          const palette = [0x88ccff, 0xaa88ff, 0xff88cc, 0xffffff];
          color.setHex(palette[Math.floor(Math.random() * palette.length)]);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const stars = new THREE.Points(
          geometry,
          new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.9,
          })
        );
        group.add(stars);

        const core = new THREE.Mesh(
          new THREE.SphereGeometry(50, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
        );
        group.add(core);

        const jetMaterial = new THREE.MeshBasicMaterial({ color: 0x99ccff, transparent: true, opacity: 0.7 });
        const jetGeometry = new THREE.CylinderGeometry(5, 30, 1000, 32, 1, true);

        const jetUp = new THREE.Mesh(jetGeometry, jetMaterial);
        jetUp.position.y = 500;
        group.add(jetUp);

        const jetDown = new THREE.Mesh(jetGeometry, jetMaterial);
        jetDown.position.y = -500;
        group.add(jetDown);

        group.userData.isStageObject = true;
        stageObject = group;
        scene.add(stageObject);

        camera.position.set(0, 200, 1500);
        controls.target.set(0, 0, 0);
        controls.update();
      }
    };

    setupStage();

    let frameId;
    const animate = () => {
      if (stage === "solar_system" && sun) {
        sun.rotation.y += 0.002;
        planets.forEach((p) => {
          p.angle += p.speed;
          p.mesh.position.x = p.radius * Math.cos(p.angle);
          p.mesh.position.z = p.radius * Math.sin(p.angle);
        });
      } else if ((stage === "bigbang" || stage === "galaxy_formation") && stageObject) {
        stageObject.rotation.y += 0.0005;
      }

      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);

      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      mount.removeChild(labelRenderer.domElement);
    };
  }, [stage]);

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 100, display: "flex", gap: "8px" }}>
        <button onClick={startSimulation}>Start</button>
        <button onClick={pauseSimulation}>{status === "paused" ? "Resume" : "Pause"}</button>
        <button onClick={() => changeStage("bigbang")}>BigBang</button>
        <button onClick={() => changeStage("galaxy_formation")}>Galaxy</button>
        <button onClick={() => changeStage("solar_system")}>SolarSystem</button>
      </div>
    </div>
  );
}
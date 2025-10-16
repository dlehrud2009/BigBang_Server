// src/components/UniverseSimulation.jsx
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const STAGES = ["quark", "proton_neutron", "helium_nucleus", "atom", "star", "galaxy"];

// 랜덤 위치
const randomPos = (spread = 200) => [
  (Math.random() - 0.5) * spread,
  (Math.random() - 0.5) * spread,
  (Math.random() - 0.5) * spread,
];

// 입자 생성
const createParticle = (color, pos) => {
  const geom = new THREE.SphereGeometry(2, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(...pos);
  return mesh;
};

// 끌어당기는 힘
const attract = (mesh, target, factor = 0.02) => {
  mesh.position.x += (target.x - mesh.position.x) * factor;
  mesh.position.y += (target.y - mesh.position.y) * factor;
  mesh.position.z += (target.z - mesh.position.z) * factor;
};

export default function UniverseSimulation() {
  const mountRef = useRef();
  const [stageIndex, setStageIndex] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 0, 200);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    let objs = [];

    const setupStage = () => {
      // 기존 객체 제거
      objs.forEach(o => scene.remove(o.mesh));
      objs = [];

      const stage = STAGES[stageIndex];

      if (stage === "quark") {
        for (let i = 0; i < 50; i++) objs.push({ mesh: createParticle(0xff0000, randomPos()), type: "quark" });
        for (let i = 0; i < 50; i++) objs.push({ mesh: createParticle(0x00ff00, randomPos()), type: "electron" });
      }

      if (stage === "proton_neutron") {
        objs.push(...Array.from({ length: 30 }, () => ({ mesh: createParticle(0x0000ff, randomPos()), type: "proton", target: new THREE.Vector3(0,0,0) })));
        objs.push(...Array.from({ length: 30 }, () => ({ mesh: createParticle(0xffff00, randomPos()), type: "neutron", target: new THREE.Vector3(0,0,0) })));
      }

      if (stage === "helium_nucleus") {
        objs.push({ mesh: createParticle(0x0000ff, [-5,0,0]), type: "proton", target: new THREE.Vector3(0,0,0) });
        objs.push({ mesh: createParticle(0x0000ff, [5,0,0]), type: "proton", target: new THREE.Vector3(0,0,0) });
        objs.push({ mesh: createParticle(0xffff00, [-2,5,0]), type: "neutron", target: new THREE.Vector3(0,0,0) });
        objs.push({ mesh: createParticle(0xffff00, [2,5,0]), type: "neutron", target: new THREE.Vector3(0,0,0) });
      }

      if (stage === "atom") {
        objs.push({ mesh: createParticle(0x0000ff, [0,0,0]), type: "proton" });
        objs.push({ mesh: createParticle(0xffff00, [2,2,0]), type: "neutron" });
        objs.push({ mesh: createParticle(0x00ff00, [20,0,0]), type: "electron", orbitRadius: 20, angle: Math.random()*Math.PI*2, speed: 0.05 });
      }

      if (stage === "star") {
        for (let i = 0; i < 20; i++) objs.push({ mesh: createParticle(0xffaa00, randomPos(100)), type: "star" });
      }

      if (stage === "galaxy") {
        for (let i = 0; i < 200; i++) {
          const radius = Math.random()*200;
          objs.push({ mesh: createParticle(0xffffff, randomPos(400)), type: "star", angle: Math.random()*Math.PI*2, radius, speed: 0.002+Math.random()*0.003 });
        }
      }

      objs.forEach(o => scene.add(o.mesh));
      setParticles(objs);
    };

    setupStage();

    let frameId;
    const animate = () => {
      const stage = STAGES[stageIndex];

      objs.forEach(p => {
        if ((stage === "proton_neutron" || stage === "helium_nucleus") && p.target) attract(p.mesh, p.target, 0.05);
        if (stage === "atom" && p.type === "electron") {
          p.angle += p.speed;
          p.mesh.position.x = Math.cos(p.angle) * p.orbitRadius;
          p.mesh.position.y = Math.sin(p.angle) * p.orbitRadius;
        }
        if (stage === "galaxy" && p.type === "star") {
          p.angle += p.speed;
          p.mesh.position.x = Math.cos(p.angle) * p.radius;
          p.mesh.position.y = Math.sin(p.angle) * p.radius;
        }
      });

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [stageIndex]);

  const nextStage = () => setStageIndex(prev => (prev + 1) % STAGES.length);
  const prevStage = () => setStageIndex(prev => (prev - 1 + STAGES.length) % STAGES.length);

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "8px" }}>
        <button onClick={prevStage}>Prev Stage</button>
        <button onClick={nextStage}>Next Stage</button>
      </div>
    </div>
  );
}
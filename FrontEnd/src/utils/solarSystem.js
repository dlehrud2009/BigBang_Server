// src/utils/solarSystem.js
import * as THREE from "three";

// ----------------------
// 스케일 상수
// ----------------------
const SCALE_DISTANCE = 10; // 행성 거리 10배
const SCALE_SIZE = 10;     // 행성 크기 10배
const SUN_SCALE = 10;      // 태양 크기 10배

// ----------------------
// 태양계 행성 데이터
// ----------------------
export const solarSystemPlanets = [
  { name: "Mercury", radius: 60 * SCALE_DISTANCE, size: 3 * SCALE_SIZE, color: 0x888888, speed: 0.02 },
  { name: "Venus",   radius: 90 * SCALE_DISTANCE, size: 6 * SCALE_SIZE, color: 0xffa500, speed: 0.015 },
  { name: "Earth",   radius: 120 * SCALE_DISTANCE, size: 7 * SCALE_SIZE, color: 0x00bfff, speed: 0.01 },
  { name: "Mars",    radius: 150 * SCALE_DISTANCE, size: 5 * SCALE_SIZE, color: 0xff0000, speed: 0.008 },
  { name: "Jupiter", radius: 190 * SCALE_DISTANCE, size: 12 * SCALE_SIZE, color: 0x8b4513, speed: 0.005 },
  { name: "Saturn",  radius: 230 * SCALE_DISTANCE, size: 10 * SCALE_SIZE, color: 0xdaa520, speed: 0.004, ring: true },
  { name: "Uranus",  radius: 270 * SCALE_DISTANCE, size: 9 * SCALE_SIZE, color: 0xadd8e6, speed: 0.003 },
  { name: "Neptune", radius: 310 * SCALE_DISTANCE, size: 9 * SCALE_SIZE, color: 0x00008b, speed: 0.0025 },
];

// ----------------------
// 태양 생성
// ----------------------
export function createSun() {
  const geo = new THREE.SphereGeometry(10, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff33,
    emissiveIntensity: 1,
    metalness: 0,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.set(SUN_SCALE, SUN_SCALE, SUN_SCALE); // 태양 스케일 적용
  mesh.userData.isSun = true;
  return mesh;
}

// ----------------------
// 행성 생성
// ----------------------
export function createPlanets(scene, CSS2DObject) {
  return solarSystemPlanets.map(p => {
    const geo = new THREE.SphereGeometry(p.size, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      metalness: 0,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // 토성 고리
    if (p.ring) {
      const ringScale = 4; // 고리 강조용 스케일
      const ringGeo = new THREE.RingGeometry(
        p.size + 5 * ringScale,  // 안쪽 반지름
        p.size + 15 * ringScale, // 바깥쪽 반지름
        128
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd2b48c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      mesh.add(ring);
    }


    mesh.userData.isPlanet = true;
    scene.add(mesh);

    // 행성 라벨
    if (CSS2DObject) {
      const labelDiv = document.createElement("div");
      labelDiv.className = "label";
      labelDiv.textContent = p.name;
      labelDiv.style.color = "white";
      labelDiv.style.fontSize = "20px";
      labelDiv.style.fontFamily = "Arial";
      labelDiv.style.pointerEvents = "none";
      const label = new CSS2DObject(labelDiv);
      label.position.set(0, p.size + 10, 0);
      mesh.add(label);
    }

    // 궤도 생성
    const segments = 128;
    const orbitPositions = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      orbitPositions.push(p.radius * Math.cos(theta), 0, p.radius * Math.sin(theta));
    }
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute("position", new THREE.Float32BufferAttribute(orbitPositions, 3));
    const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
    orbitLine.userData.isOrbit = true;
    scene.add(orbitLine);

    return { ...p, mesh, angle: Math.random() * Math.PI * 2 };
  });
}

// ----------------------
// 행성 위치 업데이트
// ----------------------
export function updatePlanetPositions(planets) {
  planets.forEach(p => {
    p.angle += p.speed;
    p.mesh.position.x = p.radius * Math.cos(p.angle);
    p.mesh.position.z = p.radius * Math.sin(p.angle);
  });
}

// ----------------------
// 은하 생성
// ----------------------
export function generateGalaxy(numStars = 5000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(numStars * 3);
  const colors = new Float32Array(numStars * 3);
  const color = new THREE.Color();

  for (let i = 0; i < numStars; i++) {
    const branch = i % 4;
    const radius = Math.random() * 400;
    const angle = radius * 0.1 + branch * Math.PI / 2;
    const spread = (Math.random() - 0.5) * 15;

    positions[i * 3] = radius * Math.cos(angle) + spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = radius * Math.sin(angle) + spread;

    const c = Math.random() * 0.8 + 0.2;
    color.setRGB(c, c, c);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 2, vertexColors: true })
  );
}
// utils/galaxyUtils.js
import * as THREE from "three";

export function generateSpiralGalaxy(numParticles = 30000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(numParticles * 3);
  const colors = new Float32Array(numParticles * 3);
  const color = new THREE.Color();

  const arms = 3;
  const armOffset = (2 * Math.PI) / arms;
  const spiralTwist = 5;
  const galaxyRadius = 300;

  for (let i = 0; i < numParticles; i++) {
    const r = Math.pow(Math.random(), 0.5) * galaxyRadius;
    const arm = i % arms;
    const theta = r * spiralTwist + arm * armOffset + (Math.random() - 0.5) * 0.5;

    const x = r * Math.cos(theta) + (Math.random() - 0.5) * 5;
    const y = (Math.random() - 0.5) * 10;
    const z = r * Math.sin(theta) + (Math.random() - 0.5) * 5;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = 1 - r / galaxyRadius + Math.random() * 0.2;
    color.setRGB(c, c * 0.9, c * 0.7);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 2, vertexColors: true })
  );
  points.userData.isStageObject = true;

  return points;
}

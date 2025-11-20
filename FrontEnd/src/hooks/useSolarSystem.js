// src/hooks/useSolarSystem.js
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { createSun, createPlanets, updatePlanetPositions, generateGalaxy } from "../utils/solarSystem";

export function useSolarSystem(scene, camera, active) {
  const planetsRef = useRef([]);
  const sunRef = useRef();
  const galaxyRef = useRef();
  const frameIdRef = useRef();
  const labelRendererRef = useRef();
  const rendererRef = useRef();

  const SCALE_DISTANCE = 50;
  const SCALE_SIZE = 50;
  const SUN_SCALE = 50;

  useEffect(() => {
    if (!active || !scene || !camera) return;

    // ----------------------
    // WebGLRenderer
    // ----------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ----------------------
    // CSS2DRenderer (행성 이름)
    // ----------------------
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    document.body.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // ----------------------
    // 태양
    // ----------------------
    const sun = createSun(CSS2DObject);
    sun.scale.set(SUN_SCALE, SUN_SCALE, SUN_SCALE);
    scene.add(sun);
    sunRef.current = sun;

    // ----------------------
    // 행성
    // ----------------------
    const planets = createPlanets(scene, CSS2DObject).map(p => {
      p.mesh.scale.set(SCALE_SIZE, SCALE_SIZE, SCALE_SIZE);
      p.radius *= SCALE_DISTANCE;
      p.speed *= 0.05;
      return p;
    });
    planetsRef.current = planets;

    // ----------------------
    // 은하 배경
    // ----------------------
    const galaxy = generateGalaxy(5000);
    galaxy.scale.set(10, 10, 10);
    scene.add(galaxy);
    galaxyRef.current = galaxy;

    // ----------------------
    // 카메라
    // ----------------------
    camera.position.set(0, 2500, 10000);

    // ----------------------
    // 애니메이션
    // ----------------------
    const animate = () => {
      sun.rotation.y += 0.0001;
      updatePlanetPositions(planetsRef.current);

      frameIdRef.current = requestAnimationFrame(animate);

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // ----------------------
    // 정리
    // ----------------------
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      planetsRef.current.forEach(p => scene.remove(p.mesh));
      scene.remove(sun);
      scene.remove(galaxy);
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
    };
  }, [scene, camera, active]);
}
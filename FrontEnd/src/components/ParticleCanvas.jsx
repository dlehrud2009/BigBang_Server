// frontend/src/components/ParticleCanvas.jsx
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { createSun, createPlanets, solarSystemPlanets } from "../utils/solarSystem";
import {
  createClassroomBlackboard,
  updateClassroomBlackboard
} from "../utils/educationalBigBang";
import "./ParticleCanvas.css";

export default function ParticleCanvas({ userid, stage, status, startSimulation, pauseSimulation, changeStage }) {
  const mountRef = useRef();
  const changeStageRef = useRef(changeStage);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayTime, setDisplayTime] = useState(null);
  const [educationalStageIndex, setEducationalStageIndex] = useState(0);
  const planetsRef = useRef([]);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const followPlanetRef = useRef(null);
  const educationalStageRef = useRef(0);

  useEffect(() => {
    changeStageRef.current = changeStage;
  }, [changeStage]);

  // 시계 업데이트
  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 50000);
    camera.position.set(0, 2500, 10000);

    // --- Renderer ---
    // Create a canvas and attempt to get a WebGL2 or WebGL context with fallback strategies.
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = width;
    canvas.height = height;

    let gl = null;
    let contextError = null;

    // Try multiple context creation strategies
    const contextOptions = [
      { antialias: true },
      { antialias: false },
      { antialias: false, powerPreference: 'high-performance' },
      { antialias: false, powerPreference: 'low-power' },
      { antialias: false, preserveDrawingBuffer: true },
    ];

    for (let opts of contextOptions) {
      try {
        gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts);
        if (gl) {
          console.log('[Three.js] WebGL context created with options:', opts);
          console.log('[Three.js] WebGL Version:', gl.getParameter(gl.VERSION));
          console.log('[Three.js] Renderer:', gl.getParameter(gl.RENDERER));
          break;
        }
      } catch (err) {
        contextError = err;
        console.warn('[Three.js] Context creation failed with options', opts, ':', err.message);
      }
    }

    // If we couldn't create a GL context, show a friendly overlay and skip renderer creation.
    let noWebglOverlay = null;
    if (!gl) {
      noWebglOverlay = document.createElement('div');
      noWebglOverlay.className = 'no-webgl';
      const errorMsg = contextError ? `(${contextError.message})` : '';
      noWebglOverlay.innerHTML = `<h2>WebGL 사용 불가</h2><p>브라우저 또는 그래픽 드라이버가 WebGL을 지원하지 않습니다 ${errorMsg}.</p><p>해결책: 1) 다른 브라우저 시도 (Chrome/Firefox/Edge), 2) 브라우저 하드웨어 가속 활성화, 3) 그래픽 드라이버 업데이트</p>`;
      mount.appendChild(noWebglOverlay);
      mount.appendChild(canvas);
      console.error('[Three.js] Failed to create WebGL context after all attempts. Error:', contextError);
    }

    // Create renderer only when we have a valid context
    const renderer = gl ? new THREE.WebGLRenderer({ canvas, context: gl, antialias: false }) : null;
    if (renderer) {
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);
      console.log('[Three.js] WebGLRenderer created and mounted successfully');
    } else {
      console.error('[Three.js] WebGLRenderer creation skipped due to missing GL context');
    }

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
    controlsRef.current = controls;

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xffffff, 2.2, 0, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.userData.isStageObject = true;
    scene.add(sunLight);

    let stageObject = null;
    let sun = null;
    let planets = [];
    
    // --- Big Bang Animation State ---
    let bigBangStartTime = null;
    let isBigBangAnimating = false;
    const BIGBANG_DURATION = 5000; // 5 seconds
    
    // --- Educational BigBang State ---
    let eduBigBangStartTime = null;
    let currentEduPhase = 0;
    let eduBigBangObjects = [];

    const setupStage = () => {
      scene.children.filter((obj) => obj.userData.isStageObject).forEach((obj) => scene.remove(obj));
      stageObject = null;
      sun = null;
      planets = [];

      // --- Solar System ---
      if (stage === "solar_system") {
        sun = createSun(CSS2DObject);
        sun.userData.isStageObject = true;
        scene.add(sun);

        planets = createPlanets(scene, CSS2DObject);
        planets.forEach((p) => { p.mesh.userData.isStageObject = true; });

        // expose planets to outer scope for UI-driven focus
        planetsRef.current = planets;

        // 초기 선택 없애기
        setSelectedPlanet(null);
        camera.position.set(0, 500, 2500);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // --- BigBang ---
      if (stage === "bigbang") {
        const geometry = new THREE.BufferGeometry();
        // Reduced from 800000 to 200000 for better compatibility with macOS/Chrome
        const numParticles = 200000;
        const positions = new Float32Array(numParticles * 3);
        const initialPositions = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);
        const color = new THREE.Color();

        // 각 파티클의 목표 색상을 저장할 배열
        const targetColors = new Float32Array(numParticles * 3);
        
        // Start with particles very close to origin (pre-Big Bang high density state)
        for (let i = 0; i < numParticles; i++) {
          const r = Math.random() * 50; // 매우 작은 반지름으로 시작 (고밀도)
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          initialPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          initialPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          initialPositions[i * 3 + 2] = r * Math.cos(phi);
          
          // 초기 색상: 모두 흰색
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 1.0;
          colors[i * 3 + 2] = 1.0;
          
          // 목표 색상: 랜덤하게 다양한 색상 (흰색 → 주황 → 빨강 계열)
          const intensity = Math.random();
          const heat = intensity * 0.5 + 0.5; // 0.5~1.0
          targetColors[i * 3] = 1.0; // R
          targetColors[i * 3 + 1] = heat; // G
          targetColors[i * 3 + 2] = heat * 0.7; // B
          
          // 초기 위치 저장
          positions[i * 3] = initialPositions[i * 3];
          positions[i * 3 + 1] = initialPositions[i * 3 + 1];
          positions[i * 3 + 2] = initialPositions[i * 3 + 2];
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        stageObject = new THREE.Points(
          geometry,
          new THREE.PointsMaterial({ size: 3, vertexColors: true, sizeAttenuation: true })
        );
        stageObject.userData.isStageObject = true;
        stageObject.userData.initialPositions = initialPositions;
        stageObject.userData.geometry = geometry;
        stageObject.userData.targetColors = targetColors;
        scene.add(stageObject);

        // Start Big Bang animation
        bigBangStartTime = Date.now();
        isBigBangAnimating = true;

        camera.position.set(0, 0, 2000);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // --- Galaxy Formation ---
      if (stage === "galaxy_formation") {
        const group = new THREE.Group();
        // Reduced from 400000 to 100000 for better compatibility
        const numParticles = 100000;
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
          
          // 다양한 색상 팔레트
          const palette = [
            0x88ccff, // 하늘색
            0xaa88ff, // 보라색
            0xff88cc, // 핑크색
            0xffffff, // 흰색
            0xffff88, // 노란색
            0xffaa88, // 주황색
            0x88ffaa, // 민트색
            0xaaffff, // 시안색
          ];
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
            sizeAttenuation: true,
          })
        );
        group.add(stars);

        group.userData.isStageObject = true;
        stageObject = group;
        scene.add(stageObject);

        camera.position.set(0, 200, 1500);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // --- Educational BigBang ---
      if (stage === "edu_bigbang") {
        currentEduPhase = 0;
        eduBigBangObjects = [];
        eduBigBangStartTime = Date.now();
        educationalStageRef.current = 0;
        
        // Create Canvas texture (Classroom Blackboard)
        const blackboardCanvas = createClassroomBlackboard();
        const texture = new THREE.CanvasTexture(blackboardCanvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        
        // Create a plane to display the canvas
        const geometry = new THREE.PlaneGeometry(1400, 900);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.userData.isStageObject = true;
        mesh.userData.type = "edu_bigbang";
        mesh.userData.canvas = blackboardCanvas;
        mesh.userData.texture = texture;
        
        scene.add(mesh);
        eduBigBangObjects.push(mesh);

        camera.position.set(0, 0, 900);
        controls.target.set(0, 0, 0);
        controls.update();
      }
    };

    setupStage();

    // Raycaster for clicks (행성 클릭을 감지)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function findPlanetFromObject(obj) {
      while (obj) {
        const found = planets.find(p => p.mesh === obj);
        if (found) return found;
        obj = obj.parent;
      }
      return null;
    }

    const onPointerDown = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = planets.map(p => p.mesh).filter(Boolean);
      const intersects = raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const planet = findPlanetFromObject(obj);
        if (planet) {
          // Find full planet data from solarSystemPlanets
          const fullData = solarSystemPlanets.find(p => p.name === planet.name);
          setSelectedPlanet({ 
            name: planet.name, 
            radius: planet.radius, 
            size: planet.size,
            description: fullData?.description || "행성에 대한 정보가 없습니다.",
            imageUrl: fullData?.imageUrl
          });
        } else {
          setSelectedPlanet(null);
        }
      } else {
        setSelectedPlanet(null);
      }
    };

    // 캔버스(라벨 렌더러)에서 클릭을 잡는 편이 안전
    labelRenderer.domElement.style.cursor = 'pointer';
    labelRenderer.domElement.addEventListener('pointerdown', onPointerDown);

    // keep refs for camera and controls
    cameraRef.current = camera;

    let frameId;
    const animate = () => {
      const cameraDistance = camera.position.distanceTo(controls.target);

      if (stage === "solar_system" && sun) {
        sun.rotation.y += 0.002;
        planets.forEach((p) => {
          p.angle += p.speed;
          p.mesh.position.x = p.radius * Math.cos(p.angle);
          p.mesh.position.z = p.radius * Math.sin(p.angle);
        });
        // when not bigbang, show normal clock
        if (displayTime) setDisplayTime(null);
        
        // If a planet is being followed, smoothly update camera/controls to track it
        const follow = followPlanetRef.current;
        if (follow && follow.mesh) {
          const targetPos = new THREE.Vector3();
          follow.mesh.getWorldPosition(targetPos);
          // desired camera offset: somewhat above and behind the planet
          const offset = new THREE.Vector3(0, Math.max(200, follow.size * 6), Math.max(400, follow.size * 10));
          const desiredPos = targetPos.clone().add(offset);
          // lerp camera and controls target smoothly
          camera.position.lerp(desiredPos, 0.08);
          controls.target.lerp(targetPos, 0.12);
          controls.update();
        }
      } else if (stage === "bigbang" && stageObject && isBigBangAnimating) {
        const elapsed = Date.now() - bigBangStartTime;
        const progress = Math.min(elapsed / BIGBANG_DURATION, 1);
        const expansionFactor = Math.pow(progress * 60 + 1, 2);

        const positions = stageObject.geometry.attributes.position.array;
        const initialPositions = stageObject.userData.initialPositions;
        const targetColors = stageObject.userData.targetColors;
        const colors = stageObject.geometry.attributes.color.array;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] = initialPositions[i] * expansionFactor;
          positions[i + 1] = initialPositions[i + 1] * expansionFactor;
          positions[i + 2] = initialPositions[i + 2] * expansionFactor;

          const colorProgress = progress;
          colors[i] = 1.0 + (targetColors[i] - 1.0) * colorProgress;
          colors[i + 1] = 1.0 + (targetColors[i + 1] - 1.0) * colorProgress;
          colors[i + 2] = 1.0 + (targetColors[i + 2] - 1.0) * colorProgress;
        }

        stageObject.geometry.attributes.position.needsUpdate = true;
        stageObject.geometry.attributes.color.needsUpdate = true;
        stageObject.rotation.y += 0.0005;

        const baseSize = 3;
        const distanceFactor = Math.max(1, cameraDistance / 2000);
        stageObject.material.size = baseSize * distanceFactor;

        if (progress >= 1) isBigBangAnimating = false;
        // Update cosmological display time (0 -> 13.8 billion years)
        try {
          const years = progress * 13.8e9; // 13.8 billion years
          // format to 3 significant digits with suffix
          const billions = years / 1e9;
          const display = `${billions.toFixed(3)} B years`;
          setDisplayTime(display);
        } catch (e) {}
      } else if (stage === "bigbang" && stageObject && !isBigBangAnimating) {
        const baseSize = 3;
        const distanceFactor = Math.max(1, cameraDistance / 2000);
        stageObject.material.size = baseSize * distanceFactor;
        stageObject.rotation.y += 0.0005;
      } else if (stage === "galaxy_formation" && stageObject) {
        stageObject.rotation.y += 0.0005;
        const baseSize = 2;
        const distanceFactor = Math.max(1, cameraDistance / 1500);
        if (stageObject.children[0] && stageObject.children[0].material) {
          stageObject.children[0].material.size = baseSize * distanceFactor;
        }
      } else if (stage === "edu_bigbang") {
        // Educational BigBang animation logic - Update canvas
        if (eduBigBangStartTime && eduBigBangObjects.length > 0) {
          const mesh = eduBigBangObjects[0];
          if (mesh.userData.canvas && mesh.userData.texture) {
            const elapsed = Date.now() - eduBigBangStartTime;
            const time = elapsed * 0.001; // Convert to seconds
            
            // Update canvas
            updateClassroomBlackboard(mesh.userData.canvas, time);
            mesh.userData.texture.needsUpdate = true;
          }
        }
      }

      controls.update();
      if (renderer) renderer.render(scene, camera);
      if (labelRenderer) labelRenderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
  // Start animation loop only when a WebGL renderer exists
  if (renderer) animate();

    const onResize = () => {
      const newWidth = mount.clientWidth || window.innerWidth;
      const newHeight = mount.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      if (renderer) renderer.setSize(newWidth, newHeight);
      if (labelRenderer) labelRenderer.setSize(newWidth, newHeight);
      // ensure canvas element (if present) matches size
      if (canvas) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
    };
    window.addEventListener("resize", onResize);

    // cleanup
    return () => {
      labelRenderer.domElement.removeEventListener('pointerdown', onPointerDown);
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      if (renderer) {
        try { renderer.dispose(); } catch (e) {}
        if (renderer.domElement && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      }
      // remove label renderer dom
      if (labelRenderer.domElement && mount.contains(labelRenderer.domElement)) mount.removeChild(labelRenderer.domElement);
      // remove any no-webgl overlay or raw canvas we appended
      if (noWebglOverlay && mount.contains(noWebglOverlay)) mount.removeChild(noWebglOverlay);
      if (canvas && mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, [stage]);

  return (
    <div className="particle-canvas-root">
      <div ref={mountRef} className="canvas-mount" />

      <div className="control-bar">
        <button className="control-button" onClick={startSimulation}>Start</button>
        <button className="control-button" onClick={pauseSimulation}>{status === "paused" ? "Resume" : "Pause"}</button>
        <button className="control-button" onClick={() => changeStage("bigbang")}>BigBang</button>
        <button className="control-button" onClick={() => changeStage("edu_bigbang")}>우주 진화</button>
        <button className="control-button" onClick={() => changeStage("galaxy_formation")}>Galaxy</button>
        <button className="control-button" onClick={() => changeStage("solar_system")}>SolarSystem</button>
      </div>

      <aside className="info-panel">
        <div className="clock">{stage === 'bigbang' && displayTime ? displayTime : currentTime.toLocaleTimeString()}</div>
        {selectedPlanet ? (
          <div className="description" style={{
            backgroundImage: selectedPlanet.imageUrl ? `linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url('${selectedPlanet.imageUrl}')` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}>
            <h3>{selectedPlanet.name}</h3>
            {selectedPlanet.imageUrl && (
              <img src={selectedPlanet.imageUrl} alt={selectedPlanet.name} className="planet-image" />
            )}
            <p className="planet-description">{selectedPlanet.description}</p>
            
            <div className="planet-specs">
              <div className="spec-item">
                <span className="spec-label">🌡️ 온도:</span>
                <span className="spec-value">{selectedPlanet.temperature}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">💨 대기:</span>
                <span className="spec-value">{selectedPlanet.atmosphere}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">🌙 위성:</span>
                <span className="spec-value">{selectedPlanet.moons}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">🔄 궤도 반지름:</span>
                <span className="spec-value">{Math.round(selectedPlanet.radius).toLocaleString()} km</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">📏 크기:</span>
                <span className="spec-value">{Math.round(selectedPlanet.size).toLocaleString()} km</span>
              </div>
            </div>
            
            <div className="planet-focus-controls">
              <button 
                className="focus-button" 
                onClick={() => {
                  const planet = planetsRef.current.find(p => p.name === selectedPlanet.name);
                  if (planet) {
                    followPlanetRef.current = planet;
                  }
                }}
              >
                🔍 행성 추적
              </button>
              <button 
                className="focus-button" 
                onClick={() => {
                  followPlanetRef.current = null;
                }}
              >
                🔓 추적 해제
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="description">
              <h3>{stage === "bigbang" ? "빅뱅 - 우주의 시작" : 
                   stage === "edu_bigbang" ? "우주의 진화 - 고등학교 과학" :
                   stage === "galaxy_formation" ? "은하수 형성" : 
                   "태양계 시뮬레이션"}</h3>
              {stage === "bigbang" && (
                <div>
                  <p>약 138억 년 전, 우주는 믿을 수 없을 정도로 작고 뜨거운 한 점에서 시작되었습니다.</p>
                  <p>빅뱅 이론에 따르면, 우주는 순식간에 거대한 규모로 팽창했고, 이 과정에서 기본 입자들이 형성되었습니다.</p>
                  <p>시뮬레이션은 이 극적인 팽창과 냉각 과정을 보여줍니다. 입자들의 움직임과 색상 변화를 관찰해보세요.</p>
                </div>
              )}
              {stage === "edu_bigbang" && (
                <div>
                  <h4>우주의 진화 (고등학교 1학년 과학)</h4>
                  <p><strong>현재 단계: </strong>
                    {educationalStageIndex === 0 && "쿼크-글루온 플라즈마"}
                    {educationalStageIndex === 1 && "쿼크 → 양성자/중성자"}
                    {educationalStageIndex === 2 && "핵융합 → 원자핵 형성"}
                    {educationalStageIndex === 3 && "원자 형성 (보어 모델)"}
                    {educationalStageIndex >= 4 && "완료"}
                  </p>
                </div>
              )}
              {stage === "galaxy_formation" && (
                <div>
                  <p>중력의 영향으로 물질이 모여들면서 은하가 형성되기 시작했습니다.</p>
                  <p>우리는 수많은 은하 중 하나인 은하수(Milky Way) 안에 살고 있습니다.</p>
                  <p>다양한 색상의 별들이 우주 공간에서 회전하며 만드는 아름다운 나선 은하의 모습을 관찰할 수 있습니다.</p>
                </div>
              )}
              {stage === "solar_system" && (
                <div>
                  <p>태양계는 태양과 8개의 행성, 그리고 수많은 위성과 소행성으로 구성되어 있습니다.</p>
                  <p>행성들은 태양 주위를 타원 궤도로 공전하고 있으며, 각자의 자전축을 중심으로 자전도 하고 있습니다.</p>
                  <p>행성을 클릭하면 해당 행성에 대한 정보를 확인할 수 있습니다.</p>
                </div>
              )}
            </div>
            <div className="stage-info">
              <h4>조작 방법</h4>
              <p>마우스 드래그: 시점 회전</p>
              <p>마우스 휠: 확대/축소</p>
              <p>행성 클릭: 행성 정보 보기</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
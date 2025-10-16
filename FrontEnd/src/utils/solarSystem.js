// src/utils/solarSystem.js
import * as THREE from "three";

// ----------------------
// 스케일 상수
// ----------------------
const SCALE_DISTANCE = 12; // 행성 거리 스케일 상향
const SCALE_SIZE = 16;     // 행성 크기 스케일 상향
const SUN_SCALE = 22;      // 태양 크기 스케일 상향 (더 크게)

// ----------------------
// 태양계 행성 데이터
// ----------------------
export const solarSystemPlanets = [
  { name: "Mercury", radius: 60 * SCALE_DISTANCE, size: 3 * SCALE_SIZE, color: 0x888888, speed: 0.02 },
  { name: "Venus",   radius: 90 * SCALE_DISTANCE, size: 6 * SCALE_SIZE, color: 0xffa500, speed: 0.015 },
  { name: "Earth",   radius: 120 * SCALE_DISTANCE, size: 8 * SCALE_SIZE, color: 0x00bfff, speed: 0.01 },
  { name: "Mars",    radius: 150 * SCALE_DISTANCE, size: 5 * SCALE_SIZE, color: 0xff5533, speed: 0.008 },
  { name: "Jupiter", radius: 190 * SCALE_DISTANCE, size: 12 * SCALE_SIZE, color: 0xc48a3a, speed: 0.005 },
  { name: "Saturn",  radius: 230 * SCALE_DISTANCE, size: 12 * SCALE_SIZE, color: 0xdec07a, speed: 0.004, ring: true },
  { name: "Uranus",  radius: 270 * SCALE_DISTANCE, size: 9 * SCALE_SIZE, color: 0x8fd6e8, speed: 0.003 },
  { name: "Neptune", radius: 310 * SCALE_DISTANCE, size: 9 * SCALE_SIZE, color: 0x3557ff, speed: 0.0025 },
];

// ----------------------
// Canvas 기반 절차적 텍스처 유틸
// ----------------------
function createCanvasTexture(width = 1024, height = 512, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

function noise(ctx, w, h, alpha = 0.1) {
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = Math.random() * 255;
    data[i] = (data[i] * (1 - alpha)) + n * alpha;
    data[i + 1] = (data[i + 1] * (1 - alpha)) + n * alpha;
    data[i + 2] = (data[i + 2] * (1 - alpha)) + n * alpha;
  }
  ctx.putImageData(img, 0, 0);
}

function createPlanetTexture(name, baseHex) {
  const base = new THREE.Color(baseHex);
  return createCanvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = `#${base.getHexString()}`;
    ctx.fillRect(0, 0, w, h);

    if (name === 'Jupiter' || name === 'Saturn') {
      for (let y = 0; y < h; y += 12) {
        const t = y / h;
        const shade = 0.8 + Math.sin(t * Math.PI * 8) * 0.15;
        const c = base.clone().multiplyScalar(shade);
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.fillRect(0, y, w, 10);
      }
    } else if (name === 'Uranus' || name === 'Neptune') {
      for (let y = 0; y < h; y += 18) {
        const c = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.fillRect(0, y, w, 12);
      }
      ctx.globalAlpha = 0.15; noise(ctx, w, h, 0.2); ctx.globalAlpha = 1;
    } else if (name === 'Earth') {
      ctx.fillStyle = '#1b4d89';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2ea043';
      for (let i = 0; i < 90; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 8 + Math.random() * 40;
        ctx.beginPath();
        ctx.ellipse(x, y, r * (0.8 + Math.random()*0.6), r, Math.random()*Math.PI, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.12; noise(ctx, w, h, 0.4); ctx.globalAlpha = 1;
    } else if (name === 'Venus') {
      for (let y = 0; y < h; y += 16) {
        const c = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.fillRect(0, y, w, 16);
      }
      ctx.globalAlpha = 0.2; noise(ctx, w, h, 0.3); ctx.globalAlpha = 1;
    } else if (name === 'Mars' || name === 'Mercury') {
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 3 + 1;
        const c = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.15; noise(ctx, w, h, 0.3); ctx.globalAlpha = 1;
    }
  });
}

function createRingTexture(inner = 0.6, outer = 1.2) {
  const size = 1024;
  return createCanvasTexture(size, size, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, maxR = Math.min(cx, cy);
    const grad = ctx.createRadialGradient(cx, cy, inner * maxR, cx, cy, outer * maxR);
    grad.addColorStop(0.0, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.6, 'rgba(200,180,140,0.25)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
}

// ----------------------
// 절차적 하이트맵 -> 노멀 근사 생성
// ----------------------
function createNormalMapFromHeight(heightTex) {
  const src = heightTex.image;
  const w = src.width, h = src.height;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const out = ctx.createImageData(w, h);
  const od = out.data;
  const getGray = (x, y) => {
    x = Math.max(0, Math.min(w - 1, x));
    y = Math.max(0, Math.min(h - 1, y));
    const i = (y * w + x) * 4;
    return data[i] / 255; // R 채널만 사용
  };
  const strength = 2.0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = getGray(x + 1, y) - getGray(x - 1, y);
      const dy = getGray(x, y + 1) - getGray(x, y - 1);
      let nx = -dx * strength, ny = -dy * strength, nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const i = (y * w + x) * 4;
      od[i] = Math.round((nx * 0.5 + 0.5) * 255);
      od[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      od[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      od[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createProceduralPlanetMaps(name, baseHex) {
  const width = 4096, height = 2048; // 고해상도 캔버스
  // 색상 맵
  const colorTex = createPlanetTexture(name, baseHex);
  // 하이트맵: 행성 유형별 높이 강조
  const heightTex = createCanvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = 'rgb(127,127,127)';
    ctx.fillRect(0, 0, w, h);
    if (name === 'Earth') {
      // 대륙을 약간 높게
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgb(200,200,200)';
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const rw = 12 + Math.random() * 60, rh = 8 + Math.random() * 40;
        ctx.beginPath();
        ctx.ellipse(x, y, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.15; noise(ctx, w, h, 0.4); ctx.globalAlpha = 1;
    } else if (name === 'Mars' || name === 'Mercury') {
      // 크레이터 질감
      ctx.fillStyle = 'rgb(180,180,180)';
      for (let i = 0; i < 3500; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 4 + 1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.2; noise(ctx, w, h, 0.5); ctx.globalAlpha = 1;
    } else if (name === 'Jupiter' || name === 'Saturn' || name === 'Uranus' || name === 'Neptune') {
      // 가스 행성: 줄무늬의 높낮이 약간
      for (let y = 0; y < h; y += 6) {
        const gray = 110 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
        ctx.fillRect(0, y, w, 4);
      }
      ctx.globalAlpha = 0.1; noise(ctx, w, h, 0.3); ctx.globalAlpha = 1;
    }
  });
  const normalTex = createNormalMapFromHeight(heightTex);
  return { colorTex, normalTex };
}

// ----------------------
// 태양 생성
// ----------------------
export function createSun() {
  // 그룹으로 구성: 코어 + 코로나 + 플레어
  const sunGroup = new THREE.Group();
  sunGroup.userData.isSun = true;

  // 코어 텍스처(절차적) - 화소 노이즈 + 띠그라데이션
  const coreTex = createCanvasTexture(2048, 1024, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fff59e');
    grad.addColorStop(0.5, '#ffcc33');
    grad.addColorStop(1, '#ff9933');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.25; noise(ctx, w, h, 0.6); ctx.globalAlpha = 1;
  });

  const coreGeo = new THREE.SphereGeometry(10, 128, 128);
  const coreMat = new THREE.MeshStandardMaterial({
    map: coreTex,
    color: 0xffffff,
    emissive: new THREE.Color(0xffc83a),
    emissiveMap: coreTex,
    emissiveIntensity: 1.4,
    metalness: 0.0,
    roughness: 0.2,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.scale.set(SUN_SCALE, SUN_SCALE, SUN_SCALE);
  sunGroup.add(core);

  // 코로나(발광 스프라이트)
  const glowTex = createCanvasTexture(1024, 1024, (ctx, w, h) => {
    const cx = w/2, cy = h/2, r = Math.min(cx, cy);
    const g = ctx.createRadialGradient(cx, cy, r*0.1, cx, cy, r);
    g.addColorStop(0.0, 'rgba(255,220,120,0.9)');
    g.addColorStop(0.4, 'rgba(255,180,60,0.35)');
    g.addColorStop(1.0, 'rgba(255,140,30,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glow = new THREE.Sprite(glowMat);
  const glowScale = 1.9 * SUN_SCALE * 10; // 코어 대비 크게
  glow.scale.set(glowScale, glowScale, 1);
  sunGroup.add(glow);

  // 링처럼 보이는 플레어 제거 (태양은 코어+코로나만 유지)

  return sunGroup;
}

// ----------------------
// 행성 생성
// ----------------------
export function createPlanets(scene, CSS2DObject) {
  return solarSystemPlanets.map(p => {
    const geo = new THREE.SphereGeometry(p.size, 96, 96);
    let mat;
    const { colorTex, normalTex } = createProceduralPlanetMaps(p.name, p.color);
    // 야간 발광(지구만 약하게)
    let emissive = undefined, emissiveIntensity = 0.0;
    if (p.name === 'Earth') {
      emissive = new THREE.Color(0x222244);
      emissiveIntensity = 0.15;
    }
    mat = new THREE.MeshStandardMaterial({
      map: colorTex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 0.9,
      metalness: 0.0,
      emissive,
      emissiveIntensity,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // 자전축 기울기
    const tilts = { Mercury: 0.01, Venus: 177 * Math.PI/180, Earth: 23.5 * Math.PI/180, Mars: 25 * Math.PI/180, Jupiter: 3 * Math.PI/180, Saturn: 27 * Math.PI/180, Uranus: 98 * Math.PI/180, Neptune: 28 * Math.PI/180 };
    mesh.rotation.z = tilts[p.name] || 0;

    // 토성 고리
    if (p.ring) {
      const inner = p.size * 1.5;
      const outer = p.size * 2.8;
      const ringGeo = new THREE.RingGeometry(inner, outer, 256);
      const ringTex = createRingTexture(inner/outer * 0.9, 1.0);
      ringTex.wrapS = THREE.RepeatWrapping;
      ringTex.wrapT = THREE.RepeatWrapping;
      const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.userData.isRing = true;
      mesh.add(ring);
    }

    // 지구 구름 레이어
    if (p.name === 'Earth') {
      const cloudsGeo = new THREE.SphereGeometry(p.size * 1.02, 96, 96);
      const cloudsTex = createCanvasTexture(1024, 512, (ctx, w, h) => {
        ctx.fillStyle = 'rgba(255,255,255,0)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        for (let i = 0; i < 250; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const rw = 30 + Math.random() * 120;
          const rh = 12 + Math.random() * 40;
          ctx.beginPath();
          ctx.ellipse(x, y, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.25; noise(ctx, w, h, 0.2); ctx.globalAlpha = 1;
      });
      const cloudsMat = new THREE.MeshStandardMaterial({ map: cloudsTex, transparent: true, opacity: 0.45, depthWrite: false });
      const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
      clouds.userData.isClouds = true;
      mesh.add(clouds);

      // 대기권(프레넬 근사): 카메라 각도에서 가장자리만 더 보이게
      const atmosphereGeo = new THREE.SphereGeometry(p.size * 1.06, 96, 96);
      const atmosphereMat = new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.06 });
      const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
      atmosphere.userData.isAtmosphere = true;
      mesh.add(atmosphere);
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

    const baseRotation = 0.01;
    const rotationMap = { Mercury: 0.002, Venus: -0.001, Earth: 0.02, Mars: 0.018, Jupiter: 0.05, Saturn: 0.04, Uranus: -0.03, Neptune: 0.03 };
    const rotationSpeed = rotationMap[p.name] ?? baseRotation;
    return { ...p, mesh, angle: Math.random() * Math.PI * 2, rotationSpeed };
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
    if (p.rotationSpeed) {
      p.mesh.rotation.y += p.rotationSpeed;
      const clouds = p.mesh.children && p.mesh.children.find(c => c.userData && c.userData.isClouds);
      if (clouds) clouds.rotation.y += p.rotationSpeed * 1.2;
    }
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
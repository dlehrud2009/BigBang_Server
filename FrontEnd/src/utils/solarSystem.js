// src/utils/solarSystem.js
import * as THREE from "three";

const SCALE_DISTANCE = 12;
const SCALE_SIZE = 16;
const SUN_SCALE = 50;


export const solarSystemPlanets = [
  { 
    name: "Mercury", 
    radius: 60 * SCALE_DISTANCE, 
    size: 3 * SCALE_SIZE, 
    color: 0x888888, 
    speed: 0.02,
    description: "수성은 태양에 가장 가까운 행성입니다. 매우 빠른 공전 속도와 극단적인 온도 변화가 특징입니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/02/Mercury_in_true_color.jpg",
    temperature: "낮: 430°C / 밤: -180°C",
    atmosphere: "매우 희박한 대기 (산소, 나트륨)",
    moons: "위성 없음"
  },
  { 
    name: "Venus", 
    radius: 90 * SCALE_DISTANCE, 
    size: 6 * SCALE_SIZE, 
    color: 0xffa500, 
    speed: 0.015,
    description: "금성은 태양계에서 가장 뜨거운 행성입니다. 두꺼운 대기와 강한 온실 효과로 표면 온도가 매우 높습니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg",
    temperature: "평균 465°C",
    atmosphere: "이산화탄소 (96.5%), 질소",
    moons: "위성 없음"
  },
  { 
    name: "Earth", 
    radius: 120 * SCALE_DISTANCE, 
    size: 8 * SCALE_SIZE, 
    color: 0x00bfff, 
    speed: 0.01,
    description: "지구는 우리가 살고 있는 유일한 생명이 존재하는 행성입니다. 액체 물과 적절한 온도가 생명을 가능하게 합니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/69/NASA_Blue_Marble_2002.jpg",
    temperature: "평균 15°C",
    atmosphere: "질소 (78%), 산소 (21%)",
    moons: "달 (1개)"
  },
  { 
    name: "Mars", 
    radius: 150 * SCALE_DISTANCE, 
    size: 5 * SCALE_SIZE, 
    color: 0xff5533, 
    speed: 0.008,
    description: "화성은 붉은 행성으로 알려져 있습니다. 산화철이 풍부하며 태양계에서 가장 탐사가 많이 이루어진 행성입니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
    temperature: "평균 -65°C",
    atmosphere: "이산화탄소 (95%), 질소",
    moons: "포보스, 데이모스 (2개)"
  },
  { 
    name: "Jupiter", 
    radius: 190 * SCALE_DISTANCE, 
    size: 12 * SCALE_SIZE, 
    color: 0xc48a3a, 
    speed: 0.005,
    description: "목성은 태양계에서 가장 큰 행성입니다. 주로 가스로 이루어져 있으며 수십 개 이상의 위성을 가지고 있습니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Jupiter.jpg",
    temperature: "평균 -110°C",
    atmosphere: "수소 (90%), 헬륨 (10%)",
    moons: "이오, 유로파, 가니메데, 칼리스토 등 95개+"
  },
  { 
    name: "Saturn", 
    radius: 230 * SCALE_DISTANCE, 
    size: 12 * SCALE_SIZE, 
    color: 0xdec07a, 
    speed: 0.004, 
    ring: true,
    description: "토성은 아름다운 고리로 유명한 행성입니다. 고리는 얼음과 암석으로 이루어진 입자들로 구성되어 있습니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg",
    temperature: "평균 -140°C",
    atmosphere: "수소 (96%), 헬륨 (3%)",
    moons: "타이탄, 레아, 이아페투스 등 146개+"
  },
  { 
    name: "Uranus", 
    radius: 270 * SCALE_DISTANCE, 
    size: 9 * SCALE_SIZE, 
    color: 0x8fd6e8, 
    speed: 0.003,
    description: "천왕성은 독특한 청록색을 띠는 행성입니다. 자전축이 90도 가까이 기울어져 있는 매우 특이한 행성입니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg",
    temperature: "평균 -195°C",
    atmosphere: "수소, 헬륨, 메탄",
    moons: "타이타니아, 오베론, 움브리엘 등 27개+"
  },
  { 
    name: "Neptune", 
    radius: 310 * SCALE_DISTANCE, 
    size: 9 * SCALE_SIZE, 
    color: 0x3557ff, 
    speed: 0.0025,
    description: "해왕성은 태양계 가장자리의 푸른 행성입니다. 태양계에서 가장 먼 행성이며 매우 강한 바람이 있습니다.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/63/Neptune.jpg",
    temperature: "평균 -200°C",
    atmosphere: "수소, 헬륨, 메탄",
    moons: "트리톤, 프로테우스 등 16개+"
  },
];

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
    return data[i] / 255;
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
  const colorTex = createPlanetTexture(name, baseHex);
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
      ctx.fillStyle = 'rgb(180,180,180)';
      for (let i = 0; i < 3500; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 4 + 1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.2; noise(ctx, w, h, 0.5); ctx.globalAlpha = 1;
    } else if (name === 'Jupiter' || name === 'Saturn' || name === 'Uranus' || name === 'Neptune') {
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

export function createSun(CSS2DObject) {
  const sunGroup = new THREE.Group();
  sunGroup.userData.isSun = true;

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
  const glowScale = 1.9 * SUN_SCALE * 10;
  glow.scale.set(glowScale, glowScale, 1);
  sunGroup.add(glow);

  if (CSS2DObject) {
    const labelDiv = document.createElement('div');
    labelDiv.textContent = 'Sun';
    labelDiv.style.color = '#ffffff';
    labelDiv.style.fontSize = '16px';
    labelDiv.style.fontWeight = 'bold';
    labelDiv.style.textShadow = '0 0 10px #ffcc33';
    labelDiv.style.pointerEvents = 'none';
    labelDiv.style.userSelect = 'none';
    
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, -SUN_SCALE * 15, 0);
    sunGroup.add(label);
  }

  return sunGroup;
}

export function createPlanets(scene, CSS2DObject) {
  return solarSystemPlanets.map(p => {
    const geo = new THREE.SphereGeometry(p.size, 96, 96);
    let mat;
    const { colorTex, normalTex } = createProceduralPlanetMaps(p.name, p.color);
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

    const tilts = { Mercury: 0.01, Venus: 177 * Math.PI/180, Earth: 23.5 * Math.PI/180, Mars: 25 * Math.PI/180, Jupiter: 3 * Math.PI/180, Saturn: 27 * Math.PI/180, Uranus: 98 * Math.PI/180, Neptune: 28 * Math.PI/180 };
    mesh.rotation.z = tilts[p.name] || 0;

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

      const atmosphereGeo = new THREE.SphereGeometry(p.size * 1.06, 96, 96);
      const atmosphereMat = new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.06 });
      const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
      atmosphere.userData.isAtmosphere = true;
      mesh.add(atmosphere);
    }


    mesh.userData.isPlanet = true;
    scene.add(mesh);

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
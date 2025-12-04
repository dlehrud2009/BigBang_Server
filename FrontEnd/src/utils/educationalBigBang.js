// 교육용 빅뱅 시뮬레이션 - 칠판 강의식 형식
// 시간이 지나면서 각 단계가 칠판에 그려집니다

export function createClassroomBlackboard() {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  
  // 칠판 배경 (어두운 초록색)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a3a2a');
  gradient.addColorStop(1, '#0f2620');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 칠판 테두리
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 15;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  
  // 제목
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('The Big Bang: 우주의 진화', canvas.width / 2, 60);
  
  // 시간축 (가로줄)
  ctx.strokeStyle = '#ffff99';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(100, 750);
  ctx.lineTo(canvas.width - 100, 750);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 시간축 레이블
  ctx.fillStyle = '#ffff99';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('10⁻¹² s', 100, 800);
  ctx.fillText('10⁻⁶ s', 400, 800);
  ctx.fillText('1-3 min', 700, 800);
  ctx.fillText('380,000 years', 1000, 800);
  
  return canvas;
}

export function updateClassroomBlackboard(canvas, time) {
  const ctx = canvas.getContext('2d');
  
  // 칠판 배경
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a3a2a');
  gradient.addColorStop(1, '#0f2620');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 칠판 테두리
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 15;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  
  // 제목
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('The Big Bang: 우주의 진화', canvas.width / 2, 60);
  
  // 시간축
  ctx.strokeStyle = '#ffff99';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(100, 750);
  ctx.lineTo(canvas.width - 100, 750);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 시간축 레이블
  ctx.fillStyle = '#ffff99';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('10⁻¹² s', 100, 800);
  ctx.fillText('10⁻⁶ s', 380, 800);
  ctx.fillText('1-3 min', 680, 800);
  ctx.fillText('380k years', 980, 800);
  
  // 우주 역사 인포그래픽(5번째 이미지)을 참고한 타임라인/깔때기 시각화
  drawUniverseTimeline(ctx, canvas, time);
  
  // 현재 시간 표시
  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`t = ${time.toFixed(1)}s (simulation)`, canvas.width - 50, 850);
}
 
  // 우주 역사 인포그래픽 스타일 타임라인 그리기
  function drawUniverseTimeline(ctx, canvas, time) {
    const left = 140;
    const right = canvas.width - 140;
    const width = right - left;
    const centerY = 320;
    const stages = [
      { title: 'Big Bang', sub: '13.8 billion years ago', color: '#FFDDAA' },
      { title: 'Quark-gluon plasma', sub: '1 microsecond', color: '#FF6B6B' },
      { title: 'Nucleons form', sub: 'few microseconds', color: '#FFB86B' },
      { title: 'Light elements', sub: '10s–20min', color: '#88DD88' },
      { title: 'Structure formation', sub: 'Millions years', color: '#88CCFF' },
      { title: 'Today', sub: '13.8 billion years', color: '#B0A0FF' }
    ];

    // compute expanding sizes to mimic funnel
    const minR = 40;
    const maxR = 220;
    const n = stages.length;

    // draw soft cone behind (chalky trapezoid)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(left - 20, centerY - minR);
    ctx.lineTo(left - 20, centerY + minR);
    ctx.lineTo(right + 20, centerY + maxR);
    ctx.lineTo(right + 20, centerY - maxR);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // highlight current stage based on time
    const cycle = 12; // seconds per cycle
    const p = ((time % cycle) + cycle) % cycle / cycle;
    const activeIndex = Math.floor(p * n);

    // 전체 설명을 한 번에 그립니다 (단계별 타이핑 대신)
    drawCombinedDescription(ctx, canvas);

    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // x position along timeline
      const cx = left + t * width;
      // radius grows with t (expanding universe)
      const rx = minR + t * (maxR - minR);
      const ry = rx * 0.6;

        // chalky ellipse
      const g = ctx.createRadialGradient(cx - rx * 0.2, centerY - ry * 0.2, rx * 0.1, cx, centerY, rx);
      g.addColorStop(0, hexWithAlpha(stages[i].color, 0.9));
      g.addColorStop(1, hexWithAlpha('#000000', 0.05));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, centerY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // dashed outline (chalk)
      ctx.setLineDash([10, 6]);
      ctx.strokeStyle = '#FFFF99';
      ctx.lineWidth = i === activeIndex ? 4 : 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // stage title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = i === activeIndex ? 'bold 16px Arial' : '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stages[i].title, cx, centerY - ry - 12);
      // sub label
      ctx.fillStyle = '#FFFF99';
      ctx.font = '12px Arial';
      ctx.fillText(stages[i].sub, cx, centerY + ry + 16);

      // pulsing indicator for active stage
      if (i === activeIndex) {
        const glow = 1 + Math.sin(time * 3) * 0.08;
        ctx.beginPath();
        ctx.fillStyle = hexWithAlpha('#FFFF99', 0.12 * glow);
        ctx.ellipse(cx, centerY, rx + 12 * glow, ry + 8 * glow, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // draw detailed slice contents (high-quality visuals)
      drawSliceDetails(ctx, i, cx, centerY, rx, ry, time);

      ctx.restore();
    }

    // draw connecting timeline arrow
    ctx.save();
    ctx.strokeStyle = '#FFFF99';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(left, centerY + minR + 30);
    ctx.lineTo(right + 30, centerY + maxR + 60);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrow head
    ctx.beginPath();
    ctx.moveTo(right + 30, centerY + maxR + 60);
    ctx.lineTo(right + 18, centerY + maxR + 46);
    ctx.lineTo(right + 18, centerY + maxR + 74);
    ctx.closePath();
    ctx.fillStyle = '#FFFF99';
    ctx.fill();
    ctx.restore();
  }

  function hexWithAlpha(hex, alpha) {
    // hex like #RRGGBB
    const c = hex.replace('#','');
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
// 각 첨부 이미지(2,3,4)에 해당하는 패널을 그립니다.
function drawPanelForAttachment(ctx, idx, x, y, progress) {
  ctx.save();
  const baseAlpha = 0.9;
  ctx.globalAlpha = baseAlpha * (0.5 + progress * 0.5);

  switch (idx) {
    case 0:
      drawQGP(ctx, x, y, progress);
      break;
    case 1:
      drawProtonsNeutrons(ctx, x, y, progress);
      break;
    case 2:
      drawLightElements(ctx, x, y, progress);
      break;
    case 3:
      drawAtomPanel(ctx, x, y, progress);
      break;
  }

  ctx.restore();
}

// ---------- 상세 슬라이스 콘텐츠 (고퀄) ----------
function drawSliceDetails(ctx, idx, cx, cy, rx, ry, time) {
  // idx: 0..n-1
  // use offscreen canvas for complex patterns when needed
  switch (idx) {
    case 0: // Big Bang - bright flash + expanding particles
      drawBigBangFlash(ctx, cx, cy, rx, ry, time);
      break;
    case 1: // Quark-gluon plasma - dense colored particles
      drawQGPDetail(ctx, cx, cy, rx, ry, time);
      break;
    case 2: // Nucleons form - clusters of protons/neutrons
      drawNucleonClusters(ctx, cx, cy, rx, ry, time);
      break;
    case 3: // Light elements - fusion sparks and small nuclei
      drawLightElementFormation(ctx, cx, cy, rx, ry, time);
      break;
    case 4: // Structure formation / CMB-like texture
      drawCMBAndProtoStructures(ctx, cx, cy, rx, ry, time);
      break;
    case 5: // Today - galaxies, stars, life icon
      drawTodayScene(ctx, cx, cy, rx, ry, time);
      break;
  }
}

function drawBigBangFlash(ctx, cx, cy, rx, ry, time) {
  // intense central flash with expanding particles
  const t = (Math.sin(time * 2) + 1) * 0.5;
  // core glow
  const coreR = Math.max(6, rx * 0.12 + t * 30);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
  g.addColorStop(0, 'rgba(255,255,220,0.95)');
  g.addColorStop(0.3, 'rgba(255,200,120,0.6)');
  g.addColorStop(1, 'rgba(40,20,10,0.03)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, coreR * 3, coreR * 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // many fast radial particles
  const count = 80;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (time * 1.5 % (Math.PI * 2));
    const r = coreR + (Math.random() * rx * 0.9 + (time % 1) * rx * 0.4);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.7;
    const size = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,${80 + Math.floor(Math.random()*160)},${40 + Math.floor(Math.random()*120)},${0.7*Math.random()})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawQGPDetail(ctx, cx, cy, rx, ry, time) {
  // dense colorful points (quarks + gluons), animated jitter
  const num = 220; // many small particles
  for (let i = 0; i < num; i++) {
    const ang = (i / num) * Math.PI * 2 + (i % 7) * 0.13 + time * 2.0 * ((i%3)-1);
    const r = (Math.random() * 0.9 + 0.1) * rx * 0.6;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * (r * 0.6);
    const palette = ['#FF6B6B','#FFD166','#4ECDC4','#FFD6C2','#FF8C69'];
    ctx.beginPath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.globalAlpha = 0.85 * (0.4 + Math.random() * 0.6);
    ctx.arc(x, y, 1.8 + (i % 4) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function drawNucleonClusters(ctx, cx, cy, rx, ry, time) {
  // draw clusters of red/blue spheres with soft shading
  const clusters = 6;
  for (let c = 0; c < clusters; c++) {
    const ang = (c / clusters) * Math.PI * 2 + time * 0.3 * (1 + c*0.1);
    const rDist = rx * 0.45 * (0.4 + (c % 3) * 0.2);
    const cxp = cx + Math.cos(ang) * rDist;
    const cyp = cy + Math.sin(ang) * (rDist * 0.6);
    // draw cluster of 3-7 spheres
    const pcs = 4 + (c % 4);
    for (let i = 0; i < pcs; i++) {
      const a = (i / pcs) * Math.PI * 2 + (c * 0.5);
      const rr = 10 + (i % 3) * 3;
      const px = cxp + Math.cos(a) * (rr * 1.8);
      const py = cyp + Math.sin(a) * (rr * 1.2);
      drawShadedSphere(ctx, px, py, rr, i % 2 === 0 ? '#FF6B6B' : '#4E8CFF');
    }
  }
}

function drawLightElementFormation(ctx, cx, cy, rx, ry, time) {
  // show two protons approaching and fusing with sparks
  const baseR = rx * 0.25;
  const offset = Math.sin(time * 2) * 12;
  drawShadedSphere(ctx, cx - baseR - offset, cy, 18, '#FF6B6B');
  drawShadedSphere(ctx, cx + baseR + offset, cy, 18, '#FF6B6B');

  // fusion spark
  if (Math.floor(time) % 2 === 0) {
    const sparkCount = 18;
    for (let i = 0; i < sparkCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 20;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,${180+Math.floor(Math.random()*75)},0,${0.6*Math.random()})`;
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 1 + Math.random()*2, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

function drawCMBAndProtoStructures(ctx, cx, cy, rx, ry, time) {
  // textured speckle background (CMB-like)
  const density = 600;
  for (let i = 0; i < density; i++) {
    const x = cx - rx + Math.random() * rx * 2;
    const y = cy - ry + Math.random() * ry * 2;
    const v = Math.random();
    ctx.fillStyle = `rgba(${180+Math.floor(v*60)},${180+Math.floor(v*30)},${200+Math.floor(v*20)},${0.06+v*0.06})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // a few proto-galaxies (small spirals)
  const proto = 6;
  for (let i = 0; i < proto; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * rx * 0.7;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.6;
    drawSpiralGalaxy(ctx, x, y, 0.6 + Math.random()*1.6, time * 0.2 + i);
  }
}

function drawTodayScene(ctx, cx, cy, rx, ry, time) {
  // draw several full galaxies and stars
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 0.05 * (i%3);
    const r = 20 + i * (rx / 12);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.6;
    drawSpiralGalaxy(ctx, x, y, 1 + (i%3)*0.6, time * 0.3 + i);
  }
  // small star field
  for (let s = 0; s < 120; s++) {
    const x = cx - rx + Math.random() * rx * 2;
    const y = cy - ry + Math.random() * ry * 2;
    const sz = Math.random() * 1.5;
    ctx.fillStyle = `rgba(255,255,${200+Math.floor(Math.random()*55)},${0.8*Math.random()})`;
    ctx.fillRect(x, y, sz, sz);
  }
  // life icon (simple human silhouettes)
  drawHumanIcon(ctx, cx + rx*0.45, cy - ry*0.2);
}

// helper: shaded sphere (simple light from top-left)
function drawShadedSphere(ctx, x, y, r, color) {
  const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.4, r*0.1, x, y, r);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.12, color);
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fill();
}

function drawSpiralGalaxy(ctx, x, y, scale, phase) {
  // simple multi-armed spiral using strokes
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(phase * 0.4);
  const arms = 3;
  for (let a = 0; a < arms; a++) {
    ctx.beginPath();
    for (let t = 0; t < 1.8; t += 0.02) {
      const ang = t * Math.PI * 2 + (a * (Math.PI*2/arms));
      const rad = t * 20 * scale * (1 + 0.2*Math.sin(t*20+phase));
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad * 0.6;
      if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `rgba(255, ${200 - a*30}, ${180 - a*20}, 0.9)`;
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
  }
  // core
  ctx.beginPath(); ctx.fillStyle = '#FFF2CC'; ctx.arc(0,0,4*scale,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawHumanIcon(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#FFFF99';
  // two simple silhouettes
  ctx.beginPath(); ctx.arc(x-6, y-6, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillRect(x-10, y-0, 8, 14);
  ctx.beginPath(); ctx.arc(x+12, y-6, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillRect(x+8, y-0, 8, 14);
  ctx.restore();
}

function drawPanelTitle(ctx, idx, x, y, progress) {
  const titles = [
    'Quark-gluon plasma',
    'Protons and neutrons emerge',
    'First light elements forged',
    'Atoms form'
  ];
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(titles[idx], x, y);
}

// 2번째 사진: Quark-gluon plasma (빨갛고 흐린 구름)
function drawQGP(ctx, x, y, progress) {
  // 뒷배경 흐림
  const maxR = 90;
  for (let i = 0; i < 6; i++) {
    const r = maxR * (0.2 + (i / 6) * 0.9) * progress;
    ctx.beginPath();
    const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    grad.addColorStop(0, 'rgba(255,200,160,' + (0.12 * (1 - i / 8)) + ')');
    grad.addColorStop(1, 'rgba(120,20,20,' + (0.02 * (1 - i / 8)) + ')');
    ctx.fillStyle = grad;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 작은 쿼크 점들
  ctx.fillStyle = '#FFD6C2';
  const count = Math.floor(25 * progress + 5);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.random() * 70 * progress;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 라벨: Quarks, Gluons
  ctx.fillStyle = '#FFFF99';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Quarks', x - 40, y - 60);
  ctx.fillText('Gluons', x + 40, y + 60);
}

// 3번째 사진: Protons and Neutrons emerge (작은 구들이 결합)
function drawProtonsNeutrons(ctx, x, y, progress) {
  // 핵을 구성하는 구들
  const nucleusR = 40 * progress;
  const particles = [
    { dx: -nucleusR * 0.6, dy: 0, color: '#FF8C69', label: 'Proton' },
    { dx: nucleusR * 0.6, dy: 0, color: '#FFD1DC', label: 'Neutron' },
    { dx: 0, dy: -nucleusR * 0.8, color: '#FFB347', label: 'Quarks' }
  ];

  particles.forEach((p, i) => {
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(x + p.dx, y + p.dy, 18 * progress, 0, Math.PI * 2);
    ctx.fill();
    // 라벨
    ctx.fillStyle = '#FFFF99';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, x + p.dx, y + p.dy + 30);
  });

  // 연결선
  ctx.strokeStyle = '#FFFF99';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - nucleusR * 0.6 + 12 * progress, y);
  ctx.lineTo(x + nucleusR * 0.6 - 12 * progress, y);
  ctx.stroke();
}

// 4번째 사진: First light elements forged (헬륨 원자핵처럼 구들이 합쳐짐)
function drawLightElements(ctx, x, y, progress) {
  // 큰 구 2개와 작은 중성자
  const rMain = 32 * progress;
  // 왼쪽 오른쪽 큰 구
  ctx.beginPath();
  ctx.fillStyle = '#66CCFF';
  ctx.arc(x - rMain * 0.8, y, rMain, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#88DD88';
  ctx.arc(x + rMain * 0.8, y, rMain, 0, Math.PI * 2);
  ctx.fill();

  // 작은 구(중성자)
  ctx.beginPath();
  ctx.fillStyle = '#FFCC99';
  ctx.arc(x, y - rMain * 0.9, rMain * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // 라벨
  ctx.fillStyle = '#FFFF99';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Proton', x - rMain * 0.8, y + rMain + 18);
  ctx.fillText('Neutron', x, y - rMain * 0.9 - 18);
  ctx.fillText('Proton', x + rMain * 0.8, y + rMain + 18);
}

// 추가: 원자(보어 모델) 패널
function drawAtomPanel(ctx, x, y, progress) {
  // 핵
  ctx.save();
  ctx.globalAlpha = 0.9 * (0.5 + progress * 0.5);
  ctx.fillStyle = '#FFD39B';
  ctx.beginPath();
  ctx.arc(x, y, 8 * progress, 0, Math.PI * 2);
  ctx.fill();

  // 전자 껍질 3개 (보어형)
  const shells = [30, 55, 80];
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  shells.forEach((r, idx) => {
    const drawR = r * progress;
    // 떨리는 분필선 느낌
    ctx.globalAlpha = 0.6 * progress;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.arc(x, y, drawR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 전자들 - 회전
    const num = 2 + idx * 2 + 1;
    for (let i = 0; i < num; i++) {
      const angle = (i / num) * Math.PI * 2 + Date.now() * 0.001 * (idx + 1) * 0.6;
      const ex = x + Math.cos(angle) * drawR;
      const ey = y + Math.sin(angle) * drawR;
      ctx.beginPath();
      ctx.fillStyle = '#AEE7FF';
      ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 라벨
  ctx.fillStyle = '#FFFF99';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Hydrogen-like atom', x, y + 110);
  ctx.restore();
}

// 분필로 그린 느낌의 중앙 뭉치
function drawDrawnCore(ctx, x, y, radius, progress) {
  const drawRadius = radius * progress;
  
  // 분필 느낌: 여러 겹으로 그려서 자연스러움
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.3 - i * 0.05;
    ctx.beginPath();
    ctx.arc(x, y, drawRadius + i * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(x, y, drawRadius, 0, Math.PI * 2);
  ctx.fill();
}

// 분필로 그린 느낌의 궤도
function drawDrawnOrbit(ctx, x, y, radius, progress) {
  const drawRadius = radius * progress;
  
  ctx.lineWidth = 2;
  
  // 분필 느낌: 점선으로 궤도 표현
  ctx.setLineDash([8, 4]);
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.5 - i * 0.1;
    ctx.beginPath();
    ctx.arc(x, y, drawRadius + i, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  
  // 궤도상의 입자들
  ctx.globalAlpha = 0.8;
  const numParticles = Math.max(3, Math.floor(drawRadius * 1.5));
  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2;
    const px = x + Math.cos(angle) * drawRadius;
    const py = y + Math.sin(angle) * drawRadius;
    
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 분필로 그린 원자 (보어 모델)
function drawDrawnAtom(ctx, x, y, progress) {
  ctx.lineWidth = 2;
  
  // 작은 핵
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // 3개 전자 껍질
  const shellRadii = [30, 55, 80];
  shellRadii.forEach((shellRadius, idx) => {
    const drawRadius = shellRadius * progress;
    
    if (drawRadius > 0) {
      // 분필 느낌: 떨리는 선으로
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.arc(x, y, drawRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // 전자 입자들
      ctx.globalAlpha = 0.8;
      const numElectrons = 3 + idx * 2;
      for (let i = 0; i < numElectrons; i++) {
        const angle = (i / numElectrons) * Math.PI * 2 + Date.now() * 0.001 * (idx + 1) * 0.5;
        const px = x + Math.cos(angle) * drawRadius;
        const py = y + Math.sin(angle) * drawRadius;
        
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// 단계별 레이블
function drawStageLabel(ctx, stageIdx, x, y, progress) {
  const labels = [
    { title: 'Stage 2: QGP', desc: '쿼크-글루온\n플라즈마' },
    { title: 'Stage 3: Hadrons', desc: '양성자/중성자\n형성' },
    { title: 'Stage 4: Nuclei', desc: '원자핵\n형성' },
    { title: 'Stage 5: Atoms', desc: '원자\n형성' }
  ];
  
  const label = labels[stageIdx];
  
  // 제목
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label.title, x, y + 130);
  
  // 설명 (진행도에 따라 타이핑 효과)
  ctx.fillStyle = '#FFFF99';
  ctx.font = '12px Arial';
  
  const descLines = label.desc.split('\n');
  const typingProgress = Math.floor(progress * 30); // 최대 30글자
  
  let charCount = 0;
  descLines.forEach((line, lineIdx) => {
    let displayText = '';
    for (let i = 0; i < line.length; i++) {
      if (charCount < typingProgress) {
        displayText += line[i];
      }
      charCount++;
    }
    ctx.fillText(displayText, x, y + 150 + lineIdx * 18);
  });
}

// 한 번에 전체 단계 설명을 그리는 함수
// 한 번에 전체 단계 설명을 그리는 함수
function drawCombinedDescription(ctx, canvas) {
  const left = 80;
  const top = 120;
  const width = 420;
  const padding = 12;

  // 배경 박스 (분필 느낌)
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, left, top, width, 260, 10, true, false);
  ctx.restore();

  // 제목
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('우주 진화 요약', left + padding, top + 28);

  // 한 문단으로 합친 한국어 설명 생성
  const parts = educationalBigBangStages.map(s => `${s.name}(${s.timeRange}): ${s.description}`);
  const paragraph = `요약 — ${parts.join(' → ')}.`;

  // 본문 텍스트 그리기 (자동 줄바꿈)
  ctx.fillStyle = '#FFFF99';
  ctx.font = '13px Arial';
  const textX = left + padding;
  const textY = top + 54;
  const maxWidth = width - padding * 2;
  const lineHeight = 18;
  wrapText(ctx, paragraph, textX, textY, maxWidth, lineHeight);
}

// helper: 긴 문장 자동 줄바꿈 및 렌더
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = words[n];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

// helper: rounded rectangle
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// 단계 정보
export const educationalBigBangStages = [
  {
    id: 0,
    name: "쿼크-글루온 플라즈마",
    timeRange: "10⁻¹² 초",
    description: "우주 극초기 - 극도로 뜨거운 상태"
  },
  {
    id: 1,
    name: "양성자/중성자 형성",
    timeRange: "10⁻⁶ 초",
    description: "쿼크들이 결합하기 시작"
  },
  {
    id: 2,
    name: "핵융합 → 원자핵",
    timeRange: "1-3 분",
    description: "헬륨-4, 리튬 등 형성"
  },
  {
    id: 3,
    name: "원자 형성",
    timeRange: "38만 년",
    description: "전자가 원자핵 주변을 돌기 시작"
  }
];

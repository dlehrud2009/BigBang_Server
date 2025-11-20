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
  
  // 각 단계별 애니메이션
  // 이제 3개의 패널을 그립니다: (이미지 2, 3, 4)
  const stages = [
    { x: 300, y: 250, duration: 2.5, delay: 0 },   // 2번째 사진: Quark-gluon plasma
    { x: 700, y: 250, duration: 2.5, delay: 2.5 }, // 3번째 사진: Protons & neutrons emerge
    { x: 1100, y: 250, duration: 3, delay: 5 },    // 4번째 사진: First light elements forged
    { x: 700, y: 550, duration: 3, delay: 8 }      // 추가: 원자 패널 (Atoms)
  ];
  
  stages.forEach((stage, idx) => {
    const elapsed = time - stage.delay;
    
    // 단계별 진행도 (0~1)
    const progress = Math.max(0, Math.min(1, elapsed / stage.duration));
    
    if (progress > 0) {
      // 각 패널은 첨부 이미지(및 원자)를 그립니다.
      drawPanelForAttachment(ctx, idx, stage.x, stage.y, progress);
      
      // 패널 제목 (분필 스타일, Stage라는 단어는 제거)
      drawPanelTitle(ctx, idx, stage.x, stage.y + 150, progress);
    }
  });
  
  // 현재 시간 표시
  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`t = ${time.toFixed(1)}s (simulation)`, canvas.width - 50, 850);
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

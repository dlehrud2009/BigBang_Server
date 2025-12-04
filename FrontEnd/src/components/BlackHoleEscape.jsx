import { useRef, useEffect, useState } from "react";
import axios from "axios";
import "./BlackHoleEscape.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const GAME_DURATION = 60000; // 60초
const BASE_DASH_DISTANCE = 100; // 기본 대시 거리 (속도에 맞춰 증가)
const MAX_DASH_DISTANCE = 250; // 최대 대시 거리 한도
const DASH_DURATION = 250; // 대시 지속 시간 (ms) - 더 빠르게
const DASH_COOLDOWN = 1000; // 대시 쿨다운 (ms)

// 난이도 설정
const DIFFICULTY_SETTINGS = {
  easy: { 
    multiplier: 0.3, 
    name: "Easy",
    spawnRate: 0.005,      // 장애물 생성 빈도 (매우 낮음)
    dashSpawnRate: 0.001,  // 대시 전용 장애물 생성 빈도 (매우 낮음)
    baseSpeed: 1.5,        // 기본 장애물 속도
    speedMultiplier: 1.0,  // 속도 배수
    backgroundSpeed: 1.0,   // 배경 이동 속도
    playerSpeed: 1.0,      // 플레이어 자동 이동 속도
    difficultyIncrease: 0.02, // 시간 경과에 따른 난이도 증가 속도
  },
  normal: { 
    multiplier: 1.0, 
    name: "Normal",
    spawnRate: 0.02,
    dashSpawnRate: 0.01,
    baseSpeed: 3.0,
    speedMultiplier: 2.0,
    backgroundSpeed: 2.0,
    playerSpeed: 1.5,
    difficultyIncrease: 0.1,
  },
  hard: { 
    multiplier: 1.5, 
    name: "Hard",
    spawnRate: 0.03,
    dashSpawnRate: 0.015,
    baseSpeed: 4.0,
    speedMultiplier: 2.5,
    backgroundSpeed: 2.5,
    playerSpeed: 2.0,
    difficultyIncrease: 0.15,
  },
  insane: { 
    multiplier: 2.0, 
    name: "Insane",
    spawnRate: 0.04,
    dashSpawnRate: 0.02,
    baseSpeed: 5.0,
    speedMultiplier: 3.0,
    backgroundSpeed: 3.0,
    playerSpeed: 2.5,
    difficultyIncrease: 0.2,
  },
  nightmare: { 
    multiplier: 2.5, 
    name: "Nightmare",
    spawnRate: 0.05,
    dashSpawnRate: 0.025,
    baseSpeed: 6.0,
    speedMultiplier: 3.5,
    backgroundSpeed: 3.5,
    playerSpeed: 3.0,
    difficultyIncrease: 0.25,
  },
  lunatic: { 
    multiplier: 3.0, 
    name: "Lunatic",
    spawnRate: 0.08,       // 장애물 생성 빈도 (매우 높음)
    dashSpawnRate: 0.035,   // 대시 전용 장애물 생성 빈도 (매우 높음)
    baseSpeed: 7.5,        // 기본 장애물 속도 (매우 빠름)
    speedMultiplier: 4.0,  // 속도 배수
    backgroundSpeed: 4.0,  // 배경 이동 속도 (매우 빠름)
    playerSpeed: 3.0,      // 플레이어 자동 이동 속도
    difficultyIncrease: 0.3, // 시간 경과에 따른 난이도 증가 속도 (매우 빠름)
  },
};

export default function BlackHoleEscape({ userid, username }) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastTimeRef = useRef(0);
  const keysRef = useRef({});
  const lastKeyPressRef = useRef({});
  
  const [gameState, setGameState] = useState("menu"); // menu, difficulty, playing, gameover, ranking
  const [selectedDifficulty, setSelectedDifficulty] = useState("normal");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [gameOverReason, setGameOverReason] = useState("");
  const [rankings, setRankings] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [rankingDifficulty, setRankingDifficulty] = useState("all");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // 게임 상태
  const gameStateRef = useRef({
    player: { x: 100, y: 300, width: 40, height: 40, invincible: false },
    obstacles: [],
    dashObstacles: [], // 대시로만 통과 가능한 장애물
    wallObstacles: [], // 55초에 생성되는 화면을 가로막는 장애물
    particles: [],
    backgroundX: 0,
    difficulty: 1,
    baseDifficulty: 1,
    difficultySettings: DIFFICULTY_SETTINGS.normal, // 현재 난이도 설정
    dashCooldown: 0,
    dashActive: false,
    dashDirection: { x: 0, y: 0 },
    dashStartTime: 0,
    gameStartTime: 0,
    wallSpawned: false, // 55초 장애물 생성 여부
  });

  // 키 입력 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing") return;
      
      const key = e.key;
      const keyLower = key.toLowerCase();
      
      // Z키로 대시 실행
      if (keyLower === "z") {
        e.preventDefault();
        const state = gameStateRef.current;
        if (state.dashCooldown <= 0 && !state.dashActive) {
          // 난이도와 속도에 비례한 대시 거리 계산 (속도가 빠를수록 더 긴 대시)
          const speedFactor = 1 + (state.difficultySettings.baseSpeed + state.difficulty * state.difficultySettings.speedMultiplier) * 0.1;
          let dashDistance = BASE_DASH_DISTANCE * state.difficultySettings.multiplier * speedFactor;
          
          // 최대 대시 거리 한도 적용
          dashDistance = Math.min(dashDistance, MAX_DASH_DISTANCE);
          
          // 현재 이동 방향으로 대시
          let dashX = 0, dashY = 0;
          if (keysRef.current["ArrowRight"] || keysRef.current["d"] || keysRef.current["D"]) dashX = dashDistance;
          else if (keysRef.current["ArrowLeft"] || keysRef.current["a"] || keysRef.current["A"]) dashX = -dashDistance;
          else if (keysRef.current["ArrowUp"] || keysRef.current["w"] || keysRef.current["W"]) dashY = -dashDistance;
          else if (keysRef.current["ArrowDown"] || keysRef.current["s"] || keysRef.current["S"]) dashY = dashDistance;
          else dashX = dashDistance; // 기본적으로 오른쪽으로 대시
          
          state.dashActive = true;
          state.dashDirection = { x: dashX, y: dashY };
          state.dashStartTime = performance.now();
          state.player.invincible = true;
          state.dashCooldown = DASH_COOLDOWN;
          
          // 대시 파티클 효과
          for (let i = 0; i < 20; i++) {
            state.particles.push({
              x: state.player.x + state.player.width / 2,
              y: state.player.y + state.player.height / 2,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 30,
              color: `hsl(${200 + Math.random() * 60}, 100%, 60%)`,
            });
          }
        }
        return;
      }
      
      // 방향키와 WASD 키 저장
      keysRef.current[key] = true;
    };

    const handleKeyUp = (e) => {
      const key = e.key;
      keysRef.current[key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // 캔버스 크기 조정
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 게임 루프
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const gameLoop = (currentTime) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        gameStateRef.current.gameStartTime = performance.now();
      }
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const state = gameStateRef.current;
      const dt = deltaTime / 16.67; // 60fps 기준 정규화

      // 플레이어 이동 (속도 증가)
      const speed = 6; // 3에서 6으로 증가
      if (keysRef.current["ArrowUp"] || keysRef.current["w"] || keysRef.current["W"]) {
        state.player.y = Math.max(0, state.player.y - speed * dt);
      }
      if (keysRef.current["ArrowDown"] || keysRef.current["s"] || keysRef.current["S"]) {
        state.player.y = Math.min(canvas.height - state.player.height, state.player.y + speed * dt);
      }
      if (keysRef.current["ArrowLeft"] || keysRef.current["a"] || keysRef.current["A"]) {
        state.player.x = Math.max(0, state.player.x - speed * dt);
      }
      if (keysRef.current["ArrowRight"] || keysRef.current["d"] || keysRef.current["D"]) {
        state.player.x = Math.min(canvas.width - state.player.width, state.player.x + speed * dt);
      }

      // 난이도 설정 가져오기
      const settings = state.difficultySettings;

      // 자동으로 오른쪽으로 이동 (난이도별 속도)
      state.backgroundX += settings.backgroundSpeed * state.difficulty * dt;
      state.player.x += settings.playerSpeed * state.difficulty * dt;

      // 대시 처리 (난이도에 비례한 속도)
      if (state.dashActive) {
        const dashElapsed = performance.now() - state.dashStartTime;
        if (dashElapsed < DASH_DURATION) {
          // 난이도에 비례한 대시 속도
          const dashSpeed = (state.dashDirection.x !== 0 ? state.dashDirection.x : state.dashDirection.y) / (DASH_DURATION / 16.67);
          state.player.x += dashSpeed * dt;
          state.player.y += (state.dashDirection.y / (DASH_DURATION / 16.67)) * dt;
          state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x));
          state.player.y = Math.max(0, Math.min(canvas.height - state.player.height, state.player.y));
        } else {
          state.dashActive = false;
          state.player.invincible = false;
        }
      }

      // 대시 쿨다운
      if (state.dashCooldown > 0) {
        state.dashCooldown -= deltaTime;
      }

      // 난이도 증가 (기본 난이도에 시간 경과 추가)
      const elapsed = performance.now() - state.gameStartTime;
      state.difficulty = state.baseDifficulty + (elapsed / 10000) * settings.difficultyIncrease;

      // 시간 체크
      const timeRemainingForPhase = GAME_DURATION - elapsed;
      const isFinalPhase = timeRemainingForPhase <= 2000; // 58초 이후 (남은 시간 2초 이하)
      const isWallPhase = timeRemainingForPhase <= 5000 && timeRemainingForPhase > 2000; // 55초~58초 (남은 시간 5초~2초)

      // 55초에 화면을 가로막는 장애물 생성 (한 번만)
      if (isWallPhase && !state.wallSpawned) {
        state.wallSpawned = true;
        // 화면 전체를 가로막는 장애물 생성 (대시로만 통과 가능)
        const wallObstacle = {
          x: canvas.width + 50,
          y: 0,
          width: 150, // 충분히 넓게
          height: canvas.height, // 화면 전체 높이
          speed: settings.baseSpeed + state.difficulty * settings.speedMultiplier,
          type: "wall",
        };
        state.wallObstacles.push(wallObstacle);
      }

      // 장애물 생성 (난이도별 생성 빈도)
      const totalSpawnRate = settings.spawnRate * (1 + state.difficulty * 0.5);
      
      if (Math.random() < totalSpawnRate) {
        // 58초 이후: 모든 장애물을 대시 전용으로 변경
        // 58초 이전: 9.8:0.2 비율 (일반 98%, 대시 전용 2%)
        const shouldBeDashOnly = isFinalPhase || Math.random() < 0.02; // 2% 확률로 대시 전용
        
        if (shouldBeDashOnly) {
          // 대시 전용 장애물 생성
          const dashObstacle = {
            x: canvas.width + 50,
            y: Math.random() * (canvas.height - 200),
            width: 100,
            height: canvas.height * 0.5,
            speed: settings.baseSpeed + state.difficulty * settings.speedMultiplier,
            type: "dashOnly",
          };
          state.dashObstacles.push(dashObstacle);
        } else {
          // 일반 장애물 생성
          const obstacle = {
            x: canvas.width + 50,
            y: Math.random() * (canvas.height - 100),
            width: 30 + Math.random() * 40,
            height: 30 + Math.random() * 40,
            speed: settings.baseSpeed + state.difficulty * settings.speedMultiplier,
            type: "asteroid",
          };
          state.obstacles.push(obstacle);
        }
      }

      // 장애물 업데이트
      state.obstacles = state.obstacles.filter((obs) => {
        obs.x -= obs.speed * dt;
        return obs.x > -100;
      });

      state.dashObstacles = state.dashObstacles.filter((obs) => {
        obs.x -= obs.speed * dt;
        return obs.x > -100;
      });

      state.wallObstacles = state.wallObstacles.filter((obs) => {
        obs.x -= obs.speed * dt;
        return obs.x > -200; // 화면을 완전히 벗어날 때까지 유지
      });

      // 파티클 업데이트
      state.particles = state.particles.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        return p.life > 0;
      });

      // 충돌 감지 (원형 충돌)
      if (!state.player.invincible) {
        const playerCenterX = state.player.x + state.player.width / 2;
        const playerCenterY = state.player.y + state.player.height / 2;
        const playerRadius = Math.min(state.player.width, state.player.height) / 2;

        // 일반 장애물 충돌 (원형)
        for (const obs of state.obstacles) {
          const obsCenterX = obs.x + obs.width / 2;
          const obsCenterY = obs.y + obs.height / 2;
          const obsRadius = Math.min(obs.width, obs.height) / 2;
          const distance = Math.sqrt(
            Math.pow(playerCenterX - obsCenterX, 2) + Math.pow(playerCenterY - obsCenterY, 2)
          );
          
          if (distance < playerRadius + obsRadius) {
            setGameOverReason("운석과 충돌했습니다!");
            const nowScore = Math.floor((performance.now() - state.gameStartTime) / 100);
            setScore(nowScore);
            setGameState("gameover");
            // 점수 제출
            if (userid && !scoreSubmitted) {
              submitScore(nowScore, selectedDifficulty);
            }
            return;
          }
        }

        // 대시 전용 장애물 충돌 (사각형)
        for (const obs of state.dashObstacles) {
          if (
            state.player.x < obs.x + obs.width &&
            state.player.x + state.player.width > obs.x &&
            state.player.y < obs.y + obs.height &&
            state.player.y + state.player.height > obs.y
          ) {
            setGameOverReason("대시로만 통과할 수 있는 장애물과 충돌했습니다!");
            const nowScore = Math.floor((performance.now() - state.gameStartTime) / 100);
            setScore(nowScore);
            setGameState("gameover");
            // 점수 제출
            if (userid && !scoreSubmitted) {
              submitScore(nowScore, selectedDifficulty);
            }
            return;
          }
        }

        // 55초 벽 장애물 충돌 (화면 전체를 가로막는 장애물)
        for (const obs of state.wallObstacles) {
          if (
            state.player.x < obs.x + obs.width &&
            state.player.x + state.player.width > obs.x &&
            state.player.y < obs.y + obs.height &&
            state.player.y + state.player.height > obs.y
          ) {
            setGameOverReason("벽을 통과하려면 대시를 사용해야 합니다!");
            const nowScore = Math.floor((performance.now() - state.gameStartTime) / 100);
            setScore(nowScore);
            setGameState("gameover");
            // 점수 제출
            if (userid && !scoreSubmitted) {
              submitScore(nowScore, selectedDifficulty);
            }
            return;
          }
        }
      }

      // 시간 체크
      const timeRemaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(Math.ceil(timeRemaining / 1000));
      const currentScore = Math.floor(elapsed / 100);
      setScore(currentScore);

      if (timeRemaining <= 0) {
        setGameOverReason("시간이 끝났습니다! TON618에서 탈출 성공!");
        setGameState("gameover");
        // 점수 제출
        if (userid && !scoreSubmitted) {
          submitScore(currentScore, selectedDifficulty);
        }
        return;
      }

      // 렌더링
      ctx.fillStyle = "#000011";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 배경 별들
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 100; i++) {
        const x = (i * 50 + state.backgroundX) % (canvas.width + 50);
        const y = (i * 37) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
      }

      // 블랙홀 TON618 배경 효과
      const blackHoleX = -200 + state.backgroundX * 0.3;
      const blackHoleY = canvas.height / 2;
      const gradient = ctx.createRadialGradient(
        blackHoleX, blackHoleY, 0,
        blackHoleX, blackHoleY, 300
      );
      gradient.addColorStop(0, "rgba(100, 0, 150, 0.3)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 장애물 렌더링 (원형)
      for (const obs of state.obstacles) {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const radius = Math.min(obs.width, obs.height) / 2;
        
        // 운석 그라데이션
        const gradient = ctx.createRadialGradient(
          centerX - radius * 0.3, centerY - radius * 0.3, 0,
          centerX, centerY, radius
        );
        gradient.addColorStop(0, "#aaaaaa");
        gradient.addColorStop(1, "#555555");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 운석 외곽선
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 운석 텍스처 (크레이터 효과)
        ctx.fillStyle = "#333333";
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 대시 전용 장애물 렌더링 (빨간색, 크게)
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      for (const obs of state.dashObstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 4;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        // 경고 표시
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("넘사벽", obs.x + obs.width / 2, obs.y + obs.height / 2);
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      }

      // 55초 벽 장애물 렌더링 (화면 전체를 가로막는 장애물)
      ctx.fillStyle = "rgba(255, 100, 0, 0.8)";
      for (const obs of state.wallObstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = "#ff6600";
        ctx.lineWidth = 5;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        // 경고 표시
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("DASH REQUIRED!", obs.x + obs.width / 2, obs.y + obs.height / 2 - 20);
        ctx.fillText("대시 필수!", obs.x + obs.width / 2, obs.y + obs.height / 2 + 20);
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255, 100, 0, 0.8)";
      }

      // 파티클 렌더링
      for (const p of state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x, p.y, 4, 4);
      }
      ctx.globalAlpha = 1;

      // 플레이어 렌더링
      if (state.player.invincible) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#00ffff";
      } else {
        ctx.fillStyle = "#00aaff";
      }
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
      ctx.globalAlpha = 1;

      // 플레이어 외곽선
      ctx.strokeStyle = state.player.invincible ? "#00ffff" : "#0088ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(state.player.x, state.player.y, state.player.width, state.player.height);

      // 대시 쿨다운 게이지 바 (플레이어 하단)
      const gaugeWidth = state.player.width + 10; // 플레이어보다 약간 넓게
      const gaugeHeight = 5;
      const gaugeX = state.player.x - 5; // 중앙 정렬
      const gaugeY = state.player.y + state.player.height + 4;
      
      // 게이지 배경 (어두운 회색)
      ctx.fillStyle = "rgba(50, 50, 50, 0.7)";
      ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
      
      // 대시 쿨다운 비율 계산 (0 ~ 1)
      const cooldownProgress = Math.min(1, Math.max(0, state.dashCooldown / DASH_COOLDOWN));
      const gaugeFillWidth = gaugeWidth * cooldownProgress;
      
      if (gaugeFillWidth > 0) {
        // 중앙에서 양 옆으로 채워지는 효과
        const centerX = gaugeX + gaugeWidth / 2;
        const halfFillWidth = gaugeFillWidth / 2;
        
        // 파란색 (쿨다운 중) → 초록색 (준비 완료)
        const isReady = cooldownProgress >= 1;
        const gaugeColor = isReady ? "#00ff00" : "#0088ff";
        
        ctx.fillStyle = gaugeColor;
        // 중앙에서 양 옆으로 채우기
        ctx.fillRect(centerX - halfFillWidth, gaugeY, gaugeFillWidth, gaugeHeight);
      }
      
      // 중앙 표시선 (항상 표시)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      const centerX = gaugeX + gaugeWidth / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, gaugeY);
      ctx.lineTo(centerX, gaugeY + gaugeHeight);
      ctx.stroke();
      
      // 게이지 외곽선
      ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const startGame = (difficulty = null) => {
    const canvas = canvasRef.current;
    const state = gameStateRef.current;
    const difficultyToUse = difficulty || selectedDifficulty;
    const settings = DIFFICULTY_SETTINGS[difficultyToUse];
    const initialY = canvas ? canvas.clientHeight / 2 - 20 : 300;
    state.player = { x: 100, y: initialY, width: 40, height: 40, invincible: false };
    state.obstacles = [];
    state.dashObstacles = [];
    state.wallObstacles = [];
    state.particles = [];
    state.backgroundX = 0;
    state.baseDifficulty = settings.multiplier;
    state.difficulty = state.baseDifficulty;
    state.difficultySettings = settings; // 난이도 설정 저장
    state.dashCooldown = 0;
    state.dashActive = false;
    state.wallSpawned = false;
    state.gameStartTime = 0;
    lastTimeRef.current = 0;
    setSelectedDifficulty(difficultyToUse);
    setScore(0);
    setTimeLeft(GAME_DURATION / 1000);
    setScoreSubmitted(false);
    setGameState("playing");
  };

  const goToDifficultySelect = () => {
    setGameState("difficulty");
    setScoreSubmitted(false);
  };

  // 점수 제출
  const submitScore = async (finalScore, difficulty) => {
    if (!userid || scoreSubmitted) return; // 로그인한 사용자만 점수 제출
    
    try {
      const res = await axios.post(`${API_BASE}/api/blackhole/score`, {
        userid,
        username: username || "Guest",
        score: finalScore,
        difficulty,
      });
      setScoreSubmitted(true);
      if (res.data && typeof res.data.bestScore === "number" && res.data.bestScore === finalScore) {
        setScore(res.data.bestScore);
      }
      if (res.data.rank) {
        setUserRank(res.data.rank);
      }
    } catch (err) {
      console.error("점수 제출 실패:", err);
    }
  };

  // 랭킹 조회
  const loadRankings = async (difficulty = "all") => {
    try {
      const res = await axios.get(`${API_BASE}/api/blackhole/ranking`, {
        params: { limit: 10, difficulty },
      });
      if (res.data.success) {
        setRankings(res.data.rankings);
      }
    } catch (err) {
      console.error("랭킹 조회 실패:", err);
    }
  };

  // 랭킹 화면으로 이동
  const goToRanking = () => {
    setGameState("ranking");
    loadRankings(rankingDifficulty);
  };

  return (
    <div className="blackhole-escape-container">
      <canvas ref={canvasRef} className="game-canvas" />
      
      {gameState === "menu" && (
        <div className="game-menu">
          <h1 className="game-title">TON618 탈출</h1>
          <p className="game-subtitle">블랙홀에서 도망치세요!</p>
          <div className="game-instructions">
            <h3>조작 방법</h3>
            <p>방향키: 이동</p>
            <p>Z키: 대시 (무적)</p>
            <p>빨간 장애물은 대시로만 통과 가능!</p>
            <p>60초 동안 생존하세요!</p>
          </div>
          <button className="start-button" onClick={goToDifficultySelect}>
            게임 시작
          </button>
          <button className="ranking-button" onClick={goToRanking}>
            🏆 랭킹 보기
          </button>
        </div>
      )}

      {gameState === "difficulty" && (
        <div className="game-menu">
          <h1 className="game-title">난이도 선택</h1>
          <div className="difficulty-buttons">
            {Object.entries(DIFFICULTY_SETTINGS).map(([key, setting]) => (
              <button
                key={key}
                className={`difficulty-button ${selectedDifficulty === key ? "selected" : ""}`}
                onClick={() => startGame(key)}
              >
                {setting.name}
              </button>
            ))}
          </div>
          <button className="menu-button" onClick={() => setGameState("menu")}>
            뒤로
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="game-ui">
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">시간:</span>
              <span className="stat-value">{timeLeft}초</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">점수:</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">난이도:</span>
              <span className="stat-value">{gameStateRef.current.difficulty.toFixed(1)}x</span>
            </div>
          </div>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="game-over">
          <h2 className="game-over-title">게임 오버</h2>
          <p className="game-over-reason">{gameOverReason}</p>
          <p className="game-over-score">최종 점수: {score}</p>
          {userRank && userid && (
            <p className="user-rank">당신의 순위: {userRank}위</p>
          )}
          {!userid && (
            <p className="login-hint">랭킹에 등록하려면 로그인이 필요합니다</p>
          )}
          <button className="restart-button" onClick={goToDifficultySelect}>
            다시 시작
          </button>
          <button className="ranking-button" onClick={goToRanking}>
            🏆 랭킹 보기
          </button>
          <button className="menu-button" onClick={() => setGameState("menu")}>
            메뉴로
          </button>
        </div>
      )}

      {gameState === "ranking" && (
        <div className="ranking-screen">
          <h2 className="ranking-title">🏆 랭킹</h2>
          <div className="ranking-filters">
            <button
              className={`filter-button ${rankingDifficulty === "all" ? "active" : ""}`}
              onClick={() => {
                setRankingDifficulty("all");
                loadRankings("all");
              }}
            >
              전체
            </button>
            {Object.keys(DIFFICULTY_SETTINGS).map((key) => (
              <button
                key={key}
                className={`filter-button ${rankingDifficulty === key ? "active" : ""}`}
                onClick={() => {
                  setRankingDifficulty(key);
                  loadRankings(key);
                }}
              >
                {DIFFICULTY_SETTINGS[key].name}
              </button>
            ))}
          </div>
          <div className="ranking-list">
            {rankings.length === 0 ? (
              <p className="no-rankings">아직 기록이 없습니다</p>
            ) : (
              rankings.map((entry, index) => (
                <div key={index} className="ranking-item">
                  <span className="ranking-rank">{entry.rank}위</span>
                  <span className="ranking-username">{entry.username}</span>
                  <span className="ranking-score">{entry.score.toLocaleString()}</span>
                  <span className="ranking-difficulty">{DIFFICULTY_SETTINGS[entry.difficulty]?.name || entry.difficulty}</span>
                </div>
              ))
            )}
          </div>
          <button className="menu-button" onClick={() => setGameState("menu")}>
            메뉴로
          </button>
        </div>
      )}
    </div>
  );
}

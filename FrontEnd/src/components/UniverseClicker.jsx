import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./UniverseClicker.css";

// 행성 데이터 - 각 행성마다 고유 효과
const PLANETS = [
  {
    id: "mercury",
    name: "수성",
    description: "클릭당 에너지 20% 증가",
    baseCost: 75,
    effect: "clickSpeed", // 클릭당 에너지 증가
    multiplier: 1.2,
    emoji: "☿️",
    color: "#8C7853",
  },
  {
    id: "venus",
    name: "금성",
    description: "에너지 획득량 배수 20% 증가",
    baseCost: 500,
    effect: "multiplier", // 전체 에너지 획득량 배수
    multiplier: 1.2,
    emoji: "♀️",
    color: "#FFC649",
  },
  {
    id: "earth",
    name: "지구",
    description: "자동 클릭 생성",
    baseCost: 2500,
    effect: "autoClick", // 초당 자동 클릭
    multiplier: 1,
    emoji: "🌍",
    color: "#6B93D6",
  },
  {
    id: "mars",
    name: "화성",
    description: "치명타 확률 3% 증가",
    baseCost: 6000,
    effect: "criticalChance",
    multiplier: 3.0,
    emoji: "♂️",
    color: "#CD5C5C",
  },
  {
    id: "jupiter",
    name: "목성",
    description: "행성 효과 15% 강화",
    baseCost: 25000,
    effect: "planetBoost", // 모든 행성 효과 강화
    multiplier: 1.15,
    emoji: "♃",
    color: "#D8CA9D",
  },
  {
    id: "saturn",
    name: "토성",
    description: "에너지 생성 속도 40% 증가",
    baseCost: 75000,
    effect: "generationSpeed", // 자동 생성 속도 증가
    multiplier: 1.4,
    emoji: "♄",
    color: "#FAD5A5",
  },
  {
    id: "uranus",
    name: "천왕성",
    description: "성운 효과 10% 강화",
    baseCost: 250000,
    effect: "nebulaBoost", // 모든 성운 효과 강화
    multiplier: 1.10,
    emoji: "♅",
    color: "#4FD0E7",
  },
  {
    id: "neptune",
    name: "해왕성",
    description: "전체 생산량 15% 증가",
    baseCost: 1000000,
    effect: "globalProduction", // 전체 생산량 증가
    multiplier: 1.15,
    emoji: "♆",
    color: "#4166F5",
  },
  {
    id: "planetcap",
    name: "행성 한계 증폭기",
    description: "행성 최대 레벨 +3",
    baseCost: 100000000,
    effect: "increasePlanetMax",
    multiplier: 0,
    emoji: "🔭",
    color: "#FFA500",
    maxLevel: 5,
  },
  {
    id: "planetcap2",
    name: "행성 한계 증폭기 II",
    description: "행성 최대 레벨 +3",
    baseCost: 1e30,
    effect: "increasePlanetMax",
    multiplier: 0,
    emoji: "🔭",
    color: "#FFA500",
    maxLevel: 5,
  },
];

// 성운 데이터 - 각 성운마다 고유 효과
const NEBULAE = [
  {
    id: "orion",
    name: "오리온 성운",
    description: "클릭당 에너지 +15%",
    baseCost: 100000000000,
    effect: "clickBonus",
    multiplier: 1.15,
    emoji: "🌌",
    color: "#FF6B9D",
  },
  {
    id: "crab",
    name: "게 성운",
    description: "자동 생성량 +20%",
    baseCost: 50000000000000,
    effect: "autoBonus",
    multiplier: 1.25,
    emoji: "🦀",
    color: "#FFD700",
  },
  {
    id: "eagle",
    name: "독수리 성운",
    description: "크리티컬 피해 +10%",
    baseCost: 2000000000000000,
    effect: "criticalDamage",
    multiplier: 1.1,
    emoji: "🦅",
    color: "#87CEEB",
  },
  {
    id: "horsehead",
    name: "말머리 성운",
    description: "업그레이드 비용 -5%",
    baseCost: 100000000000000,
    effect: "costReduction",
    multiplier: 0.95,
    emoji: "🐴",
    color: "#8B4513",
  },
  {
    id: "helix",
    name: "나선 성운",
    description: "모든 효과 +10%",
    baseCost: 5000000000000000,
    effect: "allBoost",
    multiplier: 1.1,
    emoji: "🌀",
    color: "#9370DB",
  },
  {
    id: "pillars",
    name: "기둥 성운",
    description: "에너지 생성 속도 +20%",
    baseCost: 20000000000000000,
    effect: "generationBoost",
    multiplier: 1.2,
    emoji: "🏛️",
    color: "#FFA500",
  },
  {
    id: "tarantula",
    name: "거미 성운",
    description: "자동 생성량 +35% 증가",
    baseCost: 300000000000000,
    effect: "autoBonus",
    multiplier: 1.35,
    emoji: "🕷️",
    color: "#ff9fb3",
  },
  {
    id: "carina",
    name: "카리나 성운",
    description: "클릭 보너스 5% 증가",
    baseCost: 500000000000000,
    effect: "clickBonus",
    multiplier: 1.05,
    emoji: "🌀",
    color: "#a0c8ff",
  },
  {
    id: "rosette",
    name: "장미 성운",
    description: "모든 효과 5% 증가",
    baseCost: 800000000000000,
    effect: "allBoost",
    multiplier: 1.05,
    emoji: "🌹",
    color: "#ff8fa3",
  },
  {
    id: "trifid",
    name: "삼열 성운",
    description: "생성 속도 15% 증가",
    baseCost: 1200000000000000,
    effect: "generationBoost",
    multiplier: 1.15,
    emoji: "🔺",
    color: "#ffd2a1",
  },
  {
    id: "lagoon",
    name: "라구나 성운",
    description: "클릭 보너스 10% 증가",
    baseCost: 1600000000000000,
    effect: "clickBonus",
    multiplier: 1.1,
    emoji: "💧",
    color: "#a0f0ff",
  },
  {
    id: "omega",
    name: "오메가 성운",
    description: "모든 효과 10% 증가",
    baseCost: 2400000000000000,
    effect: "allBoost",
    multiplier: 1.1,
    emoji: "Ω",
    color: "#c0b7ff",
  },
  {
    id: "catseye",
    name: "캣아이 성운",
    description: "크리티컬 피해 10% 증가",
    baseCost: 4000000000000000,
    effect: "criticalDamage",
    multiplier: 1.1,
    emoji: "🐱",
    color: "#ffd280",
  },
  {
    id: "ringnebula",
    name: "고리 성운",
    description: "업그레이드 비용 5% 감소",
    baseCost: 6000000000000000,
    effect: "costReduction",
    multiplier: 0.95,
    emoji: "⭕",
    color: "#c0c0ff",
  },
  {
    id: "northamerica",
    name: "북아메리카 성운",
    description: "생성 속도 20% 증가",
    baseCost: 8000000000000000,
    effect: "generationBoost",
    multiplier: 1.2,
    emoji: "🗺️",
    color: "#9fd3ff",
  },
  {
    id: "veil",
    name: "베일 성운",
    description: "자동 생성량 40% 증가",
    baseCost: 10000000000000000,
    effect: "autoBonus",
    multiplier: 1.4,
    emoji: "🕸️",
    color: "#a8bfff",
  },
  {
    id: "nebulacap",
    name: "성운 한계 증폭기",
    description: "성운 최대 레벨 +3",
    baseCost: 500000000000000,
    effect: "increaseNebulaMax",
    multiplier: 0,
    emoji: "✨",
    color: "#FF88CC",
    maxLevel: 10,
  },
  {
    id: "nebulacap II",
    name: "성운 한계 증폭기 II",
    description: "성운 최대 레벨 +3",
    baseCost: 1e45,
    effect: "increaseNebulaMax",
    multiplier: 0,
    emoji: "✨",
    color: "#FF88CC",
    maxLevel: 5,
  },
  {
    id: "nebulacap3",
    name: "성운 한계 증폭기 III",
    description: "성운 최대 레벨 +3",
    baseCost: 1e63,
    effect: "increaseNebulaMax",
    multiplier: 0,
    emoji: "✨",
    color: "#FFB3E6",
    maxLevel: 5,
  },
];
const COSMOS = [
  { id: "milkyway", name: "은하수", description: "전체 배수 증가", baseCost: 1e93, effect: "multiplier", multiplier: 1.5, emoji: "🌌", color: "#9ec3ff" },
  { id: "andromeda", name: "안드로메다", description: "클릭 보너스", baseCost: 1.2e93, effect: "clickBonus", multiplier: 1.2, emoji: "🌀", color: "#8fb3ff" },
  { id: "virgo", name: "처녀자리 은하단", description: "자동 생성 보너스", baseCost: 1.5e93, effect: "autoBonus", multiplier: 1.25, emoji: "🌠", color: "#ffd08a" },
  { id: "laniakea", name: "라니아케아 초은하단", description: "전체 생산 증가", baseCost: 2.0e93, effect: "globalProduction", multiplier: 1.5, emoji: "🌌", color: "#c1a6ff" },
  { id: "quasar", name: "퀘이사", description: "크리티컬 피해 증가", baseCost: 1.8e93, effect: "criticalDamage", multiplier: 1.2, emoji: "✨", color: "#ff7fbf" },
  { id: "pulsar", name: "펄사", description: "자동 생성 보너스", baseCost: 1.6e93, effect: "autoBonus", multiplier: 1.35, emoji: "🧭", color: "#a0e7ff" },
  { id: "neutronstar", name: "중성자별", description: "클릭 보너스", baseCost: 1.4e93, effect: "clickBonus", multiplier: 1.2, emoji: "⭐", color: "#ffe58f" },
  { id: "supernova", name: "초신성", description: "전체 배수 증가", baseCost: 2.5e93, effect: "multiplier", multiplier: 1.5, emoji: "💥", color: "#ffaf7f" },
  { id: "cmb", name: "우주배경복사", description: "모든 효과 증가", baseCost: 3.0e93, effect: "allBoost", multiplier: 1.2, emoji: "📡", color: "#a9b7ff" },
  { id: "darkmatter", name: "암흑물질", description: "업그레이드 비용 감소", baseCost: 2.2e93, effect: "costReduction", multiplier: 0.9, emoji: "🌑", color: "#666" },
  { id: "darkenergy", name: "암흑에너지", description: "전체 생산 증가", baseCost: 3.5e93, effect: "globalProduction", multiplier: 1.75, emoji: "⚡", color: "#88f" },
  { id: "cosmicweb", name: "우주 거대구조", description: "전체 배수 증가", baseCost: 2.8e93, effect: "multiplier", multiplier: 1.5, emoji: "🕸️", color: "#d0d0ff" },
  { id: "starcluster", name: "산개성단", description: "자동 생성 보너스", baseCost: 1.3e93, effect: "autoBonus", multiplier: 1.4, emoji: "🌟", color: "#ffd7a0" },
  { id: "globular", name: "구상성단", description: "클릭 보너스", baseCost: 1.7e93, effect: "clickBonus", multiplier: 1.2, emoji: "🔵", color: "#cfe2ff" },
  { id: "gascloud", name: "분자운", description: "모든 효과 증가", baseCost: 1.9e93, effect: "allBoost", multiplier: 1.2, emoji: "☁️", color: "#a0f0ff" },
  { id: "blackhole", name: "블랙홀", description: "크리티컬 피해 증가", baseCost: 2.4e93, effect: "criticalDamage", multiplier: 1.2, emoji: "⚫", color: "#333" },
  { id: "protostar", name: "원시성", description: "클릭 보너스", baseCost: 1.1e93, effect: "clickBonus", multiplier: 1.2, emoji: "🌠", color: "#ffcf8b" },
  { id: "megamaser", name: "메가메이저", description: "자동 생성 보너스", baseCost: 2.1e93, effect: "autoBonus", multiplier: 1.5, emoji: "📡", color: "#b0e0ff" },
  { id: "hypernova", name: "하이퍼노바", description: "전체 배수 증가", baseCost: 4.0e93, effect: "multiplier", multiplier: 1.5, emoji: "🔥", color: "#ff8f8f" },
  { id: "exoplanet", name: "외계행성", description: "클릭 보너스", baseCost: 1.25e93, effect: "clickBonus", multiplier: 1.2, emoji: "🪐", color: "#9fd3ff" },
  { id: "ringgalaxy", name: "고리은하", description: "모든 효과 증가", baseCost: 2.6e93, effect: "allBoost", multiplier: 1.2, emoji: "⭕", color: "#c0c0ff" },
  { id: "supercluster", name: "초은하단", description: "전체 생산 증가", baseCost: 3.2e93, effect: "globalProduction", multiplier: 1.75, emoji: "🌌", color: "#bfa3ff" },
  { id: "cosmicstring", name: "코스믹 스트링", description: "업그레이드 비용 감소", baseCost: 2.3e93, effect: "costReduction", multiplier: 0.92, emoji: "🧵", color: "#999" },
  { id: "sloanwall", name: "슬론 거대 장벽", description: "전체 배수 증가", baseCost: 5.0e93, effect: "multiplier", multiplier: 1.5, emoji: "🧱", color: "#b0b0ff" },
  { id: "greatattractor", name: "그레이트 어트랙터", description: "모든 효과 증가", baseCost: 8.0e93, effect: "allBoost", multiplier: 1.2, emoji: "🧲", color: "#ffd280" },
  { id: "bootesvoid", name: "부티스 공허", description: "전체 생산 증가", baseCost: 1.2e94, effect: "globalProduction", multiplier: 1.5, emoji: "⚪", color: "#e0e0ff" },
  { id: "observable", name: "관측 가능한 우주", description: "모든 효과 대폭 증가", baseCost: 1.0e95, effect: "allBoost", multiplier: 2, emoji: "🌌", color: "#a8bfff", maxLevel: Infinity },
];


const SAVE_KEY = "universe_clicker_save_v1";
const PRESTIGE_BASE = 1e120;
const PRESTIGE_INCREMENT = 1;

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export default function UniverseClicker({ userid }) {
  const [energy, setEnergy] = useState(0);
  const [energyPerClick, setEnergyPerClick] = useState(1);
  const [autoClickRate, setAutoClickRate] = useState(0);
  const [criticalChance, setCriticalChance] = useState(0.05);
  const [criticalDamage, setCriticalDamage] = useState(2.0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalEnergyGenerated, setTotalEnergyGenerated] = useState(0);
  const [planetMaxLevel, setPlanetMaxLevel] = useState(10);
  const [nebulaMaxLevel, setNebulaMaxLevel] = useState(10);
  const [prestigeMultiplier, setPrestigeMultiplier] = useState(1);
  const [parallelUniverses, setParallelUniverses] = useState(0);
  
  // 행성 및 성운 구매 상태
  const [planetLevels, setPlanetLevels] = useState({});
  const [nebulaLevels, setNebulaLevels] = useState({});
  
  // 애니메이션
  const [clickAnimation, setClickAnimation] = useState(null);
  const animationRef = useRef(null);
  const lastAutoClickRef = useRef(Date.now());
  const energyRef = useRef(0);
  useEffect(() => { energyRef.current = energy; }, [energy]);

  useEffect(() => {
    if (!userid) return;
    let mounted = true;
    axios.get(`${API_BASE}/api/clicker/state`, { params: { userid } })
      .then(res => {
        if (!mounted) return;
        const st = res.data && res.data.state;
        if (st) {
          if (typeof st.energy === "number") setEnergy(st.energy);
          if (typeof st.energyPerClick === "number") setEnergyPerClick(st.energyPerClick);
          if (typeof st.autoClickRate === "number") setAutoClickRate(st.autoClickRate);
          if (typeof st.criticalChance === "number") setCriticalChance(st.criticalChance);
          if (typeof st.criticalDamage === "number") setCriticalDamage(st.criticalDamage);
          if (typeof st.totalClicks === "number") setTotalClicks(st.totalClicks);
          if (typeof st.totalEnergyGenerated === "number") setTotalEnergyGenerated(st.totalEnergyGenerated);
          if (typeof st.planetMaxLevel === "number") setPlanetMaxLevel(st.planetMaxLevel);
          if (typeof st.nebulaMaxLevel === "number") setNebulaMaxLevel(st.nebulaMaxLevel);
          if (typeof st.prestigeMultiplier === "number") setPrestigeMultiplier(st.prestigeMultiplier);
          if (typeof st.parallelUniverses === "number") setParallelUniverses(st.parallelUniverses);
          if (st.planetLevels) setPlanetLevels(st.planetLevels);
          if (st.nebulaLevels) setNebulaLevels(st.nebulaLevels);
          
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [userid]);

  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!userid) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const st = {
        energy,
        energyPerClick,
        autoClickRate,
        criticalChance,
        criticalDamage,
        totalClicks,
        totalEnergyGenerated,
        planetMaxLevel,
        nebulaMaxLevel,
        prestigeMultiplier,
        parallelUniverses,
        planetLevels,
        nebulaLevels,
      };
      axios.post(`${API_BASE}/api/clicker/state`, { userid, state: st })
        .catch(() => {});
    }, 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [userid, energy, energyPerClick, autoClickRate, criticalChance, criticalDamage, totalClicks, totalEnergyGenerated, planetMaxLevel, nebulaMaxLevel, prestigeMultiplier, parallelUniverses, planetLevels, nebulaLevels]);

  // 자동 클릭 처리
  useEffect(() => {
    if (autoClickRate <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastAutoClickRef.current) / 1000;
      lastAutoClickRef.current = now;

      let baseEnergy = energyPerClick * autoClickRate * deltaTime;
      
      // 게 성운 효과 적용 (자동 생성량 증가)
      const autoSources = [...NEBULAE, ...COSMOS].filter(n => n.effect === "autoBonus");
      autoSources.forEach(src => {
        const lvl = nebulaLevels[src.id] || 0;
        if (lvl > 0) baseEnergy *= Math.pow(src.multiplier, lvl);
      });
      baseEnergy *= 1.75;
      
      const multiplier = calculateMultiplier();
      const generated = baseEnergy * multiplier;

      setEnergy((prev) => prev + generated);
      setTotalEnergyGenerated((prev) => prev + generated);
    }, 100);

    return () => clearInterval(interval);
  }, [autoClickRate, energyPerClick, nebulaLevels]);

  // 효과 계산 함수
  const calculateMultiplier = () => {
    let multiplier = 1;

    // 행성 효과
    PLANETS.forEach((planet) => {
      const level = planetLevels[planet.id] || 0;
      if (level > 0) {
        switch (planet.effect) {
          case "multiplier":
            multiplier *= Math.pow(planet.multiplier, level);
            break;
          case "planetBoost":
            // 모든 행성 효과 강화
            multiplier *= Math.pow(planet.multiplier, level);
            break;
          case "globalProduction":
            multiplier *= Math.pow(planet.multiplier, level);
            break;
        }
      }
    });

    // 성운 효과
    [...NEBULAE, ...COSMOS].forEach((nebula) => {
      const level = nebulaLevels[nebula.id] || 0;
      if (level > 0) {
        switch (nebula.effect) {
          case "allBoost":
            multiplier *= Math.pow(nebula.multiplier, level);
            break;
          case "generationBoost":
            multiplier *= Math.pow(nebula.multiplier, level);
            break;
          case "multiplier":
            multiplier *= Math.pow(nebula.multiplier, level);
            break;
          case "globalProduction":
            multiplier *= Math.pow(nebula.multiplier, level);
            break;
        }
      }
    });


    // 환생 배율
    multiplier *= prestigeMultiplier;

    return multiplier;
  };

  // 클릭 처리
  const handleUniverseClick = () => {
    setTotalClicks((prev) => prev + 1);

    // 기본 에너지 계산
    let baseEnergy = energyPerClick;

    // 행성 효과 적용
    PLANETS.forEach((planet) => {
      const level = planetLevels[planet.id] || 0;
      if (level > 0) {
        switch (planet.effect) {
          case "clickSpeed":
            baseEnergy *= Math.pow(planet.multiplier, level);
            break;
          case "multiplier":
            baseEnergy *= Math.pow(planet.multiplier, level);
            break;
        }
      }
    });

    // 성운 효과 적용
    [...NEBULAE, ...COSMOS].forEach((nebula) => {
      const level = nebulaLevels[nebula.id] || 0;
      if (level > 0) {
        switch (nebula.effect) {
          case "clickBonus":
            baseEnergy *= Math.pow(nebula.multiplier, level);
            break;
        }
      }
    });

    // 치명타 체크
    let finalEnergy = baseEnergy;
    if (Math.random() < criticalChance) {
      finalEnergy *= criticalDamage;
      setClickAnimation({ type: "critical", x: Math.random() * 100, y: Math.random() * 100 });
    } else {
      setClickAnimation({ type: "normal", x: Math.random() * 100, y: Math.random() * 100 });
    }

    finalEnergy *= calculateMultiplier();

    setEnergy((prev) => prev + finalEnergy);
    setTotalEnergyGenerated((prev) => prev + finalEnergy);

    // 애니메이션 제거
    setTimeout(() => setClickAnimation(null), 500);
  };

  // 행성 구매
  const buyPlanet = (planetId) => {
    const planet = PLANETS.find((p) => p.id === planetId);
    if (!planet) return;

    const level = planetLevelsRef.current[planetId] || 0;
    const allowedMax = planet.effect === "increasePlanetMax" ? (planet.maxLevel ?? Infinity) : calculatePlanetMaxFor(planetId);
    if (level >= allowedMax) return;
    const cost = getPlanetCost(planetId);

    if (energyRef.current >= cost) {
      setEnergy((prev) => prev - cost);
      setPlanetLevels((prev) => ({ ...prev, [planetId]: level + 1 }));

      // 효과 적용
      switch (planet.effect) {
        case "clickSpeed":
          setEnergyPerClick((prev) => prev * planet.multiplier);
          break;
        case "autoClick":
          setAutoClickRate((prev) => prev + 1);
          break;
        case "criticalDamage":
          setCriticalDamage((prev) => Math.min(prev + 0.5, 10));
          break;
        case "criticalChance":
          setCriticalChance((prev) => Math.min(prev + 0.01, 0.5));
          break;
        case "generationSpeed":
          // 자동 생성 속도는 이미 계산됨
          break;
        case "increasePlanetMax":
          setPlanetMaxLevel((prev) => Math.min(prev + 3, calculatePlanetMaxLimit()));
          break;
      }
    }
  };

  // 성운 구매
  const buyNebula = (nebulaId) => {
    const nebula = [...NEBULAE, ...COSMOS].find((n) => n.id === nebulaId);
    if (!nebula) return;

    const level = nebulaLevelsRef.current[nebulaId] || 0;
    const allowedMax = nebula.effect === "increaseNebulaMax" ? (nebula.maxLevel ?? Infinity) : calculateNebulaMax();
    if (level >= allowedMax) return;
    const cost = getNebulaCost(nebulaId);

    if (energyRef.current >= cost) {
      setEnergy((prev) => prev - cost);
      setNebulaLevels((prev) => ({ ...prev, [nebulaId]: level + 1 }));

      // 효과 적용
      switch (nebula.effect) {
        case "criticalDamage":
          setCriticalDamage((prev) => Math.min(prev * nebula.multiplier, 10));
          break;
        case "costReduction":
          // 비용 감소는 구매 시 계산됨
          break;
        case "increaseNebulaMax":
          setNebulaMaxLevel((prev) => Math.min(prev + 3, calculateNebulaMaxLimit()));
          break;
      }
    }
  };

  // 비용 계산 (할인 포함)
  const getPlanetCost = (planetId) => {
    const planet = PLANETS.find((p) => p.id === planetId);
    if (!planet) return 0;
    const level = planetLevels[planetId] || 0;
    let cost = planet.baseCost * Math.pow(1.5, level);
    
    // 말머리 성운 효과 적용
    const reducers = [...NEBULAE, ...COSMOS].filter(n => n.effect === "costReduction");
    reducers.forEach(r => {
      const lvl = nebulaLevels[r.id] || 0;
      if (lvl > 0) cost *= Math.pow(r.multiplier, lvl);
    });
    
    return Math.floor(cost);
  };

  const getNebulaCost = (nebulaId) => {
    const nebula = [...NEBULAE, ...COSMOS].find((n) => n.id === nebulaId);
    if (!nebula) return 0;
    const level = nebulaLevels[nebulaId] || 0;
    let cost = nebula.baseCost * Math.pow(2, level);
    
    // 말머리 성운 효과 적용
    const reducers = [...NEBULAE, ...COSMOS].filter(n => n.effect === "costReduction");
    reducers.forEach(r => {
      const lvl = nebulaLevels[r.id] || 0;
      if (lvl > 0) cost *= Math.pow(r.multiplier, lvl);
    });
    
    return Math.floor(cost * 10);
  };

  // 초당 생성량 계산
  const calculatePerSecond = () => {
    let base = autoClickRate * energyPerClick;
    const autoSources = [...NEBULAE, ...COSMOS].filter(n => n.effect === "autoBonus");
    autoSources.forEach(src => {
      const lvl = nebulaLevels[src.id] || 0;
      if (lvl > 0) base *= Math.pow(src.multiplier, lvl);
    });
    base *= 1.75;
    return base * calculateMultiplier();
  };

  // 숫자 포맷팅
  const formatNumber = (num) => {
    if (!Number.isFinite(num)) return String(num);
    const abs = Math.abs(num);
    if (abs < 1e3) return Math.floor(num).toLocaleString();
    const MAX_SUFFIX_EXP = 123;
    if (abs >= Math.pow(10, MAX_SUFFIX_EXP + 1)) {
      const sign = num < 0 ? "-" : "";
      const exp = Math.floor(Math.log10(abs));
      const mant = abs / Math.pow(10, exp);
      return sign + mant.toFixed(2) + "e" + exp;
    }
    // 접두어 표기 제거: e 표기법 사용
    const exp = Math.floor(Math.log10(abs));
    const mant = abs / Math.pow(10, exp);
    const sign = num < 0 ? "-" : "";
    return sign + mant.toFixed(2) + "e" + exp;
    return Math.floor(num).toLocaleString();
  };

  const formatMoney = (num) => {
    const scale = Math.pow(10, 120) * Math.pow(2, parallelUniverses);
    const v = num / scale;
    if (!Number.isFinite(v)) return String(v) + " Notg";
    if (Math.abs(v) >= 100) return Math.floor(v).toLocaleString() + " Notg";
    return v.toFixed(4) + " Notg";
  };

  // 한계 증폭기 중첩 계산
  const calculatePlanetBaseMaxFor = (id) => (id === "mercury" ? 20 : 10);
  const calculatePlanetMaxFor = (id) => calculatePlanetBaseMaxFor(id) + 3 * ["planetcap", "planetcap2"].reduce((sum, cid) => sum + (planetLevelsRef.current[cid] || 0), 0);
  const calculatePlanetMaxLimit = () => 10 + 3 * ["planetcap", "planetcap2"].reduce((sum, cid) => sum + (PLANETS.find(p=>p.id===cid)?.maxLevel || 0), 0);
  const calculateNebulaMax = () => 10 + 3 * ["nebulacap", "nebulacap II", "nebulacap3"].reduce((sum, id) => sum + (nebulaLevelsRef.current[id] || 0), 0);
  const calculateNebulaMaxLimit = () => 10 + 3 * ["nebulacap", "nebulacap II", "nebulacap3"].reduce((sum, id) => sum + (([...NEBULAE].find(n=>n.id===id)?.maxLevel) || 0), 0);

  const getPrestigeThreshold = () => PRESTIGE_BASE * Math.pow(100, parallelUniverses);

  // 환생(평행우주)
  const canPrestige = energy >= getPrestigeThreshold();
  const doPrestige = () => {
    if (!canPrestige) return;
    setParallelUniverses((prev) => prev + 1);
    setPrestigeMultiplier((prev) => prev + PRESTIGE_INCREMENT);
    setEnergy(0);
    setEnergyPerClick(1);
    setAutoClickRate(0);
    setCriticalDamage(2.0);
    setPlanetLevels({});
    setNebulaLevels({});
    setPlanetMaxLevel(10);
    setNebulaMaxLevel(10);
    setTotalClicks(0);
    setTotalEnergyGenerated(0);
  };

  const planetLevelsRef = useRef({});
  useEffect(() => { planetLevelsRef.current = planetLevels; }, [planetLevels]);
  const nebulaLevelsRef = useRef({});
  useEffect(() => { nebulaLevelsRef.current = nebulaLevels; }, [nebulaLevels]);

  const pressTimerRef = useRef(null);
  const startContinuousBuy = (type, id) => {
    if (pressTimerRef.current) clearInterval(pressTimerRef.current);
    if (type === "planet") buyPlanet(id);
    else if (type === "nebula") buyNebula(id);
    pressTimerRef.current = setInterval(() => {
      if (type === "planet") buyPlanet(id);
      else if (type === "nebula") buyNebula(id);
    }, 30);
  };
  const stopContinuousBuy = () => {
    if (pressTimerRef.current) {
      clearInterval(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };



  return (
    <div className="universe-clicker">
      <div className="floating-money-bar">
        <div className="floating-money">{formatNumber(energy)}</div>
      </div>
      <div className="clicker-header">
        <h1>🌌 우주 팽창 클릭커</h1>
        <div className="energy-display">
          <div className="energy-main">
            <span className="energy-label">에너지:</span>
            <span className="energy-value">{formatNumber(energy)}</span>
          </div>
          <div className="energy-stats">
            <div>클릭당: {formatNumber(energyPerClick * calculateMultiplier())}</div>
            <div>초당: {formatNumber(calculatePerSecond())}</div>
            <div>크리티컬: {(criticalChance * 100).toFixed(0)}% (크리티컬 피해 {(criticalDamage * 100).toFixed(0)}%)</div>
            <div>평행 우주: x{prestigeMultiplier.toFixed(2)} (평행우주 {parallelUniverses}개)</div>
            
          </div>
          
        </div>
      </div>

      <div className="clicker-content">
        <div className="main-click-area">
          <div
            className={`universe-button ${clickAnimation?.type === "critical" ? "critical-hit" : ""}`}
            onClick={handleUniverseClick}
          >
            <div className="universe-core">🌌</div>
            <div className="universe-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
            {clickAnimation && (
              <div
                className={`click-effect ${clickAnimation.type}`}
                style={{
                  left: `${clickAnimation.x}%`,
                  top: `${clickAnimation.y}%`,
                }}
              >
                +{formatNumber(energyPerClick * calculateMultiplier() * (clickAnimation.type === "critical" ? criticalDamage : 1))}
              </div>
            )}
          </div>
          <p className="click-hint">우주를 클릭하여 에너지를 생성하세요!</p>
        </div>

        <div className="upgrades-section">
          <div className="planets-section">
            <h2>🪐 행성 업그레이드</h2>
            <div className="upgrade-grid">
              {PLANETS.map((planet) => {
                const level = planetLevels[planet.id] || 0;
                const cost = getPlanetCost(planet.id);
                const allowedMax = planet.effect === "increasePlanetMax" ? (planet.maxLevel ?? Infinity) : calculatePlanetMaxFor(planet.id);
                const canBuy = energy >= cost && level < allowedMax;

                return (
                  <div
                    key={planet.id}
                    className={`upgrade-card planet-card ${canBuy ? "" : "disabled"}`}
                    onMouseDown={() => canBuy && startContinuousBuy("planet", planet.id)}
                    onMouseUp={stopContinuousBuy}
                    onMouseLeave={stopContinuousBuy}
                    onTouchStart={() => canBuy && startContinuousBuy("planet", planet.id)}
                    onTouchEnd={stopContinuousBuy}
                  >
                    <div className="upgrade-emoji" style={{ color: planet.color }}>
                      {planet.emoji}
                    </div>
                    <div className="upgrade-info">
                      <h3>{planet.name}</h3>
                      <p>{planet.description}</p>
                      <div className="upgrade-level">레벨: {level}</div>
                      <div className="upgrade-cost">비용: {formatNumber(cost)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          

          <div className="nebulae-section">
            <h2>🌌 성운 업그레이드</h2>
            <div className="upgrade-grid">
              {NEBULAE.map((nebula) => {
                const level = nebulaLevels[nebula.id] || 0;
                const cost = getNebulaCost(nebula.id);
                const allowedMax = nebula.effect === "increaseNebulaMax" ? (nebula.maxLevel ?? Infinity) : nebulaMaxLevel;
                const canBuy = energy >= cost && level < allowedMax;

                return (
                  <div
                    key={nebula.id}
                    className={`upgrade-card nebula-card ${canBuy ? "" : "disabled"}`}
                    onMouseDown={() => canBuy && startContinuousBuy("nebula", nebula.id)}
                    onMouseUp={stopContinuousBuy}
                    onMouseLeave={stopContinuousBuy}
                    onTouchStart={() => canBuy && startContinuousBuy("nebula", nebula.id)}
                    onTouchEnd={stopContinuousBuy}
                  >
                    <div className="upgrade-emoji" style={{ color: nebula.color }}>
                      {nebula.emoji}
                    </div>
                    <div className="upgrade-info">
                      <h3>{nebula.name}</h3>
                      <p>{nebula.description}</p>
                      <div className="upgrade-level">레벨: {level}</div>
                      <div className="upgrade-cost">비용: {formatNumber(cost)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="nebulae-section">
          <h2>🧬 우주 구조 업그레이드</h2>
          <div className="upgrade-grid">
            {COSMOS.map((item) => {
              const level = nebulaLevels[item.id] || 0;
              const cost = getNebulaCost(item.id);
              const allowedMax = item.maxLevel ?? nebulaMaxLevel;
              const canBuy = energy >= cost && level < allowedMax;
              return (
                <div
                  key={item.id}
                  className={`upgrade-card nebula-card ${canBuy ? "" : "disabled"}`}
                  onMouseDown={() => canBuy && startContinuousBuy("nebula", item.id)}
                  onMouseUp={stopContinuousBuy}
                  onMouseLeave={stopContinuousBuy}
                  onTouchStart={() => canBuy && startContinuousBuy("nebula", item.id)}
                  onTouchEnd={stopContinuousBuy}
                >
                  <div className="upgrade-emoji" style={{ color: item.color }}>
                    {item.emoji}
                  </div>
                  <div className="upgrade-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="upgrade-level">레벨: {level}</div>
                    <div className="upgrade-cost">비용: {formatNumber(cost)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stats-section">
          <h2>📊 통계</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">총 클릭 수:</span>
              <span className="stat-value">{formatNumber(totalClicks)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">생성된 에너지:</span>
              <span className="stat-value">{formatNumber(totalEnergyGenerated)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">보유 에너지:</span>
              <span className="stat-value">{formatNumber(energy)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">초당 생성량:</span>
              <span className="stat-value">
                {formatNumber(calculatePerSecond())}
              </span>
            </div>
          </div>
          
          <div className="prestige-section">
            <h3>🌀 평행우주</h3>
            <p>현재 에너지로 평행우주를 만들면 획득 배율이 증가합니다. 평행우주 생성 시 모든 업그레이드가 초기화됩니다.</p>
            <button className={`prestige-button ${canPrestige ? "" : "disabled"}`} onClick={doPrestige} disabled={!canPrestige}>
              평행우주 (요구 에너지 {formatNumber(getPrestigeThreshold())})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

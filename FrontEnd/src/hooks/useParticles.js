//FrontEnd/src/hooks/useParticles.js
import { useState, useEffect } from "react";
import { randomSphere, lerp } from "../utils/mathUtils";
import { PARTICLE_COUNT } from "../utils/constants";

export function useParticles(stage) {
  const [particles, setParticles] = useState([]);

  // 초기 입자 생성
  useEffect(() => {
    setParticles(Array.from({ length: PARTICLE_COUNT }, () => randomSphere(3)));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p, i) => {
          if (stage === 0) {
            // 빅뱅: 폭발
            return {
              x: lerp(p.x, p.x * 2, 0.05),
              y: lerp(p.y, p.y * 2, 0.05),
              z: lerp(p.z, p.z * 2, 0.05),
            };
          }

          if (stage === 1) {
            // 원시핵합성: 균일 분포
            const target = randomSphere(4);
            return {
              x: lerp(p.x, target.x, 0.05),
              y: lerp(p.y, target.y, 0.05),
              z: lerp(p.z, target.z, 0.05),
            };
          }

          if (stage === 2) {
            // 은하 형성: 회전 원반 + 핵
            const r = Math.sqrt(p.x ** 2 + p.y ** 2);
            const angle = Math.atan2(p.y, p.x) + 0.03;
            const newR = r * 0.98;
            const z = lerp(p.z, p.z * 0.5 + (Math.random() - 0.5) * 0.05, 0.05);
            return {
              x: lerp(p.x, newR * Math.cos(angle), 0.05),
              y: lerp(p.y, newR * Math.sin(angle), 0.05),
              z,
            };
          }

          if (stage === 3) {
            // 태양계 형성: 중심 태양 + 행성 궤도
            const r = Math.sqrt(p.x ** 2 + p.y ** 2);
            const angle = Math.atan2(p.y, p.x) + 0.05;
            const z = lerp(p.z, 0, 0.05);
            return {
              x: lerp(p.x, r * Math.cos(angle), 0.05),
              y: lerp(p.y, r * Math.sin(angle), 0.05),
              z,
            };
          }

          return p;
        })
      );
    }, 16);
    return () => clearInterval(interval);
  }, [stage]);

  return particles;
}
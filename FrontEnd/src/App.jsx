import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import ParticleCanvas from "./components/ParticleCanvas";
import UniverseSimulation from "./components/UniverseSimulation";

export default function App() {
  const [userid, setUserId] = useState(null);
  const [stage, setStage] = useState("bigbang");
  const [status, setStatus] = useState("paused");
  const socketRef = useRef();

  // ------------------------
  // 접속 시 사용자 생성
  // ------------------------
  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await axios.post("http://localhost:4000/api/user", {
          username: "Guest",
        });
        setUserId(res.data.userid);

        // WebSocket 연결
        socketRef.current = io("http://localhost:4000");
        socketRef.current.emit("join", res.data.userid);

        // 서버 상태 수신 (서버는 'stageUpdated'를 emit)
        socketRef.current.on("stageUpdated", (data) => {
          setStage(data.stage);
          setStatus(data.status);
        });
      } catch (err) {
        console.error("사용자 생성 실패:", err);
      }
    };
    initUser();
  }, []);

  // ------------------------
  // 시뮬레이션 제어
  // ------------------------
  const startSimulation = async () => {
    if (!userid) return;

    await axios.post("http://localhost:4000/api/simulation/start", { userid });
    setStatus("started");
    setStage("bigbang");
    socketRef.current.emit("start", { userid });
  };

  const pauseSimulation = async () => {
    if (!userid) return;

    const res = await axios.post("http://localhost:4000/api/simulation/pause", {
      userid,
    });
    setStatus(res.data.status);
    setStage(res.data.stage);
    socketRef.current.emit("pause", { userid });
  };

  const changeStage = async (newStage) => {
    if (!userid) return;

    await axios.post("http://localhost:4000/api/simulation/stage", { userid, stage: newStage });
    setStage(newStage);
    // 서버 브로드캐스트는 REST로 처리되므로 별도 소켓 emit 불필요
  };

  return (
    <div>
      <h1>BigBang Simulator</h1>
      <ParticleCanvas
        userid={userid}
        stage={stage}
        status={status}
        startSimulation={startSimulation}
        pauseSimulation={pauseSimulation}
        changeStage={changeStage}
      />
      {process.env.NODE_ENV !== "production" && <UniverseSimulation />}
    </div>
  );
}
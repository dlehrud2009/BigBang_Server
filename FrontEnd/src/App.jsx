import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import ParticleCanvas from "./components/ParticleCanvas";
import UniverseClicker from "./components/UniverseClicker";
import BlackHoleEscape from "./components/BlackHoleEscape";
import Login from "./components/Login";
import AuthConfirmation from "./components/AuthConfirmation";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export default function App() {
  const [userid, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [stage, setStage] = useState("bigbang");
  const [status, setStatus] = useState("paused");
  const [currentView, setCurrentView] = useState("menu"); // login, menu, simulation, clicker, blackhole
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const socketRef = useRef();

  // 로그인 처리
  const handleLogin = (loggedInUserId, loggedInUsername) => {
    setUserId(loggedInUserId);
    setUsername(loggedInUsername);
    setIsLoggedIn(true);
    setCurrentView("menu");

    // WebSocket 연결
    socketRef.current = io(API_BASE);
    socketRef.current.emit("join", loggedInUserId);

    // 서버 상태 수신 (서버는 'stageUpdated'를 emit)
    socketRef.current.on("stageUpdated", (data) => {
      setStage(data.stage);
      setStatus(data.status);
    });
  };

  // 게스트로 계속하기
  const handleGuestContinue = () => {
    setCurrentView("menu");
  };

  // 로그아웃
  const handleLogout = () => {
    setUserId(null);
    setUsername(null);
    setIsLoggedIn(false);
    setCurrentView("login");
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  // ------------------------
  // 시뮬레이션 제어
  // ------------------------
  const startSimulation = async () => {
    if (!userid) {
      setStatus("started");
      setStage("bigbang");
      return;
    }

    await axios.post(`${API_BASE}/api/simulation/start`, { userid });
    setStatus("started");
    setStage("bigbang");
    socketRef.current.emit("start", { userid });
  };

  const pauseSimulation = async () => {
    if (!userid) {
      setStatus((prev) => (prev === "paused" ? "started" : "paused"));
      return;
    }

    const res = await axios.post(`${API_BASE}/api/simulation/pause`, {
      userid,
    });
    setStatus(res.data.status);
    setStage(res.data.stage);
    socketRef.current.emit("pause", { userid });
  };

  const changeStage = async (newStage) => {
    if (!userid) {
      setStage(newStage);
      return;
    }

    await axios.post(`${API_BASE}/api/simulation/stage`, { userid, stage: newStage });
    setStage(newStage);
  };

  if (currentView === "login") {
    return <Login onLogin={handleLogin} onGuestContinue={handleGuestContinue} />;
  }

  // Supabase 이메일 인증 후 리다이렉션 경로 처리
  if (window && window.location && window.location.pathname === '/auth-confirmation') {
    return <AuthConfirmation />;
  }

  if (currentView === "menu") {
    return (
      <div className="app-menu">
        <div className="menu-container">
          <div className="menu-header">
            <h1 className="menu-title">🌌 우주 시뮬레이션</h1>
            {isLoggedIn ? (
              <div className="user-info">
                <span className="username">👤 {username}</span>
                <button className="logout-button" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            ) : (
              <button className="login-button-header" onClick={() => setCurrentView("login")}>
                로그인
              </button>
            )}
          </div>
          <div className="menu-buttons">
            <button className="menu-button" onClick={() => setCurrentView("simulation")}>
              🪐 우주 시뮬레이션
            </button>
            <button className="menu-button" onClick={() => setCurrentView("clicker")}>
              🌌 우주 팽창 클릭커
            </button>
            <button className="menu-button" onClick={() => setCurrentView("blackhole")}>
              ⚫ TON618 탈출
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "clicker") {
    return (
      <div>
        <button className="back-button" onClick={() => setCurrentView("menu")}>
          ← 메뉴로
        </button>
        <UniverseClicker userid={userid} />
      </div>
    );
  }

  if (currentView === "blackhole") {
    return (
      <div>
        <button className="back-button" onClick={() => setCurrentView("menu")}>
          ← 메뉴로
        </button>
        <BlackHoleEscape userid={userid} username={username} />
      </div>
    );
  }

  return (
    <div>
      <button className="back-button" onClick={() => setCurrentView("menu")}>
        ← 메뉴로
      </button>
      <ParticleCanvas
        userid={userid}
        stage={stage}
        status={status}
        startSimulation={startSimulation}
        pauseSimulation={pauseSimulation}
        changeStage={changeStage}
      />
    </div>
  );
}

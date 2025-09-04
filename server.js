// server.js (CommonJS)
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const PORT = 4000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 서버 메모리 상태
let users = {};
let simulationStates = {};
let userIdCounter = 1;

// API: 사용자 생성
app.post("/api/user", (req, res) => {
  const userid = userIdCounter++;
  users[userid] = { username: req.body.username || "Guest" };
  simulationStates[userid] = { stage: "bigbang", status: "paused" };
  res.json({ userid, username: users[userid].username });
});

// API: 시뮬레이션 시작
app.post("/api/simulation/start", (req, res) => {
  const { userid } = req.body;
  if (!simulationStates[userid]) return res.status(404).send("User not found");
  simulationStates[userid].status = "started";
  simulationStates[userid].stage = "bigbang";
  io.emit("stageUpdated", { userid, stage: "bigbang", status: "started" });
  res.json({ userid, ...simulationStates[userid] });
});

// API: 일시정지
app.post("/api/simulation/pause", (req, res) => {
  const { userid } = req.body;
  if (!simulationStates[userid]) return res.status(404).send("User not found");
  simulationStates[userid].status = "paused";
  io.emit("stageUpdated", { userid, ...simulationStates[userid] });
  res.json({ userid, ...simulationStates[userid] });
});

// API: stage 변경
app.post("/api/simulation/stage", (req, res) => {
  const { userid, stage } = req.body;
  if (!simulationStates[userid]) return res.status(404).send("User not found");
  simulationStates[userid].stage = stage;
  io.emit("stageUpdated", { userid, stage, status: simulationStates[userid].status });
  res.json({ userid, stage, status: simulationStates[userid].status });
});

// React 빌드 서빙
app.use(express.static(path.join(__dirname, "../FrontEnd/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/build", "index.html"));
});

// Socket.io 연결
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
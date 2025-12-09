// server.js (CommonJS)
const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");
const path = require("path");
const {
  createUser,
  getUserByUsername,
  getUserById,
  saveBlackHoleScore,
  getBlackHoleRankings,
  getUserRank,
  resetDatabase,
  saveClickerEnergy,
  getClickerEnergy,
  saveClickerState,
  getClickerState,
  saveClickerRanking,
  getClickerRankings,
  getClickerUserRank,
} = require("./database");

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [
  "http://localhost:3000",
]);

// 미들웨어
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 서버 메모리 상태 (세션용)
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

// 비밀번호 검증 함수
function validatePassword(password) {
  const errors = [];
  
  // 8자 이상
  if (password.length < 8) {
    errors.push("비밀번호는 8자 이상이어야 합니다");
  }
  
  // 대문자 포함
  if (!/[A-Z]/.test(password)) {
    errors.push("비밀번호에 대문자가 포함되어야 합니다");
  }
  
  // 특수문자 포함
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("비밀번호에 특수문자가 포함되어야 합니다");
  }
  
  return errors;
}

// API: 회원가입
app.post("/api/auth/signup", (req, res) => {
  try {
    console.log("회원가입 요청 받음:", req.body);
    
    const { username, password } = req.body;
    
    // 입력값 검증
    if (!username || typeof username !== "string") {
      return res.status(400).json({ success: false, message: "ID를 입력하세요" });
    }
    
    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "비밀번호를 입력하세요" });
    }
    
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedUsername) {
      return res.status(400).json({ success: false, message: "ID를 입력하세요" });
    }
    
    if (!trimmedPassword) {
      return res.status(400).json({ success: false, message: "비밀번호를 입력하세요" });
    }
    
    // 비밀번호 강도 검증
    const passwordErrors = validatePassword(trimmedPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: passwordErrors.join(", ") 
      });
    }
    
    // DB에 사용자 생성
    createUser(trimmedUsername, trimmedPassword, (err, user) => {
      if (err) {
        console.error("회원가입 DB 오류:", err);
        if (err.message.includes("이미 존재하는")) {
          return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ 
          success: false, 
          message: "회원가입 처리 중 오류가 발생했습니다: " + err.message 
        });
      }
      
      // 세션 상태 초기화
      users[user.userid] = { username: user.username };
      simulationStates[user.userid] = { stage: "bigbang", status: "paused" };
      
      console.log(`회원가입 성공: ${user.username} (ID: ${user.userid})`);
      
      res.json({ success: true, userid: user.userid, username: user.username });
    });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({ success: false, message: "회원가입 처리 중 오류가 발생했습니다: " + error.message });
  }
});

// API: 로그인
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "사용자 이름과 비밀번호를 입력하세요" });
  }
  
  // DB에서 사용자 조회
  getUserByUsername(username.trim(), (err, user) => {
    if (err) {
      console.error("로그인 DB 오류:", err);
      return res.status(500).json({ success: false, message: "로그인 처리 중 오류가 발생했습니다" });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: "사용자 이름 또는 비밀번호가 잘못되었습니다" });
    }
    
    // 비밀번호 확인
    if (user.password !== password.trim()) {
      return res.status(401).json({ success: false, message: "사용자 이름 또는 비밀번호가 잘못되었습니다" });
    }
    
    // 세션 상태 초기화
    const userid = user.id;
    if (!users[userid]) {
      users[userid] = { username: user.username };
      simulationStates[userid] = { stage: "bigbang", status: "paused" };
    }
    
    res.json({ success: true, userid, username: user.username });
  });
});

// API: Supabase 사용자 동기화 (이메일 로그인용)
app.post('/api/auth/supabase-sync', (req, res) => {
  const { supabase_id, email, username } = req.body;

  if (!supabase_id || !email || !username) {
    return res.status(400).json({ 
      success: false, 
      message: '필수 정보가 누락되었습니다' 
    });
  }

  console.log('Supabase 동기화 요청:', { email, username });

  // 먼저 기존 사용자 확인
  getUserByUsername(username, (err, user) => {
    if (err) {
      console.error('사용자 조회 오류:', err);
      return res.status(500).json({ 
        success: false, 
        message: '서버 오류가 발생했습니다' 
      });
    }

    if (user) {
      // 이미 존재하는 사용자 - 로그인 처리
      const userid = user.id;
      if (!users[userid]) {
        users[userid] = { username: user.username };
        simulationStates[userid] = { stage: "bigbang", status: "paused" };
      }
      
      console.log(`이메일 로그인: ${user.username} (ID: ${userid})`);
      return res.json({
        success: true,
        userid: userid,
        username: user.username,
        message: '이메일 로그인 성공'
      });
    } else {
      // 새 사용자 - 회원가입 처리 (supabase_id를 비밀번호로 사용)
      createUser(username, supabase_id, (createErr, result) => {
        if (createErr) {
          console.error('이메일 사용자 생성 오류:', createErr);
          
          // 중복 사용자명 처리
          if (createErr.message.includes('이미 존재')) {
            const randomUsername = `${username}_${Math.floor(Math.random() * 10000)}`;
            createUser(randomUsername, supabase_id, (retryErr, retryResult) => {
              if (retryErr) {
                return res.status(500).json({ 
                  success: false, 
                  message: '회원가입 실패' 
                });
              }
              
              users[retryResult.userid] = { username: randomUsername };
              simulationStates[retryResult.userid] = { stage: "bigbang", status: "paused" };
              
              console.log(`이메일 회원가입 성공: ${randomUsername} (ID: ${retryResult.userid})`);
              return res.json({
                success: true,
                userid: retryResult.userid,
                username: randomUsername,
                message: '회원가입 성공'
              });
            });
          } else {
            return res.status(500).json({ 
              success: false, 
              message: '회원가입 실패' 
            });
          }
        } else {
          users[result.userid] = { username: result.username };
          simulationStates[result.userid] = { stage: "bigbang", status: "paused" };
          
          console.log(`이메일 회원가입 성공: ${result.username} (ID: ${result.userid})`);
          return res.json({
            success: true,
            userid: result.userid,
            username: result.username,
            message: '회원가입 성공'
          });
        }
      });
    }
  });
});

// API: 블랙홀 점수 제출
app.post("/api/blackhole/score", (req, res) => {
  const { userid, username, score, difficulty } = req.body;
  
  if (!userid || score === undefined) {
    return res.status(400).json({ success: false, message: "필수 정보가 누락되었습니다" });
  }
  
  const finalUsername = username || users[userid]?.username || "Unknown";
  const finalScore = parseInt(score);
  const finalDifficulty = difficulty || "normal";
  const timestamp = Date.now();
  
  // DB에 점수 저장
  saveBlackHoleScore(userid, finalUsername, finalScore, finalDifficulty, (err, result) => {
    if (err) {
      console.error("점수 저장 DB 오류:", err);
      return res.status(500).json({ success: false, message: "점수 저장 중 오류가 발생했습니다" });
    }
    
    // 사용자 순위 조회
    const effectiveScore = (result && result.bestScore) ? result.bestScore : finalScore;
    const effectiveTimestamp = (result && result.timestamp) ? result.timestamp : timestamp;
    getUserRank(userid, effectiveScore, effectiveTimestamp, (rankErr, rank) => {
      if (rankErr) {
        console.error("순위 조회 오류:", rankErr);
      }
      
      res.json({ success: true, rank: rank || null, bestScore: effectiveScore });
    });
  });
});

// API: 블랙홀 랭킹 조회
app.get("/api/blackhole/ranking", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const difficulty = req.query.difficulty || "all";
  
  // DB에서 랭킹 조회
  getBlackHoleRankings(limit, difficulty, (err, rankings) => {
    if (err) {
      console.error("랭킹 조회 DB 오류:", err);
      return res.status(500).json({ success: false, message: "랭킹 조회 중 오류가 발생했습니다" });
    }
    
    res.json({ success: true, rankings: rankings || [] });
  });
});

// 헬스 체크 엔드포인트
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/api/clicker/energy", (req, res) => {
  const userid = parseInt(req.query.userid);
  if (!userid) return res.status(400).json({ success: false, message: "userid 필요" });
  getClickerEnergy(userid, (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "조회 오류" });
    res.json({ success: true, userid: row.userid, energy: row.energy, updated_at: row.updated_at });
  });
});

app.post("/api/clicker/energy", (req, res) => {
  const { userid, energy } = req.body;
  if (!userid || energy === undefined) return res.status(400).json({ success: false, message: "필수 정보 누락" });
  const parsedUserId = parseInt(userid);
  const parsedEnergy = Number(energy);
  if (!Number.isFinite(parsedUserId) || !Number.isFinite(parsedEnergy)) return res.status(400).json({ success: false, message: "형식 오류" });
  saveClickerEnergy(parsedUserId, parsedEnergy, (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "저장 오류" });
    res.json({ success: true, userid: row.userid, energy: row.energy, updated_at: row.updated_at });
  });
});

app.get("/api/clicker/state", (req, res) => {
  const userid = parseInt(req.query.userid);
  if (!userid) return res.status(400).json({ success: false, message: "userid 필요" });
  getClickerState(userid, (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "조회 오류" });
    res.json({ success: true, userid: row.userid, state: row.state, updated_at: row.updated_at });
  });
});

app.post("/api/clicker/state", (req, res) => {
  const { userid, state } = req.body;
  if (!userid || !state) return res.status(400).json({ success: false, message: "필수 정보 누락" });
  const parsedUserId = parseInt(userid);
  if (!Number.isFinite(parsedUserId)) return res.status(400).json({ success: false, message: "형식 오류" });
  saveClickerState(parsedUserId, state, (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "저장 오류" });
    res.json({ success: true, userid: row.userid, state: row.state, updated_at: row.updated_at });
  });
});

app.post("/api/clicker/ranking", (req, res) => {
  const { userid, username, parallelUniverses, energy } = req.body;
  if (!userid) return res.status(400).json({ success: false, message: "userid 필요" });
  const parsedUserId = parseInt(userid);
  const parsedParallel = parseInt(parallelUniverses || 0);
  const parsedEnergy = Number(energy || 0);
  if (!Number.isFinite(parsedUserId) || !Number.isFinite(parsedParallel) || !Number.isFinite(parsedEnergy)) {
    return res.status(400).json({ success: false, message: "형식 오류" });
  }
  const finalUsername = username || users[parsedUserId]?.username || "Unknown";
  saveClickerRanking(parsedUserId, finalUsername, parsedParallel, parsedEnergy, (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "저장 오류" });
    res.json({ success: true, ranking: row });
  });
});

app.get("/api/clicker/ranking", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  getClickerRankings(limit, (err, rankings) => {
    if (err) return res.status(500).json({ success: false, message: "조회 오류" });
    res.json({ success: true, rankings: rankings || [] });
  });
});

app.get("/api/clicker/rank", (req, res) => {
  const userid = parseInt(req.query.userid);
  if (!userid) return res.status(400).json({ success: false, message: "userid 필요" });
  getClickerUserRank(userid, (err, userRank) => {
    if (err) return res.status(500).json({ success: false, message: "조회 오류" });
    res.json({ success: true, user: userRank || null });
  });
});

// 관리자: 데이터베이스 초기화
app.post("/api/admin/reset", (req, res) => {
  try {
    resetDatabase((err) => {
      if (err) {
        console.error("데이터베이스 초기화 오류:", err);
        return res.status(500).json({ success: false, message: "DB 초기화 실패" });
      }
      users = {};
      simulationStates = {};
      userIdCounter = 1;
      res.json({ success: true });
    });
  } catch (e) {
    console.error("DB 초기화 예외:", e);
    res.status(500).json({ success: false });
  }
});

// 루트 라우트
app.get("/", (req, res) => {
  res.json({ service: "BigBang Backend", health: "/api/health" });
});

// API 라우트가 먼저 처리되도록 확인
// React 빌드 서빙은 마지막에
const buildPath = path.join(__dirname, "../FrontEnd/build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(buildPath, "index.html"));
    } else {
      res.status(404).json({ success: false, message: "API endpoint not found" });
    }
  });
}

// Socket.io 연결
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins } });

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

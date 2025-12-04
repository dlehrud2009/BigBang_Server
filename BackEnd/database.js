const path = require("path");
let sqlite3;
try {
  sqlite3 = require("sqlite3").verbose();
} catch (e) {
  sqlite3 = null;
}

const DB_PATH = path.join(__dirname, "database.db");

let db;
let isInitialized = false;
let initPromise;
if (sqlite3) {
  initPromise = new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        db.run("PRAGMA foreign_keys = ON", () => {});
        initializeDatabase()
          .then(() => {
            isInitialized = true;
            resolve();
          })
          .catch(reject);
      }
    });
  });
} else {
  initPromise = Promise.resolve();
  isInitialized = true;
}

// 데이터베이스 초기화 (Promise 기반)
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // 사용자 테이블 생성
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error("users 테이블 생성 오류:", err.message);
        reject(err);
        return;
      }
      console.log("users 테이블 준비 완료");

      // 블랙홀 점수 테이블 생성
      db.run(`
        CREATE TABLE IF NOT EXISTS blackhole_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userid INTEGER NOT NULL,
          username TEXT NOT NULL,
          score INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error("blackhole_scores 테이블 생성 오류:", err.message);
          reject(err);
          return;
        }
        console.log("blackhole_scores 테이블 준비 완료");

        db.run(
          `CREATE TABLE IF NOT EXISTS clicker_state (
            userid INTEGER PRIMARY KEY,
            energy REAL NOT NULL,
            updated_at INTEGER NOT NULL
          )`
        , (tblErr) => {
          if (tblErr) {
            console.error("clicker_state 테이블 생성 오류:", tblErr.message);
            reject(tblErr);
            return;
          }

          db.run(`
            CREATE TABLE IF NOT EXISTS clicker_state_full (
              userid INTEGER PRIMARY KEY,
              state TEXT NOT NULL,
              updated_at INTEGER NOT NULL
            )
          `, (tblErr2) => {
            if (tblErr2) {
              console.error("clicker_state_full 테이블 생성 오류:", tblErr2.message);
              reject(tblErr2);
              return;
            }

            db.run(`
              CREATE TABLE IF NOT EXISTS clicker_rankings (
                userid INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                parallel_universes INTEGER NOT NULL,
                energy REAL NOT NULL,
                updated_at INTEGER NOT NULL
              )
            `, (tblErr3) => {
              if (tblErr3) {
                console.error("clicker_rankings 테이블 생성 오류:", tblErr3.message);
                reject(tblErr3);
                return;
              }

        
        // 인덱스 생성 (성능 향상)
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_username ON users(username)
        `, (err) => {
          if (err) console.warn("idx_username 인덱스 생성 경고:", err.message);
        });

        db.run(`
          CREATE INDEX IF NOT EXISTS idx_score ON blackhole_scores(score DESC)
        `, (err) => {
          if (err) console.warn("idx_score 인덱스 생성 경고:", err.message);
        });

        db.run(`
          CREATE INDEX IF NOT EXISTS idx_difficulty ON blackhole_scores(difficulty)
        `, (err) => {
          if (err) {
            console.warn("idx_difficulty 인덱스 생성 경고:", err.message);
          }
          db.run(`
            CREATE INDEX IF NOT EXISTS idx_clicker_rank ON clicker_rankings(parallel_universes DESC, energy DESC)
          `, (idxErr) => {
            if (idxErr) console.warn("idx_clicker_rank 인덱스 생성 경고:", idxErr.message);
          });
          const cleanupSql = `
            DELETE FROM blackhole_scores AS b
            WHERE EXISTS (
              SELECT 1 FROM blackhole_scores AS b2
              WHERE b2.userid = b.userid AND b2.difficulty = b.difficulty
                AND (b2.score > b.score OR (b2.score = b.score AND b2.timestamp < b.timestamp))
            )
          `;
          db.run(cleanupSql, (cleanupErr) => {
            if (cleanupErr) {
              console.warn("중복 점수 정리 경고:", cleanupErr.message);
            }
            db.run(
              `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_difficulty ON blackhole_scores(userid, difficulty)`,
              (uniqErr) => {
                if (uniqErr) {
                  console.warn("고유 인덱스 생성 경고:", uniqErr.message);
                }
                console.log("데이터베이스 초기화 완료");
                resolve();
              }
            );
          });
        });
            });
          });
        });
        });
      });
  });
}

// 초기화 완료 대기 함수
function ensureInitialized(callback) {
  if (isInitialized) {
    callback();
  } else {
    initPromise.then(callback).catch(() => {
      callback();
    });
  }
}

// 사용자 생성 (회원가입)
function createUser(username, password, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [] };
    const exists = global.__MEM_DB__.users.find(u => u.username === username);
    if (exists) return callback(new Error("이미 존재하는 ID입니다"), null);
    const userid = global.__MEM_DB__.users.length + 1;
    global.__MEM_DB__.users.push({ id: userid, username, password });
    return callback(null, { userid, username });
  }
  ensureInitialized(() => {
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(sql, [username, password], function(err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          callback(new Error("이미 존재하는 ID입니다"), null);
        } else {
          callback(err, null);
        }
      } else {
        callback(null, { userid: this.lastID, username });
      }
    });
  });
}

// 사용자 조회 (로그인)
function getUserByUsername(username, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [] };
    const u = global.__MEM_DB__.users.find(x => x.username === username);
    return callback(null, u ? { id: u.id, username: u.username, password: u.password } : null);
  }
  ensureInitialized(() => {
    const sql = `SELECT id, username, password FROM users WHERE username = ?`;
    db.get(sql, [username], (err, row) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, row);
      }
    });
  });
}

// 사용자 ID로 조회
function getUserById(userid, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [] };
    const u = global.__MEM_DB__.users.find(x => x.id === userid);
    return callback(null, u ? { id: u.id, username: u.username } : null);
  }
  ensureInitialized(() => {
    const sql = `SELECT id, username FROM users WHERE id = ?`;
    db.get(sql, [userid], (err, row) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, row);
      }
    });
  });
}

// 블랙홀 점수 저장
function saveBlackHoleScore(userid, username, score, difficulty, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [] };
    const now = Date.now();
    const idx = global.__MEM_DB__.scores.findIndex(s => s.userid === userid && s.difficulty === difficulty);
    if (idx === -1) {
      global.__MEM_DB__.scores.push({ userid, username, score, difficulty, timestamp: now });
      return callback(null, { bestScore: score, timestamp: now });
    }
    const prev = global.__MEM_DB__.scores[idx];
    if (score > prev.score) {
      global.__MEM_DB__.scores[idx] = { userid, username, score, difficulty, timestamp: now };
      return callback(null, { bestScore: score, timestamp: now });
    }
    return callback(null, { bestScore: prev.score, timestamp: prev.timestamp });
  }
  ensureInitialized(() => {
    const now = Date.now();
    const selectSql = `SELECT id, score, timestamp FROM blackhole_scores WHERE userid = ? AND difficulty = ? LIMIT 1`;
    db.get(selectSql, [userid, difficulty], (selErr, row) => {
      if (selErr) {
        return callback(selErr, null);
      }
      if (!row) {
        const insertSql = `INSERT INTO blackhole_scores (userid, username, score, difficulty, timestamp) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertSql, [userid, username, score, difficulty, now], function(insErr) {
          if (insErr) {
            return callback(insErr, null);
          }
          callback(null, { bestScore: score, timestamp: now });
        });
      } else {
        if (score > row.score) {
          const updateSql = `UPDATE blackhole_scores SET username = ?, score = ?, timestamp = ? WHERE id = ?`;
          db.run(updateSql, [username, score, now, row.id], function(upErr) {
            if (upErr) {
              return callback(upErr, null);
            }
            callback(null, { bestScore: score, timestamp: now });
          });
        } else {
          callback(null, { bestScore: row.score, timestamp: row.timestamp });
        }
      }
    });
  });
}

function saveClickerState(userid, stateObj, callback) {
  const now = Date.now();
  const stateStr = JSON.stringify(stateObj || {});
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [], clicker_full: [] };
    const idx = global.__MEM_DB__.clicker_full.findIndex(s => s.userid === userid);
    if (idx === -1) {
      global.__MEM_DB__.clicker_full.push({ userid, state: stateStr, updated_at: now });
    } else {
      global.__MEM_DB__.clicker_full[idx] = { userid, state: stateStr, updated_at: now };
    }
    return callback && callback(null, { userid, state: JSON.parse(stateStr), updated_at: now });
  }
  ensureInitialized(() => {
    const sql = `INSERT INTO clicker_state_full (userid, state, updated_at) VALUES (?, ?, ?)
                 ON CONFLICT(userid) DO UPDATE SET state=excluded.state, updated_at=excluded.updated_at`;
    db.run(sql, [userid, stateStr, now], function(err) {
      if (err) return callback && callback(err, null);
      callback && callback(null, { userid, state: JSON.parse(stateStr), updated_at: now });
    });
  });
}

function getClickerState(userid, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [], clicker_full: [] };
    const row = global.__MEM_DB__.clicker_full.find(s => s.userid === userid);
    const state = row ? (typeof row.state === 'string' ? JSON.parse(row.state) : row.state) : {};
    return callback && callback(null, { userid, state, updated_at: row ? row.updated_at : Date.now() });
  }
  ensureInitialized(() => {
    const sql = `SELECT userid, state, updated_at FROM clicker_state_full WHERE userid = ? LIMIT 1`;
    db.get(sql, [userid], (err, row) => {
      if (err) return callback && callback(err, null);
      const state = row && row.state ? JSON.parse(row.state) : {};
      callback && callback(null, { userid, state, updated_at: row ? row.updated_at : Date.now() });
    });
  });
}

function saveClickerEnergy(userid, energy, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [], clicker: [] };
    const now = Date.now();
    const idx = global.__MEM_DB__.clicker.findIndex(s => s.userid === userid);
    if (idx === -1) {
      global.__MEM_DB__.clicker.push({ userid, energy, updated_at: now });
    } else {
      global.__MEM_DB__.clicker[idx] = { userid, energy, updated_at: now };
    }
    return callback && callback(null, { userid, energy, updated_at: now });
  }
  ensureInitialized(() => {
    const now = Date.now();
    const sql = `INSERT INTO clicker_state (userid, energy, updated_at) VALUES (?, ?, ?)
                 ON CONFLICT(userid) DO UPDATE SET energy=excluded.energy, updated_at=excluded.updated_at`;
    db.run(sql, [userid, energy, now], function(err) {
      if (err) return callback && callback(err, null);
      callback && callback(null, { userid, energy, updated_at: now });
    });
  });
}

function getClickerEnergy(userid, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [], clicker: [] };
    const row = global.__MEM_DB__.clicker.find(s => s.userid === userid);
    return callback && callback(null, row || { userid, energy: 0, updated_at: Date.now() });
  }
  ensureInitialized(() => {
    const sql = `SELECT userid, energy, updated_at FROM clicker_state WHERE userid = ? LIMIT 1`;
    db.get(sql, [userid], (err, row) => {
      if (err) return callback && callback(err, null);
      callback && callback(null, row || { userid, energy: 0, updated_at: Date.now() });
    });
  });
}

function saveClickerRanking(userid, username, parallelUniverses, energy, callback) {
  const now = Date.now();
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [], clicker_rank: [] };
    const idx = global.__MEM_DB__.clicker_rank.findIndex(s => s.userid === userid);
    const row = { userid, username: username || "Unknown", parallel_universes: parseInt(parallelUniverses) || 0, energy: Number(energy) || 0, updated_at: now };
    if (idx === -1) {
      global.__MEM_DB__.clicker_rank.push(row);
    } else {
      global.__MEM_DB__.clicker_rank[idx] = row;
    }
    return callback && callback(null, row);
  }
  ensureInitialized(() => {
    const sql = `INSERT INTO clicker_rankings (userid, username, parallel_universes, energy, updated_at) VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(userid) DO UPDATE SET username=excluded.username, parallel_universes=excluded.parallel_universes, energy=excluded.energy, updated_at=excluded.updated_at`;
    db.run(sql, [userid, username || "Unknown", parseInt(parallelUniverses) || 0, Number(energy) || 0, now], function(err) {
      if (err) return callback && callback(err, null);
      callback && callback(null, { userid, username: username || "Unknown", parallel_universes: parseInt(parallelUniverses) || 0, energy: Number(energy) || 0, updated_at: now });
    });
  });
}

function getClickerRankings(limit = 10, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [], clicker_rank: [] };
    const arr = [...global.__MEM_DB__.clicker_rank].sort((a, b) => (b.parallel_universes - a.parallel_universes) || (b.energy - a.energy) || (b.updated_at - a.updated_at));
    const rows = arr.slice(0, limit).map((row, idx) => ({ rank: idx + 1, ...row }));
    return callback && callback(null, rows);
  }
  ensureInitialized(() => {
    const sql = `SELECT userid, username, parallel_universes, energy, updated_at FROM clicker_rankings ORDER BY parallel_universes DESC, energy DESC, updated_at DESC LIMIT ?`;
    db.all(sql, [limit], (err, rows) => {
      if (err) return callback && callback(err, null);
      const rankings = rows.map((row, idx) => ({ rank: idx + 1, ...row }));
      callback && callback(null, rankings);
    });
  });
}

// 블랙홀 랭킹 조회
function getBlackHoleRankings(limit = 10, difficulty = null, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [] };
    let arr = [...global.__MEM_DB__.scores];
    if (difficulty && difficulty !== "all") arr = arr.filter(s => s.difficulty === difficulty);
    arr.sort((a, b) => (b.score - a.score) || (b.timestamp - a.timestamp));
    const rankings = arr.slice(0, limit).map((row, idx) => ({ rank: idx + 1, ...row }));
    return callback(null, rankings);
  }
  ensureInitialized(() => {
    let sql = `SELECT userid, username, score, difficulty, timestamp FROM blackhole_scores`;
    const params = [];
    if (difficulty && difficulty !== "all") {
      sql += ` WHERE difficulty = ?`;
      params.push(difficulty);
    }
    sql += ` ORDER BY score DESC, timestamp DESC LIMIT ?`;
    params.push(limit);
    db.all(sql, params, (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        const rankings = rows.map((row, idx) => ({ rank: idx + 1, ...row }));
        callback(null, rankings);
      }
    });
  });
}

// 사용자 점수 순위 조회
function getUserRank(userid, score, timestamp, callback) {
  if (!sqlite3) {
    global.__MEM_DB__ = global.__MEM_DB__ || { users: [], scores: [] };
    const arr = [...global.__MEM_DB__.scores].sort((a, b) => (b.score - a.score) || (b.timestamp - a.timestamp));
    let rank = 1;
    for (const s of arr) {
      if (s.score > score || (s.score === score && s.timestamp < timestamp)) rank++;
    }
    return callback(null, rank);
  }
  ensureInitialized(() => {
    const sql = `
      SELECT COUNT(*) + 1 as rank
      FROM blackhole_scores
      WHERE score > ? OR (score = ? AND timestamp < ?)
    `;
    db.get(sql, [score, score, timestamp], (err, row) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, row ? row.rank : null);
      }
    });
  });
}

// 데이터베이스 연결 종료
function closeDatabase() {
  if (!sqlite3) return Promise.resolve();
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  db: () => db,
  initPromise,
  createUser,
  getUserByUsername,
  getUserById,
  saveBlackHoleScore,
  getBlackHoleRankings,
  getUserRank,
  closeDatabase,
  resetDatabase: function(callback) {
    if (!sqlite3) {
      global.__MEM_DB__ = { users: [], scores: [] };
      return callback && callback(null, true);
    }
    ensureInitialized(() => {
      db.serialize(() => {
        db.run(`DELETE FROM users`, (err1) => {
          if (err1) return callback && callback(err1, null);
          db.run(`DELETE FROM blackhole_scores`, (err2) => {
            if (err2) return callback && callback(err2, null);
            db.run(`DELETE FROM sqlite_sequence WHERE name IN ('users','blackhole_scores')`, (err3) => {
              if (err3) console.warn("sqlite_sequence 초기화 경고:", err3.message);
              callback && callback(null, true);
            });
          });
        });
      });
    });
  },
  saveClickerEnergy,
  getClickerEnergy,
  saveClickerState,
  getClickerState,
  saveClickerRanking,
  getClickerRankings,
};

const { Pool } = require('pg');

// PostgreSQL 연결 설정 (Render의 DATABASE_URL 환경변수 사용)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let isInitialized = false;
let initPromise;

// 데이터베이스 초기화
initPromise = initializeDatabase();

async function initializeDatabase() {
  try {
    console.log('PostgreSQL 데이터베이스 연결 중...');
    
    // 사용자 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('users 테이블 준비 완료');

    // 블랙홀 점수 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blackhole_scores (
        id SERIAL PRIMARY KEY,
        userid INTEGER NOT NULL,
        username TEXT NOT NULL,
        score INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        UNIQUE(userid, difficulty)
      )
    `);
    console.log('blackhole_scores 테이블 준비 완료');

    // 클리커 상태 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clicker_state (
        userid INTEGER PRIMARY KEY,
        energy DOUBLE PRECISION NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);
    console.log('clicker_state 테이블 준비 완료');

    // 클리커 전체 상태 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clicker_state_full (
        userid INTEGER PRIMARY KEY,
        state TEXT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);
    console.log('clicker_state_full 테이블 준비 완료');

    // 클리커 랭킹 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clicker_rankings (
        userid INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        parallel_universes INTEGER NOT NULL,
        energy DOUBLE PRECISION NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);
    console.log('clicker_rankings 테이블 준비 완료');

    // 인덱스 생성
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_username ON users(username)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_score ON blackhole_scores(score DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_difficulty ON blackhole_scores(difficulty)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_clicker_rank ON clicker_rankings(energy DESC, parallel_universes DESC)`);
    
    console.log('인덱스 생성 완료');

    // 기존 사용자 수 확인
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`기존 사용자 수: ${result.rows[0].count}`);
    
    isInitialized = true;
    console.log('PostgreSQL 데이터베이스 초기화 완료');
  } catch (err) {
    console.error('데이터베이스 초기화 오류:', err);
    throw err;
  }
}

// 초기화 완료 대기 함수
async function ensureInitialized() {
  if (!isInitialized) {
    await initPromise;
  }
}

// 사용자 생성 (회원가입)
async function createUser(username, password, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, password]
    );
    console.log(`사용자 생성 성공: ${username} (ID: ${result.rows[0].id})`);
    callback(null, { userid: result.rows[0].id, username: result.rows[0].username });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      callback(new Error('이미 존재하는 ID입니다'), null);
    } else {
      console.error('사용자 생성 오류:', err);
      callback(err, null);
    }
  }
}

// 사용자 조회 (로그인)
async function getUserByUsername(username, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );
    callback(null, result.rows[0] || null);
  } catch (err) {
    console.error('사용자 조회 오류:', err);
    callback(err, null);
  }
}

// 사용자 ID로 조회
async function getUserById(userid, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [userid]
    );
    callback(null, result.rows[0] || null);
  } catch (err) {
    callback(err, null);
  }
}

// 블랙홀 점수 저장
async function saveBlackHoleScore(userid, username, score, difficulty, callback) {
  try {
    await ensureInitialized();
    const now = Date.now();
    
    // UPSERT: 존재하면 업데이트, 없으면 삽입
    const result = await pool.query(`
      INSERT INTO blackhole_scores (userid, username, score, difficulty, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (userid, difficulty) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        score = CASE WHEN EXCLUDED.score > blackhole_scores.score THEN EXCLUDED.score ELSE blackhole_scores.score END,
        timestamp = CASE WHEN EXCLUDED.score > blackhole_scores.score THEN EXCLUDED.timestamp ELSE blackhole_scores.timestamp END
      RETURNING score, timestamp
    `, [userid, username, score, difficulty, now]);
    
    console.log(`점수 저장: ${username} - ${result.rows[0].score} (난이도: ${difficulty})`);
    callback(null, { bestScore: result.rows[0].score, timestamp: result.rows[0].timestamp });
  } catch (err) {
    console.error('점수 저장 오류:', err);
    callback(err, null);
  }
}

// 클리커 전체 상태 저장
async function saveClickerState(userid, stateObj, callback) {
  try {
    await ensureInitialized();
    const now = Date.now();
    const stateStr = JSON.stringify(stateObj || {});
    
    await pool.query(`
      INSERT INTO clicker_state_full (userid, state, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (userid)
      DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at
    `, [userid, stateStr, now]);
    
    callback && callback(null, { userid, state: JSON.parse(stateStr), updated_at: now });
  } catch (err) {
    callback && callback(err, null);
  }
}

// 클리커 전체 상태 조회
async function getClickerState(userid, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(
      'SELECT userid, state, updated_at FROM clicker_state_full WHERE userid = $1',
      [userid]
    );
    
    const state = result.rows[0] ? JSON.parse(result.rows[0].state) : {};
    callback && callback(null, { 
      userid, 
      state, 
      updated_at: result.rows[0] ? result.rows[0].updated_at : Date.now() 
    });
  } catch (err) {
    callback && callback(err, null);
  }
}

// 클리커 에너지 저장
async function saveClickerEnergy(userid, energy, callback) {
  try {
    await ensureInitialized();
    const now = Date.now();
    
    await pool.query(`
      INSERT INTO clicker_state (userid, energy, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (userid)
      DO UPDATE SET energy = EXCLUDED.energy, updated_at = EXCLUDED.updated_at
    `, [userid, energy, now]);
    
    callback && callback(null, { userid, energy, updated_at: now });
  } catch (err) {
    callback && callback(err, null);
  }
}

// 클리커 에너지 조회
async function getClickerEnergy(userid, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(
      'SELECT userid, energy, updated_at FROM clicker_state WHERE userid = $1',
      [userid]
    );
    
    callback && callback(null, result.rows[0] || { userid, energy: 0, updated_at: Date.now() });
  } catch (err) {
    callback && callback(err, null);
  }
}

// 클리커 랭킹 저장
async function saveClickerRanking(userid, username, parallelUniverses, energy, callback) {
  try {
    await ensureInitialized();
    const now = Date.now();
    
    await pool.query(`
      INSERT INTO clicker_rankings (userid, username, parallel_universes, energy, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (userid)
      DO UPDATE SET 
        username = EXCLUDED.username,
        parallel_universes = EXCLUDED.parallel_universes,
        energy = EXCLUDED.energy,
        updated_at = EXCLUDED.updated_at
    `, [userid, username || "Unknown", parseInt(parallelUniverses) || 0, Number(energy) || 0, now]);
    
    callback && callback(null, { 
      userid, 
      username: username || "Unknown", 
      parallel_universes: parseInt(parallelUniverses) || 0, 
      energy: Number(energy) || 0, 
      updated_at: now 
    });
  } catch (err) {
    callback && callback(err, null);
  }
}

// 클리커 랭킹 조회
async function getClickerRankings(limit = 10, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(
      'SELECT userid, username, parallel_universes, energy, updated_at FROM clicker_rankings ORDER BY energy DESC, updated_at DESC LIMIT $1',
      [limit]
    );
    
    const rankings = result.rows.map((row, idx) => ({ rank: idx + 1, ...row }));
    callback && callback(null, rankings);
  } catch (err) {
    callback && callback(err, null);
  }
}

// 클리커 사용자 랭킹 조회
async function getClickerUserRank(userid, callback) {
  try {
    await ensureInitialized();
    
    // 먼저 랭킹 테이블에서 조회
    let result = await pool.query(
      'SELECT userid, username, parallel_universes, energy, updated_at FROM clicker_rankings WHERE userid = $1',
      [userid]
    );
    
    let userRow;
    if (result.rows.length > 0) {
      userRow = result.rows[0];
    } else {
      // 랭킹 테이블에 없으면 에너지 테이블과 사용자 테이블에서 조회
      const energyResult = await pool.query(
        'SELECT energy, updated_at FROM clicker_state WHERE userid = $1',
        [userid]
      );
      const userResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [userid]
      );
      
      userRow = {
        userid,
        username: userResult.rows[0] ? userResult.rows[0].username : "Unknown",
        parallel_universes: 0,
        energy: energyResult.rows[0] ? energyResult.rows[0].energy : 0,
        updated_at: energyResult.rows[0] ? energyResult.rows[0].updated_at : 0
      };
    }
    
    // 랭킹 계산
    const rankResult = await pool.query(
      'SELECT COUNT(*) + 1 AS rank FROM clicker_rankings WHERE energy > $1 OR (energy = $1 AND updated_at > $2)',
      [userRow.energy || 0, userRow.updated_at || 0]
    );
    
    const rank = rankResult.rows[0].rank;
    callback && callback(null, { rank, ...userRow });
  } catch (err) {
    callback && callback(err, null);
  }
}

// 블랙홀 랭킹 조회
async function getBlackHoleRankings(limit = 10, difficulty = null, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(`
      SELECT DISTINCT ON (userid) userid, username, score, difficulty, timestamp
      FROM blackhole_scores
      ORDER BY userid, score DESC, timestamp DESC
      LIMIT $1
    `, [limit]);
    
    // 점수 순으로 재정렬
    const sorted = result.rows.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    const rankings = sorted.map((row, idx) => ({ rank: idx + 1, ...row }));
    
    callback(null, rankings);
  } catch (err) {
    callback(err, null);
  }
}

// 사용자 점수 순위 조회
async function getUserRank(userid, score, timestamp, callback) {
  try {
    await ensureInitialized();
    const result = await pool.query(
      'SELECT COUNT(*) + 1 as rank FROM blackhole_scores WHERE score > $1 OR (score = $1 AND timestamp < $2)',
      [score, timestamp]
    );
    
    callback(null, result.rows[0].rank);
  } catch (err) {
    callback(err, null);
  }
}

// 데이터베이스 연결 종료
async function closeDatabase() {
  try {
    await pool.end();
    console.log('PostgreSQL 연결 종료');
  } catch (err) {
    console.error('데이터베이스 종료 오류:', err);
    throw err;
  }
}

// 데이터베이스 리셋
async function resetDatabase(callback) {
  try {
    await ensureInitialized();
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM blackhole_scores');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE blackhole_scores_id_seq RESTART WITH 1');
    console.log('데이터베이스 리셋 완료');
    callback && callback(null, true);
  } catch (err) {
    console.error('데이터베이스 리셋 오류:', err);
    callback && callback(err, null);
  }
}

module.exports = {
  db: () => pool,
  initPromise,
  createUser,
  getUserByUsername,
  getUserById,
  saveBlackHoleScore,
  getBlackHoleRankings,
  getUserRank,
  closeDatabase,
  resetDatabase,
  saveClickerEnergy,
  getClickerEnergy,
  saveClickerState,
  getClickerState,
  saveClickerRanking,
  getClickerRankings,
  getClickerUserRank,
};
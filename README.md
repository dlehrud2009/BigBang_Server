# BigBang

React 프론트엔드와 Node.js(Express, Socket.IO, SQLite) 백엔드로 구성된 빅뱅/블랙홀 시뮬레이션 및 랭킹 앱입니다. 프론트엔드 빌드를 백엔드가 정적 파일로 서빙하도록 설계되어 단일 서비스로 배포할 수 있습니다.

## 폴더 구조
- `FrontEnd/` — Create React App 기반 UI
- `BackEnd/` — Express API 및 Socket.IO 서버, SQLite 데이터베이스(`BackEnd/database.db`)

## 로컬 실행
- 요구 사항: Node.js `>=18.18 <19`
- 1) 프론트엔드
  - `cd FrontEnd`
  - `npm install`
  - `npm start` → `http://localhost:3000`
- 2) 백엔드
  - `cd BackEnd`
  - `npm install`
  - `npm start` → `http://localhost:4000`

기본 CORS 허용 오리진은 `http://localhost:3000`입니다. 백엔드 포트는 `PORT` 환경 변수로 변경할 수 있습니다(기본값 4000).

## 환경 변수
- `PORT` — 백엔드 포트(기본: `4000`)
- `ALLOWED_ORIGINS` — CORS 허용 오리진 목록(쉼표 구분). 예: `https://your-service.onrender.com`

## 빌드/프로덕션
프론트엔드 빌드를 생성하고 백엔드가 이를 서빙합니다.
- `cd FrontEnd && npm run build`
- 빌드 산출물은 `FrontEnd/build`에 생성되며, 백엔드가 자동으로 정적 파일을 서빙합니다.
- 프로덕션 서버 실행: `cd BackEnd && npm start`

## 테스트
- 프론트엔드: `cd FrontEnd && npm test`
- 백엔드: 현재 별도의 테스트 스크립트 없음

## API 명세
- 사용자/세션 생성
  - 경로: `/api/user` — `POST`
  - 요청: `{ "username": "홍길동" }`
  - 응답: `{ "userid": number, "username": string }`
  - 설명: 세션용 사용자 메모리 생성. 초기 상태는 서버가 내부적으로 `{ stage: "bigbang", status: "paused" }`로 세팅됨. 참고: `BackEnd/server.js:38-43`

- 시뮬레이션 시작
  - 경로: `/api/simulation/start` — `POST`
  - 요청: `{ "userid": number }`
  - 응답: `{ "userid": number, "stage": "bigbang", "status": "started" }`
  - 설명: 사용자의 시뮬레이션을 시작하고 현재 단계/상태를 브로드캐스트. 참고: `BackEnd/server.js:46-53`

- 시뮬레이션 일시정지
  - 경로: `/api/simulation/pause` — `POST`
  - 요청: `{ "userid": number }`
  - 응답: `{ "userid": number, "stage": string, "status": "paused" }`
  - 설명: 사용자의 시뮬레이션을 일시정지. 참고: `BackEnd/server.js:56-62`

- 단계 변경
  - 경로: `/api/simulation/stage` — `POST`
  - 요청: `{ "userid": number, "stage": string }`
  - 응답: `{ "userid": number, "stage": string, "status": string }`
  - 설명: 사용자의 현재 단계를 변경하고 브로드캐스트. 참고: `BackEnd/server.js:65-71`

- 회원가입
  - 경로: `/api/auth/signup` — `POST`
  - 요청: `{ "username": string, "password": string }`
  - 응답: `{ "success": true, "userid": number, "username": string }` 또는 에러 메시지
  - 설명: 비밀번호 강도 검증 후 사용자 생성(SQLite). 참고: `BackEnd/server.js:95-156`, `BackEnd/database.js:131-155`

- 로그인
  - 경로: `/api/auth/login` — `POST`
  - 요청: `{ "username": string, "password": string }`
  - 응답: `{ "success": true, "userid": number, "username": string }` 또는 에러 메시지
  - 설명: 사용자 조회 및 세션 상태 초기화. 참고: `BackEnd/server.js:159-191`, `BackEnd/database.js:157-174`

- 블랙홀 점수 제출
  - 경로: `/api/blackhole/score` — `POST`
  - 요청: `{ "userid": number, "username"?: string, "score": number, "difficulty"?: string }`
  - 응답: `{ "success": true, "rank": number | null, "bestScore": number }`
  - 설명: 난이도별 최고 점수 저장 및 순위 계산. 참고: `BackEnd/server.js:195-225`, `BackEnd/database.js:195-242`

- 블랙홀 랭킹 조회
  - 경로: `/api/blackhole/ranking` — `GET`
  - 쿼리: `limit`(기본 10), `difficulty`(`all` 기본)
  - 응답: `{ "success": true, "rankings": Array<{ rank, userid, username, score, difficulty, timestamp }> }`
  - 설명: 점수 상위 랭킹 조회. 참고: `BackEnd/server.js:228-241`, `BackEnd/database.js:244-272`

- 헬스 체크
  - 경로: `/api/health` — `GET`
  - 응답: `{ "status": "ok", "message": "Server is running" }`
  - 참고: `BackEnd/server.js:244-246`

주의: 다음 엔드포인트는 현재 미구현입니다 — `GET /api/user`(사용자 목록), `GET /api/simulation/stage/:userid`(단계 조회), `POST /api/simulation/next/:userid`, `POST /api/simulation/prev/:userid`.

## 단계 순서(권장)
- `bigbang` → `galaxy_formation` → `solar_system`
- 서버는 임의 문자열 단계를 수용합니다. 프론트엔드에서 위 순서를 기준으로 제어하는 것을 권장합니다.

## 소프트웨어 아키텍처
- 유형: 3계층 아키텍처(Three-Tier)
- UI: React + Three.js
- Controller: Express API + Socket.IO
- Service: 서버 메모리 기반 시뮬레이션 상태 관리
- Model/Data: 사용자/점수는 SQLite, 시뮬레이션 상태는 메모리(서버 재시작 시 초기화)

## 배포 계획
- 단일 서비스: 백엔드가 빌드된 프론트엔드를 정적 서빙(`BackEnd/server.js:248-260`)
- 분리 배포: Web Service(백엔드) + Static Site(프론트엔드)
  - Web Service: `BackEnd` 기준, `node server.js`
  - Static Site: `FrontEnd` 빌드(`npm run build`) 후 `build` 디렉토리 퍼블리시
  - CORS: `ALLOWED_ORIGINS`에 Static Site 도메인 추가

## Render 배포 가이드(단일 서비스)
백엔드가 프론트엔드 빌드를 서빙하도록 단일 Web Service로 배포합니다.

1) 리포지토리 연결 후 Web Service 생성
- Runtime: Node
- Node 버전: 18 LTS
- Root Directory: `BackEnd` (백엔드를 기준으로 실행)

2) Build Command
- 프론트엔드 빌드와 백엔드 설치를 함께 수행합니다.
```
cd ../FrontEnd && npm install && npm run build && cd ../BackEnd && npm install
```

3) Start Command
```
node server.js
```

4) Environment Variables
- `PORT=4000` (선택)
- `ALLOWED_ORIGINS=https://<your-service>.onrender.com` (동일 도메인 허용)

5) Persistent Disk(데이터 유지)
- 기본 파일 시스템은 배포/재시작 시 초기화됩니다. SQLite 데이터를 유지하려면 Render의 Persistent Disk를 추가하는 것을 권장합니다.
- 현재 DB 경로는 고정(`BackEnd/database.db`)이므로, 디스크 마운트 경로로 저장하려면 추후 코드에서 경로를 환경 변수로 설정하도록 개선이 필요합니다.

6) 헬스 체크
- 엔드포인트: `/api/health`

## 프론트엔드 API/소켓 주소 변경 안내
현재 프론트엔드는 `http://localhost:4000` 하드코딩 주소를 사용합니다. Render 배포 시 동일 서비스 도메인을 사용하도록 상대 경로 또는 환경 변수로 변경하세요.

- 소켓 초기화: `FrontEnd/src/App.jsx:27`
  - 기존: `io("http://localhost:4000")`
  - 권장: `io()` 또는 `io(window.location.origin)`

- API 호출: 아래 위치의 `http://localhost:4000`를 `/api/...` 상대 경로로 치환 권장
  - `FrontEnd/src/App.jsx:59, 68, 79`
  - `FrontEnd/src/components/Login.jsx:74, 87`
  - `FrontEnd/src/components/BlackHoleEscape.jsx:631, 652`

CRA 환경 변수를 사용할 경우 빌드 시 `REACT_APP_API_BASE_URL`을 주입하고 코드에서 `process.env.REACT_APP_API_BASE_URL`을 참조하도록 변경할 수 있습니다.

## 문제 해결(Troubleshooting)
- `sqlite3` 빌드 오류: Node 18 LTS 사용 및 로그 확인. 본 프로젝트는 `postinstall`에서 `sqlite3`를 재빌드하도록 설정되어 있습니다.
- CORS 오류: `ALLOWED_ORIGINS`에 서비스 도메인을 추가하세요.
- 데이터 유실: Persistent Disk를 추가하거나 외부 DB(PostgreSQL 등)로 전환을 고려하세요.

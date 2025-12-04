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


# 빅뱅 시뮬레이터 (BigBang Simulator)

우주의 탄생부터 현재까지의 과정을 시각적으로 체험할 수 있는 인터랙티브 시뮬레이션 프로젝트입니다.

## 프로젝트 개요

빅뱅 시뮬레이터는 우주의 진화 과정을 실시간으로 시각화하는 웹 애플리케이션입니다. 사용자는 빅뱅부터 시작하여 별의 형성, 은하의 생성, 태양계의 탄생까지 우주의 역사를 단계별로 탐험할 수 있습니다.

## 주요 기능

- **실시간 우주 시뮬레이션**: 빅뱅부터 현재까지의 우주 진화 과정 시각화
- **인터랙티브 제어**: 시뮬레이션 시작/일시정지, 단계별 진행 제어
- **실시간 멀티플레이어**: WebSocket을 통한 실시간 상태 동기화
- **3D 파티클 시스템**: Three.js를 활용한 입자 기반 시각화
- **반응형 UI**: 다양한 디바이스에서 최적화된 사용자 경험

## 기술 스택

### Frontend
- **React 19.1.1** - 사용자 인터페이스
- **Three.js** - 3D 그래픽스 및 파티클 시스템
- **Socket.io Client** - 실시간 통신
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **Socket.io** - 실시간 양방향 통신
- **CORS** - 크로스 오리진 리소스 공유

## 프로젝트 구조

```
bigbang/
├── FrontEnd/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── ParticleCanvas.jsx
│   │   │   └── UniverseSimulation.jsx
│   │   ├── hooks/          # 커스텀 훅
│   │   │   ├── useParticles.js
│   │   │   └── useSolarSystem.js
│   │   └── utils/          # 유틸리티 함수
│   │       ├── galaxyUtils.js
│   │       ├── mathUtils.js
│   │       ├── solarSystem.js
│   │       └── educationalBigBang.js
│   └── build/              # 프로덕션 빌드
├── BackEnd/                # Node.js 백엔드
│   ├── server.js          # 메인 서버 파일
│   ├── models/            # 데이터 모델
│   └── services/          # 비즈니스 로직
└── package.json           # 루트 패키지 설정
```

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd bigbang
```

### 2. 의존성 설치

#### 백엔드 의존성 설치
```bash
cd BackEnd
npm install
```

#### 프론트엔드 의존성 설치
```bash
cd FrontEnd
npm install
```

### 3. 개발 서버 실행

#### 백엔드 서버 실행 (포트 4000)
```bash
cd BackEnd
npm start
```

#### 프론트엔드 개발 서버 실행 (포트 3000)
```bash
cd FrontEnd
npm start
```

### 4. 프로덕션 빌드 및 실행

#### 프론트엔드 빌드
```bash
cd FrontEnd
npm run build
```

#### 프로덕션 서버 실행
```bash
cd BackEnd
npm start
```

## 사용 방법

1. **접속**: 웹 브라우저에서 `http://localhost:3000` (개발) 또는 `http://localhost:4000` (프로덕션)에 접속
2. **시뮬레이션 시작**: "시작" 버튼을 클릭하여 빅뱅 시뮬레이션 시작
3. **단계 제어**: 다양한 우주 진화 단계를 선택하여 탐험
4. **일시정지/재개**: 시뮬레이션을 일시정지하거나 재개

## 개발 스크립트

### 프론트엔드
```bash
npm start          # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm test           # 테스트 실행
npm run eject      # 설정 추출 (주의: 되돌릴 수 없음)
```

### 백엔드
```bash
npm start          # 서버 실행
```

## 주요 컴포넌트

- **ParticleCanvas**: 3D 파티클 시스템을 통한 우주 시각화
- **UniverseSimulation**: 우주 진화 시뮬레이션 로직
- **useParticles**: 파티클 시스템 관리 훅
- **useSolarSystem**: 태양계 시뮬레이션 훅

## API 엔드포인트

| 서비스 | API 경로 | HTTP Method | Request | Response | 설명 |
| --- | --- | --- | --- | --- | --- |
| 사용자 생성 | `/api/user` | POST | `{ "username": "홍길동" }` | `{ "userid": 1, "username": "홍길동", "stage": "bigbang", "status": "started" }` | 접속 시 새로운 사용자 생성 및 시뮬레이션 자동 시작 |
| 사용자 목록 조회 | `/api/user` | GET | 없음 | `[{"userid":1, "username":"홍길동"}]` | 서버에 등록된 모든 사용자 목록 조회 |
| 시뮬레이션 일시정지 | `/api/simulation/pause` | POST | `{ "userid": 1 }` | `{ "userid": 1, "status": "paused", "stage": "bigbang" }` | 해당 사용자의 시뮬레이션 일시정지 |
| 현재 단계 조회 | `/api/simulation/stage/:userid` | GET | 없음 | `{ "stage": "bigbang" }` | 해당 사용자의 현재 시뮬레이션 단계 확인 |
| 다음 단계 전환 | `/api/simulation/next/:userid` | POST | 없음 | `{ "stage": "galaxy" }` | 해당 사용자의 시뮬레이션을 다음 단계로 전환 |
| 이전 단계 되돌리기 | `/api/simulation/prev/:userid` | POST | 없음 | `{ "stage": "bigbang" }` | 해당 사용자의 시뮬레이션을 이전 단계로 되돌리기 |

> 모든 상태는 서버 메모리에 저장되며, 서버 재시작 시 초기화됩니다.


## 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 ISC 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

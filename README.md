# CareerLens – 통합 프로젝트 (Expo 모바일 프론트 + Spring Boot 백엔드)

이 프로젝트는 **Expo / React Native 모바일 앱 프론트엔드** 와 **Spring Boot 백엔드 + MySQL 데이터베이스** 를 **한 폴더 안에서 통합 개발** 할 수 있도록 병합한 단일 리포지토리입니다.

---

## 📁 프로젝트 구조

```
CareerLensApp-main/
├── src/                        # ✅ Expo (React Native) 모바일 프론트엔드
│   ├── app/                    #   파일 기반 라우팅 (login, signup, mypage, jobs, planner 등)
│   ├── components/             #   UI 컴포넌트 (site-header, RequireAuth, UI Kit 등)
│   ├── lib/                    #   API 클라이언트 (auth.ts, jobs.ts, recommendation.ts 등)
│   └── ...
│
├── backend/                    # ✅ Spring Boot 백엔드 (Java 17)
│   ├── src/main/java/...       #   Controller, Service, Repository, Entity, Config
│   ├── src/main/resources/
│   │   └── application.yml     #   백엔드 설정 (포트 8080, DB, CORS, 시드 등)
│   ├── Dockerfile              #   백엔드 도커 이미지 빌드 스크립트
│   └── pom.xml                 #   Maven 의존성
│
├── seed-data/                  # ✅ 추천 / 샘플 CSV, JSON 시드 데이터
│   ├── processed/              #   가공 완료된 job-postings, employee-samples, pattern-profiles 등
│   └── recommendation-seed.json
│
├── docs/                       # 개발 문서 모음 (추천, 플래너, CORS, 인증, 데이터 파이프라인 등)
│
├── assets/                     # Expo 아이콘, 스플래시, 탭 아이콘 등 리소스
│
├── docker-compose.yml          # 🐳 로컬 개발용: MySQL(3307) + 백엔드(8088→8080)
├── .env.example                # 환경변수 예시 (복사 후 .env 로 사용)
├── .env                        # ⚠️ Expo 프론트가 실제로 사용하는 API 주소
├── DOCKER.md                   # Docker 환경 구축 가이드
├── design.md                   # 화면 설계서
│
├── package.json                # Expo 프론트 의존성 / 스크립트
├── app.json / metro.config.js  # Expo / Metro 번들러 설정
└── tsconfig.json               # 타입스크립트 설정
```

---

## 🚀 빠른 시작 (로컬 개발)

### ① 백엔드 + DB 실행 (Docker 추천 ⭐)

Docker 가 설치되어 있다면 **MySQL + 백엔드까지 한 번에** 올릴 수 있습니다.

```bash
# 1. 프로젝트 루트에서 실행
docker compose up -d --build

# 2. 정상 실행 확인
#   - 백엔드 API:   http://localhost:8088  (컨테이너 내부는 8080)
#   - MySQL:       jdbc:mysql://localhost:3307/careerlens
#                   (비밀번호: 1234 / 아이디: root)
```

> 처음 뜰 때 시드 데이터가 자동으로 적재되고, 데모 계정(`demo` / `CareerLens123!`)이 자동 생성됩니다.

### ①-② 백엔드만 직접 실행 (IntelliJ 등)

1. 먼저 MySQL 을 로컬에서 실행합니다. (Docker 로 DB 만 먼저 띄워도 됨)
   ```bash
   docker compose up -d db
   ```
2. IntelliJ 에서 `backend/pom.xml` 을 연 뒤 `CareerLensBackendApplication` 을 실행합니다.
3. 기본 포트는 `8080` 입니다.

### ② Expo 프론트엔드 실행

Expo 프론트가 백엔드 API 를 바라보게 하려면 `.env` 파일 안 `EXPO_PUBLIC_API_BASE_URL` 만 맞춰주면 됩니다.

| 백엔드 실행 방식      | .env 안 EXPO_PUBLIC_API_BASE_URL   |
|-----------------------|------------------------------------|
| Docker compose        | `http://localhost:8088` (기본값)   |
| IntelliJ 직접 실행    | `http://localhost:8080`            |
| 실제 폰 Expo Go 테스트| `http://192.168.xxx.xxx:8088`      |

```bash
# 1. 의존성 설치 (최초 1회)
npm install

# 2. 앱 시작 (웹 브라우저 / iOS 시뮬레이터 / Android 에뮬레이터 / Expo Go)
npx expo start
```

화면이 뜨면 회원가입 → 로그인 하거나, 아래 데모 계정으로 바로 로그인할 수 있습니다.
- **아이디**: `demo`
- **비밀번호**: `CareerLens123!`

---

## 🔌 주요 포트 정리

| 서비스              | 포트 (호스트 → 컨테이너/내부) |
|---------------------|------------------------------|
| 백엔드 (Docker)     | `8088 → 8080`                |
| 백엔드 (직접실행)   | `8080`                       |
| MySQL (Docker)      | `3307 → 3306`                |
| Expo 개발서버        | `8081`, `19000~19006` (자동) |

---

## ✨ 미리 구현된 기능

| 화면 / 기능             | 위치 (src/app)                      | 백엔드 API                                             |
|------------------------|-------------------------------------|--------------------------------------------------------|
| 로그인 / 회원가입      | `/login`, `/signup`                 | POST `/api/auth/login`, `/api/auth/signup` 등           |
| 마이페이지 / 프로필    | `/mypage`, `/onboarding/profile`    | `GET/POST/PUT /api/profile`                            |
| 설정 / 비밀번호 변경 / 로그아웃 | `/mypage/settings`            | `PUT /api/auth/password`, `POST /api/auth/logout`      |
| 채용 / 추천            | `/jobs`, `/jobs/recommendation`     | `GET /api/jobs`, `POST /api/recommendations/diagnose`  |
| 플래너 / 마일스톤      | `/planner`                          | `GET/POST /api/planner/roadmaps`                       |
| 정착 가이드 / 국가별   | `/settlement`, `/resources/...`     | `GET /api/settlement/*`, `/api/resource-posts`         |
| 인증 배지               | `/mypage/badges`                    | `POST /api/verifications/github` 등                    |

백엔드 전체 API 는 [AuthController](backend/src/main/java/com/careerlens/backend/controller/AuthController.java) 부터 `backend/src/main/java/.../controller/` 안에 모두 모여있습니다.

---

## 🛠️ 환경변수 설정

`.env.example` 을 `.env` 로 복사한 뒤 필요한 값을 채우세요. 주요 변수는 다음과 같습니다:

| 변수명                            | 설명                                                                   |
|-----------------------------------|------------------------------------------------------------------------|
| `EXPO_PUBLIC_API_BASE_URL`        | **Expo 프론트 → 백엔드** 연결 주소. Docker=8088, 직접실행=8080 사용    |
| `NEXT_PUBLIC_API_BASE_URL`        | (기존 웹 프론트 호환용)                                                |
| `DB_URL` / `DB_USERNAME` / ...    | 백엔드 → MySQL 접속 정보                                               |
| `JWT_SECRET`                      | 로그인 토큰 서명 키 (프로덕션 배포시 반드시 복잡한 값으로 교체)        |
| `CORS_ALLOWED_ORIGINS` / `...PATTERNS` | 백엔드 CORS 허용 목록 (Expo / LAN IP 대역 기본 포함됨)          |

---

## 🧪 데모 시나리오

1. `docker compose up -d --build`
2. `npx expo start` → 웹 브라우저로 열기
3. **회원가입**으로 새 계정을 만들거나 데모 계정(`demo` / `CareerLens123!`)으로 로그인
4. **온보딩 프로필** 작성 → **추천 진단** → **취업 / 플래너 / 정착** 탐색
5. 필요하면 **마이페이지 → 설정 → 로그아웃** 으로 계정 전환

---

### 기존 Expo README (원본)

> 원래 create-expo-app 의 기본 안내는 아래와 같습니다.
> - 의존성: `npm install`
> - 개발서버: `npx expo start`
> - 린트: `npx expo lint`
> - 프로젝트 초기화(템플릿 예제로 되돌리기): `npm run reset-project`

# CareerLens Docker 실행 가이드

이 프로젝트는 세 개의 컨테이너로 실행합니다.

- `frontend`: Next.js, `http://localhost:3000`
- `backend`: Spring Boot, `http://localhost:8080`
- `db`: MySQL 8.4, 호스트에서는 `localhost:3307`

## API 키 저장 방식

API 키는 Docker 이미지 안에 넣지 말고 프로젝트 루트의 `.env` 파일에 저장합니다. `.env`는 `.gitignore`에 포함되어 있으므로 Git에 올라가지 않습니다.

처음 한 번만 예시 파일을 복사합니다.

```powershell
Copy-Item .env.example .env
```

또는 CMD/Git Bash에서는:

```bash
copy .env.example .env
```

그 다음 `.env` 파일에서 필요한 값을 채웁니다.

```properties
AI_PLANNER_ENABLED=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4
```

항공 API를 켜려면:

```properties
DUFFEL_ENABLED=true
DUFFEL_ACCESS_TOKEN=duffel_test_...
```

실제 API 키가 들어간 `.env` 파일은 팀 채팅, GitHub, Notion에 올리지 마세요. 공유할 때는 `.env.example`만 공유하고, 각자 로컬에서 `.env`를 만듭니다.

## 전체 실행

프로젝트 루트에서 실행합니다.

```bash
docker compose up --build
```

브라우저에서 아래 주소로 접속합니다.

```txt
http://localhost:3000
```

백엔드 API 확인:

```txt
http://localhost:8080/api/jobs
```

## 백그라운드 실행

```bash
docker compose up --build -d
```

로그 확인:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

중지:

```bash
docker compose down
```

DB 데이터까지 삭제:

```bash
docker compose down -v
```

## 개별 이미지 빌드

백엔드:

```bash
docker build -f backend/Dockerfile -t careerlens-backend .
```

프론트엔드:

```bash
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 -t careerlens-frontend ./frontend
```

## 기본 환경변수

기본 Docker 구성은 로컬 시연용입니다.

- DB 이름: `careerlens`
- DB 계정: `root`
- DB 비밀번호: `1234`
- 컨테이너 내부 DB 주소: `db:3306`
- 호스트에서 DB 접속 주소: `localhost:3307`

공유 서버나 배포 환경에서는 최소한 아래 값은 바꾸세요.

```properties
JWT_SECRET=충분히_긴_랜덤_문자열
MYSQL_ROOT_PASSWORD=안전한_DB_비밀번호
DB_PASSWORD=안전한_DB_비밀번호
```

## 주의할 점

프론트엔드의 `NEXT_PUBLIC_API_BASE_URL`은 브라우저 코드에 포함됩니다. API 주소를 바꾸면 프론트 이미지를 다시 빌드해야 합니다.

```bash
docker compose build frontend
docker compose up -d frontend
```

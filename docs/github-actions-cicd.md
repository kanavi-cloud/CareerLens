# GitHub Actions CI/CD

이 저장소에는 두 개의 GitHub Actions 워크플로가 있습니다.

- `CI`: 백엔드 Maven 빌드, 프론트 TypeScript/Next 빌드, Docker 이미지 빌드 검증
- `Docker Image CD`: `main` 또는 `master`에 push되거나 수동 실행될 때 Docker 이미지를 GHCR에 발행

## CI 실행 조건

CI는 아래 상황에서 자동 실행됩니다.

- Pull request 생성 또는 업데이트
- 모든 브랜치에 push
- GitHub Actions 화면에서 수동 실행

검증 항목:

```txt
backend: mvn -B package
frontend: npm ci -> npm run typecheck -> npm run build
docker: backend/frontend 이미지 빌드
```

## CD 실행 조건

Docker 이미지 발행은 아래 상황에서 실행됩니다.

- `main` 또는 `master` 브랜치에 push
- `v*` 형식의 태그 push
- GitHub Actions 화면에서 수동 실행

발행되는 이미지:

```txt
ghcr.io/<owner>/<repo>/backend:latest
ghcr.io/<owner>/<repo>/backend:sha-<commit>
ghcr.io/<owner>/<repo>/frontend:latest
ghcr.io/<owner>/<repo>/frontend:sha-<commit>
```

## 필요한 설정

GitHub 저장소의 `Settings -> Actions -> General`에서 아래 권한을 확인합니다.

- Workflow permissions: `Read and write permissions`
- Allow GitHub Actions to create and approve pull requests: 필요하면 활성화

프론트가 빌드될 때 사용할 API 주소는 저장소 변수로 설정할 수 있습니다.

```txt
Settings -> Secrets and variables -> Actions -> Variables
Name: NEXT_PUBLIC_API_BASE_URL
Value: https://your-api.example.com
```

설정하지 않으면 기본값은 아래 주소입니다.

```txt
http://localhost:8080
```

## 실제 서버 배포를 붙일 때

현재 CD는 Docker 이미지를 GHCR에 올리는 단계까지입니다. 서버에 자동 배포하려면 배포 대상이 필요합니다.

- AWS EC2, Lightsail, 학교 서버, 개인 VPS 중 어디인지
- SSH 접속 주소와 사용자
- 서버에서 `docker compose`로 띄울지, Kubernetes/ECS로 띄울지
- 사용할 도메인과 HTTPS 처리 방식

이 정보가 정해지면 GHCR에서 이미지를 pull하고 `docker compose up -d`까지 실행하는 deploy job을 추가하면 됩니다.

# 외부 공고 API 연동 구조 - Greenhouse

## 목적

교수님 피드백 중 "공고를 개발자가 계속 수동으로 관리할 수 있는가?"라는 지점을 보완하기 위해, CareerLens는 수동 조사/seed-data 방식과 별개로 외부 공고 provider 구조를 둔다.

현재 구현 범위는 무단 크롤링이 아니라 Greenhouse 공개 Job Board API의 GET 엔드포인트를 사용하는 시연용 provider다.

## 사용 API

- Provider: Greenhouse Job Board API
- 공식 문서: https://developer.greenhouse.io/job-board.html
- 공고 목록: `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true`
- 인증: 공개 Job Board GET 엔드포인트는 인증 불필요
- 제외 범위: 지원서 제출 API, ATS 내부 데이터, 로그인 필요 데이터, LinkedIn/Greenhouse 페이지 scraping

## CareerLens 내부 흐름

```text
Greenhouse Job Board API
  -> GreenhouseJobProviderService
  -> ExternalJobPreviewDto
  -> JobPosting 정규화
  -> 기본 PatternProfile 생성
  -> 기존 추천 진단 / 전체 공고 / 로드맵 흐름에서 사용
```

추천 엔진은 Greenhouse를 직접 알지 않는다. 외부 공고는 먼저 내부 `JobPosting`으로 정규화되고, 추천 진단은 기존처럼 `JobPosting + PatternProfile + UserProfile`만 비교한다.

## 백엔드 API

### 미리보기

```http
GET /api/jobs/external/greenhouse/preview?boardToken=airbnb&defaultCountry=United%20States&defaultJobFamily=Backend&limit=8
```

역할:
- 외부 API에서 공고를 읽어온다.
- DB에는 저장하지 않는다.
- CareerLens 내부 공고 양식으로 어떻게 변환되는지 확인한다.

### DB 등록

```http
POST /api/jobs/external/greenhouse/import
Content-Type: application/json

{
  "board_token": "airbnb",
  "default_country": "United States",
  "default_job_family": "Backend",
  "limit": 8,
  "default_deadline": "2026-06-20",
  "create_pattern_profile": true
}
```

역할:
- `external_ref = greenhouse:{boardToken}:{jobId}` 기준으로 upsert한다.
- 공고 본문의 기술 키워드, 위치, 경력 표현을 분석해 `JobPosting` 필드로 정규화한다.
- `create_pattern_profile=true`이면 추천 진단이 동작할 수 있도록 기본 `PatternProfile`을 함께 생성한다.

## 환경변수

기본값으로도 동작하지만, 팀원별로 명시하려면 아래 값을 설정한다.

```properties
GREENHOUSE_ENABLED=true
GREENHOUSE_BASE_URL=https://boards-api.greenhouse.io
GREENHOUSE_TIMEOUT_SECONDS=12
```

자동 동기화까지 켜려면 아래 값을 추가한다. 서버가 실행 중인 동안에만 주기적으로 동작한다.

```properties
GREENHOUSE_SYNC_ENABLED=true
GREENHOUSE_SYNC_BOARD_TOKENS=airbnb,doordashusa,reddit
GREENHOUSE_SYNC_DEFAULT_COUNTRY=United States
GREENHOUSE_SYNC_DEFAULT_JOB_FAMILY=Backend
GREENHOUSE_SYNC_LIMIT_PER_BOARD=50
GREENHOUSE_SYNC_CREATE_PATTERN_PROFILE=true
GREENHOUSE_SYNC_DEFAULT_DEADLINE_OFFSET_DAYS=45
GREENHOUSE_SYNC_FIXED_DELAY_MINUTES=360
GREENHOUSE_SYNC_FIXED_DELAY_MILLIS=21600000
GREENHOUSE_SYNC_INITIAL_DELAY_MILLIS=60000
```

주의:
- `GREENHOUSE_SYNC_FIXED_DELAY_MILLIS`가 실제 스케줄 주기다.
- `GREENHOUSE_SYNC_FIXED_DELAY_MINUTES`는 화면/문서 표시용 값이다.
- 예를 들어 6시간마다 동기화하려면 `GREENHOUSE_SYNC_FIXED_DELAY_MILLIS=21600000`으로 둔다.
- `external_ref = greenhouse:{boardToken}:{jobId}` 기준으로 upsert하므로 같은 공고가 중복 저장되지 않는다.
- 자동동기화는 신규 공고를 무조건 DB에 넣지 않고, 이미 검증되어 저장된 공고만 최신 원문 기준으로 업데이트하는 방식으로 운용한다.

## 프론트 화면

- URL: `/jobs/import`
- 성격: 관리자용 데이터 관리 화면
- 접근 정책: `ADMIN` 역할 사용자만 접근 가능
- 기능:
  - board token 입력
  - 국가/직무군 필터 지정
  - 미리보기
  - 미리보기 조회 개수, 신규 후보 수, 기등록 수 표시
  - DB 등록
  - 기본 PatternProfile 생성 여부 선택
  - 자동 동기화 상태 확인
  - 수동 동기화 실행

## 관리자 계정

로컬 개발 환경에서는 회원가입 시 `login_id`를 아래 값 중 하나로 만들면 관리자 역할을 받는다.

```text
admin
careerlens-admin
```

관리자 login id 목록은 환경변수로 변경할 수 있다.

```properties
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

주의:
- 현재 권한 체계는 캡스톤 시연용 경량 구조다.
- 프론트에서는 관리자 계정만 `/jobs/import` 내용을 보여준다.
- 백엔드는 `X-Careerlens-User-Role=ADMIN` 헤더가 없는 외부 공고 API 요청을 403으로 차단한다.
- 상용 수준에서는 JWT/session 기반 인증과 서버측 RBAC로 교체해야 한다.

## AI 신뢰성 검증 확장안

외부 공고 API로 가져온 공고는 원문 품질과 회사별 작성 방식이 다르기 때문에, 관리자 등록 전에 AI 보조 검수를 붙이는 것이 적합하다.

입력:

```text
- 원문 공고 제목
- 원문 위치
- 원문 본문 요약
- 정규화된 country
- 정규화된 job_family
- 추출된 required_skills / preferred_skills
- 추론된 min_experience_years
- 생성 예정 PatternProfile 초안
```

출력:

```text
- 국가 추론 신뢰도
- 직무군 추론 신뢰도
- 기술스택 추출 신뢰도
- 경력 추론 신뢰도
- 비기술 공고 혼입 위험
- 관리자 검수 필요 여부
- 수정 제안
```

역할:

```text
외부 API 공고 -> 규칙 기반 정규화 -> AI 신뢰성 검토 -> 관리자 검수 -> DB 등록
```

추천 점수 계산에는 AI를 직접 쓰지 않고, 공고 데이터 품질 검수와 설명 생성에만 사용한다.

## 자동 동기화 API

### 상태 확인

```http
GET /api/jobs/external/greenhouse/sync/status
```

### 즉시 실행

```http
POST /api/jobs/external/greenhouse/sync/run
```

자동 동기화는 Spring Boot `@Scheduled` 기반이다. 별도 서버리스/배치 인프라 없이 백엔드 서버가 살아 있는 동안 설정된 주기마다 실행된다.

## 발표 때 설명 문장

> 초기 프로토타입은 수동 조사 기반 seed-data로 추천 구조를 검증했습니다. 다만 공고를 계속 개발자가 직접 관리하는 것은 확장성이 낮기 때문에, Greenhouse 같은 공개 Job Board API를 provider 방식으로 연결해 외부 공고를 내부 JobPosting으로 정규화하는 구조를 추가했습니다. 무단 크롤링은 정책/법적 리스크가 있어 배제했고, 추천 엔진은 외부 API에 직접 의존하지 않도록 분리했습니다.

## 한계와 TODO

- Greenhouse 공개 API는 회사별 board token이 필요하다.
- 모든 공고가 마감일, 연봉, 비자 조건을 명확히 제공하지 않는다.
- Software Engineer처럼 넓은 제목으로 올라오는 경우가 많아서 본문 키워드 기반 직무군 추론이 필요하다. 현재 기본 추론 범위는 `Backend`, `Frontend`, `AI/ML`, `Data`다.
- Policy, Finance, Business Operations, Marketing, Sales, Recruiting 등 비기술 공고는 미리보기/import 단계에서 제외한다.
- 위치가 명확한 공고는 `Seoul -> South Korea`, `Milan -> Italy`, `Singapore -> Singapore`처럼 실제 국가로 정규화한다. 미국/일본 추천 진단에는 사용자의 희망 국가 필터가 적용된다.
- `/jobs/import`의 국가/직무군 선택은 fallback이 아니라 실제 필터로 동작한다. 전체 국가/전체 직무군을 보고 싶으면 `ALL` 값을 사용한다.
- Airbnb처럼 회사 소개 문장이 모든 공고 본문 앞에 반복되는 경우, 요약에서는 반복 소개 문장을 제거하고 역할/자격 섹션을 우선 표시한다.
- 현재 PatternProfile은 공고 키워드 기반 기본 패턴이다.
- 실제 서비스 수준에서는 직원 표본/합격자 패턴 검수 또는 관리자 승인 플로우가 필요하다.
- Greenhouse 외 Workday, Lever 등은 별도 provider로 추가하는 구조가 적합하다.

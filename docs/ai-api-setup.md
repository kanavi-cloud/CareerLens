# CareerLens AI API 설정 가이드

CareerLens는 AI를 추천 점수 계산기가 아니라 설명 생성, 로드맵 생성, 문서/프로젝트 분석 보조 도구로 사용한다.

## 1. API 키 보안 원칙

API 키는 절대 코드, `application.yml`, README, 캡처 이미지, GitHub 커밋에 넣지 않는다.

키가 채팅이나 문서에 노출된 경우:

1. OpenAI 대시보드에서 해당 키를 즉시 폐기한다.
2. 새 키를 발급받는다.
3. 새 키는 환경변수에만 넣는다.

## 2. IntelliJ 실행 환경변수

IntelliJ 기준:

```txt
Run/Debug Configurations
-> Spring Boot 실행 설정
-> Environment variables
```

아래 값을 넣는다.

```txt
OPENAI_API_KEY=새로_발급받은_키
AI_PLANNER_ENABLED=true
AI_PROVIDER=openai
OPENAI_MODEL=gpt-5.4
```

## 3. PowerShell 임시 실행

터미널에서 일시적으로 실행할 때:

```powershell
$env:OPENAI_API_KEY="새로_발급받은_키"
$env:AI_PLANNER_ENABLED="true"
$env:AI_PROVIDER="openai"
$env:OPENAI_MODEL="gpt-5.4"
```

그 다음 백엔드를 실행한다.

## 4. Amadeus 항공 API 설정

출국로드맵에서 항공편 후보를 조회하려면 공식 Flight API 키가 필요하다.
현재 1순위 연동 후보는 Duffel이다.

### Duffel 설정

Duffel은 테스트 access token을 만들 수 있으며, 테스트 토큰은 `duffel_test_`로 시작한다.

환경변수:

```txt
TRAVEL_PROVIDER=duffel
DUFFEL_ENABLED=true
DUFFEL_ACCESS_TOKEN=duffel_test_...
DUFFEL_BASE_URL=https://api.duffel.com
DUFFEL_VERSION=v2
DUFFEL_SUPPLIER_TIMEOUT_MILLIS=10000
```

주의:

```txt
DUFFEL_ACCESS_TOKEN은 프론트엔드에서 직접 사용하지 않는다.
반드시 백엔드 환경변수로만 관리한다.
CareerLens는 Offer Request와 항공편 후보 표시까지만 사용하고 예약/결제는 하지 않는다.
```

### Amadeus legacy 설정

현재 코드는 Amadeus for Developers의 Self-Service API 기준으로 구현되어 있지만,
2026년 5월 확인 기준으로 Self-Service 신규 등록이 제한되고 2026년 7월 17일 decommission 예정 공지가 표시되고 있다.

따라서 Amadeus 연동은 기존 키를 이미 보유한 경우에만 선택적으로 사용한다.
신규 키를 발급받지 못하는 경우에도 출국로드맵은 규칙 기반으로 정상 동작한다.

사용 API:

```txt
Amadeus Flight Offers Search API
```

환경변수:

```txt
AMADEUS_ENABLED=true
AMADEUS_CLIENT_ID=발급받은_API_KEY
AMADEUS_CLIENT_SECRET=발급받은_API_SECRET
AMADEUS_BASE_URL=https://test.api.amadeus.com
AMADEUS_CURRENCY_CODE=KRW
```

IntelliJ 기준 설정 위치:

```txt
Run/Debug Configurations
-> Spring Boot 실행 설정
-> Environment variables
```

PowerShell 임시 실행:

```powershell
$env:AMADEUS_ENABLED="true"
$env:AMADEUS_CLIENT_ID="발급받은_API_KEY"
$env:AMADEUS_CLIENT_SECRET="발급받은_API_SECRET"
$env:AMADEUS_BASE_URL="https://test.api.amadeus.com"
$env:AMADEUS_CURRENCY_CODE="KRW"
```

동작 방식:

```txt
1. /api/departure/plan 호출
2. 서버가 Amadeus OAuth token 발급
3. Flight Offers Search API 호출
4. 항공편 후보를 FlightOfferDto로 변환
5. 프론트 출국로드맵 화면에 후보 표시
```

주의:

```txt
Amadeus 테스트 환경은 노선/날짜/항공사 데이터가 제한될 수 있다.
신규 Self-Service 계정/키 발급이 불가능할 수 있다.
Self-Service portal decommission 이후에는 기존 키도 동작하지 않을 수 있다.
결과가 없거나 API 호출이 실패해도 출국로드맵은 규칙 기반으로 생성된다.
항공권 예약, 가격 보장, 좌석 보장은 구현하지 않는다.
```

자세한 내용:

```txt
docs/departure-flight-api-integration.md
```

## 5. 현재 적용 위치

현재 AI 호출이 연결된 우선 위치:

- 커리어 플래너 과제 생성
- AI 문서/산출물 검증
- GitHub repository 분석 보조
- PDF/DOCX 분석 보조
- 정착 준비 요약
- 출국 로드맵 마일스톤 보조 생성

환경변수가 설정되어 있으면 `PlannerTaskDraftService`가 OpenAI Responses API를 호출한다.
AI 호출이 실패하거나 키가 없으면 규칙 기반 fallback 과제를 생성한다.

## 6. 권장 확장 순서

1. AI 커리어 플래너 생성 안정화
2. 추천 결과 설명 생성
3. 이력서/자기소개서/포트폴리오 분석
4. GitHub 프로젝트 분석
5. 관리자용 PatternProfile 초안 생성
6. 국가/비자/행정 정보 요약

## 7. AI에 맡기지 않을 것

- 추천 점수의 최종 계산
- 합격 확률 단정
- 외부 공고 자동 수집
- LinkedIn 직원 scraping
- 검수 없는 PatternProfile DB 저장

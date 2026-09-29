# 팀 공유용 노션 정리 - 2026-05-09

## 작업 브랜치

`feature/profile-recommendation-job-family-expansion`

## 작업 요약

외부 공고 API 연동 구조를 Greenhouse 공개 Job Board API 기준으로 정리했다. Greenhouse는 전체 공고 검색 API가 아니라 회사별 board token 기반 API이므로, 관리자가 여러 회사의 token을 미리보기로 확인하고 필요한 공고만 DB에 저장하는 방식으로 운영한다.

## 핵심 변경 사항

- 관리자 외부 공고 미리보기 화면에서 검증된 Greenhouse board token 프리셋 제공
- Notion/Coinbase는 2026-05-09 기준 공개 API 404 확인으로 기본 프리셋에서 제외
- 실제 200 응답 확인된 회사 토큰 추가
  - Airbnb
  - Stripe
  - Reddit
  - Databricks
  - Figma
  - Greenhouse
  - Anthropic
  - DoorDash
  - Asana
  - Discord
  - Duolingo
  - GitLab
  - Mixpanel
  - Webflow
- 외부 공고 연봉 추출 보강
  - `metadata.currency_range` 우선 사용
  - 본문 `Compensation`, `Pay Range`, `Annual Pay Range`에서 통화 포함 범위 추출
- 비자 조건 추출 보강
  - sponsorship/work authorization 문구가 있을 때만 분류
  - 명시가 없으면 `Not specified in public posting`
- 공개 API에 근거가 부족한 마감일, 기업가치, 워라밸 점수는 임의 생성하지 않음
- 자동 동기화는 신규 공고 자동 저장이 아니라, 관리자가 이미 DB에 저장한 공고를 최신 원문 기준으로 갱신하는 방식

## 변경 파일

```txt
backend/src/main/java/com/careerlens/backend/service/GreenhouseJobProviderService.java
backend/src/main/resources/application.yml
frontend/lib/external-jobs.ts
frontend/lib/greenhouse-board-registry.ts
frontend/app/jobs/import/page.tsx
docs/greenhouse-board-token-registry.md
docs/external-job-provider-greenhouse.md
README.md
```

## 영향받는 화면/API

화면:

```txt
/jobs/import
/jobs
/jobs/recommendation
/mypage
```

API:

```txt
GET  /api/jobs/external/greenhouse/preview
POST /api/jobs/external/greenhouse/import
GET  /api/jobs/external/greenhouse/sync/status
POST /api/jobs/external/greenhouse/sync/run
```

## 마이페이지 프로필 입력 검토

현재 프로필 입력 항목은 외부 공고 API와 추천 진단 기준으로 1차 시연에는 충분하다.

현재 반영 항목:

- 희망 국가/도시
- 희망 직무군/직무명
- 선호 근무형태
- 입사 가능 시점
- 총 경력/직무 관련 경력
- 대표 프로젝트 경험
- 산업/도메인 경험
- 기술스택
- 자격증/시험
- 영어/일본어/대표 언어 수준
- 학력/전공
- 희망 연봉
- 비자 스폰서십 필요 여부
- GitHub/포트폴리오 보유 여부
- 선호 조건
- 추천 우선순위

추후 추가하면 좋은 항목:

- 현재 근로허가 상태
- relocation 가능 여부
- 선호 통화/최저 연봉
- 지원 제외 국가
- 희망 seniority
- 원격 근무 가능 시간대

## AI API 활용 방향

마이페이지 입력 화면 자체에는 AI API를 직접 붙이지 않는 것이 좋다. 추천 진단의 기준이 되는 정형 데이터는 사용자가 직접 입력해야 설명 가능성이 높다.

AI를 붙이기 좋은 위치:

- 커리어 플래너 주차별 과제 생성
- 공고 요약/관리자 검수 보조
- 이력서/자기소개서/포트폴리오 분석
- GitHub repository 분석
- PatternProfile 생성 프롬프트 보조

## 환경변수

OpenAI 예시:

```properties
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4
AI_PLANNER_ENABLED=true
```

Greenhouse 자동 동기화 예시:

```properties
GREENHOUSE_SYNC_ENABLED=true
GREENHOUSE_SYNC_BOARD_TOKENS=airbnb,stripe,reddit,databricks,figma,greenhouse,anthropic,doordashusa,asana,discord,duolingo,gitlab,mixpanel,webflow
GREENHOUSE_SYNC_DEFAULT_COUNTRY=ALL
GREENHOUSE_SYNC_DEFAULT_JOB_FAMILY=ALL
GREENHOUSE_SYNC_LIMIT_PER_BOARD=50
GREENHOUSE_SYNC_CREATE_PATTERN_PROFILE=true
GREENHOUSE_SYNC_DEFAULT_DEADLINE_OFFSET_DAYS=0
GREENHOUSE_SYNC_FIXED_DELAY_MILLIS=21600000
```

## 테스트 방법

1. 백엔드 서버 재시작
2. 프론트 서버 재시작
3. 관리자 계정으로 로그인
4. `/jobs/import` 접속
5. 프리셋 회사 선택
6. 미리보기 실행
7. 공고별 국가/직무군/연봉/비자/기등록 여부 확인
8. 필요한 공고만 체크 후 DB 저장
9. `/jobs`에서 저장 공고 확인
10. 추천 진단 또는 공고별 로드맵 생성 확인

## 남은 TODO

- 400/500 에러가 화면에 그대로 보이지 않도록 전역 예외 처리 개선
- 외부 공고 `content_summary`를 직무 설명/자격요건 중심으로 더 깔끔하게 요약
- 외부 공고 저장 정책 확정
- 추천 진단에서 null score 처리 방식 재검토
- AI 기반 관리자 공고 검수 보조 추가
- PatternProfile 생성/검수 흐름 고도화

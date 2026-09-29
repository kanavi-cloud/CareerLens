# Greenhouse Board Token Registry

## 목적

Greenhouse Job Board API는 전체 기업 공고 검색 API가 아니라 회사별 공개 채용 보드 API다.

예를 들어 `airbnb` board token을 사용하면 Airbnb 공고만 조회된다. 따라서 CareerLens에서 여러 기업 공고를 확보하려면 관리자가 검증한 board token registry를 두고, 미리보기 결과 중 시연/추천에 적합한 공고만 DB에 저장하는 방식이 맞다.

## 현재 프리셋

프론트 관리자 화면 `/jobs/import`에는 실제 `boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` 호출에서 200 응답을 확인한 토큰만 기본 프리셋으로 둔다.

| 회사 | board token | 도메인 | 용도 |
| --- | --- | --- | --- |
| Airbnb | `airbnb` | Travel / Marketplace | 글로벌 숙박/여행 플랫폼의 엔지니어링 공고 확인 |
| Stripe | `stripe` | Fintech / Payments | 결제 인프라, 플랫폼, 데이터 직무 확인 |
| Reddit | `reddit` | Social / Community / AI | 커뮤니티, 검색, 추천, ML 관련 공고 확인 |
| Databricks | `databricks` | Data / AI Platform | 데이터 플랫폼, AI, 인프라 엔지니어링 공고 확인 |
| Figma | `figma` | Design / Collaboration | 프론트엔드, 데이터, AI 프로덕트 공고 확인 |
| Greenhouse | `greenhouse` | HR SaaS | 채용 SaaS 기업 자체 공고 확인 |
| Anthropic | `anthropic` | AI | AI/ML, 인프라, 데이터 직무 확인 |
| DoorDash | `doordashusa` | Commerce / Logistics | 커머스, 물류, 플랫폼 공고 확인 |
| Asana | `asana` | Productivity / SaaS | 협업 SaaS, 프로덕트 엔지니어링 공고 확인 |
| Discord | `discord` | Social / Realtime | 실시간 커뮤니케이션, 플랫폼 공고 확인 |
| Duolingo | `duolingo` | EdTech / AI | 교육, AI, 모바일/플랫폼 공고 확인 |
| GitLab | `gitlab` | DevTools | DevOps, 플랫폼, 보안 엔지니어링 공고 확인 |
| Mixpanel | `mixpanel` | Analytics SaaS | 제품 분석, 데이터 플랫폼 공고 확인 |
| Webflow | `webflow` | No-code / Web | 웹 플랫폼, 프론트엔드, 인프라 공고 확인 |

## Notion/Coinbase 404에 대한 정리

`notion`, `coinbase`, `Coinbase`는 2026-05-09 기준 Greenhouse 공개 Job Board API에서 404를 반환하는 것을 확인했다.

회사 채용 페이지가 Greenhouse 계열 UI를 사용하더라도 공개 Job Board API 토큰이 항상 열려 있는 것은 아니다. 이런 회사는 현재 구조에서는 자동 수집 대상에서 제외하고, 필요하면 관리자가 수동 조사 데이터 CSV로 등록하는 것이 안전하다.

## 운영 원칙

- 관리자 미리보기 기본 limit은 `50`개다.
- `default_country=ALL`, `default_job_family=ALL`로 먼저 가져온 뒤 CareerLens 정규화 로직으로 국가/직무군을 추론한다.
- DB 저장은 관리자가 체크박스로 선택한 공고만 수행한다.
- 자동 동기화는 신규 공고를 무작정 저장하지 않고, 이미 검증되어 DB에 저장된 공고만 최신 원문 기준으로 업데이트한다.
- 마감일, 기업가치, 워라밸처럼 공개 API에 명확한 근거가 없는 항목은 임의 점수로 만들지 않는다.
- 연봉은 `metadata.currency_range`가 있으면 우선 사용하고, 없으면 공고 본문의 `Compensation`, `Pay Range`, `Annual Pay Range` 영역에서 통화가 포함된 범위를 추출한다.
- 비자 조건은 명시 문구가 있을 때만 분류한다. 명시가 없으면 `Not specified in public posting`으로 둔다.

## 환경변수 예시

```properties
GREENHOUSE_SYNC_ENABLED=true
GREENHOUSE_SYNC_BOARD_TOKENS=airbnb,stripe,reddit,databricks,figma,greenhouse,anthropic,doordashusa,asana,discord,duolingo,gitlab,mixpanel,webflow
GREENHOUSE_SYNC_DEFAULT_COUNTRY=ALL
GREENHOUSE_SYNC_DEFAULT_JOB_FAMILY=ALL
GREENHOUSE_SYNC_LIMIT_PER_BOARD=50
GREENHOUSE_SYNC_CREATE_PATTERN_PROFILE=true
GREENHOUSE_SYNC_DEFAULT_DEADLINE_OFFSET_DAYS=0
```

`GREENHOUSE_SYNC_DEFAULT_DEADLINE_OFFSET_DAYS=0`은 실제 공고 마감일을 임의로 만들지 않는다는 뜻이다.

## 발표 설명 문장

> CareerLens는 Greenhouse를 전체 공고 검색 API처럼 사용하지 않고, 회사별 공개 Job Board API를 관리자 검증 기반으로 활용합니다. 관리자가 여러 회사의 board token을 미리보기로 확인하고 적합한 공고만 DB에 저장하면, 이후 자동 동기화는 저장된 공고의 최신 원문만 갱신합니다. 이렇게 하면 개발자가 매번 공고를 코드로 수정하지 않으면서도, 무분별한 크롤링이나 근거 없는 공고 생성을 피할 수 있습니다.

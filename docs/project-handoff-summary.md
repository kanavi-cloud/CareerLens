# CareerLens 프로젝트 이어받기 요약

새 대화창이나 다른 팀원이 프로젝트를 이어받을 때 이 문서를 먼저 읽으면 됩니다.

## 현재 목표

CareerLens는 해외 취업 구직자를 위한 맞춤 채용 추천 및 커리어 준비 플래너 캡스톤 프로토타입입니다.

현재 서비스 흐름:

```txt
회원가입
-> 로그인
-> 해외취업 프로필 온보딩
-> 개인화 맞춤채용정보 추천 진단
-> 부족 요소 분석
-> 커리어 플래너 연결
```

## 프로젝트 구조

```txt
backend/
frontend/
seed-data/
docs/
```

백엔드:

- Spring Boot
- Spring Data JPA
- MySQL
- DTO 기반 API 응답
- 외부 공고 API 없음
- LinkedIn scraping 없음
- ATS / Greenhouse sync 없음

프론트:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

## 구현된 API

Auth:

```txt
POST /api/auth/signup
POST /api/auth/login
```

Profile:

```txt
GET /api/users/{userId}/profile
PUT /api/users/{userId}/profile
```

Recommendation:

```txt
POST /api/recommendations/diagnose
POST /api/recommendations/diagnose/users/{userId}
GET /api/recommendations/{userId}
```

## 구현된 프론트 라우트

```txt
/
/signup
/login
/mypage
/onboarding/profile
/jobs/recommendation
```

## 추천 로직

CareerLens는 사용자와 공고를 직접 비교하는 구조가 아닙니다.

현재 흐름:

```txt
JobPosting
-> 공고에 연결된 PatternProfile
-> UserProfile과 PatternProfile 비교
-> DiagnosisResult 저장
```

`DiagnosisResult`에는 추천 점수 계산에 사용된 `PatternProfile`의 ref/title/evidence summary가 함께 저장됩니다.
프론트 추천 카드와 상세 비교 패널에서도 기준 패턴과 근거 요약을 표시합니다.

패턴 점수에 반영되는 항목:

- 핵심 기술
- 우대 기술
- 목표 경력 연차
- 언어 기준
- 학력 기준
- 자격증
- GitHub 기대 여부
- 포트폴리오 기대 여부

## Seed 데이터

fallback seed:

```txt
seed-data/recommendation-seed.json
```

CSV seed 우선순위:

```txt
seed-data/processed/job-postings.csv
seed-data/processed/employee-samples.csv
seed-data/processed/pattern-profiles.csv
```

`pattern-profiles.csv`가 없으면 아래 파일로 최종 패턴을 생성할 수 있습니다.

```txt
seed-data/processed/accepted-candidate-patterns.csv
```

템플릿:

```txt
seed-data/templates/job-postings-template.csv
seed-data/templates/employee-samples-template.csv
seed-data/templates/accepted-candidate-patterns-template.csv
seed-data/templates/pattern-profiles-template.csv
```

추가 데이터 계약 문서:

```txt
docs/recommendation-data-contract.md
docs/pattern-scoring-guide.md
```

원본 조사 파일 위치:

```txt
seed-data/raw/
```

이 폴더는 gitignore 처리되어 있습니다.

## 데이터 모델링 개념

팀이 수동 조사하는 것:

```txt
공개 공고 데이터
+ 같은 회사/직무군의 직원 프로필 표본
```

그다음 모델링하는 것:

```txt
가상 합격자 더미 패턴
-> 최종 PatternProfile
```

권장 설명:

```txt
CareerLens는 수동 조사한 공고와 익명화한 직원 표본을 바탕으로
설명 가능한 가상 합격자 패턴을 만들고,
이를 프로토타입 추천 진단 기준으로 사용합니다.
```

피해야 할 표현:

```txt
실제 채용 합격 예측
통계적으로 검증된 채용 확률
실제 합격자 데이터
```

## 로컬 버전

백엔드:

- Java target: 17
- 확인된 로컬 JDK: OpenJDK 17.0.18 Temurin
- Spring Boot: 3.3.5
- Database: MySQL

프론트:

- Node.js: 24.15.0
- npm: 11.12.1
- Next.js: 16.2.4
- React: 18.3.1
- TypeScript: 5.6.3
- Tailwind CSS: 3.4.14

## 검증 상태

프론트 검증 완료:

```txt
npm run typecheck
npm run build
npm audit --audit-level=high
```

현재 Codex 환경에는 `mvn`이 없어 백엔드 Maven 빌드는 검증하지 못했습니다.

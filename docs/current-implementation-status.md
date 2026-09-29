# CareerLens 현재 구현 상태 정리

작성 기준일: 2026-05-07

이 문서는 현재 로컬 프로젝트에 실제 구현되어 있는 기능, API, 화면, 데이터 흐름, AI 활용 위치, 남은 placeholder를 조원/발표 준비용으로 빠르게 공유하기 위한 기준 문서입니다.

## 1. 현재 구현된 핵심 흐름

현재 CareerLens는 단순 채용공고 목록 서비스가 아니라 아래 흐름을 시연할 수 있는 프로토타입입니다.

```txt
회원가입/로그인
-> 마이페이지 해외취업 프로필 입력
-> 전체 공고 조회 또는 맞춤추천 진단
-> 공고 + PatternProfile + 사용자 프로필 비교
-> DiagnosisResult 저장
-> 커리어 플래너 로드맵 생성
-> PlannerTask 산출물/검증 기준 확인
-> AI 문서 분석 또는 룰 기반 검증
-> VerificationBadge 발급
-> 마이페이지 검증 배지 확인
-> 지원 관리/정착 지원으로 확장
```

## 2. 현재 구현된 기능

### 사용자/인증

- 회원가입
- 로그인
- 로그인 사용자 localStorage 저장
- 사용자별 프로필 저장/조회
- 마이페이지에서 해외취업 프로필 입력

### 맞춤채용정보 추천 진단

- seed-data/DB 기반 공고 조회
- 공고별 PatternProfile 조회
- 사용자 프로필과 PatternProfile 비교
- 기술, 경력, 언어, 학력/자격, 포트폴리오 적합도 계산
- 합격 가능성, 연봉 매력도, 워라밸, 기업 가치, 직무 적합도 가중치 반영
- 추천 결과와 부족 요소 저장
- 전체 공고에서도 특정 공고를 선택해 로드맵 생성 가능

### 전체 공고 조회

- `GET /api/jobs` 기반 전체 공고 목록 표시
- 국가/직무군/검색 필터
- 공고별 마감기한 표시
- 마감 상태 표시
  - `URGENT`
  - `CLOSING_SOON`
  - `OPEN`
  - `CLOSED`
  - `ROLLING`
- 공고 선택 후 사용자 프로필 기준 진단 및 로드맵 생성

### 커리어 플래너

- 추천 진단 결과에서 로드맵 생성
- 준비도에 따라 4주/8주/12주 로드맵 생성
- PlannerTask 생성
- 과제 상태 변경
  - `TODO`
  - `IN_PROGRESS`
  - `DONE`
- 과제별 필드
  - 설명
  - 기대 산출물
  - 검증 기준
  - 예상 소요 시간
  - 난이도

### AI 문서 분석/검증

- PlannerTask와 VerificationRequest 연결
- 텍스트 기반 검증
- GitHub repository URL 검증
- PDF/DOCX 업로드 검증
- 검증 점수 반환
- 좋은 점/보완점 반환
- AI 키가 없거나 실패하면 rule-based fallback 사용

### 검증 배지

- 검증 점수 기반 배지 발급
- 발급 기준
  - 60점 이상: Bronze
  - 75점 이상: Silver
  - 90점 이상: Gold
  - GitHub repository 분석 75점 이상: GitHub Project Verified
- 마이페이지 검증 배지 화면에서 사용자별 배지 목록 조회

### 지원 관리

- 로드맵에서 지원 관리 기록 생성
- 사용자별 지원 기록 조회
- 지원 상태 변경
- 준비 서류 목록 표시
- 현재는 실제 기업 지원 제출이 아니라 지원 파이프라인 시연용

### 정착 지원

- 사용자별 정착 체크리스트 조회
- 체크리스트 상태 변경
- 비자/출국/초기 정착 흐름을 보여주는 시연용 구조

## 3. 현재 API 목록

### Auth

```txt
POST /api/auth/signup
POST /api/auth/login
```

### User Profile

```txt
GET /api/users/{userId}/profile
PUT /api/users/{userId}/profile
```

### Jobs

```txt
GET /api/jobs
```

### Recommendations

```txt
POST /api/recommendations/diagnose
POST /api/recommendations/diagnose/users/{userId}
POST /api/recommendations/diagnose/users/{userId}/jobs/{jobId}
GET  /api/recommendations/{userId}
```

### Planner

```txt
POST  /api/planner/roadmaps/from-diagnosis/{diagnosisId}
GET   /api/planner/roadmaps/{roadmapId}
GET   /api/planner/users/{userId}/roadmaps
PATCH /api/planner/tasks/{taskId}/status
```

### Verifications

```txt
POST /api/verifications/tasks/{taskId}/text
POST /api/verifications/tasks/{taskId}/github
POST /api/verifications/tasks/{taskId}/file
GET  /api/verifications/tasks/{taskId}
GET  /api/verifications/users/{userId}/badges
```

### Applications

```txt
GET   /api/applications/users/{userId}
POST  /api/applications/from-roadmap/{roadmapId}
PATCH /api/applications/{applicationId}/status
```

### Settlement

```txt
GET   /api/settlement/users/{userId}/checklists
PATCH /api/settlement/checklists/{itemId}/status
```

## 4. 현재 화면 목록

### 실제 연결된 화면

```txt
/
/signup
/login
/mypage
/jobs
/jobs/recommendation
/planner
/planner/[roadmapId]
/roadmap/employment
/roadmap/employment/documents
/applications
/settlement
/mypage/badges
```

### 구조만 잡힌 placeholder/확장 예정 화면

```txt
/jobs/popular
/companies
/recommendations/compare
/recommendations/feed
/roadmap/departure
/roadmap/administration
/mypage/saved-jobs
/mypage/settings
/resources
/resources/notices
/resources/qna
/resources/countries
/resources/visas
```

## 5. 주요 엔티티

```txt
User
UserProfile
JobPosting
EmployeeProfileSample
PatternProfile
DiagnosisResult
PlannerRoadmap
PlannerTask
ApplicationRecord
SettlementChecklist
VerificationRequest
VerificationBadge
```

## 6. 추천 진단 데이터 흐름

현재 추천 진단은 아래 방식으로 동작합니다.

```txt
UserProfile
-> 국가/직무군/언어/경력 하드 필터링
-> JobPosting 후보 조회
-> 공고별 PatternProfile 조회
-> UserProfile vs PatternProfile 비교
-> 기술/경력/언어/학력/포트폴리오 점수 계산
-> 공고별 우선순위 가중치 반영
-> DiagnosisResult 저장
-> 프론트 추천 결과 표시
```

중요한 점:

- 추천 점수 계산은 AI가 아니라 rule-based 로직입니다.
- AI는 설명, 플래너 과제 생성, 문서 검증 보조에 사용합니다.
- PatternProfile은 실행 중 새로 생성하지 않고 seed/DB에 저장된 데이터를 사용합니다.

## 7. 데이터 사용 방식

현재 데이터는 자동 수집이 아니라 seed-data 또는 수동 입력 기반입니다.

```txt
seed-data/processed/job-postings.csv
seed-data/processed/employee-samples.csv
seed-data/processed/accepted-candidate-patterns.csv
seed-data/processed/pattern-profiles.csv
```

현재 더미 규모:

```txt
공고: 24개
직원 표본: 120개
가상 합격자 패턴: 480개
최종 PatternProfile: 72개
```

공고에는 2026-05-20부터 2026-07-31까지 다양한 마감기한이 포함되어 있습니다.

## 8. AI 활용 위치

현재 AI 활용은 다음 위치에 들어가 있습니다.

### 1. 커리어 플래너 과제 생성

```txt
DiagnosisResult
JobPosting
PatternProfile
부족 요소
마감기한
준비 기간
-> AI 프롬프트 구성
-> 주차별 PlannerTask JSON 생성
```

AI 키가 없거나 실패하면 rule-based task 생성으로 fallback합니다.

### 2. 문서/산출물 검증

```txt
PlannerTask
기대 산출물
검증 기준
사용자 제출 텍스트/GitHub/PDF/DOCX
-> AI 또는 rule-based 분석
-> 검증 점수/좋은 점/보완점 반환
-> 점수 기준 배지 발급
```

### 3. 추천 결과 설명

현재 추천 점수 자체는 rule-based이고, 추천 요약/다음 액션 문장은 보조 설명 역할입니다.

## 9. GitHub/PDF/DOCX 검증 정책

### GitHub

허용:

```txt
https://github.com/{owner}/{repository}
```

거부:

```txt
https://github.com/{owner}
https://github.com/topics/...
https://github.com/orgs/...
```

GitHub는 사용자 프로필 주소가 아니라 실제 프로젝트 repository URL만 받습니다.

### PDF/DOCX

- PDF: PDFBox로 텍스트 추출
- DOCX: Apache POI로 텍스트 추출
- 최대 5MB
- 이미지 기반 PDF는 텍스트 추출이 어려울 수 있음

## 10. 배지 발급 기준

```txt
60점 이상: TASK_VERIFIED_BRONZE
75점 이상: TASK_VERIFIED_SILVER
90점 이상: TASK_VERIFIED_GOLD
GitHub repository 분석 75점 이상: GITHUB_PROJECT_VERIFIED
```

배지는 합격 보장이 아니라 과제 산출물의 준비 증빙입니다.

## 11. 현재 시연 가능한 흐름

권장 시연 순서:

```txt
1. 메인 페이지 진입
2. 회원가입 또는 demo 로그인
3. 마이페이지에서 프로필 입력/확인
4. 맞춤채용정보 추천 진단 실행
5. 추천 공고 카드와 부족 요소 확인
6. 커리어 플래너 생성
7. 로드맵 상세에서 과제/기대 산출물/검증 기준 확인
8. AI 문서 분석 페이지 이동
9. 텍스트 또는 GitHub repository URL 제출
10. 검증 결과와 발급 배지 확인
11. 마이페이지 검증 배지 화면 확인
12. 지원 관리로 이동해 지원 파이프라인 확인
13. 정착 지원 체크리스트 확인
```

데모 계정:

```txt
login_id: demo
password: CareerLens123!
```

## 12. 현재 주의할 점

- 실제 LinkedIn/WorldJob/ATS 크롤링은 구현하지 않았습니다.
- 공고/직원/패턴 데이터는 seed/manual 기반입니다.
- GitHub repository 분석은 GitHub API 접근이 실패해도 fallback 분석이 동작합니다.
- AI API 키가 없으면 AI 기능은 rule-based fallback으로 동작합니다.
- PDF 파일이 스캔 이미지이면 텍스트 추출 결과가 비어 있을 수 있습니다.
- 현재 인증은 데모 수준이며 실제 서비스 수준의 세션/토큰 보안은 아직 아닙니다.
- 실제 결제, 실제 기업 지원 제출, 실제 비자 최신 판단 기능은 없습니다.

## 13. 다음 개발 우선순위

### 1순위: 시연 안정화

- README 한글 인코딩/문구 정리
- demo 계정 기준 시연 순서 고정
- API 실패 시 프론트 에러 메시지 정리
- 발표용 캡처 화면 정리

### 2순위: 지원 관리 고도화

- ApplicationRecord와 VerificationBadge 연결
- 배지 보유 여부에 따른 지원 준비 상태 표시
- 지원 단계별 다음 액션 개선

### 3순위: 데이터 관리 고도화

- CSV 업로드/검증 가이드 정리
- 관리자 입력 화면 또는 CSV import 화면 설계
- 공식 API/허가된 수집 파이프라인 확장 설계 문서화

### 4순위: 자료실/정착 로드맵 보강

- 미국/일본 국가별 기본 정보 정리
- 비자/행정 정보는 공식 출처 링크 기반으로 구성
- AI는 법적 판단이 아니라 요약/체크리스트 보조로 제한

## 14. 발표에서 강조할 문장

```txt
CareerLens는 공고 추천에서 끝나는 서비스가 아니라,
추천 결과를 준비 과제로 바꾸고,
사용자가 만든 산출물을 검증해서
해외취업 준비 증빙까지 누적하는 데이터 기반 커리어 진단 플랫폼입니다.
```

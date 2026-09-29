# PatternProfile 이해 가이드

PatternProfile은 CareerLens 추천 엔진에서 가장 중요한 중간 데이터입니다.

한 줄 정의:

```txt
PatternProfile = 특정 공고에 지원할 만한 대표 합격자 유형
```

## 1. 왜 필요한가?

공고만 보고 사용자를 비교하면 추천이 단순해집니다.

예를 들어 프론트엔드 공고 하나에도 여러 합격자 유형이 있을 수 있습니다.

```txt
React 웹앱 구현형
모바일 UI 확장형
디자인 시스템형
프론트엔드 아키텍처형
```

같은 공고라도 어떤 사용자는 React 웹앱형에 가깝고, 어떤 사용자는 모바일 UI형에 가까울 수 있습니다. 그래서 CareerLens는 공고에 여러 PatternProfile을 연결하고, 사용자와 가장 가까운 패턴을 찾습니다.

## 2. 데이터 흐름

```txt
JobPosting
수동 조사한 실제 공고 정보

EmployeeProfileSample
공고 회사/직무와 연결되는 익명화 직원 표본

AcceptedCandidatePattern
공고와 직원 표본을 바탕으로 AI가 초안 생성한 가상 합격자 데이터

PatternProfile
가상 합격자와 직원 표본을 묶어서 추출한 최종 대표 합격자 유형

DiagnosisResult
사용자 프로필과 PatternProfile을 비교한 추천 진단 결과
```

추천 버튼을 누를 때 직접 비교하는 대상은 아래입니다.

```txt
UserProfile vs PatternProfile
```

## 3. 예시

공고:

```txt
회사: Meta
직무: Frontend Engineer
국가: United States
필수 기술: React, TypeScript, GraphQL
우대 기술: Testing, React Native
최소 경력: 3년
언어: English Business
포트폴리오: 필요
```

직원 표본:

```txt
직원 A: React, TypeScript, GraphQL, 4년 경력, CS 학사
직원 B: React Native, JavaScript, Mobile UI, 5년 경력
직원 C: Frontend Architecture, Testing, GraphQL, 6년 경력
```

가능한 PatternProfile:

```txt
PAT-US-FE-001-A
패턴명: React 웹 프론트엔드형
핵심 기술: React, TypeScript, GraphQL
우대 기술: Testing, Design System
기준 경력: 3년
언어 기준: BUSINESS
학력 기준: CS 또는 관련 전공
GitHub 기대: true
Portfolio 기대: true
근거 요약: 공고 필수 기술과 직원 표본에서 React/TypeScript/GraphQL이 반복적으로 등장함
```

```txt
PAT-US-FE-001-B
패턴명: 모바일 UI 확장형
핵심 기술: React Native, JavaScript, Mobile UI
우대 기술: iOS, Android, UX Collaboration
기준 경력: 4년
언어 기준: BUSINESS
학력 기준: CS 또는 관련 전공
GitHub 기대: true
Portfolio 기대: true
근거 요약: 직원 표본에서 모바일 UI와 React Native 경험이 확인됨
```

## 4. 추천 계산에서 하는 일

추천 진단은 아래 순서로 동작합니다.

```txt
1. 사용자 프로필 로드
2. 희망 국가와 직무군으로 JobPosting 1차 필터링
3. 언어 수준과 최소 경력으로 하드 필터링
4. 남은 공고마다 연결된 PatternProfile 조회
5. 사용자와 각 PatternProfile 비교
6. 가장 높은 점수의 PatternProfile 선택
7. 그 패턴 기준으로 종합 점수와 부족 요소 생성
```

현재 점수 비중:

```txt
기술스택 적합도       35%
경력 적합도          20%
언어 적합도          15%
학력/자격 적합도     15%
포트폴리오 적합도    15%
```

## 5. PatternProfile 작성 규칙

좋은 PatternProfile은 아래 조건을 만족해야 합니다.

```txt
공고 요구사항과 연결되어야 함
직원 표본에서 반복적으로 등장하는 특성을 반영해야 함
가상 합격자 데이터에서 공통적으로 나타난 특성을 요약해야 함
핵심 기술과 우대 기술을 분리해야 함
너무 많은 기술을 넣지 않아야 함
근거 요약이 있어야 함
사람 검수 상태가 명확해야 함
```

나쁜 PatternProfile 예:

```txt
공고에 없는 기술을 과하게 추가
직원 표본 1명에게만 보이는 특성을 전체 패턴처럼 작성
핵심 기술이 15개 이상으로 너무 많음
근거 요약 없이 AI가 만든 결과를 그대로 저장
```

## 6. 발표용 설명

```txt
PatternProfile은 공고별 대표 합격자 유형입니다.
CareerLens는 공고와 사용자를 단순 비교하지 않고,
공고와 직원 표본, 가상 합격자 데이터를 통해 만든 PatternProfile과 사용자를 비교합니다.
그래서 추천 결과에서 “이 공고가 왜 추천됐는지”와 “어떤 부분이 부족한지”를 설명할 수 있습니다.
```

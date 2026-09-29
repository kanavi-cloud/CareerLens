# PatternProfile 추천 점수 반영 가이드

이 문서는 `PatternProfile`이 맞춤채용정보 추천 점수에 어떻게 반영되는지 설명합니다.

## 1. 비교 구조

추천 진단은 다음 순서로 동작합니다.

```txt
1. 사용자 프로필 DB 조회
2. 희망 국가와 직무군 기준으로 공고 1차 필터링
3. 공고별 PatternProfile 조회
4. 사용자 프로필과 PatternProfile 비교
5. 가장 높은 PatternProfile 점수를 해당 공고의 추천 점수로 사용
6. DiagnosisResult 저장
```

## 2. 점수 항목

총점은 100점 기준입니다.

```txt
기술 적합도: 35점
경력 적합도: 20점
언어 적합도: 15점
학력/자격 적합도: 15점
포트폴리오/프로젝트 적합도: 15점
```

## 3. 항목별 기준

### 기술 적합도

사용자 기술스택과 `PatternProfile.core_skills`, `PatternProfile.preferred_skills`를 비교합니다.

```txt
core_skills: 핵심 기술
preferred_skills: 있으면 유리한 기술
```

### 경력 적합도

사용자의 직무 관련 경력과 `target_experience_years`를 비교합니다.

관련 경력이 부족하면 부족 요소에 다음과 같이 표시합니다.

```txt
경력/프로젝트 밀도 1년 수준 보완
```

### 언어 적합도

사용자의 언어 수준과 `language_benchmark`를 비교합니다.

사용 가능한 단계:

```txt
BASIC
CONVERSATIONAL
BUSINESS
FLUENT
NATIVE
```

### 학력/자격 적합도

사용자의 학력, 전공, 자격증과 `education_benchmark`, `certifications`를 비교합니다.

### 포트폴리오/프로젝트 적합도

`github_expected`, `portfolio_expected`, `project_experience_benchmark`를 기준으로 GitHub, 포트폴리오, 대표 프로젝트 경험을 확인합니다.

## 4. 준비도 판단

```txt
80점 이상: 즉시 지원 가능
60점 이상 80점 미만: 준비 후 지원 가능
60점 미만: 장기 준비 필요
```

## 5. 화면 표시 기준

추천 결과 카드에는 다음 정보를 보여줍니다.

```txt
회사명
국가
직무명
추천 등급
종합 적합도
추천 이유
부족 요소
기준 PatternProfile
PatternProfile 근거 요약
```

상세 비교 패널에는 다음 정보를 보여줍니다.

```txt
기술 적합도
경력 적합도
언어 적합도
학력/자격 적합도
포트폴리오 적합도
비교 기준 PatternProfile
다음 액션
```

## 6. 발표용 한 문장

```txt
CareerLens는 공고 조건과 익명화 직원 표본에서 도출한 PatternProfile을 기준으로 사용자의 해외취업 준비도를 점수화하고, 부족 요소를 플래너로 연결합니다.
```

# CareerLens 데이터 모델링 가이드

## 1. 왜 정해진 양식이 필요한가

CareerLens의 추천 결과는 구조화된 비교에 의존합니다.

조원마다 공고와 직원 정보를 다른 형태로 기록하면 백엔드가 안정적으로 비교할 수 없습니다.

비교 대상:

- 사용자 프로필
- 공고
- 직원 표본
- 가상 합격자 모델
- 최종 직무 패턴

그래서 데이터는 두 단계로 관리합니다.

```txt
원본 조사 시트
-> 정규화 CSV
-> seed 데이터 / DB
-> 추천 진단
```

원본 조사는 자유롭게 해도 되지만, 백엔드에 넣는 정규화 CSV는 템플릿을 따라야 합니다.

## 2. 데이터 계층

### A. JobPosting

수동 조사한 공고를 의미합니다.

예:

```txt
팀원이 LinkedIn 등에서 직접 확인한 공고
```

사용 목적:

- 국가/직무군 1차 필터링
- 필수 기술 비교
- 언어/경력 조건 비교
- 추천 공고 카드 표시

템플릿:

```txt
seed-data/templates/job-postings-template.csv
```

### B. EmployeeProfileSample

회사/직무군과 관련된 실제 직원 프로필을 익명화한 표본입니다.

사용 목적:

- 해당 회사/직무군 근처의 직원 배경 파악
- 패턴 모델링 근거 제공
- 공개 데모에서 실제 인물로 노출하지 않음

템플릿:

```txt
seed-data/templates/employee-samples-template.csv
```

주의:

- 실제 이름을 공개 GitHub에 올리지 않습니다.
- 개인 LinkedIn URL을 공개 GitHub에 올리지 않습니다.
- `EMP-US-MS-001` 같은 익명 ID를 사용합니다.

### C. AcceptedCandidatePattern

공고와 직원 표본을 바탕으로 만든 가상 합격자 더미 모델입니다.

실제 합격자가 아니며, AI가 실제 합격자를 알아낸 것도 아닙니다.

만드는 기준:

```txt
공고 요구사항
+ 익명화된 직원 표본 신호
+ 팀의 수동 해석
```

사용 목적:

- 원본 직원 표본과 최종 점수 패턴 사이의 근거를 보존
- 발표에서 추천 구조를 설명하기 쉽게 만들기
- 최종 `PatternProfile`의 근거 제공

템플릿:

```txt
seed-data/templates/accepted-candidate-patterns-template.csv
```

현재는 DB 핵심 엔티티로 저장하기보다 seed-data 중간 산출물로 관리합니다.
AI가 초안을 만들 수 있지만, 팀 검토 후 최종 `PatternProfile`로 요약해야 합니다.

### D. PatternProfile

백엔드 추천 점수 계산에 실제로 사용되는 최종 패턴입니다.

현재 추천 서비스는 사용자 프로필을 `PatternProfile`과 비교합니다.

점수에 사용되는 필드:

- `core_skills`
- `preferred_skills`
- `target_experience_years`
- `language_benchmark`
- `education_benchmark`
- `certifications`
- `github_expected`
- `portfolio_expected`
- `project_experience_benchmark`
- `evidence_summary`

템플릿:

```txt
seed-data/templates/pattern-profiles-template.csv
```

추천 결과 화면에는 어떤 `PatternProfile`로 점수가 계산됐는지와 `evidence_summary`를 함께 표시합니다.

## 3. 가상 합격자 더미 데이터가 도움이 되는 이유

도움이 됩니다. 다만 표현을 정확히 해야 합니다.

공고와 직원 프로필은 서로 다른 종류의 데이터입니다.

공고는:

```txt
회사가 요구하는 조건
```

직원 프로필은:

```txt
비슷한 회사/직무군에 실제로 존재하는 사람들의 배경 신호
```

입니다.

가상 합격자 더미 모델은 이 둘을 연결해 설명 가능한 기준을 만듭니다.

발표에서 말하기 좋은 구조:

```txt
CareerLens는 사용자를 공고와만 직접 비교하지 않습니다.
수동 조사한 공고 요구사항과 익명화한 직원 표본을 바탕으로
직무 패턴을 만들고, 사용자를 이 패턴과 비교합니다.
```

과대 표현은 피해야 합니다.

피해야 할 표현:

```txt
실제 채용 합격을 예측한다.
통계적으로 검증된 합격 확률이다.
실제 합격자 데이터를 사용했다.
```

권장 표현:

```txt
캡스톤 프로토타입을 위한 수동 모델링 기반 가상 합격자 패턴입니다.
이 패턴은 수동 조사한 공고와 익명화한 직원 표본에서 도출한 진단 기준입니다.
```

## 4. 팀 작업 흐름

1. 팀원이 공고를 조사합니다.
2. 원본 조사 시트에 상세 내용을 기록합니다.
3. 해당 내용을 `job-postings.csv` 형태로 정규화합니다.
4. 관련 회사/직무군 직원 프로필을 조사합니다.
5. 공개 가능한 정보만 `employee-samples.csv`로 정규화합니다.
6. 공고와 직원 표본을 회사/직무군 기준으로 매칭합니다.
7. `accepted-candidate-patterns.csv`에 가상 합격자 모델을 작성합니다.
8. 최종 점수 계산용 `pattern-profiles.csv`로 정리합니다.
9. 백엔드가 정규화 CSV를 DB에 등록합니다.
10. 추천 진단이 사용자 프로필과 최종 패턴을 비교합니다.

## 5. 정규화 규칙

### 국가

사용:

```txt
United States
Japan
```

섞어 쓰지 말 것:

```txt
USA
US
미국
일본
JP
```

### 직무군

초기에는 아래 두 개부터 사용합니다.

```txt
Backend
Frontend
```

나중에 필요하면 추가합니다.

```txt
AI/ML
Cloud/Infra
PM
Security
Data
```

### 언어 수준

사용:

```txt
BASIC
CONVERSATIONAL
BUSINESS
FLUENT
NATIVE
```

공고 언어 조건 예:

```txt
English:BUSINESS
Japanese:CONVERSATIONAL
```

### 리스트 값

CSV 셀 안에서 여러 값을 넣을 때는 `|`를 사용합니다.

예:

```txt
Java|Spring Boot|MySQL|AWS
```

### 미기재 값

가능하면 아래처럼 적습니다.

```txt
Not specified
```

정말 값이 없을 때만 빈칸으로 둡니다.

## 6. 공개 저장소 주의사항

권장 구조:

```txt
seed-data/raw/         원본 파일, gitignore
seed-data/processed/   익명화/정규화 CSV
seed-data/templates/   팀 입력 템플릿
```

올리면 안 되는 것:

- 실제 직원 이름
- LinkedIn 개인 프로필 URL
- 불필요한 개인정보
- 비공개 팀 메모

올려도 되는 것:

- 익명화한 직원 표본 ID
- 공개 공고 기반 회사명
- 정규화한 공고 요구사항
- 수동 모델링한 패턴 데이터

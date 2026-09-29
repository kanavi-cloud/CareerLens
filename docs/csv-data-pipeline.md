# CareerLens CSV 데이터 파이프라인

## 현재 원본 데이터

팀은 현재 두 종류의 수동 조사 CSV를 가지고 있습니다.

- 공고 CSV: LinkedIn 등 공개 공고를 수동 조사해 공통 양식으로 정리한 데이터
- 직원 프로필 CSV: 실제 직원 프로필을 수동 조사해 공통 양식으로 정리한 데이터

이 데이터는 외부 API, scraping, ATS sync, Greenhouse 연동으로 수집한 것이 아닙니다. 모두 팀이 수동 조사한 자료입니다.

## 저장소 관리 원칙

- 원본 CSV는 공개 GitHub에 올리지 않습니다.
- 원본 파일은 `seed-data/raw/`에 둡니다.
- `seed-data/raw/`는 gitignore 처리되어 있습니다.
- GitHub에는 익명화/정규화된 `seed-data/processed/` 파일만 올립니다.
- 실제 직원 이름, 개인 LinkedIn URL, 불필요한 개인정보는 올리지 않습니다.

## 전체 흐름

```txt
수동 조사한 공고 CSV
-> 정규화된 job-postings.csv
-> 수동 조사한 직원 프로필 CSV
-> 회사/직무군 기준 매칭
-> 가상 합격자 패턴
-> PatternProfile seed 데이터
-> 추천 점수 계산
```

## 현재 점수 반영 상태

`PatternProfile`은 이미 추천 점수에 사용됩니다.

- `coreSkills`, `preferredSkills` -> 기술 점수
- `targetExperienceYears` -> 경력 점수
- `languageBenchmark` -> 언어 점수
- `educationBenchmark`, `certifications` -> 학력/자격 점수
- `githubExpected`, `portfolioExpected` -> 포트폴리오 점수

## CSV 자동 등록 방식

현재 백엔드는 `seed-data/processed/`를 먼저 확인합니다.

필수 파일:

```txt
seed-data/processed/job-postings.csv
seed-data/processed/employee-samples.csv
```

그리고 아래 둘 중 하나가 필요합니다.

```txt
seed-data/processed/pattern-profiles.csv
seed-data/processed/accepted-candidate-patterns.csv
```

`pattern-profiles.csv`가 있으면 최종 패턴을 그대로 등록합니다.

`pattern-profiles.csv`가 없고 `accepted-candidate-patterns.csv`만 있으면, 백엔드가 가상 합격자 패턴을 최종 `PatternProfile`로 변환해 등록합니다.

processed CSV가 없으면 기존 JSON seed를 사용합니다.

```txt
seed-data/recommendation-seed.json
```

## CSV 파싱 주의사항

원본 공고 CSV는 UTF-8 BOM 형식입니다.

원본 직원 프로필 CSV는 CP949/Windows Korean 계열로 보입니다. 또한 셀 안에 줄바꿈이 들어간 행이 있어서 단순히 줄 단위로 읽으면 데이터가 깨질 수 있습니다.

따라서 백엔드 자동 등록에는 원본 CSV를 바로 넣지 말고, 반드시 템플릿 기준으로 UTF-8 processed CSV를 만들어야 합니다.

## processed CSV 파일

```txt
seed-data/processed/job-postings.csv
seed-data/processed/employee-samples.csv
seed-data/processed/accepted-candidate-patterns.csv
seed-data/processed/pattern-profiles.csv
```

## job-postings.csv

공고 정규화 파일입니다.

템플릿:

```txt
seed-data/templates/job-postings-template.csv
```

## employee-samples.csv

직원 표본 정규화 파일입니다.

실제 직원 이름을 넣지 말고 익명 ID를 사용합니다.

예:

```txt
EMP-US-MS-001
```

템플릿:

```txt
seed-data/templates/employee-samples-template.csv
```

## accepted-candidate-patterns.csv

공고와 직원 표본을 조합해 만든 가상 합격자 더미 패턴입니다.

템플릿:

```txt
seed-data/templates/accepted-candidate-patterns-template.csv
```

## pattern-profiles.csv

추천 점수 계산에 직접 사용되는 최종 패턴입니다.

템플릿:

```txt
seed-data/templates/pattern-profiles-template.csv
```

중요 컬럼:

```txt
pattern_ref
job_external_ref
employee_sample_ref
pattern_title
core_skills
preferred_skills
target_experience_years
language_benchmark
github_expected
portfolio_expected
project_experience_benchmark
evidence_summary
```

`evidence_summary`는 추천 화면에 표시되는 패턴 근거입니다. 공고 요구사항과 익명화 직원 표본 중 어떤 신호를 보고 이 패턴을 만들었는지 적습니다.

## 리스트 값 작성 규칙

CSV 안에서 한 셀에 여러 값을 넣을 때는 `|`를 사용합니다.

예:

```txt
Java|Spring Boot|MySQL|AWS
```

자세한 데이터 모델링 설명은 아래 문서를 참고하세요.

```txt
docs/data-modeling-guide.md
```

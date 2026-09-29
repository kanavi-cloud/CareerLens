# CareerLens Seed Data 템플릿 안내

이 폴더는 조원들이 수동 조사한 공고, 직원 표본, 가상 합격자, 최종 패턴 데이터를 백엔드가 읽을 수 있는 형태로 정리하기 위한 템플릿 모음입니다.

## 파일 설명

- `job-postings-template.csv`: 수동 조사 채용공고 정규화 양식
- `employee-samples-template.csv`: 실제 직원 표본을 익명화해 정리하는 양식
- `accepted-candidate-patterns-template.csv`: 공고와 직원 표본을 바탕으로 만든 가상 합격자 데이터 양식
- `pattern-profiles-template.csv`: 추천 점수 계산에 직접 사용하는 최종 직무 패턴 양식

## 작성 규칙

- CSV 컬럼 구분자는 쉼표 `,`를 사용합니다.
- 한 칸에 여러 값을 넣을 때는 파이프 `|`를 사용합니다.
- boolean 값은 `true` / `false`로 작성합니다.
- processed CSV는 UTF-8로 저장합니다.
- 실제 직원 이름, 개인 LinkedIn URL, 얼굴 사진, 개인 연락처는 저장하지 않습니다.
- 원본 조사 파일은 `seed-data/raw/`에 보관하고 GitHub에는 올리지 않습니다.

## 추천 데이터 관계

```txt
공고 1개
-> 익명화 직원 표본 3~5명
-> 가상 합격자 데이터 10~30개
-> 최종 PatternProfile 2~4개
-> 사용자 프로필과 비교
```

`accepted-candidate-patterns.csv`는 중간 산출물입니다. 추천 점수 계산에 직접 들어가는 최종 기준은 `pattern-profiles.csv`의 `PatternProfile`입니다.

## 공고별 평가기준 컬럼

`job-postings-template.csv`에는 공고별로 다른 추천 기준을 두기 위해 아래 컬럼이 추가되어 있습니다.

```txt
salary_score
work_life_balance_score
company_value_score
probability_weight
salary_weight
work_life_balance_weight
company_value_weight
job_fit_weight
evaluation_rationale
```

작성 기준:

- `*_score`: 해당 공고가 그 카테고리에서 얼마나 좋은지 0~100으로 입력합니다.
- `*_weight`: 해당 공고에서 어떤 요소를 더 중요하게 볼지 입력합니다. 합계는 100을 권장합니다.
- `evaluation_rationale`: 왜 이런 가중치를 줬는지 발표에서 설명 가능한 한 문장으로 작성합니다.

예:

```txt
Amazon Ads SDE는 분산 시스템/API 실무역량이 중요하므로 job_fit_weight와 probability_weight를 높게 둔다.
Nintendo Manager는 경력 장벽이 높고 연봉 범위가 크므로 job_fit_weight와 salary_weight를 높게 둔다.
```

## AI 사용 위치

ChatGPT 또는 Gemini는 아래 작업의 초안 작성에만 사용합니다.

- 수동 조사 공고를 읽고 평가기준 초안 생성
- 직원 표본을 익명화한 뒤 가상 합격자 데이터 초안 생성
- 가상 합격자 데이터를 묶어 PatternProfile 초안 생성

중요:

- AI가 만든 결과는 팀원이 검수한 뒤 CSV에 입력합니다.
- 실행 중 추천 API가 외부 공고를 검색하거나 LinkedIn을 자동 수집하지 않습니다.
- 추천 실행은 저장된 CSV/DB 데이터만 사용합니다.

## 권장 작업 흐름

```txt
1. 링크드인 등에서 공고를 수동 조사
2. job-postings.csv 양식에 정규화
3. 같은 회사/유사 직무 직원 표본을 익명화해 employee-samples.csv 작성
4. AI 보조로 accepted-candidate-patterns.csv 초안 작성
5. AI 보조로 pattern-profiles.csv 초안 작성
6. 팀원이 검수 후 seed-data/processed/에 반영
7. 백엔드 재실행 후 추천 진단 검증
```

## 발표 표현 주의

권장 표현:

```txt
수동 조사 공고와 익명화 직원 표본을 기반으로 만든 캡스톤 프로토타입용 가상 합격자 패턴입니다.
```

피해야 할 표현:

```txt
실제 합격 데이터
실제 채용 합격 예측
통계적으로 검증된 합격 확률
```

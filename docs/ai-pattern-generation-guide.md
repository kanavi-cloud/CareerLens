# AI 기반 가상 합격자/PatternProfile 생성 가이드

이 문서는 조원이 수동 조사한 공고와 직원 표본을 바탕으로 AI를 활용해 가상 합격자 데이터와 PatternProfile 초안을 만드는 방법을 정리합니다.

중요 원칙:

```txt
AI가 외부 웹에서 공고나 직원을 자동으로 찾아오면 안 됩니다.
AI는 팀이 직접 정리한 데이터만 입력받아 구조화와 요약을 돕습니다.
최종 DB 저장 전에는 반드시 사람이 검수합니다.
```

## 1. 권장 운영 방식

중간발표 프로토타입 단계에서는 웹사이트 내부에서 AI API를 바로 호출하지 않습니다.

권장 흐름:

```txt
1. 조원이 공고를 수동 조사해 CSV 템플릿에 입력
2. 조원이 직원 표본을 익명화해 CSV 템플릿에 입력
3. ChatGPT/Gemini에 아래 프롬프트를 수동 입력
4. AI가 가상 합격자 후보와 PatternProfile 후보를 JSON/CSV 형태로 출력
5. 사람이 과장/오류/개인정보를 검수
6. 승인된 결과만 seed-data/processed CSV에 반영
7. 백엔드 실행 시 MySQL에 seed 등록
```

추후 고도화 단계에서는 관리자 페이지에서 아래 기능을 만들 수 있습니다.

```txt
관리자 로그인
-> 공고 등록
-> 직원 표본 등록
-> AI 생성 요청
-> 가상 합격자 후보 확인
-> PatternProfile 후보 확인
-> 관리자 승인
-> DB 저장
```

## 2. AI 입력 데이터

AI에게 전달하는 데이터는 팀이 수동으로 정리한 내용만 사용합니다.

입력 예:

```txt
[공고]
job_external_ref: JOB-US-META-FE-001
company_name: Meta
country: United States
job_title: Frontend Engineer
job_family: Frontend
required_skills: React|TypeScript|GraphQL
preferred_skills: Testing|React Native|Design System
required_languages: English BUSINESS
min_experience_years: 3
degree_requirement: Bachelor preferred
portfolio_required: true
visa_requirement: Not specified
salary_range: USD 140k-190k
work_type: Hybrid

[직원 표본]
sample_ref: EMP-US-META-001
current_job_title: Staff Frontend Engineer
matched_job_family: Frontend
education: Bachelor in Computer Science
experience_years: 6
tech_stack: React|TypeScript|GraphQL|Testing
languages: English FLUENT
github_present: false
portfolio_present: true
project_experience_notes: Frontend architecture, design system, performance improvement
```

## 3. 가상 합격자 생성 프롬프트

아래 프롬프트를 그대로 복사해 사용할 수 있습니다.

```txt
너는 CareerLens 캡스톤 프로젝트의 데이터 분석 보조자다.

목표:
수동 조사한 채용공고와 익명화한 직원 표본을 바탕으로,
해당 공고에 지원 가능성이 있는 가상 합격자 후보 데이터를 생성한다.

제약:
- 외부 웹 검색, LinkedIn 검색, 자동 수집을 절대 하지 않는다.
- 입력으로 제공된 공고/직원 표본 정보만 사용한다.
- 실제 사람처럼 보이는 이름, 실명, URL, 연락처를 만들지 않는다.
- 과장된 합격 보장 표현을 쓰지 않는다.
- 결과는 사람이 검수할 초안이다.

입력:
[여기에 공고 데이터 1개]
[여기에 직원 표본 3~5개]

출력 형식:
CSV로 출력한다.
컬럼은 반드시 아래 순서를 지킨다.

accepted_pattern_ref,
job_external_ref,
employee_sample_refs,
pattern_title,
modeled_experience_years,
modeled_languages,
modeled_core_skills,
modeled_preferred_skills,
modeled_portfolio_assets,
modeled_project_keywords,
derivation_reason,
source_confidence,
review_status

생성 규칙:
- 가상 합격자 후보 10~30개를 만든다.
- employee_sample_refs에는 근거가 된 직원 표본 ref를 |로 연결한다.
- modeled_core_skills는 공고 필수 기술과 직원 표본의 반복 기술을 중심으로 작성한다.
- modeled_preferred_skills는 우대 기술과 프로젝트 경험에서 파생한다.
- derivation_reason에는 왜 이 후보가 나왔는지 짧게 쓴다.
- source_confidence는 HIGH, MEDIUM, LOW 중 하나로 작성한다.
- review_status는 모두 NEEDS_REVIEW로 작성한다.
```

## 4. PatternProfile 추출 프롬프트

가상 합격자 후보를 만든 뒤, 아래 프롬프트로 최종 PatternProfile 후보를 추출합니다.

```txt
너는 CareerLens 캡스톤 프로젝트의 추천 패턴 설계자다.

목표:
채용공고 1개, 익명화 직원 표본, 가상 합격자 후보 데이터를 바탕으로
추천 점수 계산에 사용할 PatternProfile 후보를 추출한다.

제약:
- 외부 웹 검색을 하지 않는다.
- 입력 데이터에 없는 요구사항을 임의로 추가하지 않는다.
- 공고 1개당 PatternProfile은 1~4개만 만든다.
- 각 PatternProfile은 서로 구분되는 합격자 유형이어야 한다.
- 결과는 사람이 검수할 초안이다.

입력:
[공고 데이터 1개]
[직원 표본 3~5개]
[가상 합격자 후보 10~30개]

출력 형식:
CSV로 출력한다.
컬럼은 반드시 아래 순서를 지킨다.

pattern_ref,
job_external_ref,
employee_sample_ref,
pattern_title,
job_family,
core_skills,
preferred_skills,
target_experience_years,
language_benchmark,
education_benchmark,
certifications,
github_expected,
portfolio_expected,
project_experience_benchmark,
evidence_summary

작성 규칙:
- pattern_ref는 PAT-{국가}-{직무군}-{공고번호}-{A/B/C} 형태로 작성한다.
- core_skills는 3~6개를 권장한다.
- preferred_skills는 2~6개를 권장한다.
- target_experience_years는 공고 최소 경력과 직원 표본 경력을 함께 고려한다.
- language_benchmark는 BASIC, CONVERSATIONAL, BUSINESS, FLUENT, NATIVE 중 하나로 작성한다.
- github_expected와 portfolio_expected는 true/false로 작성한다.
- evidence_summary에는 공고, 직원 표본, 가상 합격자에서 어떤 근거가 반복됐는지 설명한다.
```

## 5. 검수 체크리스트

AI 결과를 DB에 넣기 전에 아래 항목을 확인합니다.

```txt
공고에 없는 요구사항을 과하게 추가하지 않았는가?
직원 표본 1명만의 특성을 전체 패턴처럼 일반화하지 않았는가?
개인정보, 실명, URL이 포함되지 않았는가?
core_skills가 너무 많지 않은가?
패턴끼리 충분히 구분되는가?
evidence_summary가 설명 가능한가?
review_status가 승인 전 NEEDS_REVIEW 상태인가?
```

승인된 데이터만 `seed-data/processed/`에 넣습니다.

## 6. 비용과 API 키 판단

현재 단계에서는 웹사이트 안에서 AI API를 호출하지 않는 것을 권장합니다.

이유:

```txt
API 키 관리가 필요함
호출량에 따라 비용이 발생함
시연 중 결과가 매번 달라질 수 있음
AI 결과 검수 화면과 실패 처리가 추가로 필요함
```

중간발표 전까지는 수동 프롬프트 방식으로 충분합니다. 관리자 AI 생성 기능은 최종 발표 전 고도화 항목으로 잡는 것이 현실적입니다.

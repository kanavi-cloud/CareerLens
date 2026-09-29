# CareerLens 맞춤채용정보 추천 데이터 계약

이 문서는 1번 서비스인 `맞춤채용정보 추천 진단`에서 어떤 데이터가 어떤 역할을 하는지 정리한 기준 문서입니다.

## 1. 추천 구조

CareerLens는 사용자를 공고와 단순 키워드로만 비교하지 않습니다.

```txt
수동 조사 공고
-> 익명화 직원 표본 매칭
-> 공고 + 직원 표본 기반 가상 합격자 데이터 작성
-> 검수된 PatternProfile 저장
-> 사용자 프로필 입력
-> 공고 1차 필터링
-> 공고별 PatternProfile 비교
-> 공고별 평가 가중치 + 사용자 우선순위 반영
-> 상위 5개 추천 결과 저장/조회
-> 커리어 개발 플래너로 연결
```

현재 실행 시점에는 AI가 데이터를 새로 생성하지 않습니다. AI나 ChatGPT/Gemini는 오프라인 보조 도구로만 사용하고, 최종 검수된 CSV/DB 데이터만 추천 계산에 사용합니다.

## 2. 핵심 데이터

### JobPosting

수동 조사한 채용공고를 정규화한 데이터입니다.

추천에서 하는 일:

- 국가, 직무군, 언어, 최소 경력 기준의 1차 필터링
- 추천 카드에 표시할 회사/직무/연봉/근무형태 정보 제공
- 공고별 평가 가중치 제공

중요 컬럼:

```txt
company_name
country
job_title
job_family
required_skills
preferred_skills
required_languages
min_experience_years
degree_requirement
portfolio_required
visa_requirement
salary_range
work_type
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

`probability_weight`, `salary_weight`, `work_life_balance_weight`, `company_value_weight`, `job_fit_weight`는 공고별 기본 평가기준입니다. 예를 들어 경력 장벽이 높은 매니저 공고는 `job_fit_weight`를 높이고, 연봉이 명확히 강한 공고는 `salary_weight`를 높게 둘 수 있습니다.

### EmployeeProfileSample

공고 회사 또는 유사 직무의 실제 직원 프로필을 익명화해 정리한 데이터입니다.

추천 실행 때 직접 점수화하지 않고, 가상 합격자 및 PatternProfile을 만들기 위한 근거 데이터로 사용합니다.

주의:

- 실명, LinkedIn URL, 얼굴 사진, 개인 연락처를 저장하지 않습니다.
- `sample_ref` 같은 익명 ID로 관리합니다.

### AcceptedCandidatePattern

공고와 직원 표본을 바탕으로 만든 가상 합격자 데이터입니다.

역할:

- “이 공고에 합격할 만한 사람은 어떤 역량 조합을 가질까?”를 구조화한 중간 데이터
- 최종 PatternProfile을 추출하기 위한 근거
- 추천 점수 계산에는 직접 사용하지 않고, 검수/설명용 근거로 둡니다.

### PatternProfile

추천 점수 계산에 직접 사용되는 최종 직무 패턴입니다.

쉽게 말하면:

```txt
공고 하나에 대해 합격자에게 반복적으로 나타나는 조건을 요약한 평가 기준
```

주요 비교 항목:

- 핵심 기술
- 선호 기술
- 목표 경력 연차
- 언어 기준
- 학력/자격 기준
- GitHub/포트폴리오 기대 여부
- 근거 요약

## 3. 공고별 평가기준 생성 방식

공고별 가중치는 자동 수집/자동 생성하지 않습니다. 조원이 수동 조사한 공고 내용을 ChatGPT 또는 Gemini에 넣어 초안을 만들고, 사람이 검수한 뒤 CSV에 입력합니다.

권장 프롬프트 예시:

```txt
아래 해외 취업 채용공고를 분석해서 CareerLens 추천 진단용 평가기준을 만들어줘.

출력은 CSV 입력값으로 쓸 수 있게 JSON으로 작성해줘.
카테고리는 합격 가능성, 연봉, 워라밸, 기업 가치, 직무 적합도 5개야.

조건:
- 각 score는 0~100
- 각 weight는 합계 100
- 공고별 특성에 따라 weight를 다르게 둘 것
- 근거는 발표에서 설명할 수 있게 한 문장으로 작성
- 실제로 없는 정보는 추정이라고 표시

공고 원문:
...
```

AI가 만든 값은 그대로 DB에 넣지 않고 팀원이 확인합니다.

## 4. 사용자 우선순위 반영 방식

마이페이지에서 사용자는 다음 항목을 중요도로 선택할 수 있습니다.

- 연봉
- 합격 가능성
- 워라밸
- 기업 가치
- 직무 적합도

추천 엔진은 먼저 공고별 기본 가중치를 가져온 뒤, 사용자가 선택한 항목에 추가 가중치를 부여하고 전체 합계를 다시 100으로 정규화합니다.

예:

```txt
공고 기본 가중치:
합격 가능성 30 / 연봉 15 / 워라밸 15 / 기업 가치 15 / 직무 적합도 25

사용자 선택:
합격 가능성, 직무 적합도

최종 가중치:
합격 가능성과 직무 적합도에 보너스 부여 후 합계 100으로 재계산
```

## 5. 현재 추천 점수 산식

먼저 PatternProfile 비교 점수를 계산합니다.

```txt
기술 점수
경력 점수
언어 점수
학력/자격 점수
포트폴리오 점수
```

그 다음 카테고리 점수를 만듭니다.

```txt
직무 적합도 = 기술 55% + 경력 30% + 포트폴리오 15%
합격 가능성 = 직무 적합도 55% + 언어 20% + 학력/자격 15% + 포트폴리오 10%
연봉 = JobPosting.salary_score
워라밸 = JobPosting.work_life_balance_score
기업 가치 = JobPosting.company_value_score
```

최종 점수:

```txt
합격 가능성 점수 * 최종 합격 가능성 가중치
+ 연봉 점수 * 최종 연봉 가중치
+ 워라밸 점수 * 최종 워라밸 가중치
+ 기업 가치 점수 * 최종 기업 가치 가중치
+ 직무 적합도 점수 * 최종 직무 적합도 가중치
```

결과는 `DiagnosisResult`에 저장되고 추천 화면은 이 저장 결과를 조회합니다.

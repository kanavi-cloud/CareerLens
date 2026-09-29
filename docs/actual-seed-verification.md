# 실제 조사 기반 processed seed 검증 메모

작성일: 2026-05-03

## 1. 목적

기존 JSON 더미 seed만으로는 추천 구조가 실제 조사 데이터에 맞게 동작하는지 확인하기 어렵습니다. 그래서 팀이 제공한 CSV 자료에서 일부 공고와 직원 표본을 정규화해 `seed-data/processed/`에 넣고, 추천 API가 실제 조사 기반 데이터로 동작하는지 검증했습니다.

## 2. 사용한 원본

원본 파일은 GitHub에 올리지 않습니다.

```txt
job_posts_dummydata_30_UTF8_BOM.csv
미국 취업자 프로필 정리본 - 프로필_요약.csv
```

processed CSV에는 실명과 개인 URL을 넣지 않고, 직원 표본을 `EMP-*` 형식의 익명 ID로 정리했습니다.

## 3. 생성한 processed CSV

```txt
seed-data/processed/job-postings.csv
seed-data/processed/employee-samples.csv
seed-data/processed/accepted-candidate-patterns.csv
seed-data/processed/pattern-profiles.csv
```

현재 포함된 공고:

```txt
JOB-US-MS-SEC-BE-001          Microsoft Software Engineer II
JOB-US-AMZ-ADS-BE-001         Amazon Ads Software Development Engineer
JOB-US-NOA-BE-MGR-001         Nintendo of America Software Engineering Manager
JOB-JP-RAKUTEN-SEARCH-BE-001  Rakuten Search Service Engineer
```

현재 포함된 PatternProfile:

```txt
PAT-US-MS-SEC-BE-CORE
PAT-US-MS-SEC-BE-SRE
PAT-US-AMZ-ADS-BE-DIST
PAT-US-AMZ-ADS-BE-ARCH
PAT-US-NOA-BE-MGR
PAT-JP-RAKUTEN-SEARCH-BE
```

## 4. SeedDataLoader 변경 사항

`seed-data/processed/`에 CSV가 있으면 백엔드는 JSON 더미 seed 대신 processed CSV를 사용합니다.

기존 DB에 JSON 더미 공고가 남아 있으면 추천 결과가 섞일 수 있으므로, processed CSV를 사용할 때는 아래 데이터를 초기화한 뒤 다시 적재합니다.

```txt
DiagnosisResult
PatternProfile
EmployeeProfileSample
JobPosting
```

사용자 계정과 사용자 프로필은 삭제하지 않습니다.

## 5. 검증 결과

미국 Backend 테스트 프로필:

```txt
target_country: United States
target_job_family: Backend
experience_years: 4
tech_stack: Java, Python, AWS, Distributed Systems, API, Kubernetes, CI/CD
```

결과:

```txt
candidate_count: 3
returned_recommendation_count: 3
반환 공고: Microsoft, Amazon Ads, Nintendo of America
```

일본 Backend 테스트 프로필:

```txt
target_country: Japan
target_job_family: Backend
experience_years: 5
tech_stack: Java, Python, MySQL, OpenSearch, Schema Design, Distributed Systems
```

결과:

```txt
candidate_count: 1
returned_recommendation_count: 1
반환 공고: Rakuten
```

## 6. 남은 확인

```txt
1. 마이페이지에서 실제 사용자 프로필을 저장한 뒤 추천 진단 화면에서 같은 결과가 나오는지 확인
2. 기술명 표준화 규칙 추가
3. 프로젝트/도메인 태그를 PatternProfile 점수에 반영
4. 실제 공고를 4~6개 이상으로 늘리고 프론트 카드 개수 안정화
5. 부족요소 문구가 발표 화면에서 자연스럽게 보이는지 점검
```

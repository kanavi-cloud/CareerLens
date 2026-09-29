# 마이페이지/추천진단 직무군 확장

## 목적

Greenhouse 외부 공고 API 연동으로 `JobPosting.jobFamily`가 기존 `Backend`, `Frontend` 외에 `AI/ML`, `Data`까지 들어올 수 있게 되었다. 이에 맞춰 사용자 프로필 입력과 추천 진단 화면에서도 동일한 직무군을 선택할 수 있게 확장한다.

## 반영 범위

- 마이페이지/온보딩 프로필 입력의 희망 직무군 옵션 확장
- 추천 진단 빠른 조건의 희망 직무군 옵션 확장
- 직무군별 추천 기술스택/프로젝트/도메인 태그 제공
- Greenhouse import 화면의 기본 직무군 옵션을 공통 목록으로 통일
- AI/ML, Data 진단 시 설명 문구에 외부 API 기본 패턴의 한계를 명시

## 직무군 목록

```text
Backend
Frontend
AI/ML
Data
```

## 추천 진단 로직 영향

추천 점수 산식 자체는 변경하지 않는다.

기존 구조:

```text
UserProfile.targetJobFamily
  -> JobPosting.country + jobFamily 1차 필터
  -> PatternProfile 조회
  -> 사용자 기술/경력/언어/학력/포트폴리오 비교
```

확장 후에도 동일하다. 단, AI/ML 또는 Data 추천 결과가 나오려면 해당 직무군의 `JobPosting`과 `PatternProfile`이 DB에 있어야 한다.

## 주의점

- Greenhouse import 공고는 공개 공고 본문 기반 기본 PatternProfile을 사용한다.
- 수동 seed-data처럼 직원 표본/가상 합격자 패턴까지 검수된 데이터는 아니다.
- 따라서 AI/ML, Data는 “외부 API 기반 확장 가능성” 시연에는 적합하지만, 최종 추천 품질을 높이려면 별도 seed-data 또는 관리자 검수 프로세스가 필요하다.

# 1번 맞춤채용정보서비스

이 문서는 CareerLens의 첫 번째 핵심 서비스인 맞춤채용정보 추천 진단 기능을 설명합니다.

## 서비스 흐름

```txt
회원가입
-> 로그인
-> 해외취업 프로필 설정
-> 공고 1차 필터링
-> 공고별 직무 패턴 조회
-> 사용자 프로필과 직무 패턴 비교
-> 추천 결과 및 부족 요소 제공
-> 커리어 개발 플래너 연결
```

사용자 프로필 입력과 수정은 `마이페이지(/mypage)`를 기본 진입점으로 둡니다.

## 핵심 구조

CareerLens는 사용자와 공고를 단순 직접 비교하지 않습니다.

현재 구조:

```txt
수동 조사한 실제 형태의 공고 데이터
+ 익명화한 실제 직원 표본 데이터
-> 가상 합격자 패턴 데이터
-> 최종 PatternProfile
-> 사용자 프로필과 PatternProfile 비교
-> DiagnosisResult 저장
```

## 데이터 정책

- 외부 공고 API를 사용하지 않습니다.
- ATS fetch/sync를 사용하지 않습니다.
- Greenhouse 연동을 사용하지 않습니다.
- LinkedIn scraping을 사용하지 않습니다.
- 실행 시 패턴 데이터를 새로 생성하지 않습니다.
- 모든 공고, 직원 표본, 패턴은 seed-data 또는 수동 입력 기반 데이터만 사용합니다.

## 구현 API

### `POST /api/recommendations/diagnose`

요청에 포함된 사용자 프로필로 추천 진단을 생성합니다.

```json
{
  "user_profile": {
    "display_name": "김시연",
    "email": "demo@careerlens.local",
    "target_country": "United States",
    "target_job_family": "Backend",
    "experience_years": 3,
    "language_level": "BUSINESS",
    "education": "Bachelor in Computer Science",
    "tech_stack": ["Java", "Spring Boot", "MySQL", "REST API", "Docker"],
    "certifications": ["AWS Cloud Practitioner"],
    "github_present": true,
    "portfolio_present": true,
    "preferences": ["Hybrid", "Visa support", "Cloud backend"]
  }
}
```

### `POST /api/recommendations/diagnose/users/{userId}`

DB에 저장된 사용자 프로필을 기준으로 추천 진단을 생성합니다.

회원가입, 로그인, 해외취업 프로필 설정을 거친 사용자는 이 API 흐름을 사용합니다.

### `GET /api/recommendations/{userId}`

저장된 최신 추천 진단 결과를 조회합니다.

## 점수 계산 기준

추천 점수는 `RecommendationServiceV2`에서 rule 기반으로 계산합니다.

- 기술 적합도: 패턴의 핵심 기술과 우대 기술 매칭
- 경력 적합도: 패턴 목표 연차와 사용자의 관련 경력 비교
- 언어 적합도: 패턴 언어 기준과 사용자 언어 수준 비교
- 학력/자격 적합도: 학력 기준과 자격증 보유 여부 비교
- 포트폴리오 적합도: GitHub, 포트폴리오, 프로젝트 경험 충족 여부 비교

현재 가중치:

```txt
기술 적합도 35
경력 적합도 20
언어 적합도 15
학력/자격 적합도 15
포트폴리오/프로젝트 적합도 15
```

추천 결과에는 실제 계산 기준으로 사용된 `PatternProfile`의 이름과 근거 요약을 함께 반환합니다.

## AI 사용 위치

현재 AI는 핵심 점수 계산에 사용하지 않습니다.

AI 역할은 설명 생성 레이어로 제한합니다.

- 왜 이 공고가 추천됐는지 자연어로 설명
- 부족 요소를 사용자가 이해하기 쉽게 요약
- 다음 단계 액션을 문장으로 제안

현재 구현에서는 외부 AI API 호출 없이 `AiExplanationService`가 deterministic 문구를 생성합니다.

## 발표용 설명

권장 설명:

```txt
CareerLens는 공고 조건만 보는 것이 아니라,
수동 조사한 공고와 익명화한 직원 표본을 바탕으로 만든 직무 패턴을 기준으로
사용자의 해외취업 준비도를 진단합니다.
```

주의할 표현:

```txt
실제 합격 여부를 예측한다.
실제 합격자 데이터를 학습했다.
통계적으로 검증된 합격 확률을 제공한다.
```

현재 단계는 상용 예측 서비스가 아니라 설명 가능한 캡스톤 시연용 프로토타입입니다.

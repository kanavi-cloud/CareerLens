# CareerLens Design System

## 1. 제품 정체성

CareerLens는 해외취업 데이터 기반 추천/진단 플랫폼이다.

- 사용자의 해외취업 프로필과 수동 정리된 공고 데이터를 비교한다.
- 공고와 연결된 직원 표본, 가상 합격자 데이터, 최종 PatternProfile을 추천 근거로 사용한다.
- 추천 결과는 단순 공고 목록이 아니라 점수, 근거, 부족 요소, 다음 액션을 포함한 진단 결과다.
- 추천 결과는 커리어 플래너, 지원 관리, 정착 지원으로 이어진다.
- 최종 제품 이미지는 “진단 결과 기반 커리어 실행 플랫폼”이다.

## 2. 시각적 콘셉트

- `modern career intelligence dashboard`
- `editorial data report`
- `calm professional SaaS`
- `document-like but not old-fashioned`
- 핵심 키워드: trust, clarity, evidence, action

CareerLens 화면은 예쁜 장식보다 “근거가 있는 진단서”처럼 보여야 한다. 데이터, 점수, 패턴, 부족 요소, 실행 과제가 명확히 읽혀야 한다.

## 3. Anti-Generic UI 원칙

사용하지 않는다.

- 흔한 보라/파랑 그라데이션 히어로
- 의미 없는 3개 feature card
- stock icon 남발
- glassmorphism 남발
- 둥근 카드만 반복되는 v0 스타일
- “AI가 만든 SaaS 랜딩페이지” 같은 구조
- 과한 그림자와 과한 애니메이션
- 실사용 서비스와 무관한 장식 요소

## 4. CareerLens 디자인 언어

- `Dossier Card`: 사용자, 추천 결과, 공고 분석을 문서처럼 보여주는 카드
- `Evidence Panel`: 추천 근거와 데이터 출처를 정리하는 패널
- `Score Strip`: 합격 가능성, 직무 적합도, 연봉 매력도, 워라밸 등 점수 표시
- `Roadmap Timeline`: 커리어 플래너 주차별 과제 흐름
- `Application Pipeline`: 관심 공고 -> 지원 준비 -> 지원 진행
- `Settlement Checklist`: 국가별 준비 항목 체크리스트
- `Priority Badge`: 사용자가 선택한 우선순위 표시
- `Diagnosis Summary`: 추천 결과 요약과 다음 액션 표시

## 5. 색상 시스템

색상은 의미 기반으로 제한한다.

- `night`: 깊은 네이비. 헤더, 주 CTA, 강조 패널.
- `ink`: 본문 텍스트.
- `paper`: 전체 배경. 너무 새하얗지 않은 문서형 바탕.
- `panel`: 카드 내부 보조 배경.
- `brand`: 주요 브랜드 청록. 활성 메뉴, 핵심 점수, 링크.
- `mint`: 적합, 성공, 완료.
- `amber`: 주의, 보완 필요.
- `coral`: 부족, 리스크.
- `line`: 경계선.

카드와 배경의 대비는 분명해야 한다. 색상은 늘리지 않고 상태와 정보 계층을 표현하는 데만 사용한다.

## 6. 타이포그래피 규칙

- 페이지 제목은 30~40px 수준에서 명확하게 사용한다.
- 섹션 제목은 18~22px, 카드 제목은 16~20px로 제한한다.
- 보조 설명은 14px, 라벨은 12~13px로 사용한다.
- 긴 설명은 `leading-6` 이상으로 읽기 좋게 둔다.
- 숫자 점수는 본문보다 크게 처리하고 주변에 라벨과 근거를 함께 둔다.
- 영어 kicker는 유지하되 짧고 기능적인 문구로만 사용한다.

## 7. 레이아웃 규칙

- 기본 max-width는 `max-w-7xl`을 사용한다.
- 페이지 좌우 여백은 `px-5`, 주요 섹션 간격은 `py-6` 이상으로 통일한다.
- 모바일은 1열, 태블릿은 2열, 데스크탑은 좌우 패널 구조를 사용한다.
- 핵심 CTA는 상단 우측 또는 카드 하단에 명확히 둔다.
- 스크롤이 긴 폼은 좌측 요약 + 우측 섹션형 폼으로 구성한다.

## 8. 컴포넌트 규칙

- `Button`: primary는 night 배경, secondary는 흰 배경+line, subtle은 panel 배경. 높이는 40~44px.
- `Card`: border-line, bg-white, shadow-sm. 과한 radius와 그림자는 쓰지 않는다.
- `Badge`: 작은 상태 정보. 색상은 상태 의미에 맞춰 제한한다.
- `SectionHeader`: kicker, title, description 조합.
- `PageShell`: SiteHeader와 공통 배경/본문 폭 제공.
- `TextField`, `SelectField`: 명확한 label, helper, focus-visible 상태 유지.
- `ScoreBar`: 점수와 가중치를 함께 보여준다.
- `MetricCard`: 한 가지 수치나 상태만 명확히 표시한다.
- `EmptyState`: 빈 화면에서도 다음 행동 CTA를 제공한다.
- `TimelineItem`: 주차별 흐름과 과제 수를 보여준다.
- `ChecklistItem`: 상태와 요구사항을 함께 표시한다.

## 9. 페이지별 방향

### 메인페이지

제품 소개보다 “진단 플랫폼의 구조”를 보여준다. Career Dossier, 데이터 근거, 서비스 흐름을 유지한다.

### 로그인

Account access 화면처럼 정리한다. 로그인 후 이어지는 기능을 체크형 패널로 보여준다.

### 회원가입

Onboarding entry 화면이다. 가입 후 마이페이지 프로필 설정으로 이어지는 흐름이 보여야 한다.

### 프로필 설정

핵심 입력 화면이다. 긴 폼을 단계형 섹션처럼 보이게 하고, 좌측에서 완성도와 우선순위를 요약한다.

### 맞춤채용정보 추천 진단

가장 중요한 화면이다. 추천 결과가 데이터 기반으로 산출됐다는 느낌을 강화한다. 점수, 근거, 부족 요소, 플래너 CTA가 명확해야 한다.

### 커리어 플래너

로드맵 라이브러리와 상세 timeline처럼 보여야 한다. 주차별 과제와 완료율을 읽기 쉽게 구성한다.

### 지원 관리

관심 공고 -> 지원 준비 -> 지원 진행 pipeline으로 보여준다. 실제 저장 기능이 없어도 확장 방향이 시연되어야 한다.

### 정착 지원

국가별 checklist 중심 화면이다. 비자, 출국 전 준비, 초기 정착 흐름이 한눈에 보여야 한다.

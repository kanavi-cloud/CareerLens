# CareerLens 출국로드맵 항공 API 연동 정리

## 1. 목적

출국로드맵은 해외취업 합격 이후 사용자가 입사 예정일에 맞춰 출국 준비를 할 수 있도록 돕는 기능이다.

현재 구현 목표는 다음과 같다.

```txt
입사 예정일 입력
-> 권장 입국일 계산
-> 출국 후보 기간 계산
-> 공식 항공 API 후보 조회
-> 출국 전 준비 마일스톤 생성
-> 행정로드맵/정착지원으로 연결
```

항공편 데이터는 크롤링하지 않는다.
항공사, OTA, 여행 사이트 화면을 긁어오는 방식은 약관/법적 리스크가 있으므로 사용하지 않는다.

## 2. 선택한 공식 API

현재 1순위 공식 API 후보는 Duffel Flights API다.
Duffel은 테스트 access token을 만들 수 있고, Offer Request를 생성해 항공편 후보를 받는 구조라 CareerLens 출국로드맵과 잘 맞는다.

Amadeus 연동 코드는 legacy optional로 남겨둔다.
기존 코드는 Amadeus for Developers의 Self-Service API를 기준으로 구현되어 있다.
다만 2026년 5월 확인 기준으로 Amadeus Self-Service portal은 신규 등록이 제한된 상태이며,
2026년 7월 17일 decommission 예정 공지가 표시되고 있다.

따라서 CareerLens에서는 Amadeus를 기본 필수 기능이 아니라,
기존 Self-Service 키를 이미 보유한 경우에만 선택적으로 사용하는 legacy optional 연동으로 둔다.
캡스톤 시연의 기본 경로는 수동 항공편 입력/API-ready 구조와 규칙 기반 출국로드맵이다.

사용 API 우선순위:

```txt
1. Duffel Flights API - Offer Requests
2. Amadeus Flight Offers Search API - legacy optional
3. Manual itinerary input - fallback
```

공식 문서:

- https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/quick-start/
- https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/

선택 이유:

- Duffel은 테스트 토큰 기반으로 샌드박스 개발이 가능하다.
- Duffel은 프론트 직접 호출이 아니라 백엔드 호출을 권장하므로 CareerLens 구조와 맞다.
- Offer Request 응답의 offers 배열에서 항공편 구간, 항공사, 시간, 가격을 정규화할 수 있다.
- Amadeus는 신규 키 발급이 막힐 수 있으므로 legacy optional로만 설명한다.
- API 키가 없어도 CareerLens의 규칙 기반 출국로드맵은 계속 동작하도록 fallback 구성이 가능하다.

## 3. 현재 구현 위치

Backend:

```txt
backend/src/main/java/com/careerlens/backend/controller/DeparturePlanController.java
backend/src/main/java/com/careerlens/backend/service/DeparturePlanService.java
backend/src/main/java/com/careerlens/backend/dto/DeparturePlanRequestDto.java
backend/src/main/java/com/careerlens/backend/dto/DeparturePlanDto.java
backend/src/main/java/com/careerlens/backend/dto/DepartureMilestoneDto.java
backend/src/main/java/com/careerlens/backend/dto/FlightOfferDto.java
backend/src/main/java/com/careerlens/backend/dto/FlightApiProviderDto.java
```

Frontend:

```txt
frontend/app/roadmap/departure/page.tsx
frontend/lib/departure.ts
```

설정:

```txt
backend/src/main/resources/application.yml
```

## 4. API 흐름

CareerLens 내부 API:

```txt
POST /api/departure/plan
```

요청 예시:

```json
{
  "target_country": "일본",
  "destination_city": "도쿄",
  "origin_airport": "ICN",
  "destination_airport": "HND",
  "start_date": "2026-06-20",
  "arrival_buffer_days": 14,
  "visa_status": "내정 후 회사 제출 서류 확인 필요",
  "housing_status": "임시 숙소 미정"
}
```

서버 처리 흐름:

```txt
1. 입사 예정일에서 arrival_buffer_days를 빼서 권장 입국일 계산
2. 권장 입국일 기준 출국 후보 기간 계산
3. Amadeus 설정이 있으면 OAuth token 발급
4. Amadeus Flight Offers Search 호출
5. 항공편 후보를 FlightOfferDto로 변환
6. AI 키가 있으면 출국 마일스톤 설명을 AI 보조 생성
7. AI/API가 실패하면 규칙 기반 로드맵으로 fallback
```

Amadeus OAuth:

```txt
POST https://test.api.amadeus.com/v1/security/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id={AMADEUS_CLIENT_ID}
client_secret={AMADEUS_CLIENT_SECRET}
```

Amadeus Flight Offers Search:

```txt
GET https://test.api.amadeus.com/v2/shopping/flight-offers
```

주요 파라미터:

```txt
originLocationCode
destinationLocationCode
departureDate
adults
currencyCode
max
```

## 5. 환경변수

Duffel API를 사용하려면 아래 환경변수를 설정한다.

```env
TRAVEL_PROVIDER=duffel
DUFFEL_ENABLED=true
DUFFEL_ACCESS_TOKEN=duffel_test_...
DUFFEL_BASE_URL=https://api.duffel.com
DUFFEL_VERSION=v2
DUFFEL_SUPPLIER_TIMEOUT_MILLIS=10000
```

Amadeus API는 기존 키를 이미 보유한 경우에만 선택적으로 사용한다.

```env
AMADEUS_ENABLED=true
AMADEUS_CLIENT_ID=발급받은_API_KEY
AMADEUS_CLIENT_SECRET=발급받은_API_SECRET
AMADEUS_BASE_URL=https://test.api.amadeus.com
AMADEUS_CURRENCY_CODE=KRW
```

주의:

```txt
AMADEUS_CLIENT_ID와 AMADEUS_CLIENT_SECRET은 GitHub에 올리지 않는다.
.env, IntelliJ Run Configuration, OS 환경변수 중 하나로만 관리한다.
```

## 6. 프론트 화면 표시 정보

출국로드맵 화면에서 보여주는 정보:

```txt
입사 예정일
권장 입국일
출국 후보 기간
출국 준비 D-day
항공편 탐색 기준
Amadeus 조회 상태
항공편 후보
출국 전 준비 마일스톤
행정로드맵/정착지원 연결 버튼
```

항공편 후보가 있으면 다음 값을 표시한다.

```txt
출발 공항
도착 공항
출발 시각
도착 시각
항공사 코드
편명
소요시간
통화
총 가격
예약 가능 좌석 수
```

## 7. Fallback 정책

Amadeus API는 다음 상황에서 결과가 없을 수 있다.

```txt
API 키 미설정
신규 Self-Service 키 발급 불가
Self-Service portal decommission
테스트 quota 초과
테스트 환경 데이터셋 제한
지원하지 않는 노선/항공사
날짜 조건 미지원
네트워크 오류
```

이 경우에도 CareerLens는 출국로드맵 생성을 중단하지 않는다.

Fallback 동작:

```txt
항공편 후보: 빈 배열
flight_data_status: NOT_CONFIGURED 또는 NO_RESULTS_OR_FAILED
출국 마일스톤: 규칙 기반 생성
사용자 안내: 공식 항공사/OTA/API에서 최종 확인 필요 고지
```

## 8. 현재 한계

현재 구현은 항공권 예약 기능이 아니다.
또한 Amadeus Self-Service 신규 등록 중단/폐쇄 일정 때문에, 이 연동을 필수 기능으로 발표하지 않는다.

하지 않는 것:

```txt
항공권 결제
예약 확정
가격 보장
좌석 보장
항공사/OTA 웹사이트 크롤링
비자/입국 요건 최신 판단
```

Amadeus Self-Service 테스트 환경도 제한이 있다.
일부 항공사, 저가항공, 특가 요금, 협상 운임, 특정 노선은 결과에 포함되지 않을 수 있다.

## 9. 발표에서 설명할 문장

```txt
출국로드맵은 입사 예정일을 기준으로 권장 입국일과 출국 후보 기간을 계산합니다.
항공편 데이터는 크롤링하지 않고, Duffel 공식 Flights API를 1순위로 연동할 수 있도록 설계했습니다.
Duffel test token이 있으면 백엔드에서 Offer Request를 생성해 항공편 후보를 받아오고,
키가 없거나 테스트 환경에서 결과가 없으면 규칙 기반 출국 준비 로드맵으로 fallback됩니다.
Amadeus는 Self-Service 종료 이슈가 있어 legacy optional로만 유지합니다.
```

## 10. 향후 개선

```txt
1. 사용자가 선택한 항공편 후보 저장
2. 수동 항공편 입력 기능 추가
3. 숙소 체크리스트와 연결
4. 출국 D-day 알림
5. 행정로드맵의 비자/주소/보험 체크리스트와 자동 연결
6. Amadeus Enterprise 또는 다른 공식 Flight API 승인 가능성 검토
7. Skyscanner 등 파트너 API는 승인 가능성 확인 후 별도 검토
```

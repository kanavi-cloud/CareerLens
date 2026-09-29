# CareerLens Duffel 항공 API 연동 설계

## 1. 결론

CareerLens 출국로드맵의 항공편 후보 조회는 Duffel을 1순위 공식 API 후보로 둔다.

이유:

```txt
1. 테스트 access token 발급 구조가 명확하다.
2. 테스트 토큰은 duffel_test_로 시작해 샌드박스 개발에 적합하다.
3. 항공권 검색은 Offer Request 생성 방식으로 처리한다.
4. 응답의 offers 배열에 항공편 구간, 항공사, 시간, 가격 정보가 포함된다.
5. 프론트에서 직접 호출하지 않고 백엔드에서 호출해야 하므로 CareerLens 구조와 잘 맞는다.
6. 캡스톤에서는 예약/결제가 아니라 항공편 후보 표시까지만 사용하면 된다.
```

## 2. 공식 문서 기준 핵심

Duffel 공식 문서 기준:

```txt
계정 가입
-> Dashboard > Developers
-> Access tokens에서 test access token 생성
-> POST /air/offer_requests 호출
-> 응답의 data.offers를 항공편 후보로 사용
```

참고 문서:

- https://duffel.com/docs/guides/getting-started-with-flights
- https://duffel.com/docs/api/v2/offer-requests
- https://duffel.com/docs/api/overview/test-your-integration
- https://help.duffel.com/hc/en-gb/articles/4504698704530-Can-I-use-the-Duffel-API-directly-from-my-frontend-application-or-mobile-app

중요 원칙:

```txt
Duffel access token은 브라우저 프론트에서 직접 사용하면 안 된다.
반드시 CareerLens 백엔드가 Duffel API를 호출해야 한다.
```

## 3. CareerLens 적용 구조

현재 구현 구조:

```txt
Frontend
  /roadmap/departure
    ↓
Backend
  POST /api/departure/plan
    ↓
DeparturePlanService
    ↓
Duffel
  POST /air/offer_requests?return_offers=true
    ↓
CareerLens
  FlightOfferDto로 정규화
    ↓
Frontend
  항공편 후보 카드 표시
```

## 4. 현재 구현 파일

Backend:

```txt
backend/src/main/java/com/careerlens/backend/controller/DeparturePlanController.java
backend/src/main/java/com/careerlens/backend/service/DeparturePlanService.java
backend/src/main/java/com/careerlens/backend/dto/DeparturePlanRequestDto.java
backend/src/main/java/com/careerlens/backend/dto/DeparturePlanDto.java
backend/src/main/java/com/careerlens/backend/dto/FlightOfferDto.java
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

## 5. 환경변수

IntelliJ 실행 설정 또는 OS 환경변수에 넣는다.

```env
TRAVEL_PROVIDER=duffel
DUFFEL_ENABLED=true
DUFFEL_ACCESS_TOKEN=duffel_test_...
DUFFEL_BASE_URL=https://api.duffel.com
DUFFEL_VERSION=v2
DUFFEL_SUPPLIER_TIMEOUT_MILLIS=10000
```

주의:

```txt
DUFFEL_ACCESS_TOKEN은 GitHub에 올리지 않는다.
프론트 .env에 넣지 않는다.
반드시 백엔드 환경변수로만 사용한다.
```

## 6. Duffel 요청 방식

CareerLens 백엔드는 아래 형태로 Duffel Offer Request를 생성한다.

```http
POST https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=10000
Authorization: Bearer {DUFFEL_ACCESS_TOKEN}
Duffel-Version: v2
Content-Type: application/json
```

요청 body 개념:

```json
{
  "data": {
    "slices": [
      {
        "origin": "ICN",
        "destination": "HND",
        "departure_date": "2026-06-06"
      }
    ],
    "passengers": [
      {
        "type": "adult"
      }
    ],
    "cabin_class": "economy",
    "max_connections": 1
  }
}
```

## 7. CareerLens 정규화 결과

Duffel 응답은 CareerLens 내부 DTO로 변환된다.

```txt
FlightOfferDto
- provider
- origin_code
- destination_code
- departure_at
- arrival_at
- carrier_name
- carrier_code
- flight_number
- duration
- currency
- total_price
- bookable_seats
```

Duffel에서 가져오는 주요 값:

```txt
offer.total_currency
offer.total_amount
offer.slices[0].duration
offer.slices[0].segments[0].departing_at
offer.slices[0].segments[n].arriving_at
segment.origin.iata_code
segment.destination.iata_code
segment.operating_carrier.name
segment.operating_carrier.iata_code
segment.operating_carrier_flight_number
```

## 8. 사용 범위

CareerLens 캡스톤에서 사용할 것:

```txt
Offer Request 생성
항공편 후보 조회
항공사/편명/시간/가격 표시
출국로드맵의 참고 데이터로 사용
```

CareerLens 캡스톤에서 사용하지 않을 것:

```txt
Order 생성
항공권 결제
예약 확정
환불/변경 처리
좌석/수하물 부가서비스 결제
실제 최저가 보장
```

## 9. Fallback 정책

Duffel API는 아래 상황에서 결과가 없을 수 있다.

```txt
DUFFEL_ACCESS_TOKEN 미설정
테스트 토큰 권한 문제
테스트 환경 데이터셋 제한
지원하지 않는 노선/날짜
네트워크 오류
```

이 경우 CareerLens는 출국로드맵 생성을 중단하지 않는다.

Fallback:

```txt
flight_offers: []
flight_data_status: NOT_CONFIGURED 또는 NO_RESULTS_OR_FAILED
출국 마일스톤: 규칙 기반 생성
사용자 안내: 공식 채널에서 항공편 최종 확인 필요
```

## 10. Amadeus와의 관계

Amadeus Self-Service portal은 신규 등록이 제한되고 2026년 7월 17일 decommission 예정이므로,
CareerLens에서는 Amadeus를 legacy optional로만 둔다.

현재 우선순위:

```txt
1. Duffel
2. Amadeus legacy optional
3. 수동 항공편 입력
```

## 11. 발표용 설명

```txt
출국로드맵의 항공편 후보 조회는 Duffel 공식 Flights API를 1순위로 설계했습니다.
Duffel은 테스트 토큰 기반으로 샌드박스 개발이 가능하고,
CareerLens의 백엔드에서 Offer Request를 생성해 항공편 후보를 받아오는 구조입니다.
다만 캡스톤 범위에서는 예약이나 결제를 만들지 않고,
출국 일정 계획을 위한 항공편 후보 표시까지만 사용합니다.
API 키가 없거나 테스트 환경에서 결과가 없을 경우에도 규칙 기반 출국로드맵은 계속 생성됩니다.
```

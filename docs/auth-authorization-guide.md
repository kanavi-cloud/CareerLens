# CareerLens 인증/인가 구조 정리

## 1. 핵심 요약

CareerLens의 로그인/회원가입은 현재 다음 구조로 동작한다.

```txt
회원가입 또는 로그인
-> 백엔드가 사용자 정보 검증
-> 백엔드가 JWT access token 발급
-> 프론트가 사용자 정보와 JWT를 localStorage에 저장
-> 보호 API 요청 시 Authorization 헤더에 JWT 전송
-> 백엔드가 JWT 검증
-> 권한이 맞으면 API 실행, 아니면 401/403 응답
```

JWT는 AWS 배포를 해야만 동작하는 기능이 아니다. 로컬 개발 환경에서도 백엔드와 프론트가 실행되어 있으면 동일하게 적용된다. AWS, RDS, 배포 서버는 나중에 운영 환경으로 올릴 때 필요한 영역이고, JWT 인증 방식 자체는 로컬에서도 바로 확인할 수 있다.

## 2. 인증과 인가 차이

### 인증(Authentication)

사용자가 누구인지 확인하는 과정이다.

CareerLens에서는 다음 API가 인증을 담당한다.

```txt
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me
```

예:

```txt
admin / 비밀번호
-> 로그인 성공
-> 서버가 "이 사용자는 admin 계정이다"라는 토큰 발급
```

### 인가(Authorization)

인증된 사용자가 특정 기능을 사용할 권한이 있는지 확인하는 과정이다.

예:

```txt
일반 USER
-> 맞춤채용정보 진단 가능
-> 마이페이지 접근 가능
-> 외부 공고 API 관리 화면 접근 불가

ADMIN
-> 일반 USER 기능 가능
-> 외부 공고 API 관리 화면 접근 가능
```

## 3. 현재 권한 정책

현재 권한은 크게 두 가지다.

```txt
USER
ADMIN
```

회원가입 시 아이디가 `ADMIN_LOGIN_IDS` 환경변수에 포함되어 있으면 ADMIN 권한을 받는다. 기본값은 다음과 같다.

```properties
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

즉 로컬에서 `admin` 아이디로 회원가입하면 관리자 계정이 된다. `testuser`, `eunho`, `member1` 같은 아이디로 가입하면 일반 사용자 계정이 된다.

## 4. admin으로 계속 보이는 이유

프론트는 로그인 성공 후 사용자 정보를 브라우저 localStorage에 저장한다.

```txt
localStorage["careerlens_user"]
```

한 번 `admin`으로 로그인하면 로그아웃하거나 localStorage를 지우기 전까지 헤더에는 admin 계정이 표시된다. 이것은 모든 사용자를 admin으로 처리하는 것이 아니라, 현재 브라우저에 admin 로그인 정보가 남아 있는 상태다.

확인 방법:

```txt
1. 헤더의 로그아웃 클릭
2. 일반 사용자 아이디로 회원가입
3. 다시 로그인
4. 헤더에 일반 사용자 이름과 USER 권한이 표시되는지 확인
```

브라우저 개발자도구에서 직접 지울 수도 있다.

```txt
Application
-> Local Storage
-> carelens_user 삭제
```

## 5. JWT가 저장되는 위치

로그인 또는 회원가입 성공 시 백엔드는 다음 정보를 응답한다.

```json
{
  "user_id": 1,
  "login_id": "admin",
  "display_name": "admin",
  "email": "admin@careerlens.local",
  "role": "ADMIN",
  "admin": true,
  "profile_completed": false,
  "account_status": "ACTIVE",
  "email_verified": false,
  "access_token": "JWT_TOKEN_VALUE",
  "token_type": "Bearer",
  "expires_at": 1234567890
}
```

프론트는 이 값을 localStorage에 저장한다. 이후 관리자 API를 호출할 때 다음 헤더를 붙인다.

```http
Authorization: Bearer JWT_TOKEN_VALUE
```

## 6. 현재 JWT로 보호하는 API

현재 JWT 보호 범위는 일부 API에만 적용되어 있다.

```txt
GET /api/auth/me
/api/jobs/external/**
```

특히 `/api/jobs/external/**`는 Greenhouse 같은 외부 공고 API를 미리보기/등록/동기화하는 관리자 기능이다. 이 기능은 일반 사용자가 사용하면 안 되므로 ADMIN 권한이 필요하다.

나머지 추천 진단, 마이페이지 프로필, 플래너 API는 아직 userId 기반 흐름을 유지한다. 이유는 전체 API를 한 번에 JWT 기반으로 바꾸면 추천 진단/플래너를 맡은 조원 작업과 충돌할 수 있기 때문이다. 현재는 인증 구조를 먼저 잡고, 이후 단계에서 사용자별 API를 순차적으로 보호하는 방식이 안전하다.

## 7. 회원가입 검증 정책

현재 회원가입 화면과 백엔드에서 검증하는 항목은 다음과 같다.

```txt
아이디
- 4~30자
- 영문, 숫자, 점, 언더스코어, 하이픈 허용
- 중복 불가

이메일
- 이메일 형식 검증
- 중복 불가

비밀번호
- 8자 이상
- 영문 포함
- 숫자 포함
- 특수문자 포함
- 비밀번호 확인 일치 필요

동의 항목
- 서비스 이용약관 동의 필수
- 개인정보 수집 및 이용 동의 필수
- 실제 직원 개인정보/민감정보 입력 금지 보안 안내 확인 필수
- 마케팅/피드백 수신 동의 선택
```

## 8. 로그인 보안 정책

현재 로그인 정책은 다음과 같다.

```txt
아이디 또는 이메일로 로그인 가능
비밀번호는 BCrypt로 해시 저장
로그인 실패 메시지는 아이디/비밀번호 중 무엇이 틀렸는지 구분하지 않음
비밀번호 5회 실패 시 15분 계정 잠금
로그인 성공 시 실패 횟수 초기화
마지막 로그인 시간 저장
```

## 9. 환경변수

로컬에서는 기본값으로도 실행 가능하다. 다만 조원들과 환경을 맞추거나 배포할 때는 아래 환경변수를 설정하는 것이 좋다.

```properties
JWT_SECRET=충분히_긴_랜덤_문자열
JWT_ISSUER=careerlens
JWT_EXPIRATION_MINUTES=480
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

### 가장 중요한 값

```properties
JWT_SECRET
```

이 값은 JWT 서명에 사용된다. 개발자 PC마다 달라도 되지만, 하나의 서버에서 프론트/백엔드가 같이 쓸 때는 백엔드 실행 환경에 안정적으로 설정되어 있어야 한다. AWS, 학교 서버, 공용 시연 서버에서는 기본값을 그대로 쓰면 안 된다.

## 10. 로컬 테스트 방법

```txt
1. 백엔드 실행
2. 프론트 실행
3. /signup 접속
4. admin 아이디로 회원가입
5. /jobs/import 접근 가능 확인
6. 로그아웃
7. 일반 사용자 아이디로 회원가입
8. /jobs/import 접근 시 관리자 권한 안내 확인
9. 잘못된 비밀번호 5회 입력 후 계정 잠금 메시지 확인
```

## 11. 현재 남은 과제

```txt
이메일 인증
비밀번호 재설정
refresh token 구조
JWT 만료 시 자동 로그아웃 처리
전체 사용자 API의 JWT 기반 보호
운영 DB 마이그레이션 스크립트
계정 설정 페이지에서 비밀번호 변경
관리자 계정 생성 정책 정리
```

## 12. 조원 공유용 한 줄 설명

CareerLens는 현재 JWT 기반 로그인 구조를 도입했고, 일반 사용자와 관리자 권한을 구분한다. 관리자 권한은 외부 공고 API 관리 기능에 먼저 적용했으며, 추천 진단과 플래너 API는 기존 userId 기반 흐름을 유지한 뒤 추후 단계적으로 JWT 기반으로 전환할 예정이다.

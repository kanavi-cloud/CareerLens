# 로그인/회원가입 JWT 보강 정리

## 목적

기존 로그인/회원가입은 사용자 생성과 비밀번호 검증 중심으로 동작했다. 이번 작업에서는 발표용 프로토타입이라도 실제 서비스에서 기대하는 기본 인증 정책을 갖추도록 다음 구조를 추가했다.

```txt
회원가입
-> 필수 약관/개인정보/보안 안내 동의 저장
-> 비밀번호 정책 검증
-> 사용자 계정 생성
-> JWT access token 발급

로그인
-> 아이디 또는 이메일로 사용자 조회
-> 계정 상태/잠금 여부 확인
-> 비밀번호 검증
-> 실패 횟수 누적 또는 성공 시 초기화
-> JWT access token 발급
```

## 적용 범위

현재 JWT로 보호하는 API:

```txt
/api/auth/me
/api/jobs/external/**
```

Greenhouse 외부 공고 미리보기/등록/동기화 API는 더 이상 `X-Careerlens-User-Role` 같은 임시 헤더로 접근하지 않는다. 로그인 후 발급받은 `Authorization: Bearer {token}` 헤더가 있어야 하며, ADMIN 권한이 있는 사용자만 접근할 수 있다.

## 회원가입 정책

- 아이디는 4~30자, 영문/숫자/점/언더스코어/하이픈만 허용한다.
- 아이디 중복을 검사한다.
- 이메일 형식을 검사한다.
- 이메일 중복을 검사한다.
- 이름은 필수값이다.
- 국가번호와 휴대폰 번호는 선택 입력값으로 저장한다.
- 비밀번호는 8자 이상이어야 한다.
- 비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 한다.
- 비밀번호 확인 값이 일치해야 한다.
- 서비스 이용약관 동의가 필수다.
- 개인정보 수집 및 이용 동의가 필수다.
- 실제 직원 개인정보와 민감정보를 입력하지 않는다는 보안 안내 확인이 필수다.
- 마케팅/피드백 수신 동의는 선택값이다.

## 로그인 정책

- 아이디 또는 이메일로 로그인할 수 있다.
- 로그인 실패 메시지는 보안을 위해 아이디/비밀번호 중 어느 항목이 틀렸는지 구분하지 않는다.
- 비밀번호 실패가 5회 누적되면 계정이 15분 동안 잠긴다.
- 잠금 시간이 지나면 다음 로그인 시도에서 실패 횟수와 잠금 상태를 초기화한다.
- 계정 상태가 `SUSPENDED`이면 로그인할 수 없다.
- 로그인 성공 시 실패 횟수, 잠금 상태를 초기화하고 마지막 로그인 시간을 저장한다.

## User 엔티티 추가 필드

```txt
updatedAt
accountStatus
emailVerified
countryDialCode
phoneNumber
failedLoginAttempts
lockedUntil
lastLoginAt
passwordChangedAt
termsAcceptedAt
privacyAcceptedAt
securityNoticeAcceptedAt
marketingOptIn
```

`spring.jpa.hibernate.ddl-auto=update` 환경에서는 서버 실행 시 기존 users 테이블에 누락 컬럼이 추가된다. 운영형 DB에서는 별도 마이그레이션 스크립트로 관리하는 것이 더 안전하다.

## 프론트 변경

`AuthUser` 응답 타입에 다음 필드가 추가됐다.

```ts
account_status?: string;
email_verified?: boolean;
last_login_at?: string | null;
access_token?: string;
token_type?: string;
expires_at?: number;
```

회원가입 화면은 다음 입력/검증을 포함한다.

- 아이디
- 이름
- 이메일
- 국가번호
- 휴대폰 번호
- 비밀번호
- 비밀번호 확인
- 비밀번호 표시 토글
- 비밀번호 정책 체크리스트
- 필수/선택 동의 체크박스

로그인 화면은 다음 내용을 보여준다.

- 아이디 또는 이메일 입력
- 비밀번호 입력
- 비밀번호 표시 토글
- JWT 발급 안내
- 로그인 실패 5회 잠금 안내
- ADMIN 권한 API 접근 안내

## 환경변수

```properties
JWT_SECRET=충분히_긴_랜덤_문자열
JWT_ISSUER=careerlens
JWT_EXPIRATION_MINUTES=480
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

로컬 기본값은 `application.yml`에 있지만, 공유 서버나 배포 환경에서는 반드시 `JWT_SECRET`을 별도 환경변수로 지정해야 한다.

## 테스트 방법

1. 백엔드 서버 실행
2. 프론트엔드 서버 실행
3. 회원가입 화면에서 필수값 누락 시 버튼 비활성/에러 확인
4. 비밀번호 정책 미충족 시 가입 불가 확인
5. 필수 동의 누락 시 가입 불가 확인
6. 정상 회원가입 후 `/mypage` 이동 확인
7. 로그아웃 또는 localStorage 삭제 후 로그인 확인
8. 잘못된 비밀번호를 5회 입력해 계정 잠금 메시지 확인
9. admin 계정으로 로그인 후 `/jobs/import` 접근 확인
10. 일반 계정으로 `/jobs/import` 접근 시 관리자 권한 안내 확인

## 변경 파일

```txt
backend/pom.xml
backend/src/main/resources/application.yml
backend/src/main/java/com/careerlens/backend/config/SecurityConfig.java
backend/src/main/java/com/careerlens/backend/security/JwtClaims.java
backend/src/main/java/com/careerlens/backend/security/JwtTokenService.java
backend/src/main/java/com/careerlens/backend/security/JwtAuthenticationFilter.java
backend/src/main/java/com/careerlens/backend/controller/AuthController.java
backend/src/main/java/com/careerlens/backend/controller/ExternalJobProviderController.java
backend/src/main/java/com/careerlens/backend/dto/AuthResponseDto.java
backend/src/main/java/com/careerlens/backend/dto/SignupRequestDto.java
backend/src/main/java/com/careerlens/backend/entity/User.java
backend/src/main/java/com/careerlens/backend/service/AuthService.java
frontend/lib/auth.ts
frontend/lib/external-jobs.ts
frontend/app/login/page.tsx
frontend/app/signup/page.tsx
frontend/app/jobs/import/page.tsx
```

## 남은 TODO

- 이메일 인증 메일 발송/검증 구현
- 비밀번호 재설정 메일 구현
- refresh token 도입 여부 결정
- JWT 만료 시 자동 로그아웃/재로그인 유도 UI 정리
- 전체 사용자 API를 JWT 기반으로 보호할지 정책 결정
- 운영 DB용 마이그레이션 스크립트 분리

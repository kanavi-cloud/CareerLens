# CareerLens 팀 개발 버전 공지

조원들이 로컬 환경을 맞출 때 참고하는 버전 문서입니다.

## 백엔드

- Java target version: `17`
- 현재 확인된 로컬 JDK: `OpenJDK 17.0.18 Temurin`
- Spring Boot: `3.3.5`
- Spring Data JPA: Spring Boot `3.3.5` BOM 기준
- Database: `MySQL` 또는 `MariaDB`
- MySQL JDBC Driver: `mysql-connector-j`, Spring Boot BOM 관리
- MariaDB JDBC Driver: `mariadb-java-client`, Spring Boot BOM 관리
- Build tool: `Maven`
- 백엔드 포트: `8080`
- API 기본 주소: `http://localhost:8080`

## 프론트엔드

- Node.js: `24.15.0`
- npm: `11.12.1`
- Next.js: `16.2.4`
- React: `18.3.1`
- React DOM: `18.3.1`
- TypeScript: `5.6.3`
- Tailwind CSS: `3.4.14`
- PostCSS: `8.4.47`
- Autoprefixer: `10.4.20`
- 프론트 포트: `3000`
- 메인 화면: `http://localhost:3000`
- 맞춤채용정보 화면: `http://localhost:3000/jobs/recommendation`

## 현재 로컬 DB 설정

설정 파일:

```txt
backend/src/main/resources/application.yml
```

현재 기본값은 MySQL입니다.

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:1234}
    driver-class-name: ${DB_DRIVER:com.mysql.cj.jdbc.Driver}
  jpa:
    hibernate:
      ddl-auto: ${DB_DDL_AUTO:update}
```

처음 실행하기 전에 MySQL 또는 MariaDB에서 DB를 생성해야 합니다.

```sql
CREATE DATABASE careerlens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

MariaDB 사용자는 IntelliJ 환경변수에 아래 값을 넣습니다.

```env
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=본인비밀번호
DB_DRIVER=org.mariadb.jdbc.Driver
DB_DDL_AUTO=update
```

자세한 내용:

```txt
docs/local-db-setup.md
```

## 실행 명령어

백엔드:

```bash
cd backend
mvn spring-boot:run
```

프론트엔드:

```bash
cd frontend
npm install
npm run dev
```

## 주의사항

- 현재 H2는 사용하지 않습니다.
- 테이블은 직접 만들지 않습니다. DB만 만들면 JPA가 테이블을 자동 생성합니다.
- 추천 seed 기본 파일은 `seed-data/recommendation-seed.json`입니다.
- `seed-data/processed/`에 정규화 CSV가 있으면 JSON seed보다 CSV를 우선 사용합니다.
- 프론트는 `NEXT_PUBLIC_API_BASE_URL` 환경변수를 통해 백엔드 주소를 바꿀 수 있습니다.
- 환경변수가 없으면 기본값은 `http://localhost:8080`입니다.
- 공개 GitHub에 올릴 때 DB 비밀번호는 환경변수 방식으로 바꾸는 것을 권장합니다.

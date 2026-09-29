# CareerLens 로컬 DB 설정 가이드

## 1. 결론

CareerLens 백엔드는 Spring Data JPA + Hibernate를 사용한다.

따라서 팀원이 직접 테이블을 하나하나 만들 필요는 없다.

필요한 것은 다음 두 가지다.

```txt
1. 로컬 DB에 careerlens 데이터베이스 생성
2. IntelliJ 또는 OS 환경변수로 DB 접속 정보 설정
```

테이블은 백엔드 실행 시 `ddl-auto=update` 설정에 따라 JPA 엔티티 기준으로 자동 생성된다.

## 2. 공통 원칙

현재 프로젝트는 MySQL과 MariaDB를 모두 지원한다.

기본값은 MySQL이다.
MariaDB를 사용하는 팀원은 환경변수로 DB 설정을 덮어쓴다.

설정 파일:

```txt
backend/src/main/resources/application.yml
```

현재 설정:

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

## 3. DB 생성

MySQL 또는 MariaDB에서 아래 DB를 먼저 생성한다.

```sql
CREATE DATABASE careerlens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

DB 자체는 자동 생성되지 않는다.
DB 안의 테이블만 JPA가 자동 생성한다.

## 4. MySQL 사용 팀원

기본값 그대로 사용해도 된다.

기본값:

```txt
DB_URL=jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=root
DB_PASSWORD=1234
DB_DRIVER=com.mysql.cj.jdbc.Driver
DB_DDL_AUTO=update
```

비밀번호가 다르면 IntelliJ 환경변수에 `DB_PASSWORD`만 넣어도 된다.

## 5. MariaDB 사용 팀원

IntelliJ 실행 설정의 Environment variables에 아래 값을 넣는다.

```env
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=본인_MariaDB_비밀번호
DB_DRIVER=org.mariadb.jdbc.Driver
DB_DDL_AUTO=update
```

MariaDB 포트나 계정이 다르면 각자 환경에 맞게 수정한다.

## 6. IntelliJ 설정 위치

```txt
Run
-> Edit Configurations
-> Spring Boot 실행 설정 선택
-> Environment variables
```

예시:

```txt
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8;DB_USERNAME=root;DB_PASSWORD=1234;DB_DRIVER=org.mariadb.jdbc.Driver;DB_DDL_AUTO=update
```

IntelliJ에서는 환경변수 항목을 `;`로 구분해서 입력한다.

## 7. PowerShell 임시 실행

MySQL:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="1234"
$env:DB_DRIVER="com.mysql.cj.jdbc.Driver"
$env:DB_DDL_AUTO="update"
```

MariaDB:

```powershell
$env:DB_URL="jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="1234"
$env:DB_DRIVER="org.mariadb.jdbc.Driver"
$env:DB_DDL_AUTO="update"
```

그 다음 백엔드를 실행한다.

```powershell
cd backend
mvn spring-boot:run
```

## 8. 테이블이 안 생길 때 확인할 것

```txt
1. careerlens DB 자체가 생성되어 있는가?
2. DB 계정에 CREATE TABLE 권한이 있는가?
3. DB_URL이 mysql/mariadb에 맞게 되어 있는가?
4. DB_DRIVER가 URL과 맞는가?
5. DB_DDL_AUTO가 update 또는 create인지 확인했는가?
6. application.yml이 아니라 다른 profile 설정이 실행되고 있지 않은가?
7. 백엔드 실행 로그에 Access denied, Unknown database, Communications link failure가 없는가?
8. IntelliJ Database Tool과 MariaDB Workbench가 같은 host/port/schema를 보고 있는가?
```

## 9. 자주 나는 오류

### Unknown database 'careerlens'

DB 자체가 없다.

```sql
CREATE DATABASE careerlens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Access denied for user

계정 또는 비밀번호가 틀렸거나 권한이 없다.

### No suitable driver

`DB_DRIVER`와 JDBC URL이 맞지 않는다.

MySQL:

```txt
DB_DRIVER=com.mysql.cj.jdbc.Driver
DB_URL=jdbc:mysql://...
```

MariaDB:

```txt
DB_DRIVER=org.mariadb.jdbc.Driver
DB_URL=jdbc:mariadb://...
```

### 테이블이 안 생김

`DB_DDL_AUTO`가 `none` 또는 `validate`로 되어 있으면 자동 생성되지 않는다.

개발 환경에서는:

```txt
DB_DDL_AUTO=update
```

백엔드가 실제로 연결한 DB를 확인하려면 MariaDB Workbench에서 아래를 실행한다.

```sql
SELECT DATABASE();
SHOW TABLES;
```

IntelliJ에서는 DB가 보이는데 Workbench에는 안 보이는 경우 대부분 아래 중 하나다.

```txt
1. IntelliJ와 Workbench가 서로 다른 포트의 MariaDB/MySQL을 보고 있음
2. Workbench에서 다른 schema를 선택하고 있음
3. Workbench schema 새로고침을 하지 않음
4. 백엔드가 실제로는 MySQL 기본값으로 붙고 있음
5. 백엔드가 DB 연결 실패로 실행되지 않았음
```

## 10. CORS와 Fail to fetch 확인

브라우저에서 `Failed to fetch` 또는 CORS 에러가 보이면 DB 문제와 프론트/백엔드 연결 문제를 같이 확인해야 한다.

백엔드 CORS 기본 허용값:

```txt
http://localhost:3000
http://127.0.0.1:3000
http://localhost:3001
http://127.0.0.1:3001
```

개발 환경에서는 아래 패턴도 기본 허용한다.

```txt
http://localhost:*
http://127.0.0.1:*
```

다른 주소나 포트에서 프론트를 실행하면 환경변수로 허용 origin을 추가한다.

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*
```

프론트가 백엔드를 다른 주소로 호출해야 하면 `frontend` 쪽에 아래 환경변수를 설정한다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

확인 순서:

```txt
1. 백엔드가 8080에서 정상 실행 중인지 확인
2. 브라우저에서 http://localhost:8080/api/jobs 접속
3. 프론트가 실제로 호출하는 URL이 http://localhost:8080인지 Network 탭에서 확인
4. 프론트 접속 origin이 CORS_ALLOWED_ORIGINS에 포함되어 있는지 확인
5. 백엔드 로그에 DB 연결 실패나 500 에러가 없는지 확인
```

## 11. 팀 공지용 요약

```txt
DB는 각자 MySQL/MariaDB 중 편한 것을 사용해도 됩니다.
단, careerlens DB는 직접 생성해야 합니다.
테이블은 백엔드 실행 시 JPA가 자동 생성합니다.
MariaDB 사용자는 IntelliJ 환경변수에 DB_URL, DB_DRIVER, DB_PASSWORD를 반드시 설정해주세요.
```

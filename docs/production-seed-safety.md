# 운영 Seed 데이터 안전장치

## 목적

운영 RDS에는 관리자 검수 후 직접 보정한 공고 데이터가 저장될 수 있다. 서버 재시작이나 Docker 이미지 재배포 시 `SeedDataLoader`, `CommandLineRunner`, `ApplicationRunner` 계열 초기 데이터 로더가 실행되면 운영 데이터가 덮이거나 삭제될 수 있으므로, seed 실행은 명시적으로 켠 환경에서만 동작하도록 제한한다.

## 기본 정책

- 운영 기본값은 seed 비활성화다.
- 운영에서는 `APP_SEED_ENABLED=false` 또는 미설정 상태를 유지한다.
- 운영에서는 `APP_SEED_RESET_ENABLED=false` 또는 미설정 상태를 유지한다.
- 운영에서는 `APP_RESOURCE_SEED_ENABLED=false` 또는 미설정 상태를 유지한다.
- 로컬 Docker Compose는 기존 시연 편의를 위해 seed/reset을 기본 활성화한다.

## 환경변수

| 환경변수 | 운영 권장값 | 의미 |
| --- | --- | --- |
| `APP_SEED_ENABLED` | `false` | 추천/공고/패턴 seed loader 실행 여부 |
| `APP_SEED_RESET_ENABLED` | `false` | processed CSV seed 적재 전 기존 추천 관련 데이터 삭제 여부 |
| `APP_RESOURCE_SEED_ENABLED` | `false` | 자료실 게시글 seed loader 실행 여부 |
| `DB_DDL_AUTO` | `update` | 테이블/컬럼 자동 보정. 기존 row를 삭제하지는 않음 |

## 로컬 개발에서 seed가 필요할 때

IntelliJ로 백엔드를 실행하면서 기본 공고/프로필/자료실 seed가 필요하면 아래 환경변수를 추가한다.

```properties
APP_SEED_ENABLED=true
APP_SEED_RESET_ENABLED=true
APP_RESOURCE_SEED_ENABLED=true
```

로컬 Docker Compose는 위 값이 기본값으로 들어가 있으므로 별도 설정 없이 기존처럼 seed가 실행된다.

## 운영 배포 전 확인 항목

1. EC2의 `docker-compose.prod.yml` 또는 `.env.production`에 `APP_SEED_ENABLED=true`가 들어가 있지 않은지 확인한다.
2. `APP_SEED_RESET_ENABLED=true`가 들어가 있지 않은지 확인한다.
3. `APP_RESOURCE_SEED_ENABLED=true`가 들어가 있지 않은지 확인한다.
4. `DB_DDL_AUTO=update`는 row 삭제 위험은 낮지만, 최종 운영 전에는 마이그레이션 SQL로 분리하는 것이 안전하다.
5. RDS 백업 또는 스냅샷을 만든 뒤 신규 이미지로 재시작한다.

## 주의

`APP_SEED_ENABLED=true`로 seed loader를 켜면 seed 파일의 공고/직원표본/PatternProfile이 DB에 반영된다. `APP_SEED_RESET_ENABLED=true`까지 켜면 기존 추천 관련 데이터가 삭제된 뒤 seed가 다시 적재된다. 운영에서는 두 값을 모두 켜지 않는다.

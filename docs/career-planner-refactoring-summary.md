# Career Planner Refactoring Summary

## 작업 대상

이번 리팩토링은 커리어 개발 플래너의 핵심 서비스인 `PlannerService`를 대상으로 진행했다.

```text
backend/src/main/java/com/careerlens/backend/service/PlannerService.java
```

프론트 화면, API 주소, DTO 구조, DB Entity 구조는 변경하지 않았다.

## 리팩토링 목적

기능을 바꾸는 작업이 아니라, 기존 코드를 더 읽기 쉽고 설명하기 쉽게 정리하는 작업이다.

기존 `PlannerService`는 한 메서드 안에서 여러 일을 함께 처리하고 있었다.

```text
진단 결과 조회
로드맵 생성
과제 생성
과제 순서 부여
완료율 계산
다음 액션 계산
DTO 변환
```

이 흐름이 길게 이어져 있어서 처음 보는 사람이 코드의 역할을 빠르게 파악하기 어려웠다.

## 주요 변경 내용

### 1. 로드맵 생성 흐름 분리

기존에는 `createFromDiagnosis()` 안에서 로드맵 생성 과정이 대부분 처리되었다.

리팩토링 후에는 전체 흐름이 아래처럼 보이도록 분리했다.

```text
createFromDiagnosis()
├─ findExistingRoadmap()
├─ findDiagnosis()
├─ durationWeeks()
├─ saveRoadmap()
├─ saveTasks()
└─ toDto()
```

이제 `createFromDiagnosis()`만 보면 전체 생성 순서를 쉽게 이해할 수 있다.

```text
1. 이미 만든 로드맵이 있는지 확인
2. 없으면 추천 진단 결과 조회
3. 준비 기간 계산
4. 로드맵 저장
5. 주차별 과제 저장
6. 프론트로 보낼 DTO 반환
```

### 2. 하드코딩된 값에 이름 부여

기존에는 준비 기간 숫자가 코드에 직접 들어가 있었다.

```text
case IMMEDIATE_APPLY -> 4;
case PREPARE_THEN_APPLY -> 8;
case LONG_TERM_PREPARE -> 12;
```

리팩토링 후에는 의미가 드러나는 상수로 변경했다.

```text
IMMEDIATE_APPLY_DURATION_WEEKS
PREPARE_THEN_APPLY_DURATION_WEEKS
LONG_TERM_PREPARE_DURATION_WEEKS
```

이를 통해 4, 8, 12라는 숫자가 각각 어떤 준비 기간을 의미하는지 코드만 보고 알 수 있게 되었다.

### 3. 로드맵 제목과 생성 방식 분리

기존에는 로드맵 제목과 생성 방식 문자열을 한 줄에서 직접 만들었다.

리팩토링 후에는 아래 메서드로 분리했다.

```text
buildGenerationMode()
buildRoadmapTitle()
```

이렇게 분리하면 `saveRoadmap()`은 로드맵 저장 흐름에 더 집중할 수 있다.

### 4. 과제 진행률 계산 분리

기존에는 `toDto()` 안에서 완료 과제 수, 진행 중 과제 수, 완료율을 직접 계산했다.

리팩토링 후에는 `TaskProgress`로 묶었다.

```text
TaskProgress progress = calculateTaskProgress(tasks);
```

`TaskProgress`가 담는 값은 다음과 같다.

```text
totalTaskCount
completedTaskCount
inProgressTaskCount
completionRate
```

이제 `toDto()`는 DTO 변환 흐름에 집중하고, 진행률 계산은 별도 메서드에서 담당한다.

### 5. 코드 구역 주석 추가

파일을 처음 보는 사람이 구조를 빠르게 파악할 수 있도록 구역 주석을 추가했다.

```text
주요 기능
로드맵 생성
로드맵 내용 구성
Entity 변환
상태값 검증
통계 계산
```

## 현재 PlannerService 구조

```text
PlannerService

1. 주요 기능
   - createFromDiagnosis()
   - getRoadmap()
   - getUserRoadmaps()
   - updateTaskStatus()

2. 로드맵 생성
   - findExistingRoadmap()
   - findDiagnosis()
   - saveRoadmap()
   - saveTasks()

3. 로드맵 내용 구성
   - buildSummary()
   - durationWeeks()
   - buildGenerationMode()
   - buildRoadmapTitle()

4. Entity 변환
   - toTask()
   - toDto()
   - toTaskDto()

5. 상태값 검증
   - normalizeStatus()

6. 통계 계산
   - calculateTaskProgress()
   - assignSortOrder()
   - countTasksByStatus()
   - calculateCompletionRate()
   - findNextAction()

7. 내부 데이터 묶음
   - TaskProgress
```

## 변경하지 않은 것

이번 리팩토링에서는 기능 변경을 하지 않았다.

```text
API 주소 변경 없음
DTO 필드 변경 없음
프론트 코드 변경 없음
DB Entity 변경 없음
status 값 변경 없음
```

기존에 사용하던 상태값도 그대로 유지했다.

```text
TODO
IN_PROGRESS
DONE
```

## 검증 결과

백엔드 빌드 확인을 진행했다.

```text
mvn test
BUILD SUCCESS
```

현재 프로젝트에는 테스트 소스가 없어 실제 테스트 실행은 없었지만, 백엔드 컴파일은 정상 통과했다.

## 코드 리뷰 설명 요약

```text
이번 리팩토링은 커리어 개발 플래너의 핵심 서비스인 PlannerService의 가독성을 개선한 작업입니다.
기존에는 로드맵 생성, 과제 생성, 완료율 계산, DTO 변환 로직이 한 파일 안에서 길게 이어져 있어 흐름을 파악하기 어려웠습니다.
이를 역할별 private 메서드로 분리하고, 하드코딩된 숫자와 문자열에 의미 있는 이름을 부여했습니다.
또한 과제 진행률 계산 결과를 TaskProgress로 묶어 DTO 변환 로직이 더 명확해지도록 정리했습니다.
기능, API, DTO, DB 구조는 변경하지 않았습니다.
```

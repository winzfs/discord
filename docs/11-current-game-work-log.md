# 11. 현재 게임 작업 로그

## 2026-06-06 작업

## 전투 결과 화면

### 연결 파일

```text
apps/web/src/game-client/pixi/pixiFinalResultView.ts
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
```

### 동작

최종 전투 상태가 다음 중 하나가 되면 결과 패널을 표시합니다.

```text
failed
cleared
```

결과 패널 표시 내용:

```text
전투 종료 제목
결과 등급 배지
별점
결과 메시지
클리어 웨이브 카드
처치 수 카드
점수 카드
로비 보상 골드 카드
로비 보상 보석 카드
다시 도전 버튼
로비로 버튼
```

버튼 동작:

```text
다시 도전: 현재 /play 화면 새로고침
로비로: /lobby로 이동
```

## 전투 방식 변경: 몬스터 수 기반 순환 모드

### 새 규칙

```text
몬스터는 경로 끝에서 사라지지 않습니다.
몬스터는 필드 외곽 경로를 계속 순환합니다.
전투 타이머가 0이 되면 기존 몬스터는 유지되고 다음 웨이브 몬스터가 추가됩니다.
상단 기존 HP 게이지는 현재 몬스터 수 게이지로 사용합니다.
살아있는 몬스터 수가 100마리 이상이 되면 게임 오버입니다.
```

### 이전 방식 폐기

이전 구조는 몬스터가 오른쪽 아래 출구에 도달하면 제거되고 HP를 깎는 방식이었습니다.

```text
출구 도착
몬스터 제거
HP 감소
HP 0이면 패배
```

현재 전투 방향과 맞지 않아 해당 방식은 폐기합니다.

## 변경 파일

```text
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/createPixiGame.ts
```

## 변경 내용

### 몬스터 이동

```text
출구 도착 시 삭제하지 않음
출구 도착 시 HP를 깎지 않음
progress가 1 이상이 되면 progress % 1로 다시 순환
기존 exitQueued/leaked 기반 출구 처리 로직은 새 이동 흐름에서 사용하지 않음
```

관련 파일:

```text
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
```

### 경로

```text
오른쪽 아래에서 끝나는 열린 경로를 폐기
필드 외곽 한 바퀴를 도는 순환 경로로 복구
```

관련 파일:

```text
apps/web/src/game-client/pixi/pixiPathRuntime.ts
```

### 상단 게이지

```text
기존 lives / maxLives 표시 자리를 몬스터 수 / 100으로 재사용
현재 표시는 ENEMY n / 100
몬스터를 처치하면 숫자가 줄어듦
새 웨이브가 추가되면 숫자가 늘어남
```

관련 파일:

```text
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
apps/web/src/game-client/pixi/pixiHudView.ts
```

### 게임 오버 조건

```text
살아있는 몬스터 수가 100 이상이면 failed 처리
100마리 도달 시 남은 몬스터 view를 정리하고 결과 처리로 이동
```

관련 파일:

```text
apps/web/src/game-client/pixi/createPixiGame.ts
```

## 관련 커밋

```text
4caf9efd844f798fafca104d85bfe42fa4067d96
2cdc83c7f39717c4c7efbd7c14b6acba22a2f529
9c6643c13bd9fb42e1a4436299471954a1e6ac19
b109f3060177891d2120389717eebbdaae905b25
05000dc541e44ee2ca71aece846f467f96072a0b
72f4e8822056e4861878a4d9bf6c7c95e8c76b1c
```

## 타입/빌드 점검 메모

이 환경에서는 아래 명령을 직접 실행하지 못했습니다.

```bash
pnpm typecheck
pnpm build:web
pnpm dev:web
```

코드 기준으로 확인한 주요 타입 변경점:

```text
updateActiveEnemies 옵션에서 invalidateControls, invalidateHud, floatText 제거
createPixiGame.ts의 updateActiveEnemies 호출부는 getPathPoint만 전달
상단 HUD는 기존 lives/maxLives 필드명을 재사용하지만 실제 값은 몬스터 수 / 100
ActiveEnemy의 leaked/exitQueued 필드는 타입에 남아 있지만 새 이동 로직에서는 사용하지 않음
```

## 확인할 항목

```text
/play 몬스터가 오른쪽 아래에서 사라지지 않고 계속 도는지
/play 타이머가 0이 되면 기존 몬스터가 남은 상태로 다음 웨이브가 추가되는지
/play 상단 게이지가 ENEMY n / 100으로 보이는지
/play 몬스터를 처치하면 게이지 숫자가 줄어드는지
/play 몬스터가 100마리 이상이 되면 게임 오버 결과창이 뜨는지
/play 기존 HP 감소/출구 제거 문구가 더 이상 뜨지 않는지
```

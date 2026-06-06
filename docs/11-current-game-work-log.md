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

```text
출구 도착
몬스터 제거
HP 감소
HP 0이면 패배
```

현재 전투 방향과 맞지 않아 해당 방식은 폐기합니다.

## 난이도 조정

### 몬스터 기본 능력치 상향

관련 파일:

```text
packages/game/src/data/enemies.ts
```

변경 방향:

```text
기본 몬스터 체력 상향
빠른 몬스터 체력/속도 상향
탱커 몬스터 체력 상향
엘리트 몬스터 체력/속도 상향
보스 체력/속도 상향
```

주요 변경:

```text
bug-grunt: HP 42 -> 58, speed 0.82 -> 0.86
ping-runner: HP 34 -> 48, speed 1.18 -> 1.26
lag-chunk: HP 120 -> 170, speed 0.58 -> 0.62
elite-bug: HP 210 -> 310, speed 0.72 -> 0.78
server-crasher: HP 620 -> 960, speed 0.48 -> 0.52
```

### 웨이브 압박 상향

관련 파일:

```text
packages/game/src/data/waves.ts
```

변경 방향:

```text
일반 웨이브 기본 몬스터 수 증가
일반 웨이브 스폰 간격 단축
추가 몬스터 그룹 수량 증가
보스 웨이브의 보조 몬스터 수 증가
후반 웨이브의 탱커/엘리트 압박 증가
```

주요 변경:

```text
일반 웨이브 기본 수량: 6 + wave * 1.55 -> 8 + wave * 1.85
일반 메인 스폰 최소 간격: 360ms -> 260ms
보스 보조 몬스터 수량: 4 + wave / 2.8 -> 6 + wave / 2.4
후반 추가 그룹 수량/스폰 간격 상향
```

### 신화 조합 난이도 상향

관련 파일:

```text
packages/game/src/data/mythicRecipes.ts
```

변경 방향:

```text
대부분의 신화 조합을 2~3재료 구조에서 4재료 구조로 변경
핵심 영웅 재료 수량 증가
희귀/영웅 등급 조건 추가
일부 조합에 역할 조건 재료 추가
```

예시:

```text
트레이서: spark-runner 3 + pulse-ranger 2 + rare damage 2 + epic damage 1
겐지: spark-runner 2 + overclock-tech 2 + epic damage 2 + rare support 1
D.Va: barrier-guard 2 + railgun-ace 1 + epic damage 2 + rare tank 1
일리아리: plasma-mage 2 + field-medic 2 + legendary support 1 + epic support 2
```

## 타입/잔재 정리

### 몬스터 수 기반 실패 상태 보존

관련 파일:

```text
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
```

수정 내용:

```text
finishAutoWave()에서 refs.state.status === failed 상태를 보존
기존 lives <= 0 기준 실패 판정이 100마리 게임오버 상태를 덮지 않도록 수정
failed 상태에서는 남은 몬스터가 있어도 결과 처리로 진입할 수 있도록 보정
```

## 변경 파일

```text
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
packages/game/src/data/enemies.ts
packages/game/src/data/waves.ts
packages/game/src/data/mythicRecipes.ts
```

## 관련 커밋

```text
4caf9efd844f798fafca104d85bfe42fa4067d96
2cdc83c7f39717c4c7efbd7c14b6acba22a2f529
9c6643c13bd9fb42e1a4436299471954a1e6ac19
b109f3060177891d2120389717eebbdaae905b25
05000dc541e44ee2ca71aece846f467f96072a0b
72f4e8822056e4861878a4d9bf6c7c95e8c76b1c
410a93ec22b2249add6d93b36fc2bf1c25d64186
75256e88619941cffe0861476727081fd8e9f65a
fb85b874087d42770ef28d55851b83051ed12447
3f7670db73fc4ccc84a9ccdbcd9b15982d9bdfb4
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
mythicRecipes 재료 수량 증가는 기존 mythicCraftSystem의 pickIngredients 구조에서 처리 가능
```

## 확인할 항목

```text
/play 몬스터가 오른쪽 아래에서 사라지지 않고 계속 도는지
/play 타이머가 0이 되면 기존 몬스터가 남은 상태로 다음 웨이브가 추가되는지
/play 상단 게이지가 ENEMY n / 100으로 보이는지
/play 몬스터를 처치하면 게이지 숫자가 줄어드는지
/play 몬스터가 100마리 이상이 되면 게임 오버 결과창이 뜨는지
/play 기존 HP 감소/출구 제거 문구가 더 이상 뜨지 않는지
/play 초반 웨이브가 너무 쉽지 않은지
/play 중후반에 100마리 제한 압박이 생기는지
/lobby 또는 /play 신화 조합 UI에서 강화된 재료 조건이 정상 표시되는지
/play 강화된 신화 조합 재료가 정상 소모되는지
```

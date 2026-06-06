# 22. 제어 스킬 체계 개편

## 1. 목적

신화 등급 이하 유닛의 스킬 이펙트가 너무 화려하게 보이는 문제를 줄이고, 제어형 유닛의 스킬 체계를 명확하게 분리했습니다.

이번 기준:

```text
신화 미만: 이펙트는 작고 얇게
단일 제어: 맞은 적 1마리만 제어
작은 영역 제어: 지형에 작은 제어 장판 생성
제어 중인 적: 효과 시간 동안 색상 변경
```

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiBaseSkillFxRuntime.ts
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
apps/web/src/game-client/pixi/pixiControlEffectRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyView.ts
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/createPixiGame.ts
```

## 3. 제어 스킬 분류

### 3.1 단일 제어

스킬을 맞춘 적 1마리에게만 적용됩니다.

대상 태그:

```text
slow
freeze
debuff
mark
vulnerable
```

효과:

- 맞은 적 1마리만 감속 또는 정지
- 효과 시간 동안 적 색상 틴트 적용
- 빙결 계열은 짧은 시간 정지에 가깝게 처리

### 3.2 작은 영역 제어

스킬이 발동된 지점에 작은 제어 장판을 만듭니다.

대상 태그:

```text
grouping
gravity
```

효과:

- 지형에 작은 원형 장판 생성
- 장판 안에 들어온 적에게 감속 적용
- 장판 안의 적은 효과 시간 동안 보라/푸른 계열로 틴트
- 장판 지속시간이 끝나면 자동 제거

## 4. 이펙트 톤 다운

신화 미만 공통 이펙트는 다음 기준으로 줄였습니다.

- 링 반경 축소
- 선 두께 축소
- 지속시간 축소
- 알파값 감소
- 코인/지원/타격 이펙트 파티클 수 감소

신화 유닛 고유 이펙트는 기존처럼 더 화려한 방향으로 유지합니다.

## 5. 제어 중 색상 표시

제어 상태에 걸린 적은 `controlTintUntil` 동안 색상이 바뀝니다.

현재 색상 기준:

```text
단일 감속/제어: 밝은 하늘색
빙결: 더 옅은 얼음색
영역 제어/중력: 보라색
```

## 6. 구현 방식

### 6.1 단일 제어

`applySingleControl()`이 대상 적에게 다음 상태를 부여합니다.

```text
controlSlowUntil
controlSlowMultiplier
controlTintUntil
controlTintColor
sleepUntil
```

### 6.2 영역 제어

`createControlZone()`이 `refs.controlZones`에 장판을 추가합니다.

이동 런타임은 매 틱마다 다음을 처리합니다.

```text
updateControlZones()
updateEnemyControlVisual()
getEnemyControlSpeedMultiplier()
```

## 7. 테스트 체크리스트

- 신화 미만 스킬 이펙트가 과하게 번쩍이지 않는지 확인
- slow/freeze/debuff 계열은 맞은 적 1마리만 제어되는지 확인
- grouping 계열은 작은 장판이 생성되는지 확인
- 장판 안에 들어온 적이 느려지는지 확인
- 제어 중인 적의 색상이 바뀌는지 확인
- 제어 시간이 끝나면 적 색상이 원래대로 돌아오는지 확인
- 장판 시간이 끝나면 그래픽이 제거되는지 확인
- 신화 유닛 고유 이펙트는 기존대로 유지되는지 확인

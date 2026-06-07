# 14. 유닛별 공격속도 적용 브리핑

## 1. 목적

기존 전투 구조에서는 영웅 데이터의 `attackSpeed` 수치가 UI/데이터에는 존재했지만, 실제 전투 공격 주기는 전역 `attackTimer`에 묶여 있었습니다.

이번 수정으로 유닛별 공격 쿨타임을 추가해 `attackSpeed`가 실제 공격 빈도에 반영되도록 변경했습니다.

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/createPixiGame.ts
```

## 3. 구현 내용

### 3.1 GameRefs 공격 쿨타임 상태 추가

```ts
heroAttackCooldowns: Record<string, number>
```

유닛 `instanceId`별 남은 공격 쿨타임을 저장합니다.

### 3.2 공격 주기 계산

```text
공격 간격 = 0.48초 / attackSpeed * 전역 공격속도 배율
```

- `attackSpeed`가 높을수록 더 자주 공격합니다.
- 최소 공격 간격은 0.12초입니다.
- 키리코 여우길 같은 전역 공격속도 배율은 `getAttackIntervalMultiplier(refs)`를 통해 반영됩니다.

### 3.3 전투 tick 변경

기존에는 `createPixiGame.ts`의 전역 `attackTimer`가 0 이하일 때만 모든 유닛 공격을 처리했습니다.

현재는 combat phase에서 매 tick마다 다음을 호출합니다.

```ts
spawnAttackEffects(refs, options, deltaSeconds)
```

`spawnAttackEffects()` 내부에서 각 유닛의 쿨타임을 감소시키고, 준비된 유닛만 공격합니다.

### 3.4 공격자 제한 보정

한 tick에 공격 이펙트가 과도하게 생성되지 않도록 최대 공격자 수는 10명으로 제한합니다.

단, 제한에 걸려도 모든 유닛의 쿨타임은 계속 감소하도록 보정했습니다.

### 3.5 추가 적용

최근 추가된 일반 유닛 스프라이트도 공격 모션 대상에 포함했습니다.

- `slow-bot`
- `charge-helper`

## 4. 확인 필요

```bash
pnpm typecheck
pnpm build:web
```

브라우저 확인 항목:

- 공격속도 1.2 이상 유닛이 0.8 이하 유닛보다 더 자주 공격하는지
- 키리코 여우길/공격속도 버프 중 공격 빈도가 증가하는지
- 유닛 수가 많을 때 프레임 드랍이 심하지 않은지
- 윈스턴/자리야처럼 특수 공격 이펙트가 있는 영웅도 정상 쿨타임으로 공격하는지
- `slow-bot`, `charge-helper` 공격 모션이 표시되는지

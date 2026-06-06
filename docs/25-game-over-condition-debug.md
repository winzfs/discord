# 25. Pixi 게임오버 조건 점검

## 1. 배경

웨이브 23 부근에서 화면상 `ENEMY 100 / 100`이 아닌 것처럼 보였는데도 전투 종료가 발생했다는 제보가 있었습니다.

기존 설명은 `ENEMY 100` 도달만을 기준으로 했지만, 실제 플레이 화면에서는 실패 처리 직후 적 목록이 비워지면서 `ENEMY 0 / 100`처럼 보일 수 있습니다.

## 2. 현재 Pixi 실시간 게임오버 조건

현재 Pixi 실시간 전투에서 직접 `failed` 상태로 바꾸는 핵심 조건은 다음입니다.

```text
살아있는 적 수 >= 100
```

관련 코드:

```text
createPixiGame.ts
ACTIVE_ENEMY_LIMIT = 100
checkEnemyCountLimit()
```

## 3. 혼동 원인

기존 로직은 실패 조건을 만족하면 즉시 다음을 수행했습니다.

```text
state.status = failed
모든 activeEnemies alive = false
destroyActiveEnemy()
activeEnemies = []
finishAutoWave()
최종 결과창 표시
```

그래서 플레이어가 보는 순간에는 이미 적 목록이 비워져 `ENEMY 0 / 100`으로 보일 수 있습니다.

## 4. 보강 내용

실패 시점의 원인을 저장하도록 추가했습니다.

```ts
gameOverReason = {
  type: "enemy_limit",
  enemyCount,
  enemyLimit,
  wave,
}
```

결과창에는 다음 형태로 표시됩니다.

```text
종료 사유: 적 누적 초과 100/100
```

이 표시가 나오면 실제로는 순간적으로 적 수 제한에 도달한 것입니다.

## 5. 적용 파일

```text
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiFinalResultView.ts
```

## 6. 다음 점검 포인트

다음 플레이에서 웨이브 23 전후 종료가 다시 발생하면 결과창의 종료 사유를 확인합니다.

- `종료 사유: 적 누적 초과 100/100`이 보이면 실제 원인은 enemy limit입니다.
- `종료 사유: 방어 실패`이 보이면 다른 실패 경로가 존재하는 것이므로 추가 검색이 필요합니다.

## 7. 개선 후보

게임적으로는 단순히 100마리 즉시 종료보다 아래 방식이 더 자연스러울 수 있습니다.

```text
적 100마리 도달 시 즉시 종료 대신 경고 표시
3초 이상 100마리 유지 시 종료
또는 100마리 초과분만 생명 피해로 전환
또는 ENEMY 한도를 120~150으로 상향
```

# 12. Pixi 전투 런타임 분리 메모

## 이번 작업

`createPixiGame.ts`에 남아 있던 전투 관련 helper를 분리하기 위한 첫 단계로 다음 파일을 추가했습니다.

```text
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

현재 추가된 helper:

- `getHeroDamage`
- `getBoardFirepower`
- `getRoleAccent`
- `pickAttackTarget`
- `applyTankSlow`
- `findSplashTargets`

## 의도

기존 `/play` PixiJS 클라이언트를 새로 만들지 않고, 기존 동작을 유지한 채 작은 단위로 `createPixiGame.ts`의 책임을 줄이는 것이 목표입니다.

이번 파일은 전투 계산/타겟팅/역할군 효과처럼 PixiJS 화면 객체와 직접 결합하지 않아도 되는 로직을 먼저 담습니다.

## 다음 연결 패치

다음 커밋에서는 `createPixiGame.ts`에서 아래 작업을 진행합니다.

1. `@discord-random-defense/game` import에서 `getAllBoardHeroes`, `getHeroById` 직접 사용을 줄입니다.
2. `HeroRole` type import가 더 이상 필요 없으면 제거합니다.
3. `pixiCombatRuntime.ts`에서 다음 helper를 import합니다.
   - `getBoardFirepower`
   - `getHeroDamage`
   - `getRoleAccent`
   - `pickAttackTarget`
   - `applyTankSlow`
   - `findSplashTargets`
4. 기존 `roleAccent`, `getHeroDamage`, `pickAttackTarget`, `applyTankSlow` 함수를 제거합니다.
5. `applySupportSplash`는 `findSplashTargets`를 사용하도록 단순화합니다.
6. `/play`에서 다음 회귀 테스트를 진행합니다.
   - 상단 화력 표시 정상
   - 유닛 투사체 발사 정상
   - 딜러 보스 우선 타겟팅 정상
   - 탱커 감속 적용 정상
   - 지원가 주변 스플래시 피해 정상

## 주의

`createPixiGame.ts`는 큰 파일이므로 전체 교체 방식보다 작은 연결 패치를 권장합니다.

로컬에서는 반드시 다음 명령으로 확인합니다.

```bash
pnpm typecheck
pnpm dev:web
```

# 33-3. 정커 고철총잡이 최종 적용 체크

정커 고철총잡이 스프라이트 적용을 완료했습니다.

```text
heroId: scrap-gunner
asset: apps/web/public/assets/heroes/junkgunner.png
```

적용 위치:

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/components/lobby/LobbyHeroPortrait.tsx
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

`pixiCombatRuntime.ts`의 공격 모션 대상에도 `scrap-gunner`가 포함되어야 합니다.

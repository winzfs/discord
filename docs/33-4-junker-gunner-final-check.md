# 33-4. 정커 고철총잡이 최종 매핑

정커 고철총잡이 스프라이트 적용 완료.

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

확인 기준:

```text
로비 영웅카드에서 첫 대기 행 표시
전투 보드에서 스프라이트 렌더링
공격 시 공격 행으로 전환
```

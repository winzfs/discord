# 33. 정커 고철총잡이 junkgunner.png 스프라이트 적용

## 1. 목적

`apps/web/public/assets/heroes/junkgunner.png`에 추가된 정커 고철총잡이 스프라이트 시트를 로비와 전투에 적용했습니다.

대상 유닛:

```text
heroId: scrap-gunner
displayName: 정커 고철총잡이
asset: /assets/heroes/junkgunner.png
```

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/components/lobby/LobbyHeroPortrait.tsx
```

## 3. 전투 적용

`pixiHeroSpriteView.ts`에 다음 매핑을 추가했습니다.

```text
scrap-gunner → /assets/heroes/junkgunner.png?v=20260607-junkgunner1
```

전투 보드에서는 기존 영웅들과 같은 4행 스프라이트 시트 구조를 사용합니다.

```text
1행: 왼쪽 대기
2행: 오른쪽 대기
3행: 왼쪽 공격
4행: 오른쪽 공격
```

`SPRITE_HERO_IDS`에도 `scrap-gunner`를 추가해서 이미지 렌더링 대상에 포함했습니다.

## 4. 로비 적용

`LobbyHeroPortrait.tsx`에 다음 매핑을 추가했습니다.

```text
scrap-gunner → /assets/heroes/junkgunner.png?v=20260607-junkgunner1
```

로비 영웅카드에서는 전체 시트를 그대로 보여주지 않고, 기존 `hero-sprite-portrait` / `hero-idle-sprite` CSS로 첫 대기 행만 보이게 자릅니다.

## 5. 남은 점검

`pixiCombatRuntime.ts`의 공격 모션 대상 목록에도 `scrap-gunner`를 추가해야 공격 시 3~4행 공격 프레임으로 전환됩니다.

전투 파일은 큰 파일 전체 교체 방식이라, 다음 변경에서 해당 한 줄만 안전하게 반영합니다.

## 6. 테스트 체크리스트

- 로비 영웅 카드에서 정커 고철총잡이가 글자 대신 이미지로 보이는지 확인
- 로비 카드에서 전체 시트가 아니라 첫 대기 행만 보이는지 확인
- 전투 보드에서 정커 고철총잡이가 이미지로 보이는지 확인
- 공격 모션 대상 추가 후 공격 시 공격 행으로 바뀌는지 확인

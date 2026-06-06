# 29. 오버워치 신병 private.png 스프라이트 적용

## 1. 목적

`apps/web/public/assets/heroes/private.png`에 추가된 오버워치 신병 스프라이트 시트를 로비와 전투에 모두 적용했습니다.

대상 유닛:

```text
heroId: spark-runner
displayName: 오버워치 신병
asset: /assets/heroes/private.png
```

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/components/lobby/LobbyHeroPortrait.tsx
apps/web/src/styles/lobby.css
```

## 3. 전투 적용

`pixiHeroSpriteView.ts`에 다음 매핑을 추가했습니다.

```text
spark-runner → /assets/heroes/private.png?v=20260607-private1
```

전투 보드에서는 기존 영웅들과 같은 4행 스프라이트 시트 구조를 사용합니다.

```text
1행: 왼쪽 대기
2행: 오른쪽 대기
3행: 왼쪽 공격
4행: 오른쪽 공격
```

`SPRITE_HERO_IDS`에도 `spark-runner`를 추가해서 실제 이미지 렌더링 대상에 포함했습니다.

## 4. 공격 모션 적용

`pixiCombatRuntime.ts`의 `SPRITE_ATTACK_HERO_IDS`에 `spark-runner`를 추가했습니다.

따라서 오버워치 신병도 공격 시 다음 처리를 탑니다.

```text
공격 방향 계산
공격 행 프레임 표시
공격 후 해당 방향 대기 유지
3초 후 왼쪽 대기 복귀
```

## 5. 로비 적용

기존 로비 영웅 카드 이미지는 `LobbyHeroPortrait.tsx`에서 신화 영웅 중심으로 처리했습니다.

변경 후:

```text
HERO_IDLE_SPRITES에 spark-runner 추가
SPRITE_PORTRAIT_IDS에 spark-runner 추가
일반 hero-sprite-portrait / hero-idle-sprite 클래스 사용
```

## 6. 로비 카드 스프라이트 자르기

영웅 카드는 전체 스프라이트 시트를 그대로 보여주지 않고, CSS로 첫 번째 대기 행만 보이게 자릅니다.

```text
.hero-sprite-portrait { overflow: hidden }
.hero-idle-sprite { height: 365%; top: 12px }
```

기존 `mythic-hero-portrait`, `mythic-hero-idle-sprite` 클래스와 호환되도록 CSS 별칭도 유지했습니다.

## 7. 테스트 체크리스트

- 로비 영웅 카드에서 오버워치 신병이 글자 대신 이미지로 보이는지 확인
- 로비 카드에서 전체 시트가 아니라 첫 대기 행만 보이는지 확인
- 전투 보드에서 오버워치 신병이 이미지로 보이는지 확인
- 오버워치 신병이 공격 시 공격 행으로 바뀌는지 확인
- 공격 후 해당 방향 대기 자세를 유지하는지 확인
- 3초간 공격하지 않으면 왼쪽 대기로 돌아오는지 확인

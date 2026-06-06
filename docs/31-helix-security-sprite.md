# 31. 헬릭스 경비병 helixsecurity.png 스프라이트 적용

## 1. 목적

`apps/web/public/assets/heroes/helixsecurity.png`에 추가된 헬릭스 경비병 스프라이트 시트를 로비와 전투에 모두 적용했습니다.

대상 유닛:

```text
heroId: rookie-guard
displayName: 헬릭스 경비병
asset: /assets/heroes/helixsecurity.png
```

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/components/lobby/LobbyHeroPortrait.tsx
```

## 3. 전투 적용

`pixiHeroSpriteView.ts`에 다음 매핑을 추가했습니다.

```text
rookie-guard → /assets/heroes/helixsecurity.png?v=20260607-helixsecurity1
```

전투 보드에서는 기존 영웅들과 같은 4행 스프라이트 시트 구조를 사용합니다.

```text
1행: 왼쪽 대기
2행: 오른쪽 대기
3행: 왼쪽 공격
4행: 오른쪽 공격
```

`SPRITE_HERO_IDS`에도 `rookie-guard`를 추가해서 이미지 렌더링 대상에 포함했습니다.

## 4. 공격 모션 적용

`pixiCombatRuntime.ts`의 `SPRITE_ATTACK_HERO_IDS`에 `rookie-guard`를 추가했습니다.

따라서 헬릭스 경비병도 공격 시 다음 처리를 탑니다.

```text
공격 방향 계산
공격 행 프레임 표시
공격 후 해당 방향 대기 유지
3초 후 왼쪽 대기 복귀
```

## 5. 로비 적용

`LobbyHeroPortrait.tsx`에 다음 매핑을 추가했습니다.

```text
rookie-guard → /assets/heroes/helixsecurity.png?v=20260607-helixsecurity1
```

로비 영웅카드에서는 전체 시트를 그대로 보여주지 않고, 기존 `hero-sprite-portrait` / `hero-idle-sprite` CSS로 첫 대기 행만 보이게 자릅니다.

## 6. 테스트 체크리스트

- 로비 영웅 카드에서 헬릭스 경비병이 글자 대신 이미지로 보이는지 확인
- 로비 카드에서 전체 시트가 아니라 첫 대기 행만 보이는지 확인
- 전투 보드에서 헬릭스 경비병이 이미지로 보이는지 확인
- 헬릭스 경비병이 공격 시 공격 행으로 바뀌는지 확인
- 공격 후 해당 방향 대기 자세를 유지하는지 확인
- 3초간 공격하지 않으면 왼쪽 대기로 돌아오는지 확인

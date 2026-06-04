# 12. 리팩터링 노트

## 1. 현재 상태 요약

`apps/web/src/pages/LobbyPage.tsx`의 로비 기능은 실제 소스에 반영되었습니다.

현재 로비에서 동작하는 기능:

- 상점 무료 보석 수령
- 유료 상품 구매 시 골드 차감
- 골드 부족 안내
- 영웅 업그레이드 시 골드 차감 및 레벨 증가
- 유물 업그레이드 시 골드 차감 및 레벨 증가
- 난이도 변경 후 `/play?difficulty=`로 전투 진입

로비 패치 스크립트는 더 이상 `build:web`에서 자동 실행하지 않습니다. 필요 시 `refactor:lobby:legacy`로만 수동 실행합니다.

## 2. 남은 빌드 전 패치

현재 `build:web`에 남아 있는 자동 보정은 다음 1개입니다.

```text
scripts/fix-mythic-ingredient-type.mjs
```

이 스크립트는 `apps/web/src/game-client/pixi/createPixiGame.ts` 안의 `ingredientText` 타입 문제를 빌드 전에 보정합니다.

최종 목표는 이 내용도 실제 `createPixiGame.ts`에 반영하고, `build:web`에서 해당 스크립트를 제거하는 것입니다.

## 3. Pixi 클라이언트 문제

`apps/web/src/game-client/pixi/createPixiGame.ts`는 아직 게임 초기화, 보드 입력, 배경 렌더링, 전투, 웨이브, 신화 조합 메뉴, 플로팅 텍스트, 애니메이션 루프를 한 파일에서 많이 담당합니다.

문서 기준상 500줄 이상 파일은 특별한 이유가 없으면 분리해야 하므로, `createPixiGame.ts`는 계속 분리 대상입니다.

## 4. 추가된 Pixi 분리 기반 파일

```text
apps/web/src/game-client/pixi/pixiSharedView.ts
apps/web/src/game-client/pixi/animation/animationManager.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
apps/web/src/game-client/pixi/pixiHeroLabels.ts
```

## 5. Pixi 연결용 1회성 스크립트

```text
scripts/apply-pixi-client-refactor.mjs
```

이 스크립트는 자동 빌드 과정에 연결하지 않습니다.

역할:

- `createPixiGame.ts`의 공통 텍스트/패널/컨테이너 정리 함수를 `pixiSharedView.ts`로 위임
- 애니메이션 타입/추가/갱신 일부를 `animationManager.ts`로 위임
- 몬스터 경로 좌표 계산을 `pixiPathRuntime.ts`로 위임
- 플로팅 텍스트 생성을 `pixiFloatingTextView.ts`로 위임

## 6. 다음 작업 순서

1. 로비 데이터를 `LobbyPage.tsx`에서 분리
2. 로비 화면 컴포넌트를 작은 파일로 분리
3. `fix-mythic-ingredient-type.mjs` 내용을 `createPixiGame.ts`에 직접 반영
4. `build:web`에서 `fix-mythic-ingredient-type.mjs` 제거
5. `createPixiGame.ts`의 배경, 메뉴, 웨이브, 전투 런타임을 단계적으로 분리

## 7. 주의사항

- 기존 동작하는 PixiJS 클라이언트를 새로 만들지 않습니다.
- 기능별로 작게 연결하고 매 단계마다 typecheck/build를 확인합니다.
- `createPixiGame.ts` 전체 교체는 피하고, 검증 가능한 작은 diff로 진행합니다.
- GitHub 도구 응답이 큰 파일을 중간에서 자를 수 있으므로, 대형 파일은 통째로 덮어쓰지 않습니다.

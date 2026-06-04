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

현재 `build:web`은 루트 `prebuild:web`을 통해 다음 통합 스크립트를 먼저 실행합니다.

```text
scripts/apply-pixi-build-patches.mjs
```

현재 통합 스크립트에서 실행하는 자동 보정은 다음과 같습니다.

```text
scripts/fix-floating-text-lifetime.mjs
scripts/add-unit-info-panel.mjs
scripts/fix-mythic-recipe-display.mjs
scripts/add-game-run-submission.mjs
```

이 패치들은 `apps/web/src/game-client/pixi/createPixiGame.ts`에 남아 있는 일부 임시 보정 내용을 빌드 전에 적용합니다.

최종 목표는 빌드 전 패치에 의존하지 않도록 필요한 내용을 실제 소스 파일에 직접 반영하고, `prebuild:web`에서 자동 보정 스크립트를 단계적으로 제거하는 것입니다.

## 3. Pixi 클라이언트 문제

`apps/web/src/game-client/pixi/createPixiGame.ts`는 아직 게임 초기화, 보드 입력, 배경 렌더링, 전투, 웨이브, 신화 조합 메뉴, 플로팅 텍스트, 애니메이션 루프를 한 파일에서 많이 담당합니다.

문서 기준상 500줄 이상 파일은 특별한 이유가 없으면 분리해야 하므로, `createPixiGame.ts`는 계속 분리 대상입니다.

다만 기존에 동작하던 PixiJS 클라이언트를 새로 만들지 않고, 작은 단위로 기능을 분리하고 연결합니다.

## 4. 추가된 Pixi 분리 기반 파일

```text
apps/web/src/game-client/pixi/pixiSharedView.ts
apps/web/src/game-client/pixi/animation/animationManager.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
apps/web/src/game-client/pixi/pixiHeroLabels.ts
apps/web/src/game-client/pixi/pixiGameLayerOrder.ts
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

1. `fix-mythic-recipe-display.mjs` 내용을 `createPixiGame.ts`에 직접 반영
2. `pixiGameLayerOrder.ts`를 `createPixiGame.ts`의 레이어 마운트 코드에 연결
3. 신화 조합 메뉴를 `pixiMythicMenuView.ts`로 분리
4. 유닛 합성/판매 메뉴를 `pixiUnitMenuView.ts`로 분리
5. 웨이브 진행과 적 런타임을 `pixiWaveRuntime.ts`로 분리
6. 각 단계마다 `pnpm typecheck`와 `pnpm build:web`로 확인
7. 원본 소스 반영이 끝난 패치 스크립트부터 `apply-pixi-build-patches.mjs`에서 제거

## 7. 주의사항

- 기존 동작하는 PixiJS 클라이언트를 새로 만들지 않습니다.
- 기능별로 작게 연결하고 매 단계마다 typecheck/build를 확인합니다.
- `createPixiGame.ts` 전체 교체는 피하고, 검증 가능한 작은 diff로 진행합니다.
- GitHub 도구 응답이 큰 파일을 중간에서 자를 수 있으므로, 대형 파일은 통째로 덮어쓰지 않습니다.
- 신화 조합 재료는 등급/역할 기반 표시가 아니라 고유 영웅 `heroId` 기반 표시를 우선합니다.

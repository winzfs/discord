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

## 2. 빌드 전 패치 상태

`build:web`은 더 이상 `prebuild:web` 자동 패치에 의존하지 않습니다.

현재 루트 빌드 스크립트는 다음 구조입니다.

```text
build: pnpm -r build
build:web: pnpm --filter @discord-random-defense/web build
typecheck: pnpm -r typecheck
```

기존 Pixi 빌드 전 패치 내용은 필요한 부분을 실제 소스에 반영했습니다.

반영 완료:

- 플로팅 텍스트 수명/정리 로직
- 신화 레시피 heroId 기반 표시
- 게임 결과 저장 제출 로직
- 레이어 마운트 정리
- 신화 메뉴 UI 분리
- 유닛 메뉴 UI 분리
- 배경/도로/보드 필드 렌더링 분리

검증 완료:

```text
pnpm typecheck
pnpm build:web
```

## 3. Pixi 클라이언트 문제

`apps/web/src/game-client/pixi/createPixiGame.ts`는 아직 게임 초기화, 보드 입력, 전투, 웨이브, 상태 변경 액션, 애니메이션 루프를 한 파일에서 많이 담당합니다.

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
apps/web/src/game-client/pixi/pixiMythicRecipeText.ts
apps/web/src/game-client/pixi/pixiMythicMenuView.ts
apps/web/src/game-client/pixi/pixiUnitMenuView.ts
apps/web/src/game-client/pixi/pixiBackgroundView.ts
```

## 5. Pixi 연결용 1회성 스크립트

```text
scripts/apply-pixi-client-refactor.mjs
scripts/apply-pixi-background-view-refactor.mjs
```

이 스크립트들은 자동 빌드 과정에 연결하지 않습니다.

역할:

- `createPixiGame.ts`의 공통 텍스트/패널/컨테이너 정리 함수를 `pixiSharedView.ts`로 위임
- 애니메이션 타입/추가/갱신 일부를 `animationManager.ts`로 위임
- 몬스터 경로 좌표 계산을 `pixiPathRuntime.ts`로 위임
- 플로팅 텍스트 생성을 `pixiFloatingTextView.ts`로 위임
- 신화 레시피 표시 텍스트를 `pixiMythicRecipeText.ts`로 위임
- 신화 조합 메뉴 UI를 `pixiMythicMenuView.ts`로 위임
- 유닛 합성/판매 메뉴 UI를 `pixiUnitMenuView.ts`로 위임
- 배경/도로/보드 필드 렌더링을 `pixiBackgroundView.ts`로 위임

## 6. 완료된 분리 작업

- `createPixiGame.ts`의 `Text` 직접 생성 일부를 `makePixiText`로 위임
- 공통 패널 생성을 `makePixiPanel`로 위임
- 컨테이너 clear 처리를 `clearPixiContainer`로 위임
- 애니메이션 추가/틱 처리를 `animationManager.ts`로 위임
- 플로팅 텍스트 생성을 `pixiFloatingTextView.ts`로 위임
- 경로 좌표 계산을 `pixiPathRuntime.ts`로 위임
- 레이어 마운트를 `pixiGameLayerOrder.ts`로 위임
- 신화 레시피 표시를 고유 영웅 `heroId` 기반 텍스트로 분리
- 신화 조합 메뉴 UI를 `pixiMythicMenuView.ts`로 분리
- 유닛 합성/판매 메뉴 UI를 `pixiUnitMenuView.ts`로 분리
- 배경/도로/보드 필드 렌더링을 `pixiBackgroundView.ts`로 분리
- `packages/game/src/systems/overchipCallSystem.ts` 타입 오류 수정
- `prebuild:web` 패치 의존 제거

## 7. 다음 작업 순서

1. `createPixiGame.ts`에서 보드 좌표/드래그 런타임을 더 작은 파일로 분리
2. `createPixiGame.ts`에서 웨이브 진행과 적 런타임을 `pixiWaveRuntime.ts` 계열로 분리
3. 상태 변경 액션과 UI 렌더링 경계를 추가 정리
4. 각 단계마다 `pnpm typecheck`와 `pnpm build:web`로 확인
5. 더 이상 사용하지 않는 레거시 리팩터 스크립트 정리

## 8. 주의사항

- 기존 동작하는 PixiJS 클라이언트를 새로 만들지 않습니다.
- 기능별로 작게 연결하고 매 단계마다 typecheck/build를 확인합니다.
- `createPixiGame.ts` 전체 교체는 피하고, 검증 가능한 작은 diff로 진행합니다.
- GitHub 도구 응답이 큰 파일을 중간에서 자를 수 있으므로, 대형 파일은 통째로 덮어쓰지 않습니다.
- 신화 조합 재료는 등급/역할 기반 표시가 아니라 고유 영웅 `heroId` 기반 표시를 우선합니다.
- 전투/웨이브 런타임은 상태 변경 의존성이 커서 메뉴 UI보다 더 작은 단위로 나눠야 합니다.

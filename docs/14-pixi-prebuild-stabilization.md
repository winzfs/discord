# 14. Pixi prebuild 안정화 기록

## 1. 현재 결론

`Apply Pixi Refactor` GitHub Actions 실행 이후, 기존 빌드 전 패치 방식은 대부분 실제 소스 반영 방식으로 전환되었습니다.

현재 `package.json`에는 더 이상 `prebuild:web`이 없습니다.

```json
{
  "build": "pnpm -r build",
  "build:web": "pnpm --filter @discord-random-defense/web build",
  "typecheck": "pnpm -r typecheck"
}
```

또한 기존에 사용하던 `scripts/apply-pixi-build-patches.mjs`는 최신 저장소에서 존재하지 않습니다.

즉 현재 웹 빌드는 빌드 전 Pixi 패치 스크립트를 실행하지 않고, 실제 소스 기준으로 바로 빌드됩니다.

## 2. 해결된 문제

### 2.1 GitHub Actions lockfile 문제

`Apply Pixi Refactor` 워크플로우에서 다음 문제로 실패했습니다.

```text
actions/setup-node@v4
cache: pnpm
Dependencies lock file is not found
```

원인:

- 저장소에 `pnpm-lock.yaml`이 없었습니다.
- 그런데 `.github/workflows/apply-pixi-refactor.yml`의 `setup-node` 단계에서 `cache: pnpm`을 사용했습니다.
- `pnpm install --frozen-lockfile`도 lockfile이 없으면 실패할 수 있는 설정이었습니다.

수정:

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 22

- name: Install
  run: pnpm install --no-frozen-lockfile
```

수정 커밋:

```text
f5592276f7285f7b8f7f7c65e596538a6a5c9dae
```

### 2.2 신화 레시피 표시 충돌

이전에는 `fix-mythic-ingredient-type.mjs`와 `fix-mythic-recipe-display.mjs`가 서로 다른 `ingredientText` 함수 형태를 가정해서 TypeScript 에러가 발생했습니다.

대표 에러:

```text
Expected 3 arguments, but got 1.
```

현재는 `formatMythicRecipeText`가 실제 소스에서 직접 import되어 사용되는 구조로 리팩터되었습니다.

## 3. 현재 `createPixiGame.ts` 반영 상태

현재 `apps/web/src/game-client/pixi/createPixiGame.ts`에는 다음 모듈들이 직접 import되어 있습니다.

```ts
import { submitGameRun } from "../submitGameRun";
import { addPixiAnimation, tickPixiAnimations, type PixiAnimation } from "./animation/animationManager";
import { createFloatingText } from "./pixiFloatingTextView";
import { mountPixiGameLayers } from "./pixiGameLayerOrder";
import { createPixiMythicMenuView } from "./pixiMythicMenuView";
import { createPixiUnitMenuView } from "./pixiUnitMenuView";
import { clearPixiUnitInfoView, drawPixiUnitInfoView } from "./pixiUnitInfoView";
import { formatMythicRecipeText } from "./pixiMythicRecipeText";
import { clearPixiContainer, makePixiPanel, makePixiText } from "./pixiSharedView";
import { getPixiPathPoint } from "./pixiPathRuntime";
import { drawPixiBackgroundView } from "./pixiBackgroundView";
```

즉 다음 기능은 빌드 전 패치가 아니라 실제 소스에 직접 연결된 상태입니다.

- floating text 생성
- Pixi animation manager
- Pixi 레이어 mount
- 신화 메뉴 뷰
- 유닛 메뉴 뷰
- 유닛 정보 뷰
- 신화 레시피 텍스트 표시
- 경로 계산
- 배경 그리기
- 게임 결과 저장 helper import

## 4. 영웅 정보 패널 현재 구조

현재 `createPixiGame.ts`는 `selectedCellIndex` 기반으로 영웅 선택 상태를 관리합니다.

핵심 흐름:

```ts
function clearUnitSelection(refs: GameRefs) {
  refs.selectedCellIndex = null;
  clearPixiUnitInfoView(refs.info);
}

function drawSelectedUnitInfo(refs: GameRefs) {
  if (refs.selectedCellIndex === null) {
    clearPixiUnitInfoView(refs.info);
    return;
  }

  const cell = refs.state.board[refs.selectedCellIndex];
  const hero = cell?.units[cell.units.length - 1];
  if (!cell || !hero) {
    clearUnitSelection(refs);
    return;
  }

  drawPixiUnitInfoView(refs.info, {
    hero,
    stackCount: cell.units.length,
    cellIndex: refs.selectedCellIndex,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
  });
}
```

영웅 터치 시 `showUnitMenu()`에서 다음을 수행합니다.

```ts
clearMenu(refs);
refs.selectedCellIndex = cellIndex;
drawSelectedUnitInfo(refs);
```

합성/판매 실행 전에는 다음 helper로 메뉴와 정보 패널을 같이 닫습니다.

```ts
function clearMenuAndUnitInfo(refs: GameRefs) {
  clearMenu(refs);
  clearUnitSelection(refs);
}
```

## 5. 현재 빌드 구조

현재 `package.json` 기준:

```json
{
  "build": "pnpm -r build",
  "build:web": "pnpm --filter @discord-random-defense/web build",
  "typecheck": "pnpm -r typecheck"
}
```

이전과 달리 다음 항목은 현재 빌드 경로에 없습니다.

- `prebuild:web`
- `scripts/apply-pixi-build-patches.mjs`
- `fix-floating-text-lifetime.mjs` 실행
- `add-unit-info-panel.mjs` 실행
- `fix-mythic-recipe-display.mjs` 실행
- `add-game-run-submission.mjs` 실행

## 6. 현재 남은 확인 포인트

### 6.1 `drawBoard()`에서 정보 패널 유지 여부

현재 `showUnitMenu()`에서 영웅 선택 시 정보 패널은 즉시 그려집니다.

다만 `drawBoard()` 자체에서는 아직 `drawSelectedUnitInfo(refs)`를 매번 호출하지 않습니다.

현재 코드:

```ts
function drawBoard(refs: GameRefs, layout: GameLayout) {
  const metrics = getBoardMetrics(refs, layout);
  drawBoardCells(refs.board, refs.state.board, metrics, (cellIndex) => canMergeStackCell(refs.state, cellIndex), {
    canDrag: !refs.movementLocked,
    onCellPointerDown: (cellIndex, globalX, globalY, cellSize) => beginCellDrag(refs, cellIndex, globalX, globalY, cellSize),
  });
}
```

확인 필요:

- 영웅 선택 후 리렌더가 발생해도 정보 패널이 유지되는지
- 합성/판매/이동 후 선택 정보가 올바르게 닫히는지
- 화면 리사이즈 시 정보 패널이 의도대로 닫히는지

### 6.2 불필요해진 legacy 스크립트 정리

현재 빌드 경로에서는 더 이상 실행되지 않지만, 저장소에 legacy 스크립트가 남아 있을 수 있습니다.

정리 후보:

```text
scripts/fix-floating-text-lifetime.mjs
scripts/add-unit-info-panel.mjs
scripts/fix-mythic-recipe-display.mjs
scripts/add-game-run-submission.mjs
```

주의:

- 바로 삭제하기 전에 검색으로 참조 여부를 확인해야 합니다.
- 다른 workflow나 수동 명령에서 쓰고 있지 않은지 확인해야 합니다.

## 7. 다음 작업 순서

권장 순서:

1. 저장소 전체에서 legacy Pixi patch script 참조 검색
2. 참조가 없으면 legacy patch script 삭제
3. `drawBoard()`에서 선택 정보 패널 유지가 필요한지 실제 플레이 기준 확인
4. 필요하면 `drawBoard()` 마지막에 `drawSelectedUnitInfo(refs)` 추가
5. 배포 후 `/play`에서 조작 확인
6. 문서 재갱신

## 8. 배포 후 확인 항목

배포 후 `/play`에서 확인해야 할 항목:

- Cloudflare Pages `pnpm build:web` 통과
- 피해량/코인 floating text가 누적되지 않고 사라짐
- 영웅 터치 시 정보 패널 표시
- 합성/판매 버튼 정상 작동
- 빈 곳 터치 시 정보 패널 닫힘
- 신화창 내부 터치 시 바로 닫히지 않음
- 신화 레시피가 고유 영웅명 기반으로 표시됨
- 게임 종료 시 기록 저장 메시지 표시

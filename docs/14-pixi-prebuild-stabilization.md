# 14. Pixi prebuild 안정화 기록

## 1. 배경

`/play`의 PixiJS 게임 런타임은 아직 큰 파일인 `createPixiGame.ts`에 많은 로직이 모여 있습니다.

최근 수정 중 일부는 실제 소스 파일로 분리했고, 일부는 아직 빌드 전 패치 스크립트로 `createPixiGame.ts`에 적용하고 있습니다.

현재 빌드 전 패치가 담당하는 핵심 기능:

- 플로팅 텍스트 자동 제거/cleanup
- 영웅 터치 정보 패널 연결
- 메뉴 내부 터치 시 바로 닫히지 않도록 처리
- 신화 레시피 고유 영웅명 표시
- 게임 종료 시 결과 저장 요청

## 2. 최근 빌드 실패 원인과 해결

### 2.1 신화 레시피 표시 충돌

이전에는 `fix-mythic-ingredient-type.mjs`가 먼저 `ingredientText` 함수 시그니처를 변경한 뒤, `fix-mythic-recipe-display.mjs`가 다른 함수 형태를 찾으면서 호출부만 바뀌는 문제가 있었습니다.

결과적으로 TypeScript에서 다음 에러가 발생했습니다.

```text
Expected 3 arguments, but got 1.
```

해결:

- `package.json`의 `prebuild:web`에서 `fix-mythic-ingredient-type.mjs`를 제거했습니다.
- 신화 레시피 표시는 `fix-mythic-recipe-display.mjs`가 직접 처리하도록 유지했습니다.

### 2.2 영웅 정보 패널 패치 중복 실행 문제

`add-unit-info-panel.mjs`는 원본 `createPixiGame.ts` 문자열을 기준으로 패치합니다.

같은 checkout에서 빌드를 두 번 실행하면 이미 패치된 파일을 다시 패치하려다가 실패할 수 있었습니다.

해결:

- `add-unit-info-panel.mjs`에 `alreadyPatched` 검사를 추가했습니다.
- 이미 다음 요소가 들어간 경우 패치를 다시 적용하지 않고 종료합니다.
  - `mountPixiGameLayers`
  - `shouldClearSelectionFromStagePointer`
  - `clearUnitInfoRuntime`
  - `drawUnitInfoRuntime`
  - `selectUnitInfoHeroInCell`
  - `info: Container`
  - `selectedHeroInstanceId`

## 3. 현재 prebuild 실행 상태

현재 `package.json`의 `prebuild:web`은 단일 러너를 실행합니다.

```text
node scripts/apply-pixi-build-patches.mjs
```

현재 `scripts/apply-pixi-build-patches.mjs` 내부 실행 순서:

```text
scripts/fix-floating-text-lifetime.mjs
scripts/add-unit-info-panel.mjs
scripts/fix-mythic-recipe-display.mjs
scripts/add-game-run-submission.mjs
```

주의:

- `apply-pixi-build-patches.mjs`를 패치별 메타데이터가 있는 구조로 바꾸려는 시도는 있었지만, 현재 저장소에는 아직 반영되지 않았습니다.
- 현재 파일은 단순 문자열 배열을 순서대로 실행하는 상태입니다.

## 4. 실제 소스 모듈로 분리된 것

### 4.1 플로팅 텍스트

```text
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
```

역할:

- `createFloatingText`
- `removeEffectChild`
- `cleanupEffectLayer`
- 짧은 수명 floating text 처리
- destroy된 effect child 방어

현재 상태:

- 실제 모듈은 준비되어 있습니다.
- `fix-floating-text-lifetime.mjs`가 이 모듈을 사용하도록 변경되어 있습니다.
- 하지만 `createPixiGame.ts`가 직접 이 모듈을 import하는 상태는 아닙니다.

### 4.2 영웅 정보 패널 관련 모듈

분리된 파일:

```text
apps/web/src/game-client/pixi/pixiUnitSelection.ts
apps/web/src/game-client/pixi/pixiUnitInfoLabels.ts
apps/web/src/game-client/pixi/pixiUnitInfoText.ts
apps/web/src/game-client/pixi/pixiUnitInfoPanelLayout.ts
apps/web/src/game-client/pixi/pixiUnitInfoPanelView.ts
apps/web/src/game-client/pixi/pixiUnitInfoRuntime.ts
apps/web/src/game-client/pixi/pixiGameLayerOrder.ts
apps/web/src/game-client/pixi/pixiStagePointerHandlers.ts
```

역할:

- 선택된 영웅 상태 관리
- 영웅 이름/등급/역할/공격 타입/스탯 텍스트 생성
- 정보 패널 위치 계산
- 정보 패널 그리기
- 정보 패널 런타임 연결
- Pixi 레이어 순서 관리
- stage 빈 곳 터치 판정

현재 상태:

- 실제 로직 대부분은 모듈로 분리되었습니다.
- `add-unit-info-panel.mjs`는 위 모듈들을 import하도록 축소되었습니다.
- 아직 `createPixiGame.ts`에 직접 연결부가 반영된 상태는 아닙니다.

### 4.3 게임 결과 저장

```text
apps/web/src/game-client/submitGameRun.ts
```

역할:

- 게임 종료 상태가 `failed` 또는 `cleared`일 때 `/api/game/runs`로 결과 저장 요청

현재 상태:

- 실제 파일은 분리되어 있습니다.
- `add-game-run-submission.mjs`가 `createPixiGame.ts`에 연결부를 주입합니다.
- 아직 `createPixiGame.ts`가 직접 호출하는 상태는 아닙니다.

## 5. 아직 빌드 전 패치에 남아있는 것

### 5.1 `fix-floating-text-lifetime.mjs`

남은 역할:

- `createPixiGame.ts`에 `pixiFloatingTextView.ts` import 주입
- `floatText` wrapper 주입
- `cleanupEffects` wrapper 주입
- projectile destroy 방식을 effect cleanup 방식으로 교체
- `tick()`에 cleanup 호출 삽입

### 5.2 `add-unit-info-panel.mjs`

남은 역할:

- `GameRefs`에 `info: Container` 추가
- `GameRefs`에 `selectedHeroInstanceId` 추가
- `clearUnitSelection` wrapper 주입
- `drawUnitInfoPanel` wrapper 주입
- `showUnitMenu`에 선택/패널 호출 연결
- `drawBoard`에 패널 redraw 연결
- stage pointerdown에서 빈 곳 터치 시 패널 닫기 연결
- `mountPixiGameLayers(stage, refs)`로 레이어 mount 교체

### 5.3 `fix-mythic-recipe-display.mjs`

남은 역할:

- `ingredientText`를 heroId 우선 표시 형태로 교체
- 레시피 표시 호출부를 `ingredientText(ingredient)` 형태로 교체

### 5.4 `add-game-run-submission.mjs`

남은 역할:

- `submitGameRun` import 주입
- `GameRefs.resultSubmitted` 추가
- 게임 종료 시 한 번만 결과 저장 요청
- 저장 성공/실패 floating text 표시

## 6. 현재 보류된 작업

### 6.1 `createPixiGame.ts` 직접 반영

목표:

- `add-unit-info-panel.mjs` 제거
- 이후 `fix-floating-text-lifetime.mjs`, `fix-mythic-recipe-display.mjs`, `add-game-run-submission.mjs`도 순차 제거

보류 이유:

- `createPixiGame.ts`가 큰 파일이라 전체 파일을 잘못 덮으면 위험합니다.
- 현재 GitHub 커넥터에서 raw 전체 파일 fetch가 막혀, 큰 파일을 안전하게 전체 수정하기 어렵습니다.
- 따라서 현재는 실제 모듈을 먼저 충분히 분리하고, 패치 스크립트의 역할을 점진적으로 줄이는 방식으로 진행 중입니다.

### 6.2 `apply-pixi-build-patches.mjs` 구조화

목표:

- 단순 문자열 배열이 아니라 패치별 id, script, 제거 조건을 가진 구조로 변경

현재 상태:

- 구조화 시도는 있었지만 저장소에는 아직 반영되지 않았습니다.
- 현재 파일은 기존 단순 배열 상태입니다.

## 7. 다음 작업 순서

권장 순서:

1. `apply-pixi-build-patches.mjs`를 패치별 메타데이터 구조로 변경
2. 배포 확인
3. `createPixiGame.ts`에 영웅 정보 패널 연결부를 직접 반영할 수 있는 안전한 방법 재확인
4. 직접 반영이 가능하면 `add-unit-info-panel.mjs`를 패치 목록에서 제거
5. 배포 확인
6. 같은 방식으로 floating text, mythic recipe display, game run submission 순서로 패치 제거

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

# 12. Pixi 클라이언트 리팩터링 노트

## 1. 현재 문제

`apps/web/src/game-client/pixi/createPixiGame.ts`는 아직 게임 초기화, 보드 입력, 배경 렌더링, 전투, 웨이브, 신화 조합 메뉴, 플로팅 텍스트, 애니메이션 루프를 한 파일에서 많이 담당합니다.

문서 기준상 500줄 이상 파일은 특별한 이유가 없으면 분리해야 하므로, `createPixiGame.ts`는 계속 분리 대상입니다.

## 2. 빌드 전 패치 스크립트 위험

현재 루트 `package.json`의 `prebuild:web`은 다음 스크립트를 실행합니다.

```bash
node scripts/refactor-pixi-combat-runtime.mjs \
  && node scripts/fix-floating-text-lifetime.mjs \
  && node scripts/add-unit-info-panel.mjs
```

이 스크립트들은 `createPixiGame.ts`를 문자열 기반으로 직접 수정합니다.

이 방식은 다음 위험이 있습니다.

- 빌드할 때마다 소스 파일이 변형될 수 있습니다.
- 이미 패치된 코드에 다시 패치가 적용되면 실패할 수 있습니다.
- 함수 이름이나 공백이 조금만 바뀌어도 스크립트가 실패할 수 있습니다.
- 실제 소스와 빌드 산출물 사이의 차이를 추적하기 어렵습니다.

따라서 최종 목표는 패치 내용을 실제 TypeScript 모듈로 옮기고, `prebuild:web`에서 소스 변형 스크립트를 제거하는 것입니다.

## 3. 1차로 추가된 분리 파일

다음 파일은 기능 연결 전, 안전한 분리 기반으로 추가했습니다.

```text
apps/web/src/game-client/pixi/pixiSharedView.ts
apps/web/src/game-client/pixi/animation/animationManager.ts
```

### 3.1 `pixiSharedView.ts`

역할:

- 공통 텍스트 생성
- 공통 패널 생성
- Pixi 컨테이너 정리
- Pixi child destroy 보조

향후 `createPixiGame.ts`의 `makeText`, `makePanel`, `clear`를 이 파일로 대체합니다.

### 3.2 `animation/animationManager.ts`

역할:

- 애니메이션 타입 정의
- 애니메이션 추가
- 프레임별 애니메이션 갱신

향후 `createPixiGame.ts`의 `Animation` 타입, `addAnimation`, tick 내부 애니메이션 filter 로직을 이 파일로 대체합니다.

## 4. 다음 작업 순서

한 번에 큰 파일을 갈아엎지 않고 아래 순서로 진행합니다.

1. `pixiSharedView.ts`를 `createPixiGame.ts`에 연결
2. `animationManager.ts`를 `createPixiGame.ts`에 연결
3. `pixiFloatingTextView.ts` 생성 후 플로팅 텍스트/이펙트 cleanup 분리
4. `pixiBackgroundView.ts` 생성 후 배경/경로 렌더링 분리
5. `pixiMythicMenuView.ts` 생성 후 신화 조합 메뉴 분리
6. `pixiWaveRuntime.ts` 생성 후 웨이브 시작/종료/적 스폰 분리
7. `prebuild:web`에서 소스 변형 스크립트 제거
8. `scripts/refactor-pixi-combat-runtime.mjs`, `scripts/fix-floating-text-lifetime.mjs`, `scripts/add-unit-info-panel.mjs` 삭제 또는 archived 처리

## 5. 주의사항

- 기존 동작하는 PixiJS 클라이언트를 새로 만들지 않습니다.
- 기능별로 작게 연결하고 매 단계마다 typecheck/build를 확인합니다.
- `createPixiGame.ts` 전체 교체는 피하고, 검증 가능한 작은 diff로 진행합니다.

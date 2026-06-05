# 10. PixiJS 게임 클라이언트 가이드

## 1. 현재 방향

게임 플레이 화면은 React DOM UI가 아니라 **PixiJS 기반 독립 캔버스 화면**으로 구현합니다.

역할 분리는 다음과 같습니다.

```text
React / Vite
- 홈
- 로그인
- 대시보드
- 랭킹
- 프로필
- 관리자
- /play에 PixiJS host 제공

PixiJS
- 실제 게임 플레이 화면
- /play 전용 전체화면 캔버스
- 전장, 보드, 몬스터, 소환, 이동, 합성, 공격, 웨이브, 이펙트 렌더링

packages/game
- 순수 게임 규칙
- 소환/보드/합성/도박/신화 조합/웨이브/점수 계산 보조 로직
```

## 2. 현재 라우트

현재 게임 관련 라우트는 다음처럼 분리합니다.

```text
/game       일반 웹 레이아웃 안의 게임 안내/시작 페이지
/play       PixiJS 기반 실제 게임 화면
/play-test  테스트 컨트롤이 포함된 PixiJS 게임 화면
/lobby      로비/상점/성장 화면
```

`/play`와 `/play-test`는 `MainLayout` 밖에 있는 독립 화면입니다.

## 3. 현재 구현 상태

현재 `/play`는 단순 placeholder가 아니라 실제 플레이 가능한 PixiJS MVP입니다.

구현된 핵심 기능:

- PixiJS Application 생성 및 전체화면 캔버스 렌더링
- `countdown -> combat -> result` 웨이브 phase 처리
- 5x4 영웅 배치 보드
- 보드 외곽을 도는 몬스터 이동 경로
- 적 개체 생성, 실제 경로 이동, HP바 표시
- 적 누수 시 코어 HP 감소
- 유닛 자동 타겟팅
- 투사체 공격 연출
- 적 HP 감소, 처치, 보상 지급
- 딜러/탱커/지원 역할군별 전투 효과
- 탱커 감속 효과
- 지원형 스플래시 보조 피해
- 보스 우선 타겟팅
- 보스 웨이브 경고 연출
- 웨이브 결과 표시
- 완벽 방어 시 행운석 보상
- 랜덤 유닛 소환
- 소환 비용 증가 및 할인 보정
- 행운석 도박 소환
- 유닛 드래그 이동, 자리 교환, 같은 유닛 중첩
- 셀 3스택 기반 합성
- 전역 등급 합성 로직
- 유닛 판매 메뉴
- 신화 조합 메뉴
- 고유 유닛 재료 기반 신화 조합
- 신화 조합 재료 보유 수 / 필요 수 표시
- 트레이서 스프라이트 공격 방향 연출
- 테스트 모드 컨트롤
- 게임 종료 시 기록 저장 API 호출

## 4. 현재 화면 구조

모바일 기준 권장 화면 구조:

```text
┌────────────────────────────┐
│        WAVE / TIMER         │
│        CORE HP BAR          │
│   화력 / 유닛 수 / 재화      │
├────────────────────────────┤
│    필드 배경 + 외곽 이동길    │
│                            │
│       중앙 영웅 배치판        │
│       5 x 4 필드            │
│                            │
│    길 위 몬스터 이동/전투     │
├────────────────────────────┤
│ [소환] [신화] [도박] [강화] │
│        [웨이브 시작]         │
└────────────────────────────┘
```

## 5. 현재 주요 파일 구조

현재 PixiJS 게임 클라이언트는 다음 파일들로 나뉘어 있습니다.

```text
apps/web/src/pages/GamePage.tsx
apps/web/src/game-client/submitGameRun.ts
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/gameLayout.ts
apps/web/src/game-client/pixi/gameTheme.ts
apps/web/src/game-client/pixi/pixiGameLayerOrder.ts
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
apps/web/src/game-client/pixi/pixiBoardRuntime.ts
apps/web/src/game-client/pixi/pixiBoardRenderRuntime.ts
apps/web/src/game-client/pixi/pixiBoardView.ts
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/pixiControlsView.ts
apps/web/src/game-client/pixi/pixiEnemyRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/pixiWaveRuntime.ts
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
apps/web/src/game-client/pixi/pixiWaveFeedbackRuntime.ts
apps/web/src/game-client/pixi/pixiWaveRewardRuntime.ts
apps/web/src/game-client/pixi/pixiSelectionRuntime.ts
apps/web/src/game-client/pixi/pixiDragRuntime.ts
apps/web/src/game-client/pixi/pixiUnitActionRuntime.ts
apps/web/src/game-client/pixi/pixiControlActionRuntime.ts
apps/web/src/game-client/pixi/pixiMythicMenuView.ts
apps/web/src/game-client/pixi/pixiRunBoostRuntime.ts
apps/web/src/game-client/pixi/pixiProgressBonuses.ts
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiUnitRange.ts
apps/web/src/game-client/pixi/pixiSharedView.ts
apps/web/src/game-client/pixi/animation/animationManager.ts
```

`GamePage.tsx`는 PixiJS를 붙이는 host 역할만 담당합니다.

`createPixiGame.ts`는 아직 Pixi Application 초기화, refs 구성, ticker phase 연결, 이벤트 바인딩, runtime options 조립을 담당합니다. 기능별 구현은 가능한 한 별도 runtime/view 파일로 분리합니다.

## 6. 분리 원칙

현재 구조 개선 원칙:

- `createPixiGame.ts`는 최종적으로 초기화, 조립, cleanup만 담당하도록 줄입니다.
- 화면 배치는 `gameLayout.ts`에서 계산합니다.
- 보드, HUD, 컨트롤, 적, 전투, 웨이브, 드래그, 선택 UI는 별도 파일에서 관리합니다.
- 소환/합성/도박/신화 조합 등 핵심 규칙은 `packages/game`에서 가져옵니다.
- PixiJS 내부에서 게임 규칙을 중복 구현하지 않습니다.
- 단, 현재 실시간 전투/보상/점수 일부는 Pixi runtime에서 직접 갱신하므로 추후 `packages/game` 쪽으로 계산 기준을 모아야 합니다.

## 7. 렌더링 원칙

### 7.1 React와 PixiJS 역할 분리

React:

- 라우팅
- 로그인
- 대시보드
- 랭킹
- 프로필
- 관리자
- `/play`에 PixiJS host 제공

PixiJS:

- 게임 화면 렌더링
- 전장/보드/몬스터/유닛/이펙트
- 터치 입력
- 소환/신화/도박/강화/웨이브 버튼
- 전투 연출

`packages/game`:

- 순수 게임 규칙
- 소환 확률
- 보드/스택/합성 규칙
- 도박/신화 조합 규칙
- 웨이브 데이터
- 점수 계산 보조

### 7.2 DOM 버튼 금지

게임 화면 안에서는 HTML 버튼을 사용하지 않습니다.

게임 내 버튼은 PixiJS `Container`, `Graphics`, `Text`로 직접 그립니다.

이유:

- 모바일 게임 화면처럼 보이게 하기 위해
- 캔버스 전체 렌더링 톤을 통일하기 위해
- 터치 이펙트와 애니메이션을 붙이기 쉽게 하기 위해

### 7.3 에셋 교체 가능성 유지

현재는 도형 기반 유닛/몬스터와 일부 스프라이트를 함께 사용합니다.

이미지 에셋은 다음 흐름으로 교체합니다.

```text
hero.assetKey -> assetManifest -> PixiJS Texture
enemy.assetKey -> assetManifest -> PixiJS Texture
```

`packages/game`은 이미지 경로를 직접 알면 안 됩니다.

## 8. 다음 개선 우선순위

1. `createPixiGame.ts`의 ticker/refs/options 조립 책임 추가 분리
2. 점수/보상 계산 기준을 `packages/game` 쪽으로 이동
3. `durationSeconds` 실제 측정 후 기록 저장
4. 랭킹 저장 전 score/wave/kills 상한 검증 추가
5. `game_runs.suspicious`, `hidden` 컬럼을 활용한 비정상 기록 처리
6. 유닛별 고유 효과 시각화 강화
7. 실제 이미지/스프라이트 에셋 교체 확대
8. 모바일 터치 UX 회귀 테스트

## 9. 확인 체크리스트

기능 추가 후 반드시 다음을 확인합니다.

```bash
pnpm build:web
pnpm typecheck
pnpm dev:web
```

화면 체크:

- `/play` 진입 시 캔버스 정상 표시
- `/play-test` 테스트 컨트롤 정상 표시
- 5x4 보드 표시 정상
- 소환/스택/이동/스왑 정상
- 합성/판매/신화 메뉴 정상
- 적이 외곽 경로를 따라 이동
- 유닛 투사체가 적을 향해 발사
- 적 HP바 감소/처치/코인 보상 정상
- 누수 시 코어 HP 감소 정상
- 웨이브 결과/행운석 보상 정상
- 게임 종료 시 로그인 상태에서 기록 저장 정상

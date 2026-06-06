# 10. PixiJS 게임 클라이언트 가이드

## 1. 현재 방향

게임 플레이 화면은 React DOM UI가 아니라 **PixiJS 기반 독립 캔버스 화면**으로 구현합니다.

로비 화면은 React 기반으로 유지하되, 모바일 게임 로비처럼 보이도록 카드형 UI, 성장/수집/상점/모집 화면을 제공합니다.

```text
React / Vite
- 일반 웹 페이지
- /play에 PixiJS host 제공
- /lobby 로비/상점/성장/영웅 모집 UI 제공

PixiJS
- /play 전용 전체화면 캔버스
- 전장, 보드, 몬스터, 소환, 이동, 합성, 공격, 웨이브, 스킬, 궁극기, 이펙트 렌더링

packages/game
- 순수 게임 규칙
- 소환/보드/합성/도박/신화 조합/웨이브/점수 계산 보조 로직
- 영웅/스킬/적/웨이브/밸런스 데이터
```

## 2. 현재 라우트

```text
/game       일반 웹 레이아웃 안의 게임 안내/시작 페이지
/play       PixiJS 기반 실제 게임 화면
/play-test  테스트 컨트롤이 포함된 PixiJS 게임 화면
/lobby      로비/상점/성장/영웅 모집 화면
```

`/play`와 `/play-test`는 `MainLayout` 밖에 있는 독립 화면입니다.

`/lobby`는 React UI 기반이며, 영웅/유물 수집 성장, 상점, 전투 진입, 영웅 모집 연출을 담당합니다.

## 3. 현재 구현 상태

### 3.1 `/play` 전투 구현 상태

현재 `/play`는 실제 플레이 가능한 PixiJS MVP입니다.

구현된 핵심 기능:

- PixiJS Application 생성 및 전체화면 캔버스 렌더링
- `countdown -> combat -> result` 웨이브 phase 처리
- 시간이 되면 다음 웨이브 자동 시작
- 4x5 영웅 배치 보드
- 보드 외곽을 도는 몬스터 이동 경로
- 적 개체 생성, 실제 경로 이동, HP바 표시
- 적 누수 시 코어 HP 감소
- 유닛 자동 타겟팅
- 영웅별 기본공격 연출
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
- 로비 보유 영웅 풀 기반 전투 소환
- 로비 영웅 레벨 기반 전투 데미지 배율 적용
- 행운석 도박 소환
- 유닛 드래그 이동, 자리 교환, 같은 유닛 중첩
- 셀 3스택 기반 합성
- 전역 등급 합성 로직
- 유닛 판매 메뉴
- 신화 조합 메뉴
- 고유 유닛 재료 기반 신화 조합
- 유닛 정보 패널에 스킬/궁극기 조건과 효과 표시
- 신화 영웅 궁극기 게이지 바 표시
- 공격/시간 경과 기반 궁극기 게이지 충전
- 신화 영웅 스킬 확률 발동
- 신화 영웅 궁극기 발동
- Tracer, Kiriko, D.Va, Zarya, Cassidy, Winston, Genji 스프라이트 시트 적용
- 영웅별 기본공격 고유 FX
- 영웅별 궁극기 고유 FX
- Genji 질풍참 이동형 공격 연출
- Genji 용검 베기형 이펙트
- 적 렌더링을 이모티콘형 도형에서 슬라임/드론형 실루엣으로 개선
- `Graphics` 풀 기반 FX 객체 재사용 최적화
- 테스트 모드 컨트롤
- 테스트 모드 몬스터 체력 배율 옵션
- 게임 종료 시 기록 저장 API 호출

### 3.2 `/lobby` 로비 구현 상태

현재 `/lobby`는 다음 기능을 제공합니다.

- 상단 재화 바
- 로비 스테이지/난이도 표시
- 상점 탭
- 영웅 탭
- 전투 탭
- 유물 탭
- 영웅 상세 패널
- 유물 상세 패널
- 영웅/유물 조각 기반 업그레이드
- 영웅 모집 패널
- 1회 영웅 모집
- 10회 영웅 모집
- 모집 결과 저장
- 모집 결과 2단계 연출 화면
- 모집 결과 카드 표시
- 미보유 영웅 획득 시 즉시 해금
- 중복 영웅 획득 시 조각 누적
- 골드/보석 localStorage 저장
- 상점 구매/무료 보석/뽑기/업그레이드 후 재화 저장

현재 로비 진행 저장은 `localStorage` 기반입니다.

저장되는 항목:

```text
gold
crystals
heroes: id, level, shards, owned
artifacts: id, level, pieces, owned
```

## 4. 현재 화면 구조

### 4.1 `/play` 모바일 전투 화면 구조

```text
┌────────────────────────────┐
│        WAVE / TIMER         │
│        CORE HP BAR          │
│      화력 / 유닛 수          │
├────────────────────────────┤
│    필드 배경 + 외곽 이동길    │
│                            │
│       중앙 영웅 배치판        │
│       4 x 5 필드            │
│                            │
│    길 위 몬스터 이동/전투     │
├────────────────────────────┤
│       행운석 / 코인          │
│        공격력 강화           │
│   [신화] [소환] [도박]       │
└────────────────────────────┘
```

웨이브는 시간이 되면 자동 시작되므로, 전투 중 상시 표시되는 `웨이브 시작` 버튼은 사용하지 않습니다.

### 4.2 `/lobby` 화면 구조

```text
┌────────────────────────────┐
│ 프로필 / 골드 / 보석         │
├────────────────────────────┤
│ 로비 스테이지 / 전투 진입     │
├────────────────────────────┤
│ 알림 메시지                 │
├────────────────────────────┤
│ 탭별 콘텐츠                 │
│ - 상점                      │
│ - 영웅: 모집 패널 + 영웅 목록 │
│ - 전투                      │
│ - 유물                      │
├────────────────────────────┤
│ 하단 탭 네비게이션           │
└────────────────────────────┘
```

영웅 모집 시에는 전체 화면 연출 모달을 띄웁니다.

## 5. 현재 주요 파일 구조

### 5.1 PixiJS 전투 클라이언트

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
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/pixiControlsView.ts
apps/web/src/game-client/pixi/pixiControlButtonPaint.ts
apps/web/src/game-client/pixi/pixiTextStyles.ts
apps/web/src/game-client/pixi/pixiEnemyRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/pixiSkillRuntime.ts
apps/web/src/game-client/pixi/pixiUltimateRuntime.ts
apps/web/src/game-client/pixi/pixiHeroAttackFxRuntime.ts
apps/web/src/game-client/pixi/pixiUltimateFxRuntime.ts
apps/web/src/game-client/pixi/pixiWinstonBeamRuntime.ts
apps/web/src/game-client/pixi/pixiFxPoolRuntime.ts
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
apps/web/src/game-client/pixi/pixiLobbyHeroPool.ts
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiUnitRange.ts
apps/web/src/game-client/pixi/pixiSharedView.ts
apps/web/src/game-client/pixi/animation/animationManager.ts
```

`createPixiGame.ts`는 Pixi Application 초기화, refs 구성, ticker phase 연결, 이벤트 바인딩, runtime options 조립, cleanup을 담당합니다.

`pixiLobbyHeroPool.ts`는 로비 저장 진행도에서 보유 영웅과 영웅 레벨을 읽어 전투 소환 풀과 데미지 배율에 제공하는 어댑터입니다.

### 5.2 로비/모집/성장 파일

```text
apps/web/src/pages/LobbyPage.tsx
apps/web/src/game-lobby/lobbyData.ts
apps/web/src/game-lobby/lobbyProgressStorage.ts
apps/web/src/game-lobby/lobbyRecruit.ts
apps/web/src/components/lobby/LobbyTopBar.tsx
apps/web/src/components/lobby/LobbyStage.tsx
apps/web/src/components/lobby/LobbyBottomNav.tsx
apps/web/src/components/lobby/LobbyViews.tsx
apps/web/src/components/lobby/LobbyDetailPanel.tsx
apps/web/src/components/lobby/LobbyRecruitPanel.tsx
apps/web/src/components/lobby/LobbyRecruitReveal.tsx
apps/web/src/components/lobby/lobbyHeroSkillDetails.ts
apps/web/src/styles/lobby.css
apps/web/src/styles/lobby-polish.css
apps/web/src/styles/lobby-stage-polish.css
apps/web/src/styles/lobby-recruit-reveal.css
```

로비 영웅 모집 규칙은 `lobbyRecruit.ts`에 분리합니다.

모집 UI는 `LobbyRecruitPanel.tsx`, 연출 모달은 `LobbyRecruitReveal.tsx`, 연출 스타일은 `lobby-recruit-reveal.css`에 둡니다.

## 6. 로비 진행도와 전투 연결

### 6.1 저장 구조

`lobbyProgressStorage.ts`는 다음 데이터를 저장합니다.

```text
gold
crystals
heroes: id, level, shards, owned
artifacts: id, level, pieces, owned
```

기존 저장 데이터에 `gold`와 `crystals`가 없어도 기본값으로 병합합니다.

기본 재화:

```text
gold: 13580
crystals: 4550
```

### 6.2 전투 소환 풀

전투 시작 시 `createPixiGame.ts`에서 `loadPixiLobbyHeroPool()`을 호출합니다.

처리 방식:

- 로비 저장 진행도에서 `owned = true`인 영웅만 전투 소환 풀에 포함합니다.
- 보유 영웅이 하나도 없으면 안전 장치로 전체 영웅 풀을 사용합니다.
- 전투 소환 버튼은 `summonHeroFromPool()`을 사용합니다.
- 기존 `summonHero()`는 전체 영웅 풀 기반 함수로 유지합니다.

관련 파일:

```text
packages/game/src/systems/summonSystem.ts
apps/web/src/game-client/pixi/pixiLobbyHeroPool.ts
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiControlActionRuntime.ts
```

### 6.3 로비 영웅 레벨 전투 반영

`pixiLobbyHeroPool.ts`는 영웅별 레벨 맵을 생성합니다.

전투 데미지 계산은 `pixiCombatRuntime.ts`의 `getHeroDamage()`에서 다음 순서로 반영합니다.

```text
기본/진행 보정 공격력
x 로비 영웅 레벨 배율
x 전투 중 공격 배율
x 공격력 강화 배율
```

현재 레벨 배율:

```text
1 + (level - 1) * 0.12
```

## 7. 분리 원칙

- `createPixiGame.ts`는 초기화, 조립, cleanup 중심으로 유지합니다.
- 화면 배치는 `gameLayout.ts`에서 계산합니다.
- 보드, HUD, 컨트롤, 적, 전투, 스킬, 궁극기, 이펙트, 웨이브, 드래그, 선택 UI는 별도 파일에서 관리합니다.
- 소환/합성/도박/신화 조합 등 핵심 규칙은 `packages/game`에서 가져옵니다.
- PixiJS 내부에서 게임 규칙을 중복 구현하지 않습니다.
- 로비 수집/모집/연출은 `LobbyPage.tsx`에 몰아넣지 않고 `game-lobby`와 `components/lobby`로 분리합니다.
- 긴 CSS는 기능별로 분리합니다. 예: `lobby-recruit-reveal.css`.

## 8. 신화 영웅 전투 구현 요약

현재 신화 영웅은 기본공격, 스킬 1/2, 궁극기를 가집니다.

### 8.1 기본공격/스킬

- 스킬은 `pixiSkillRuntime.ts`에서 처리합니다.
- 공격형 스킬은 기본 42% 확률로 발동합니다.
- 제어형 스킬은 기본 30% 확률로 발동합니다.
- 지원형 스킬은 기본 24% 확률로 발동합니다.
- 자리야 입자포는 예외로 지속 공격/차지형으로 항상 동작합니다.
- 아나 수면총은 일반/보스 모두 3초 수면 효과를 적용할 수 있습니다.
- 겐지 질풍참은 발동 확률을 낮춘 이동형 연속 공격입니다.
- 겐지 질풍참은 체력이 낮은 적을 우선 대상으로 삼고, 최대 3회까지 적 사이를 이동하며 공격합니다.
- 겐지 질풍참은 각 타격 사이에 1초 딜레이를 둡니다.
- 겐지 질풍참은 매 타격마다 원위치로 돌아오지 않고, 마지막 타격 후 복귀합니다.
- 겐지 질풍참은 처치 시 재사용 조건을 사용하지 않습니다.
- 윈스턴 기본공격은 좁은 전기 광선형 체인 공격입니다.

### 8.2 궁극기

```text
D.Va: 영웅 위치 기준 자폭 광역 폭발
자리야: 중력자탄 3초 흡입/속박
트레이서: 펄스폭탄 부착 후 폭발
캐서디: 보이는 적 락온 후 진행도 비례 피해
윈스턴: 원시의 분노 광역 충격파/감속
겐지: 용검 연속 베기. 이동 궤적이 아니라 적 위에 칼로 베는 이펙트 표시
아나: 나노 강화제 공격 배율 증가
키리코: 여우길 5초 공격속도 200%
일리아리: 태양 작렬 광역 폭발
```

## 9. 로비 영웅 모집 시스템

### 9.1 목표

운빨존많겜류의 수집형 성장 흐름을 참고하되 그대로 복사하지 않고, 현재 게임에 맞는 로비 영웅 모집 시스템으로 재구성합니다.

핵심 방향:

- 전투 중 유닛 소환과 로비 영웅 모집은 분리합니다.
- 전투 중 소환은 매 판 안에서 사용하는 일회성 유닛 소환입니다.
- 로비 영웅 모집은 계정/로컬 진행도에 쌓이는 수집 성장입니다.
- 미보유 영웅은 해금됩니다.
- 이미 보유한 영웅은 조각이 누적됩니다.
- 조각은 영웅 레벨업에 사용됩니다.
- 보유 영웅과 레벨은 전투 소환 풀과 데미지에 반영됩니다.

### 9.2 현재 모집 비용

```text
1회 모집: 300 보석
10회 모집: 2700 보석
```

티켓 비용 상수도 준비되어 있습니다.

```text
1회 모집 티켓: 1
10회 모집 티켓: 10
```

현재 UI에서는 보석 모집만 연결되어 있습니다.

### 9.3 현재 등급 확률

```text
일반(common): 54%
희귀(rare): 28%
영웅(epic): 13%
전설(legendary): 4.2%
신화(mythic): 0.8%
```

10회 모집의 마지막 1회는 일반 등급을 제외합니다.

### 9.4 등급별 조각 획득량

```text
일반: 3
희귀: 5
영웅: 8
전설: 14
신화: 22
```

10회 모집에서는 등급별 보너스 조각이 붙습니다.

```text
영웅: +2
전설: +3
신화: +5
```

### 9.5 모집 결과 처리

`recruitHeroes()`는 다음 요약을 반환합니다.

```text
results: RecruitResult[]
nextHeroes: LobbyHero[]
totalShards: number
newHeroCount: number
```

결과 처리:

- 뽑힌 영웅이 미보유 상태면 `owned = true`, `level = 1`로 해금합니다.
- 뽑힌 영웅이 이미 보유 상태면 조각을 누적합니다.
- 결과는 `lastRecruitResults`에 저장되어 영웅 탭 패널에 표시됩니다.
- 결과는 `revealResults`에 저장되어 전체 화면 연출 모달로 표시됩니다.
- 영웅/유물/골드/보석 진행도는 `saveLobbyProgress()`로 저장됩니다.

### 9.6 모집 연출

현재 모집 연출은 2단계입니다.

```text
1단계: 충전
- 전체 화면 어두운 오버레이
- 회전 광선
- 수정구/문양 확대
- "소환 에너지 응축 중..." 표시
- 결과는 숨김

2단계: 공개
- 약 0.92초 후 결과 공개
- 가장 높은 등급의 영웅을 대표 보상으로 크게 표시
- 전체 결과 카드를 순차적으로 표시
- 확인 버튼 표시
```

연출 구현 파일:

```text
apps/web/src/components/lobby/LobbyRecruitReveal.tsx
apps/web/src/styles/lobby-recruit-reveal.css
```

## 10. 웨이브/밸런스 현재값

현재 웨이브 수는 `initialBalance.maxWave = 30`입니다.

보스 웨이브 간격은 `initialBalance.bossWaveInterval = 5`입니다.

따라서 현재 보스 웨이브는 다음과 같습니다.

```text
5, 10, 15, 20, 25, 30
```

웨이브 정의는 `packages/game/src/data/waves.ts`에서 `initialBalance.maxWave` 길이만큼 생성됩니다.

## 11. 다음 개선 우선순위

1. `pnpm build:web`와 `pnpm typecheck`로 최근 로비 저장/전투 풀 연결 코드 검증
2. `/lobby`에서 골드/보석 저장 유지 확인
3. `/lobby`에서 뽑기 후 새로고침해도 보석/영웅/조각이 유지되는지 확인
4. `/play`에서 로비 미보유 영웅이 소환되지 않는지 확인
5. `/play`에서 로비 영웅 레벨에 따라 데미지가 증가하는지 확인
6. 도박 소환과 신화 조합도 보유 영웅 정책을 적용할지 결정
7. 모집 티켓 재화 연결
8. `/play`, `/play-test`에서 공격/궁극기 이펙트 회귀 테스트
9. `createPixiGame.ts`의 ticker/refs/options 조립 책임 추가 분리
10. 점수/보상 계산 기준을 `packages/game` 쪽으로 이동
11. `durationSeconds` 실제 측정 후 기록 저장
12. 랭킹 저장 전 score/wave/kills 상한 검증 추가
13. `game_runs.suspicious`, `hidden` 컬럼을 활용한 비정상 기록 처리
14. 모바일 터치 UX 회귀 테스트

## 12. 확인 체크리스트

기능 추가 후 반드시 다음을 확인합니다.

```bash
pnpm build:web
pnpm typecheck
pnpm dev:web
```

화면 체크:

- `/lobby` 진입 시 로비 화면 정상 표시
- `/lobby` 영웅 탭에서 모집 패널 표시
- 1회 모집 시 보석 300 차감
- 10회 모집 시 보석 2700 차감
- 보석 부족 시 모집 차단
- 모집 후 2단계 연출 표시
- 연출 후 결과 카드 표시
- 미보유 영웅 신규 해금 정상
- 중복 영웅 조각 누적 정상
- 모집 결과가 영웅 목록/상세 패널에 반영
- 영웅 조각 조건 충족 시 업그레이드 가능
- 새로고침 후 골드/보석 유지
- 새로고침 후 영웅/유물 진행도 유지
- `/play` 진입 시 캔버스 정상 표시
- `/play`에서 보유 영웅 중심으로 소환
- `/play`에서 영웅 레벨 데미지 배율 반영
- `/play-test` 테스트 컨트롤 정상 표시
- 4x5 보드 표시 정상
- 소환/스택/이동/스왑 정상
- 합성/판매/신화 메뉴 정상
- 적이 외곽 경로를 따라 이동
- 유닛 기본공격 FX가 적을 향해 표시
- 신화 영웅 궁극기 게이지 표시
- 신화 영웅 궁극기 발동과 FX 표시
- 적 HP바 감소/처치/코인 보상 정상
- 누수 시 코어 HP 감소 정상
- 웨이브 자동 시작 정상
- 웨이브 결과/행운석 보상 정상
- 게임 종료 시 로그인 상태에서 기록 저장 정상

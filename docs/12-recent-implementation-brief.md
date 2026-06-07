# 12. 최근 구현 브리핑 및 다음 작업

## 1. 기준

이 문서는 최근 `/play` PixiJS 전투 화면, 기록 저장 API, 랭킹, Discord OAuth 개발 환경에서 수정한 내용을 정리합니다.

현재 기준은 다음 작업 이후 상태입니다.

- Illari 스프라이트/공격 방향/idle 예외 처리 안정화
- 웨이브 클리어 후 다음 웨이브 진행 수정
- 영웅 개성/성장/신화 조합 UX 개선
- 몬스터 체력 난이도 상향
- 기록 저장 시간, 서버 검증, 랭킹 필터, OAuth 로컬 쿠키, `/play-test` 테스트 컨트롤 상태 수정

## 2. 최근 반영 사항

### 2.1 Illari 스프라이트 시트 적용

`apps/web/public/assets/heroes/illari.png` 파일을 PixiJS 영웅 스프라이트 로더에 연결했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
```

반영 내용:

- `illari` 텍스처 경로 추가
- 스프라이트 렌더 가능 영웅 목록에 `illari` 추가
- Illari 전용 스케일 값 추가
- 사전 로딩 대상에 자동 포함

### 2.2 Illari 공격 모션 활성화

Illari는 이미지 경로만 연결된 상태에서는 공격 모션 트리거 목록에 포함되지 않아 idle 프레임만 표시될 수 있었습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

반영 내용:

- `SPRITE_ATTACK_HERO_IDS`에 `illari` 추가
- 공격 시 `attackLeft` / `attackRight` 프레임으로 전환되도록 처리

### 2.3 공격 후 대기 방향 유지

영웅이 공격한 뒤 바로 기본 왼쪽 대기로 돌아가면 어색해 보이기 때문에, 마지막 공격 방향을 잠시 유지하도록 변경했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/pixiGenjiDashRuntime.ts
```

반영 내용:

- `HeroSpriteAttackState`에 `idleUntil` 추가
- 공격 후 마지막 공격 방향으로 대기
- 3초간 공격이 없으면 왼쪽 대기 모션으로 복귀
- Genji 질풍참 전용 방향 상태에도 `idleUntil` 추가

### 2.4 Illari 대기 프레임 순서 예외 처리

Illari 스프라이트 시트는 대기 프레임만 `오른쪽, 왼쪽` 순서이고, 공격 프레임은 다른 영웅과 동일한 순서입니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
```

반영 내용:

- `HERO_REVERSED_IDLE_IDS`에 `illari` 추가
- Illari는 idle 프레임 선택 시에만 좌우를 반전
- 공격 프레임은 공통 `attackLeft`, `attackRight` 순서 유지

### 2.5 웨이브 클리어 후 다음 웨이브 진행 수정

몬스터를 빨리 모두 처치해서 `finishAutoWave()`로 웨이브가 종료되는 경우 `currentWave`가 증가하지 않아 1웨이브가 반복될 수 있었습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
```

반영 내용:

- 웨이브 클리어 시 `clearedWave` 기록
- 실패 상태가 아니고 최종 웨이브가 아니면 `currentWave + 1`
- `clearedWaves`를 실제 클리어한 웨이브 기준으로 보정
- 다음 카운트다운 후 증가된 웨이브 번호의 몬스터 구성 사용

### 2.6 웨이브 난이도 상승 구조 확인

난이도 상승 데이터는 이미 `packages/game/src/data/waves.ts`에 구현되어 있습니다.

현재 구조:

- 웨이브 번호가 오를수록 기본 적 수 증가
- 웨이브 번호가 오를수록 스폰 간격 감소
- 특정 웨이브부터 추가 적 그룹 등장
- 보스 웨이브는 별도 구성 사용
- 20웨이브 이후 보스 웨이브 구성 강화

### 2.7 영웅별 개성 1차 강화

일반~전설 영웅의 태그 기반 개성을 더 체감할 수 있도록 전투 시너지 런타임을 추가했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiHeroSynergyRuntime.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

반영 내용:

- 주변 8칸 안의 지원형 영웅이 공격 보너스를 제공합니다.
- `buff`, `haste`, `power-up`, `attack-speed`, `team-wide` 계열 지원 영웅이 연계 보너스 대상입니다.
- `commander`, `team-wide` 계열 영웅은 전역 지휘 보너스를 제공합니다.
- 보너스는 최대 35%까지 누적됩니다.
- 전투 중 첫 공격자 기준으로 `연계 +N%` 플로팅 텍스트를 표시합니다.

### 2.8 장기 성장 1차 강화

로비 영웅 레벨이 단순 공격력 상승 외에도 스킬 효과에 영향을 주도록 확장했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiProgressBonuses.ts
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
```

반영 내용:

- `getProgressHeroMasteryEffect()` 추가
- 영웅 레벨이 오를수록 일반~전설 스킬 효과가 강화됩니다.
- 범위 피해, 연쇄 피해, 감속/제어 효과, 경제 보너스가 레벨에 따라 상승합니다.
- 5레벨 이상 영웅은 경제형 스킬 보너스 코인을 추가로 얻습니다.

### 2.9 영웅 개성/성장 표시 1차 개선

영웅 개성과 장기 성장 효과가 적용되어도 유저가 알기 어려웠기 때문에, 선택 정보 패널과 범위 표시를 개선했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiSelectionRuntime.ts
apps/web/src/game-client/pixi/pixiUnitInfoView.ts
apps/web/src/game-client/pixi/pixiUnitRangeView.ts
apps/web/src/game-client/pixi/pixiHeroSynergyRuntime.ts
```

반영 내용:

- 선택한 영웅 정보 패널에 `연계 효과` 문구를 표시합니다.
- 선택한 영웅 정보 패널에 `숙련 Lv.N` 문구를 표시합니다.
- 지원형 버프 영웅을 선택하면 주변 8칸 버프 범위를 초록색 셀로 표시합니다.
- 시너지 판정 헬퍼를 export하여 정보 패널/범위 표시에서 재사용합니다.

### 2.10 신화 조합 재료 보유 표시

신화 조합 메뉴에서 해당 재료를 현재 보유 중인지 바로 알 수 있도록 재료 진행도를 표시합니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiMythicMenuView.ts
packages/game/src/systems/mythicCraftSystem.ts
```

반영 내용:

- 신화 조합 메뉴의 각 조합 행에 재료별 `보유/필요` 수량을 표시합니다.
- 충족한 재료는 `✓ 재료명 보유/필요` 형태로 밝은 노란색 표시합니다.
- 일부 보유한 재료는 `보유 재료명 보유/필요` 형태로 노란색 표시합니다.
- 미보유 재료는 `부족 재료명 0/필요` 형태로 회색 표시합니다.
- 재료를 개별 텍스트로 분리해 보유한 해당 재료만 강조합니다.
- 조합 가능한 행에는 `조합 가능 ·` 접두어를 표시합니다.

### 2.11 몬스터 체력 난이도 상향

최근 영웅 성장, 시너지, 스킬 효과가 강화되면서 전투 난이도가 낮아져 몬스터 체력을 상향했습니다.

적용 위치:

```text
packages/game/src/data/enemies.ts
apps/web/src/game-client/pixi/pixiEnemyRuntime.ts
```

반영 내용:

- 기본 몬스터 체력을 2차로 추가 상향했습니다.
- 현재 기본 체력은 `잡버그 180`, `핑러너 150`, `렉덩어리 620`, `엘리트버그 1150`, `서버크래셔 4200`입니다.
- 일반 몬스터 웨이브 체력 스케일은 `1.75 + wave * 0.24`입니다.
- 보스는 추가로 `1.35 + wave * 0.34` 배율을 더 받아 보스 웨이브 체감 난이도를 크게 올립니다.
- 웨이브 수, 스폰 수, 보상, 이자 시스템은 건드리지 않았습니다.

### 2.12 게임 기록 시간 저장 보정

게임 기록 저장 시 `durationSeconds`가 항상 0으로 제출되던 문제를 수정했습니다.

적용 위치:

```text
apps/web/src/game-client/submitGameRun.ts
```

반영 내용:

- `durationSeconds` 인자를 받을 수 있도록 확장했습니다.
- 인자가 없거나 유효하지 않으면 클라이언트 로드 이후 경과 시간을 기준으로 최소 1초 이상 저장합니다.
- 기존 `score`, `wave`, `kills`, `bossKills`, `resultPayload` 제출 구조는 유지했습니다.

주의:

- 현재 보정은 클라이언트 기준 경과 시간입니다.
- 추후 더 정확한 런 단위 시간을 위해 `createPixiGame.ts`의 `runStartedAt`을 제출 함수에 직접 넘기는 방식으로 고도화할 수 있습니다.

### 2.13 서버 기록 검증 및 suspicious 처리 추가

클라이언트에서 제출한 기록을 그대로 랭킹에 반영하지 않도록 최소 검증을 추가했습니다.

적용 위치:

```text
apps/api/src/services/gameRunService.ts
```

반영 내용:

- mode가 `single_random_wave_defense`가 아니면 suspicious 처리합니다.
- 최대 웨이브 초과, 0초 이하 기록, 보스 처치 수 과다, 킬/점수 과다 제출을 suspicious 처리합니다.
- suspicious 기록은 `game_runs`에는 저장하지만 `leaderboard_entries` 갱신에는 사용하지 않습니다.
- 점수/킬 상한은 현재 넉넉한 1차 방어선입니다.

주의:

- 아직 서버가 전체 전투를 재시뮬레이션하지는 않습니다.
- 경쟁 랭킹을 강화하려면 점수/보상 계산 기준을 `packages/game` 쪽으로 더 모아야 합니다.

### 2.14 랭킹 hidden/suspicious 필터 추가

랭킹 조회에서 숨김/의심 기록이 노출되지 않도록 했습니다.

적용 위치:

```text
apps/api/src/services/leaderboardService.ts
```

반영 내용:

- `leaderboard_entries` 조회 시 `game_runs`를 join합니다.
- `game_runs.hidden = 0` 조건을 추가했습니다.
- `game_runs.suspicious = 0` 조건을 추가했습니다.

### 2.15 로컬 Discord OAuth 쿠키 분기

로컬 HTTP 환경에서 Discord OAuth 테스트 시 secure cookie 때문에 세션이 저장되지 않을 수 있던 문제를 완화했습니다.

적용 위치:

```text
apps/api/src/utils/session.ts
```

반영 내용:

- `PUBLIC_APP_URL` 또는 `DISCORD_REDIRECT_URI`가 `http://localhost`, `http://127.0.0.1`, `http://0.0.0.0`이면 cookie `secure`를 false로 설정합니다.
- 배포 환경처럼 HTTPS 주소를 사용하는 경우에는 기존처럼 `secure: true`를 유지합니다.

### 2.16 `/play-test` 테스트 컨트롤 전역 상태 제거

React StrictMode 또는 재마운트 상황에서 `/play-test` 테스트 컨트롤이 이전 Pixi 인스턴스의 전역 상태를 참조할 수 있던 구조를 정리했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiGameTypes.ts
```

반영 내용:

- 파일 전역 `testControlsView`를 제거했습니다.
- `GameRefs`에 `testControlsView`를 두고 Pixi 게임 인스턴스별로 관리합니다.
- `invalidateControls`, `drawTestControls`, `updateTestControls`가 모두 `refs.testControlsView`를 사용합니다.
- `createPixiGame()` 초기 refs에 `testControlsView: null`을 추가했습니다.

## 3. 현재 주의할 점

### 3.1 빌드 재확인 필요

최근 타입/API/랭킹/OAuth/Pixi 상태 수정 이후 Cloudflare Pages 또는 로컬에서 다시 확인해야 합니다.

권장 확인 명령:

```bash
pnpm typecheck
pnpm build:web
```

특히 확인할 부분:

- `apps/api/src/services/gameRunService.ts`에서 `@discord-random-defense/game`의 `initialBalance` import가 API 빌드에서 정상 해석되는지
- `GameRefs.testControlsView` 선택 필드와 `createPixiGame.ts` refs 초기화가 타입체크를 통과하는지
- `submitGameRun()`의 optional `durationSeconds` 변경이 호출부와 충돌하지 않는지

### 3.2 실제 플레이 회귀 테스트 필요

특히 다음 항목은 브라우저에서 직접 확인해야 합니다.

- `/play` 진입 후 1웨이브 시작 여부
- 1웨이브 클리어 후 2웨이브로 넘어가는지
- 2, 3, 4웨이브에서 적 수와 구성이 증가하는지
- 1~5웨이브 체력이 너무 과하지 않은지
- 보스 웨이브 진입 시 경고와 보스 생성이 정상인지
- 보스 체력이 실제로 오래 버티는지
- Illari idle 방향이 왼쪽으로 복귀하는지
- Illari 공격 방향은 다른 영웅과 동일하게 동작하는지
- Genji 질풍참 후 타입/방향 오류가 없는지
- 지원형 영웅 주변 배치 시 `연계 +N%`가 표시되는지
- 레벨이 높은 일반~전설 영웅의 스킬 효과가 체감되는지
- 영웅 선택 패널에 연계/숙련 문구가 표시되는지
- 지원형 영웅 선택 시 주변 8칸 버프 범위가 표시되는지
- 신화 조합 메뉴에서 재료별 보유/필요 수량이 표시되는지
- 보유한 재료만 개별적으로 노란색 강조되는지
- 조합 가능 상태에서 행 터치로 정상 조합되는지
- `/play-test` 진입/이탈/재진입 시 테스트 컨트롤이 정상 표시되는지
- 테스트 모드 몬스터 HP 배율 버튼이 정상 동작하는지
- 로그인 상태에서 게임 종료 시 `durationSeconds`가 0이 아닌 값으로 저장되는지
- suspicious 기록이 랭킹에 반영되지 않는지
- 로컬 HTTP OAuth 테스트에서 session/state cookie가 저장되는지

## 4. 다음 작업 우선순위

### 1순위: 빌드 안정화

가장 먼저 `pnpm typecheck`, `pnpm build:web` 기준으로 깨지는 타입/빌드 오류를 모두 정리합니다.

이유:

- Cloudflare 배포가 막히면 실제 테스트가 불가능합니다.
- 최근 API import, Pixi 타입, 기록 저장 함수 시그니처 변경처럼 다른 런타임에서 깨질 수 있는 지점을 빨리 확인해야 합니다.

### 2순위: 기록/랭킹 회귀 테스트

기록 저장과 랭킹 신뢰성 관련 변경이 들어갔으므로 실제 DB 기준으로 확인합니다.

체크 항목:

- 정상 기록 저장
- `durationSeconds` 0 고정 해소
- suspicious 기록 저장 여부
- suspicious 기록 랭킹 제외 여부
- hidden 기록 랭킹 제외 여부
- 기존 정상 최고 점수 갱신 흐름 유지 여부

### 3순위: 웨이브 회귀 테스트

웨이브가 자동으로 올라가는지, 난이도가 실제 체감되는지 확인합니다.

체크 항목:

- 빠른 클리어 시 다음 웨이브 증가
- 시간 만료 시 다음 웨이브 증가
- 결과 보상 선택 후 다음 웨이브 카운트다운 복귀
- 보스 웨이브 도달
- 실패/클리어 상태에서 더 이상 웨이브가 진행되지 않는지

### 4순위: 스프라이트 방향/모션 검수

최근 여러 영웅 스프라이트가 추가되었으므로, 방향 행 순서를 영웅별로 점검합니다.

체크 항목:

- 기본 왼쪽 idle
- 오른쪽 공격 후 오른쪽 idle 유지
- 3초 무공격 후 왼쪽 idle 복귀
- 공격 프레임 좌/우 일치
- Illari idle만 예외 처리되는지

### 5순위: 영웅 개성 2차 강화

1차는 태그 기반 패시브와 주변 지원 연계를 강화했습니다.

다음 개선:

- 보드 위 신화 재료 영웅 테두리 강조
- 특정 영웅별 고유 타겟팅 추가: 최고 체력 우선, 낮은 체력 우선, 선두 적 우선
- 신화 조합 가능 상태를 전투 화면에서 더 강하게 알림
- 보상/점수 계산 기준을 `packages/game` 쪽으로 더 정리

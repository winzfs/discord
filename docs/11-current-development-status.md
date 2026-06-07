# 11. 현재 개발 상태 및 다음 작업

## 1. 현재 기준

이 문서는 현재 저장소 `main` 브랜치 기준의 실제 구현 상태와 다음 개발 우선순위를 정리합니다.

현재 프로젝트 방향은 다음과 같습니다.

- MVP는 싱글플레이 랜덤 디펜스 1개를 우선 완성합니다.
- 게임 화면은 `/play`의 PixiJS 독립 캔버스에서 구현합니다.
- `/play-test`는 테스트 컨트롤이 포함된 개발/검증용 게임 화면입니다.
- `/game`은 일반 웹 레이아웃 안의 게임 안내/시작 페이지로 사용합니다.
- `/lobby`는 로비/상점/성장 화면으로 사용합니다.
- React는 대시보드, 로그인, 랭킹, 프로필, 관리자 UI를 담당합니다.
- PixiJS는 실제 게임 플레이 화면과 터치/전투/웨이브/스킬/궁극기 연출을 담당합니다.
- 게임 규칙은 `packages/game`의 순수 TypeScript 로직으로 관리합니다.
- 기존에 동작하던 PixiJS 클라이언트를 새로 만들지 않고, 기존 클라이언트에 작은 단위로 기능을 추가합니다.
- 한 파일에 기능을 몰아넣지 않고, 렌더링/컨트롤/보드/적/전투/스킬/궁극기/이펙트/웨이브 런타임을 계속 분리합니다.

## 2. 완료된 인프라

### 2.1 Cloudflare D1

Cloudflare D1 데이터베이스를 사용합니다.

```text
Database name: discord_random_defense
Binding name: DB
```

마이그레이션 기준 파일:

```text
apps/api/migrations/0001_initial.sql
```

현재 테이블:

- `users`
- `seasons`
- `game_runs`
- `leaderboard_entries`
- `admin_logs`

`game_runs`에는 `suspicious`, `hidden` 컬럼이 있으며, 현재 기록 검증/랭킹 필터에서 사용합니다.

### 2.2 Cloudflare Workers API

`apps/api`는 Cloudflare Workers + Hono 기반입니다.

현재 제공 라우트:

- `GET /health`
- `GET /api/health`
- `GET /api/auth/discord`
- `GET /api/auth/callback`
- `GET /api/auth/status`
- `GET /api/me`
- `GET /api/leaderboard`
- `POST /api/game/runs`
- `GET /api/game/status`
- `GET /api/admin/summary`

### 2.3 Discord OAuth

현재 Discord OAuth는 placeholder가 아니라 실제 흐름이 구현되어 있습니다.

구현된 흐름:

1. `/api/auth/discord` 진입
2. OAuth state 생성
3. 서명된 state cookie 저장
4. Discord authorize URL로 redirect
5. `/api/auth/callback`에서 `code`, `state` 검증
6. Discord token 교환
7. `/users/@me`, `/users/@me/guilds` 조회
8. 서버 멤버 여부 확인
9. 관리자 Discord ID 확인
10. `users` 테이블 upsert
11. 서명된 session cookie 발급
12. `/dashboard`로 redirect

필요 환경 변수:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `DISCORD_GUILD_ID`
- `ADMIN_DISCORD_IDS`
- `SESSION_SECRET`
- `PUBLIC_APP_URL`

현재 cookie 처리:

- 배포/HTTPS 환경에서는 session/state cookie를 `secure: true`로 발급합니다.
- `PUBLIC_APP_URL` 또는 `DISCORD_REDIRECT_URI`가 `http://localhost`, `http://127.0.0.1`, `http://0.0.0.0`이면 로컬 OAuth 테스트를 위해 `secure: false`로 발급합니다.
- 운영 배포 환경에서는 HTTPS 주소를 사용해야 합니다.

### 2.4 기록 저장 / 랭킹

게임 종료 시 프론트에서 `/api/game/runs`로 기록 저장을 시도합니다.

현재 저장 데이터:

- mode
- score
- wave / clearedWaves
- kills / defeatedEnemies
- bossKills / defeatedBosses
- durationSeconds
- clientVersion
- resultPayload
- suspicious
- hidden

현재 반영 상태:

- `apps/web/src/game-client/submitGameRun.ts`에서 `durationSeconds`가 0으로 고정되지 않도록 보정했습니다.
- 명시 duration 값이 없거나 유효하지 않으면 클라이언트 기준 경과 시간으로 최소 1초 이상 저장합니다.
- `apps/api/src/services/gameRunService.ts`에서 mode, wave, duration, bossKills, kills, score 기준의 1차 suspicious 검증을 수행합니다.
- suspicious 기록은 `game_runs`에는 저장하지만 `leaderboard_entries`에는 반영하지 않습니다.
- `apps/api/src/services/leaderboardService.ts`에서 랭킹 조회 시 `game_runs.hidden = 0`, `game_runs.suspicious = 0` 조건을 적용합니다.

남은 주의점:

- 현재 기록 검증은 넉넉한 1차 방어선이며, 서버 전투 재시뮬레이션은 아직 하지 않습니다.
- `durationSeconds`는 클라이언트 기준 경과 시간 보정입니다. 더 정확한 런 단위 시간 측정을 위해 추후 `createPixiGame.ts`의 run start timestamp를 명시 전달하는 방식으로 고도화할 수 있습니다.
- 점수/보상 계산 기준은 장기적으로 `packages/game` 쪽으로 더 모아야 합니다.

## 3. 현재 게임 구현 상태

### 3.1 Web 라우팅

현재 게임 관련 라우트:

```text
/game       일반 웹 레이아웃 안의 게임 안내/시작 페이지
/play       PixiJS 전체화면 실제 게임 화면
/play-test  테스트 컨트롤이 포함된 PixiJS 게임 화면
/lobby      로비/상점/성장 화면
```

`/play`, `/play-test`, `/lobby`는 `MainLayout` 밖에서 독립 실행됩니다.

### 3.2 PixiJS 게임 화면

현재 `/play`는 실제 플레이 가능한 PixiJS MVP입니다.

구현된 기능:

- PixiJS Application 생성
- 전체화면 캔버스 렌더링
- 밝은 필드형 배경
- 보드 외곽을 도는 몬스터 이동 경로
- 중앙 4x5 영웅 배치판
- 상단 WAVE / 타이머 / 코어 HP / 화력 / 유닛 수 / 재화 HUD
- 하단 소환 / 신화 / 도박 / 강화 / 웨이브 버튼
- `countdown -> combat -> result` 웨이브 phase
- 자동 카운트다운 후 웨이브 시작
- 웨이브 버튼으로 즉시 시작
- 적 개체 생성
- 적 개체별 HP, 속도, 보상, 라이프 피해
- 적이 실제 경로를 따라 이동
- 적 누수 시 코어 HP 감소
- 유닛 자동 타겟팅
- 영웅별 기본공격 FX
- 적 HP 감소와 HP바 갱신
- 적 처치 시 코인 보상 지급
- 딜러 보스 우선 타겟팅
- 탱커 감속 효과
- 지원형 스플래시 보조 피해
- 보스 웨이브 경고 연출
- 웨이브 결과 표시
- 완벽 방어 시 행운석 보상 지급
- 랜덤 유닛 소환
- 소환 비용 증가
- 소환 할인 보정
- 행운석 기반 도박 소환
- 유닛 드래그 이동
- 자리 교환
- 같은 유닛 중첩
- 셀 3스택 합성
- 전역 등급 합성 로직
- 유닛 판매 메뉴
- 유닛 클릭 정보 패널
- 스킬 1/2 좌우 분리 정보 표시
- 궁극기 효과와 발동 조건 표시
- 빈 화면 터치 시 메뉴/정보 패널 닫기
- 신화 조합 메뉴
- 고유 유닛 재료 기반 신화 조합
- 신화 조합 재료 보유 수 / 필요 수 표시
- 신화 영웅 궁극기 게이지 바
- 공격/시간 경과 기반 궁극기 게이지 충전
- 신화 영웅 스킬 확률 발동
- 신화 영웅 궁극기 발동
- Tracer, Kiriko, D.Va, Zarya, Cassidy, Winston 스프라이트 시트 적용
- 테스트 모드 컨트롤
- 테스트 모드 몬스터 체력 50배/100배 옵션
- `/play-test` 테스트 컨트롤 상태를 Pixi 게임 인스턴스별 `GameRefs`에서 관리
- 게임 종료 시 기록 저장 API 호출

### 3.3 신화 영웅 스킬/궁극기 상태

현재 신화 영웅:

```text
D.Va, 자리야, 윈스턴, 트레이서, 캐서디, 겐지, 아나, 키리코, 일리아리
```

현재 스킬 발동 구조:

- 공격형 스킬: 기본 42% 확률
- 제어형 스킬: 기본 30% 확률
- 지원형 스킬: 기본 24% 확률
- 자리야 입자포: 지속 빔/차지형 예외 처리
- 아나 수면총: 일반/보스 모두 3초 수면 가능
- 겐지 질풍참: 체력 낮은 적 우선, 처치 시 연속 발동
- 키리코 여우길: 5초간 공격속도 200%
- 윈스턴 기본공격: 좁은 전기 광선형 체인 공격

현재 궁극기 구현:

```text
D.Va: 영웅 위치 기준 자폭 광역 폭발
자리야: 중력자탄 3초 흡입/속박
트레이서: 펄스폭탄 부착 후 0.5초 뒤 폭발
캐서디: 3초 락온 후 진행도 비례 피해
윈스턴: 원시의 분노 광역 충격파/감속
겐지: 용검 연속 베기
아나: 나노 강화제 공격 배율 증가
키리코: 여우길 공격속도 200%
일리아리: 태양 작렬 광역 폭발
```

### 3.4 PixiJS 파일 분리 현황

현재 주요 PixiJS 파일:

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
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiUnitRange.ts
apps/web/src/game-client/pixi/pixiSharedView.ts
apps/web/src/game-client/pixi/pixiTestControlsView.ts
apps/web/src/game-client/pixi/animation/animationManager.ts
```

현재 `createPixiGame.ts`는 많이 줄었지만 아직 다음 책임이 남아 있습니다.

- Pixi Application 초기화
- refs 초기 상태 구성
- ticker phase 연결
- stage pointer event 바인딩
- runtime options 조립
- render 호출 순서 조립
- cleanup

다음 리팩터링 목표는 `createPixiGame.ts`를 초기화/조립/cleanup 중심으로 더 줄이는 것입니다.

### 3.5 FX/최적화 상태

최근 기본공격/궁극기 이펙트가 강화되었습니다.

구현된 FX 파일:

- `pixiHeroAttackFxRuntime.ts`: D.Va, 트레이서, 캐서디, 겐지, 아나, 키리코, 일리아리 기본공격 고유 FX
- `pixiWinstonBeamRuntime.ts`: 윈스턴 전기 광선형 기본공격 FX
- `pixiUltimateFxRuntime.ts`: 신화 영웅 궁극기 고유 FX
- `pixiFxPoolRuntime.ts`: `Graphics` 객체 재사용 풀

최적화 방향:

- 이펙트 퀄리티를 낮추지 않고 객체 생성/파괴 비용을 줄입니다.
- 공격/궁극기/윈스턴 전기 FX는 `acquireFxGraphics` / `releaseFxGraphics`를 사용합니다.
- 게임 cleanup 시 `destroyFxGraphicsPool(refs)`로 풀을 정리합니다.
- 현재 풀 최대치는 게임 인스턴스당 96개입니다.

## 4. 현재 게임 규칙 구현 상태

`packages/game`에는 React/PixiJS/API와 독립적인 순수 게임 규칙을 둡니다.

현재 export되는 주요 영역:

- artifacts
- balance
- enemies
- gamble
- gameModes
- heroes
- mythicRecipes
- pets
- runBoosts
- runMissions
- skills
- waves
- scoring
- attackUpgradeSystem
- boardSystem
- combatSystem
- gambleSystem
- mergeSystem
- mythicCraftSystem
- runChoiceSystem
- sellSystem
- stackMergeSystem
- summonSystem
- waveSystem
- random

현재 구현된 핵심 로직:

- 초기 게임 상태 생성
- seed 기반 랜덤 유틸
- 4x5 보드 생성
- 셀당 최대 3스택
- 빈 칸 배치
- 같은 유닛 중첩
- 유닛 이동 / 자리 교환
- 유닛 판매
- 소환 확률
- 소환 비용 증가
- 랜덤 유닛 소환
- 같은 등급 3마리 전역 합성
- 같은 셀 3스택 합성
- 공격력 강화 비용/배율
- 행운석 기반 도박 소환
- 런 중 선택형 보너스
- 신화 조합 레시피
- heroId 기반 신화 조합 재료 조건
- 신화 조합 재료 진행도 계산
- 신화 조합 실행
- 웨이브 데이터 생성
- 웨이브 시작/완료 보조 로직
- 웨이브 단위 전투력 계산 보조 로직
- 점수 계산 보조 로직

주의:

- 실제 `/play`의 실시간 적 이동/공격/처치/보상/스킬/궁극기 처리는 Pixi runtime 쪽에서 직접 갱신하는 부분이 있습니다.
- 장기적으로 점수/보상/검증 기준은 `packages/game` 쪽으로 더 모으는 것이 좋습니다.

## 5. 현재 주요 유닛/등급

현재 등급:

```text
common
rare
epic
legendary
mythic
```

한국어 표기:

| 내부값 | 표시명 |
|---|---|
| `common` | 일반 |
| `rare` | 희귀 |
| `epic` | 영웅 |
| `legendary` | 전설 |
| `mythic` | 신화 |

현재 주요 소환/조합 유닛:

```text
일반: 스파크 러너, 루키 가드, 미니 메딕
희귀: 펄스 사수, 방벽 수호자, 야전 의무병
영웅: 플라즈마 마도사, 코어 기사, 오버클럭 기술자
전설: 크레딧 해커, 레일건 에이스, 라스트 바스티온
신화: D.Va, 자리야, 윈스턴, 트레이서, 캐서디, 겐지, 아나, 키리코, 일리아리
```

## 6. 현재 적/웨이브 상태

현재 적 데이터:

```text
잡버그: 기본형
핑러너: 빠른 적
렉덩어리: 느리고 단단한 적
엘리트버그: 중간 보스형 적
서버크래셔: 보스
```

현재 웨이브 구조:

- 총 30웨이브
- 5웨이브마다 보스 웨이브
- 초반은 잡버그 중심
- 4웨이브 이후 핑러너 러시 추가
- 6웨이브 이후 렉덩어리 탱커 추가
- 11웨이브 이후 엘리트버그 등장
- 18웨이브 이후 엘리트 중심 웨이브 등장
- 21웨이브 이후 빠른 적 + 탱커 혼합 압박 강화
- 보스 웨이브는 서버크래셔 + 잡몹 + 탱커 + 후반 엘리트 혼합

## 7. 문서와 코드 동기화 메모

이번 동기화에서 반영한 차이:

- API placeholder 표현 제거 상태 유지
- Discord OAuth 실제 구현 상태 반영 상태 유지
- 로컬 HTTP OAuth 테스트용 cookie secure 분기 반영
- 게임 기록 저장 / 랭킹 API 연결 상태 반영 상태 유지
- `durationSeconds` 0 고정 문제 수정 반영
- 서버 기록 suspicious 1차 검증 추가 반영
- suspicious 기록 랭킹 갱신 차단 반영
- 랭킹 조회에서 hidden/suspicious 기록 제외 반영
- 4x5 보드 표현으로 통일
- `/play-test`, `/lobby` 라우트 반영
- `/play-test` 테스트 컨트롤 전역 상태 제거 반영
- 실제 PixiJS runtime 파일 목록 최신화
- 신화 유닛 목록을 현재 코드 기준으로 유지
- 적 이동/공격/웨이브가 실제 구현된 상태로 유지
- 신화 영웅 스킬/궁극기 게이지/궁극기 발동 구현 반영
- 영웅별 기본공격 FX와 궁극기 FX 구현 반영
- Tracer, Kiriko, D.Va, Zarya, Cassidy, Winston 스프라이트 적용 반영
- `pixiFxPoolRuntime.ts` 기반 `Graphics` 풀 최적화 반영

## 8. 현재 주요 리스크

1. `pnpm build:web`, `pnpm typecheck`를 최근 API/Pixi 타입 변경 이후 아직 실행 확인해야 합니다.
2. `apps/api/src/services/gameRunService.ts`에서 `@discord-random-defense/game` import가 API 빌드에서 정상 해석되는지 확인해야 합니다.
3. `GameRefs.testControlsView`와 `/play-test` 테스트 컨트롤이 실제 브라우저 재진입 상황에서 정상 동작하는지 확인해야 합니다.
4. `createPixiGame.ts`에 아직 조립 책임이 많습니다.
5. 점수/보상 계산이 `packages/game`과 Pixi runtime에 나뉘어 있습니다.
6. suspicious 검증은 1차 방어선이며, 서버 전투 재시뮬레이션은 아직 없습니다.
7. 이펙트가 화려해진 만큼 모바일 실기기 프레임 확인이 필요합니다.
8. 궁극기/스킬/FX가 늘어났으므로 `/play-test`에서 신화 영웅별 회귀 테스트가 필요합니다.

## 9. 다음 작업 우선순위

현재는 기능 추가보다 **빌드 안정화, 문서 동기화, 회귀 테스트**가 우선입니다.

### 9.1 최우선

1. `pnpm typecheck` 실행
2. `pnpm build:web` 실행
3. `/play` 실제 실행 확인
4. `/play-test` 테스트 컨트롤 확인
5. 소환/드래그/스택/합성/판매 회귀 테스트
6. 웨이브 시작/적 이동/공격/누수/보상 회귀 테스트
7. 신화 조합창 재료 표시/조합 가능 여부 확인
8. 신화 영웅 스킬 1/2 확률 발동 확인
9. 신화 영웅 궁극기 게이지/발동/FX 확인
10. 게임 종료 후 로그인 상태 기록 저장 확인
11. `durationSeconds`가 0이 아닌 값으로 저장되는지 확인
12. suspicious 기록이 랭킹에 반영되지 않는지 확인
13. 랭킹 화면 정상 기록 반영 확인
14. 로컬 HTTP OAuth 테스트에서 session/state cookie 저장 확인

### 9.2 다음 개발

1. 빌드/타입체크 결과에 따른 깨진 타입 정리
2. `durationSeconds`를 Pixi run start timestamp 기준으로 더 정확히 전달
3. 서버 기록 검증 기준을 `packages/game` 점수/웨이브 데이터와 더 강하게 연결
4. 점수/보상 계산 기준을 `packages/game` 쪽으로 정리
5. `createPixiGame.ts` 추가 분리
6. 보드 전체 리렌더 감소와 게이지 레이어 분리
7. 모바일 실기기 프레임/발열 확인
8. 실제 이미지/스프라이트 에셋 교체 확대
9. 모바일 터치 UX 개선

## 10. 개발 원칙

- 문서를 먼저 확인합니다.
- 큰 파일에 기능을 욱여넣지 않습니다.
- 기존에 동작하던 클라이언트를 버리고 새로 만들지 않습니다.
- 전체 파일 재생성 방식은 지양하고, 기능 단위로 작은 패치를 적용합니다.
- PixiJS 객체는 매 프레임 재생성하지 않고, 가능한 한 생성 후 재사용합니다.
- 이펙트 퀄리티를 낮추기보다 객체 풀/레이어 분리/리렌더 최소화로 최적화합니다.
- 작업 중 진행상황을 짧게 공유합니다.

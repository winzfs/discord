# 06. 파일 시스템 구성 가이드

## 1. 목적

이 문서는 이후 Codex 또는 사람이 개발을 시작할 때, 큰 파일 하나에 모든 기능을 몰아넣지 않고 유지보수와 확장이 쉬운 구조로 프로젝트를 구성하기 위한 기준입니다.

핵심 원칙:

- 기능별로 폴더를 나눈다.
- 화면과 로직을 분리한다.
- 게임 데이터와 게임 규칙을 분리한다.
- API 라우트와 서비스 로직을 분리한다.
- DB 접근 코드를 한 곳에 모은다.
- 파일 하나가 너무 커지기 전에 나눈다.

## 2. 권장 저장소 구조

장기적으로 추천하는 구조는 monorepo입니다.

```text
discord/
  README.md
  docs/
  apps/
    web/
    api/
  packages/
    game/
    ui/
    types/
    config/
  database/
    migrations/
    seeds/
  scripts/
  .github/
    workflows/
  .env.example
  package.json
  pnpm-workspace.yaml
  wrangler.toml
```

## 3. 초기 MVP 구조

초기에는 너무 복잡하게 시작하지 않아도 됩니다.

하지만 나중에 분리하기 쉽게 다음 구조를 권장합니다.

```text
apps/web/
  src/
    app/
    pages/
    features/
    components/
    game-client/
    lib/
    styles/

apps/api/
  src/
    routes/
    middleware/
    services/
    repositories/
    discord/
    game/
    db/
    utils/

packages/game/
  src/
    engine/
    systems/
    rules/
    data/
    types/

packages/types/
  src/

packages/ui/
  src/
```

## 4. apps/web 구조

프론트엔드 앱입니다.

```text
apps/web/src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  pages/
    HomePage.tsx
    LoginPage.tsx
    DashboardPage.tsx
    GamePage.tsx
    LeaderboardPage.tsx
    ProfilePage.tsx
    AdminPage.tsx
  features/
    auth/
    dashboard/
    leaderboard/
    profile/
    admin/
  components/
    common/
    layout/
    cards/
    buttons/
  game-client/
    GameCanvas.tsx
    GameHud.tsx
    GameControls.tsx
    GameResultModal.tsx
  lib/
    apiClient.ts
    format.ts
    constants.ts
  styles/
    globals.css
```

### 4.1 pages

페이지 단위 컴포넌트만 둡니다.

나쁜 예:

```text
DashboardPage.tsx 안에 API 호출, 카드 UI, 랭킹 계산, 관리자 로직을 모두 넣음
```

좋은 예:

```text
DashboardPage.tsx는 레이아웃만 담당
features/dashboard에서 데이터 조회와 섹션 구성
components/cards에서 UI 카드 재사용
```

### 4.2 features

기능 단위로 상태와 UI를 묶습니다.

예시:

```text
features/leaderboard/
  LeaderboardTable.tsx
  useLeaderboard.ts
  leaderboardApi.ts
  leaderboardTypes.ts
```

### 4.3 game-client

게임 표시용 React 컴포넌트만 둡니다.

게임 규칙과 전투 계산은 `packages/game`에 둡니다.

## 5. apps/api 구조

Cloudflare Workers API입니다.

```text
apps/api/src/
  index.ts
  routes/
    auth.routes.ts
    me.routes.ts
    game.routes.ts
    leaderboard.routes.ts
    admin.routes.ts
  middleware/
    authRequired.ts
    adminRequired.ts
    rateLimit.ts
    errorHandler.ts
  services/
    authService.ts
    userService.ts
    gameRunService.ts
    leaderboardService.ts
    seasonService.ts
    adminService.ts
  repositories/
    userRepository.ts
    gameRunRepository.ts
    leaderboardRepository.ts
    seasonRepository.ts
    adminLogRepository.ts
  discord/
    discordOAuth.ts
    discordApi.ts
    discordGuild.ts
  game/
    validateGameResult.ts
    suspiciousScore.ts
  db/
    client.ts
    schema.ts
  utils/
    env.ts
    response.ts
    id.ts
    time.ts
```

## 6. packages/game 구조

게임 로직 공유 패키지입니다.

```text
packages/game/src/
  engine/
    createInitialState.ts
    gameLoop.ts
    tick.ts
    types.ts
  systems/
    combatSystem.ts
    enemySystem.ts
    waveSystem.ts
    summonSystem.ts
    mergeSystem.ts
    upgradeSystem.ts
    skillSystem.ts
  rules/
    scoring.ts
    summonRates.ts
    mergeRules.ts
    balance.ts
  data/
    units.ts
    enemies.ts
    waves.ts
    bosses.ts
    relics.ts
    mascots.ts
  types/
    unit.ts
    enemy.ts
    wave.ts
    gameState.ts
    result.ts
  utils/
    random.ts
    math.ts
```

중요:

- React 컴포넌트에서 직접 점수 계산하지 않음
- API에서 직접 소환 확률 계산하지 않음
- `packages/game`의 순수 함수로 게임 규칙을 관리

## 7. 파일 크기 기준

권장 기준:

- 150줄 이상: 분리 검토
- 300줄 이상: 반드시 분리 후보
- 500줄 이상: 특별한 이유 없으면 분리

예외:

- 정적 데이터 파일
- 마이그레이션 SQL
- 자동 생성 파일

## 8. 네이밍 규칙

### 8.1 파일명

- React 컴포넌트: `PascalCase.tsx`
- Hook: `useSomething.ts`
- 일반 함수: `camelCase.ts`
- 타입: `something.types.ts` 또는 `types.ts`
- 테스트: `*.test.ts`

예시:

```text
LeaderboardTable.tsx
useLeaderboard.ts
leaderboardApi.ts
leaderboard.types.ts
scoring.test.ts
```

### 8.2 함수명

- 동사로 시작
- 역할이 분명하게

좋은 예:

```ts
calculateScore()
getCurrentSeason()
validateGameResult()
mergeUnits()
summonUnit()
```

나쁜 예:

```ts
doStuff()
handleData()
process()
run()
```

## 9. 데이터 파일 관리 원칙

게임 밸런스 데이터는 별도 파일로 둡니다.

```text
packages/game/src/data/units.ts
packages/game/src/data/enemies.ts
packages/game/src/data/waves.ts
packages/game/src/data/bosses.ts
packages/game/src/rules/balance.ts
```

나쁜 예:

```ts
if (unit.name === 'A') damage = 100;
```

좋은 예:

```ts
const unit = unitsById[unitId];
const damage = unit.baseDamage * modifiers.attack;
```

## 10. API 라우트 작성 원칙

라우트 파일은 얇게 유지합니다.

라우트 역할:

- 요청 파싱
- 인증 미들웨어 적용
- 서비스 호출
- 응답 반환

서비스 역할:

- 비즈니스 로직
- 여러 repository 조합
- 검증

repository 역할:

- DB 쿼리
- 데이터 변환

예시:

```text
game.routes.ts
  -> gameRunService.submitGameRun()
    -> validateGameResult()
    -> gameRunRepository.insert()
    -> leaderboardService.updateBestScore()
```

## 11. 상태 관리 원칙

프론트엔드 상태는 세 종류로 나눕니다.

### 11.1 서버 상태

- 내 프로필
- 랭킹
- 시즌
- 최근 기록

추천:

- TanStack Query
- 또는 간단한 custom hook

### 11.2 UI 상태

- 모달 열림
- 탭 선택
- 필터

추천:

- React state

### 11.3 게임 상태

- 유닛 목록
- 적 목록
- 웨이브
- 자원
- 점수

추천:

- `packages/game`의 GameState
- React는 렌더링만 담당

## 12. 테스트 파일 위치

권장:

```text
packages/game/src/rules/scoring.test.ts
packages/game/src/systems/mergeSystem.test.ts
apps/api/src/services/gameRunService.test.ts
```

게임 규칙은 반드시 테스트를 붙이는 것을 추천합니다.

우선 테스트 대상:

- 점수 계산
- 소환 확률
- 합성 규칙
- 랭킹 갱신
- 비정상 기록 감지

## 13. 환경 설정 파일

저장소에 포함:

```text
.env.example
wrangler.toml.example 또는 wrangler.toml
```

저장소에 포함 금지:

```text
.env
.dev.vars
Discord client secret
session secret
Cloudflare API token
```

## 14. 문서 유지 원칙

기능이 추가되면 반드시 문서를 갱신합니다.

문서 위치:

```text
docs/
  00-project-brief.md
  01-reference-analysis.md
  02-game-design.md
  03-game-systems.md
  04-discord-dashboard.md
  05-technical-architecture.md
  06-file-system-guide.md
  07-mvp-roadmap.md
```

추후 추가 문서:

```text
docs/08-api-spec.md
docs/09-database-schema.md
docs/10-balance-guide.md
docs/11-admin-guide.md
```

## 15. Codex 작업 지시 원칙

Codex에게 작업을 맡길 때는 한 번에 큰 작업을 주지 않습니다.

나쁜 지시:

```text
전체 게임 만들어줘.
```

좋은 지시:

```text
docs/06-file-system-guide.md 기준으로 Vite React + TypeScript 프로젝트 초기 구조만 생성해줘. 게임 구현은 하지 말고 라우팅과 폴더만 만들어줘.
```

또는:

```text
packages/game/src/rules/scoring.ts에 점수 계산 순수 함수와 테스트만 작성해줘.
```

## 16. 기능 추가 순서 원칙

1. 타입 정의
2. 데이터 정의
3. 순수 함수 작성
4. 테스트 작성
5. API 연결
6. UI 연결
7. 문서 갱신

이 순서를 지키면 기능이 커져도 유지보수하기 쉽습니다.

## 17. 최종 권장 사항

- `GamePage.tsx`가 거대해지지 않게 한다.
- `index.ts`에 모든 API 라우트를 몰아넣지 않는다.
- 유닛/웨이브/밸런스 수치를 컴포넌트에 넣지 않는다.
- Discord API 호출을 여러 파일에 흩뿌리지 않는다.
- DB 쿼리는 repository 계층에 모은다.
- 게임 규칙은 `packages/game`의 순수 함수로 관리한다.

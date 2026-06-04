# 13. 웹 API 연결 및 게임 결과 저장 진행 기록

## 1. 이번 작업 범위

이번 작업에서는 기존 placeholder 중심 웹 페이지를 실제 API와 연결하고, PixiJS 게임 종료 시 결과를 저장할 수 있는 연결점을 추가했습니다.

## 2. 변경 파일

### 2.1 공용 API 클라이언트

```text
apps/web/src/lib/apiClient.ts
```

추가/확장 기능:

- `apiGet`
- `apiPost`
- `apiClient.me()`
- `apiClient.leaderboard()`
- `apiClient.adminSummary()`
- API 공통 응답 타입 처리
- `VITE_API_BASE_URL` 지원
- 쿠키 세션 사용을 위한 `credentials: "include"` 적용

### 2.2 랭킹 페이지

```text
apps/web/src/pages/LeaderboardPage.tsx
```

변경 내용:

- `GET /api/leaderboard` 호출
- 랭킹 테이블 표시
- 로딩/빈 상태/에러 상태 표시

### 2.3 프로필 페이지

```text
apps/web/src/pages/ProfilePage.tsx
```

변경 내용:

- `GET /api/me` 호출
- Discord ID, 서버 멤버 여부, 관리자 여부 표시
- 로그인 필요 시 로그인 페이지 링크 표시

### 2.4 관리자 페이지

```text
apps/web/src/pages/AdminPage.tsx
```

변경 내용:

- `GET /api/admin/summary` 호출
- 전체 유저 수, 전체 플레이 기록 수 표시
- 최근 플레이 기록 테이블 표시

### 2.5 대시보드 페이지

```text
apps/web/src/pages/DashboardPage.tsx
```

변경 내용:

- `GET /api/me` 호출
- `GET /api/leaderboard?limit=5` 호출
- 로그인 유저, 현재 1위, 게임 시작 버튼 표시

### 2.6 웹 스타일

```text
apps/web/src/styles/globals.css
```

추가 스타일:

- 통계 숫자
- 데이터 테이블
- 프로필 아바타/행

### 2.7 게임 결과 제출 헬퍼

```text
apps/web/src/game-client/submitGameRun.ts
```

역할:

- 게임 상태가 `failed` 또는 `cleared`일 때만 결과 저장 요청
- `POST /api/game/runs` 호출
- 점수, 웨이브, 처치 수, 보스 처치 수, 상태 payload 전송

### 2.8 게임 결과 제출 패치 스크립트

```text
scripts/add-game-run-submission.mjs
```

역할:

- `createPixiGame.ts`에 `submitGameRun` import 추가
- `GameRefs`에 `resultSubmitted` 플래그 추가
- 게임 종료 시 한 번만 결과 저장 요청
- 성공 시 `기록 저장 완료` 표시
- 실패 시 `로그인하면 기록 저장` 표시

## 3. 빌드 전 패치 흐름

현재 `package.json`의 `prebuild:web`은 다음 순서로 실행됩니다.

```text
node scripts/fix-mythic-ingredient-type.mjs
node scripts/fix-floating-text-lifetime.mjs
node scripts/add-unit-info-panel.mjs
node scripts/add-game-run-submission.mjs
```

그 후 웹 빌드가 실행됩니다.

```text
pnpm --filter @discord-random-defense/web build
```

## 4. 현재 남은 구조 개선

현재는 안정성을 위해 기존 패치 스크립트 흐름에 결과 저장 패치를 추가했습니다.

다음 구조 개선 목표:

1. `fix-floating-text-lifetime.mjs` 내용을 실제 소스 모듈로 흡수
2. `add-unit-info-panel.mjs` 내용을 실제 소스 모듈로 흡수
3. `add-game-run-submission.mjs` 내용을 실제 소스로 흡수
4. 이후 `prebuild:web`에서 위 임시 패치 스크립트 제거

권장 분리 대상:

```text
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
apps/web/src/game-client/pixi/pixiUnitInfoPanelView.ts
apps/web/src/game-client/submitGameRun.ts
```

## 5. 테스트 체크리스트

배포 후 확인할 항목:

- `/login`에서 Discord 로그인 링크가 작동하는지
- 로그인 후 `/profile`에서 Discord 정보가 보이는지
- `/leaderboard`에서 랭킹 테이블이 뜨는지
- `/admin`에서 관리자 계정일 때 요약이 뜨는지
- `/play`에서 게임 종료 시 기록 저장 메시지가 뜨는지
- 로그인하지 않은 상태에서 게임 종료 시 `로그인하면 기록 저장` 메시지가 뜨는지
- 저장된 기록이 `/leaderboard`에 반영되는지

## 6. 로컬/CI 확인 명령

```bash
pnpm install
pnpm typecheck
pnpm build:web
```

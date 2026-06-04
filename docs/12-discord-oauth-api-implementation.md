# 12. Discord OAuth/API 구현 진행 기록

## 1. 이번 작업 범위

Discord 공식 OAuth2 문서 기준으로 API 인증 흐름을 placeholder 단계에서 실제 구현 단계로 전환했습니다.

적용한 핵심 기준:

- OAuth 로그인 시작 시 `state` 값을 생성합니다.
- `state`는 서명된 HttpOnly 쿠키에 짧은 만료 시간으로 저장합니다.
- 콜백에서 Discord가 반환한 `state`와 저장된 `state`를 검증합니다.
- Discord 토큰 교환 요청은 `application/x-www-form-urlencoded` 형식으로 보냅니다.
- Discord 사용자 정보와 guild 목록을 조회합니다.
- 지정한 `DISCORD_GUILD_ID`가 있으면 서버 멤버 여부를 확인합니다.
- 로그인 성공 시 서명된 세션 쿠키를 발급합니다.

## 2. 추가/변경 파일

### 2.1 세션 유틸

```text
apps/api/src/utils/session.ts
```

역할:

- OAuth `state` 쿠키 생성/검증
- 로그인 세션 쿠키 생성/검증
- HMAC-SHA256 기반 서명
- HttpOnly, Secure, SameSite=Lax 쿠키 옵션 적용

### 2.2 Discord OAuth 서비스

```text
apps/api/src/services/discordOAuthService.ts
```

역할:

- Discord authorize URL 생성
- authorization code를 access token으로 교환
- `/users/@me` 조회
- `/users/@me/guilds` 조회
- 서버 멤버 여부 확인
- 관리자 Discord ID 확인

### 2.3 유저 저장소

```text
apps/api/src/services/userRepository.ts
```

역할:

- Discord 프로필을 `users` 테이블에 upsert
- 현재 로그인 유저 정보 조회
- D1 바인딩이 없을 때도 개발 흐름이 깨지지 않도록 방어

### 2.4 게임 결과 저장 서비스

```text
apps/api/src/services/gameRunService.ts
```

역할:

- 게임 결과 입력값 정규화
- `game_runs` 저장
- `leaderboard_entries` 갱신
- 현재 DB 제약 조건에 맞춰 `SELECT → UPDATE/INSERT` 방식으로 랭킹 갱신

### 2.5 랭킹 서비스

```text
apps/api/src/services/leaderboardService.ts
```

역할:

- D1에서 랭킹 조회
- 유저 프로필과 랭킹 엔트리 join
- 기본 모드 `single_random_wave_defense` 기준 조회

### 2.6 관리자 요약 서비스

```text
apps/api/src/services/adminSummaryService.ts
```

역할:

- 전체 유저 수 조회
- 전체 게임 기록 수 조회
- 최근 게임 기록 10개 조회

## 3. 변경된 라우트

### 3.1 Auth

```text
GET /api/auth/discord
GET /api/auth/callback
GET /api/auth/status
```

기존 placeholder 응답을 실제 Discord OAuth 흐름으로 교체했습니다.

### 3.2 Me

```text
GET /api/me
```

서명된 세션 쿠키를 확인하고 현재 로그인 유저 정보를 반환합니다.

### 3.3 Game

```text
GET /api/game/status
POST /api/game/runs
```

게임 결과 저장 API를 실제 D1 저장 흐름으로 연결했습니다.

### 3.4 Leaderboard

```text
GET /api/leaderboard
```

D1 기반 랭킹 조회로 교체했습니다.

지원 query:

```text
mode
limit
```

### 3.5 Admin

```text
GET /api/admin/summary
```

관리자 세션 확인 후 D1 기반 요약 데이터를 반환합니다.

## 4. 필요한 환경변수

Cloudflare Workers 환경에 다음 값이 필요합니다.

```text
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI
DISCORD_GUILD_ID
SESSION_SECRET
ADMIN_DISCORD_IDS
PUBLIC_APP_URL
```

개발용 mock fallback을 유지하려면 다음 값을 사용할 수 있습니다.

```text
ALLOW_MOCK_AUTH=true
```

## 5. 프론트 연결

```text
apps/web/src/pages/LoginPage.tsx
```

로그인 페이지의 placeholder를 실제 Discord 로그인 링크로 교체했습니다.

프론트에서 API 주소를 분리해서 사용할 경우:

```text
VITE_API_BASE_URL
```

값을 설정하면 해당 주소의 `/api/auth/discord`로 이동합니다.

## 6. 주의사항

현재 작업은 GitHub 파일 단위 점검과 정적 코드 검토 기준으로 진행했습니다.

로컬 또는 CI에서 반드시 확인해야 할 명령:

```bash
pnpm install
pnpm --filter @discord-random-defense/api typecheck
pnpm --filter @discord-random-defense/web typecheck
pnpm typecheck
```

특히 확인해야 할 항목:

- Hono `c.set("user")`, `c.get("user")` 타입 호환성
- Cloudflare Workers 런타임의 Web Crypto, `btoa`, `atob` 사용 가능 여부
- D1 SQL 실행 여부
- Discord Developer Portal의 Redirect URI와 `DISCORD_REDIRECT_URI` 일치 여부
- 쿠키 Secure 옵션 때문에 로컬 HTTP 환경에서 테스트 방식 조정 필요 여부

## 7. 다음 작업 권장 순서

1. GitHub Actions 또는 로컬에서 API typecheck 확인
2. Cloudflare Workers 환경변수 등록
3. Discord Developer Portal OAuth Redirect URI 등록
4. `/login` → Discord 로그인 → `/dashboard` 복귀 수동 테스트
5. `/api/me` 응답 확인
6. 게임 종료 시 `POST /api/game/runs` 프론트 연결
7. 랭킹 페이지에서 `/api/leaderboard` 호출 연결
8. 이후 `createPixiGame.ts`의 배경/플로팅텍스트/웨이브 런타임 분리 진행

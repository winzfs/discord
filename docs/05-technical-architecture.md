# 05. 기술 아키텍처

## 1. 목표

이 문서는 GitHub와 Cloudflare를 이용해 디스코드 연동 웹 대시보드 및 랜덤 협동 디펜스 웹게임을 구현하기 위한 기술 구조를 정의합니다.

핵심 목표:

- Cloudflare 기반으로 저렴하고 가볍게 운영
- GitHub 저장소 중심의 버전 관리
- 문서, 코드, 데이터, 설정을 명확히 분리
- 초기 MVP는 단순하게 구성
- 추후 실시간 협동까지 확장 가능하게 설계

## 2. 권장 전체 구조

```text
사용자 브라우저
  ↓
Cloudflare Pages
  - React/Next/Vite 프론트엔드
  - 정적 자산
  - 게임 클라이언트
  ↓
Cloudflare Workers API
  - Discord OAuth 처리
  - 세션 처리
  - 게임 결과 저장
  - 랭킹 조회
  - 관리자 API
  ↓
Cloudflare D1
  - users
  - game_runs
  - leaderboard_entries
  - seasons
  - admin_logs
  ↓
Cloudflare KV
  - 세션 보조
  - OAuth state
  - 캐시
  - rate limit 보조
```

추후 실시간 협동이 필요하면 다음을 추가합니다.

```text
Cloudflare Durable Objects
  - 실시간 방 상태
  - 듀오 협동 세션
  - 서버 레이드 진행 상태
```

## 3. 프론트엔드 후보

### 3.1 Vite + React + TypeScript

장점:

- 가볍다.
- Cloudflare Pages와 잘 맞는다.
- 게임 클라이언트를 구성하기 쉽다.
- 구조가 단순하다.

단점:

- 서버 렌더링이 필요하면 별도 구성이 필요하다.

MVP 추천: **Vite + React + TypeScript**

### 3.2 Next.js

장점:

- 라우팅, API, 메타 처리 편리
- 대시보드형 서비스에 익숙함

단점:

- Cloudflare 배포 시 설정이 조금 더 복잡할 수 있음
- 게임 중심 MVP에는 과할 수 있음

결론:

초기에는 Vite + React로 시작하고, API는 Workers로 분리하는 방식을 추천합니다.

## 4. 백엔드/API 후보

### 4.1 Cloudflare Workers

역할:

- Discord OAuth callback 처리
- 로그인 세션 생성
- API 인증 미들웨어
- 게임 결과 저장
- 랭킹 조회
- 관리자 API

추천 프레임워크:

- Hono
- 또는 Cloudflare Workers 기본 라우터

MVP 추천: **Hono + Cloudflare Workers**

이유:

- 타입스크립트 친화적
- 라우팅이 단순함
- 작은 API를 기능별로 분리하기 쉬움

## 5. 데이터베이스

### 5.1 Cloudflare D1

사용 목적:

- 유저 정보
- 게임 기록
- 랭킹
- 시즌 정보
- 관리자 로그

장점:

- Cloudflare와 통합이 쉽다.
- SQLite 기반이라 단순한 서비스에 적합하다.
- Workers에서 접근하기 좋다.

### 5.2 Cloudflare KV

사용 목적:

- OAuth state 임시 저장
- 세션 캐시
- rate limit 카운터
- 자주 조회하는 랭킹 캐시

주의:

- KV는 강한 일관성이 필요한 데이터 저장소가 아니다.
- 랭킹의 원본 데이터는 D1에 저장한다.

### 5.3 Durable Objects

MVP에서는 사용하지 않습니다.

추후 사용 목적:

- 실시간 듀오 협동 방
- 실시간 전투 동기화
- 서버 레이드 상태 관리
- 매칭 대기열

## 6. 인증 흐름

### 6.1 로그인 흐름

```text
1. 유저가 로그인 버튼 클릭
2. /api/auth/discord로 이동
3. 서버가 Discord OAuth URL 생성
4. Discord 로그인/승인
5. /api/auth/callback으로 code 반환
6. Workers가 code를 access token으로 교환
7. Discord user 정보 조회
8. 서버 멤버 여부 확인
9. users 테이블 upsert
10. 세션 쿠키 발급
11. 대시보드로 redirect
```

### 6.2 로그아웃 흐름

```text
1. /api/auth/logout 호출
2. 세션 쿠키 삭제
3. KV 세션 사용 시 세션 제거
4. 홈으로 redirect
```

### 6.3 관리자 인증

관리자 판정 후보:

1. 환경 변수에 등록된 Discord ID 목록
2. Discord 서버의 관리자 권한 확인
3. 특정 역할 ID 보유 여부 확인

MVP 추천:

- `ADMIN_DISCORD_IDS` 환경 변수로 시작
- 추후 역할 ID 기반으로 확장

## 7. API 설계 초안

### 7.1 인증 API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/auth/discord` | Discord OAuth 시작 |
| GET | `/api/auth/callback` | OAuth callback 처리 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/me` | 현재 로그인 유저 조회 |

### 7.2 게임 API

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/game/runs` | 게임 결과 저장 |
| GET | `/api/game/runs/me` | 내 최근 플레이 기록 |
| GET | `/api/game/best/me` | 내 최고 기록 |
| GET | `/api/leaderboard` | 랭킹 조회 |
| GET | `/api/seasons/current` | 현재 시즌 조회 |

### 7.3 관리자 API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/admin/summary` | 관리자 요약 |
| GET | `/api/admin/runs` | 최근 게임 기록 |
| GET | `/api/admin/users` | 유저 목록/검색 |
| PATCH | `/api/admin/runs/:id` | 기록 숨김/검토 처리 |

## 8. DB 스키마 초안

### 8.1 users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  discord_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  global_name TEXT,
  avatar_url TEXT,
  is_guild_member INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);
```

### 8.2 seasons

```sql
CREATE TABLE seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  rule_set_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### 8.3 game_runs

```sql
CREATE TABLE game_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  season_id TEXT,
  mode TEXT NOT NULL,
  score INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  boss_kills INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  client_version TEXT,
  result_payload TEXT,
  suspicious INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id)
);
```

### 8.4 leaderboard_entries

```sql
CREATE TABLE leaderboard_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  season_id TEXT,
  mode TEXT NOT NULL,
  best_score INTEGER NOT NULL,
  best_wave INTEGER NOT NULL,
  best_run_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (best_run_id) REFERENCES game_runs(id)
);
```

### 8.5 admin_logs

```sql
CREATE TABLE admin_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
);
```

## 9. 환경 변수

필수 환경 변수:

```text
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=
DISCORD_GUILD_ID=
DISCORD_INVITE_URL=
SESSION_SECRET=
ADMIN_DISCORD_IDS=
PUBLIC_APP_URL=
```

Cloudflare 리소스 바인딩:

```text
DB = Cloudflare D1 binding
KV = Cloudflare KV binding
```

주의:

- `.env`는 커밋하지 않는다.
- `.env.example`만 커밋한다.
- Cloudflare Dashboard 또는 Wrangler secret으로 관리한다.

## 10. 배포 구조

### 10.1 GitHub

브랜치 전략:

- `main`: 운영 배포
- `develop`: 개발 통합
- `feature/*`: 기능 개발
- `docs/*`: 문서 작업

MVP에서는 단순하게 `main`만 사용해도 됩니다.

### 10.2 Cloudflare Pages

역할:

- 프론트엔드 빌드 결과 배포
- GitHub main 브랜치 연결
- Preview deployment 제공

빌드 예시:

```text
Build command: npm run build
Output directory: dist
```

### 10.3 Cloudflare Workers

역할:

- API 서버
- OAuth 처리
- DB 접근

배포:

```text
wrangler deploy
```

### 10.4 Monorepo 구성

추천:

```text
apps/web       프론트엔드
apps/api       Workers API
packages/game  게임 로직 공유 패키지
packages/ui    공통 UI
packages/types 공통 타입
```

초기 MVP에서는 너무 복잡하면 다음처럼 시작해도 됩니다.

```text
src/
  app/
  game/
  server/
```

하지만 장기적으로는 `apps/`, `packages/` 구조가 유지보수에 유리합니다.

## 11. 클라이언트 게임 엔진 방향

### 11.1 구현 방식 후보

1. React DOM 기반
2. Canvas 기반
3. PixiJS 기반
4. Phaser 기반

MVP 추천:

- 초기에는 Canvas 또는 단순 DOM으로 구현
- 유닛/적 수가 많아지면 PixiJS 또는 Phaser 검토

### 11.2 게임 로직 분리

중요:

게임 로직은 React 컴포넌트 안에 넣지 않습니다.

분리 예시:

```text
packages/game/src/engine/
  GameLoop.ts
  GameState.ts
  CombatSystem.ts
  WaveSystem.ts
  SummonSystem.ts
  MergeSystem.ts
  ScoreSystem.ts
```

React는 화면 표시와 입력만 담당합니다.

## 12. 치팅 방지와 서버 검증

MVP에서는 모든 전투를 서버에서 계산하지 않아도 됩니다.

대신:

- 게임 시작 시 seed 발급
- 결과 제출 시 seed, duration, score, wave, kills 제출
- 서버가 기본 이상치 검증
- 비정상 결과는 `suspicious = 1`

추후:

- 서버에서 전투 재현 검증
- 상위 랭킹만 재검증
- 리플레이 데이터 저장

## 13. 로깅/모니터링

MVP 로그:

- 로그인 성공/실패
- 게임 결과 저장 실패
- 관리자 작업
- 비정상 점수 감지

Cloudflare 기능:

- Workers logs
- Analytics
- D1 query 확인

추후:

- Sentry
- Logpush
- Discord 관리자 채널 알림

## 14. 테스트 전략

### 14.1 단위 테스트

대상:

- 소환 확률
- 합성 규칙
- 점수 계산
- 웨이브 생성
- 랭킹 갱신

### 14.2 통합 테스트

대상:

- 로그인 흐름
- 게임 결과 저장
- 랭킹 조회
- 관리자 권한 체크

### 14.3 수동 테스트

대상:

- 모바일 화면
- 디스코드 인앱 브라우저
- 느린 네트워크
- 새 유저 최초 로그인

## 15. 기술 결론

MVP 추천 조합:

- Vite + React + TypeScript
- Cloudflare Pages
- Cloudflare Workers + Hono
- Cloudflare D1
- Cloudflare KV
- Discord OAuth2
- GitHub 저장소 기반 배포

추후 확장:

- Durable Objects로 실시간 협동
- 디스코드 봇 연동
- 시즌/이벤트 자동화
- 리플레이 검증

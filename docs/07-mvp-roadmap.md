# 07. MVP 개발 로드맵

## 1. 목적

이 문서는 Codex 또는 개발자가 초기 시스템을 구성할 때 따라갈 작업 순서를 정리합니다.

중요 원칙:

- 한 번에 전체 게임을 만들지 않는다.
- 먼저 프로젝트 구조를 만들고, 그다음 작은 기능을 순서대로 붙인다.
- 모든 작업은 문서와 파일 시스템 가이드를 기준으로 진행한다.
- 기능 단위로 PR 또는 커밋을 나눈다.

## 2. MVP 최종 목표

MVP가 완료되면 다음이 가능해야 합니다.

1. 유저가 디스코드로 로그인한다.
2. 지정 디스코드 서버 멤버인지 확인한다.
3. 대시보드에서 내 프로필과 랭킹을 본다.
4. 웹게임을 시작한다.
5. 랜덤 유닛을 호출하고 합성하며 웨이브를 막는다.
6. 게임 결과가 저장된다.
7. 최고 점수가 서버 랭킹에 반영된다.
8. 관리자가 최근 기록을 확인한다.

## 3. 개발 단계 요약

| 단계 | 목표 | 산출물 |
|---|---|---|
| 0 | 문서 정리 | `docs/` 문서 세트 |
| 1 | 프로젝트 초기화 | 앱/패키지 폴더, 설정 파일 |
| 2 | 게임 규칙 패키지 | 순수 함수, 데이터, 테스트 |
| 3 | 프론트 기본 화면 | 라우팅, 대시보드, 게임 화면 껍데기 |
| 4 | API 기본 구조 | Workers, 라우트, 미들웨어 |
| 5 | Discord OAuth | 로그인/세션/멤버 확인 |
| 6 | DB/랭킹 | D1 스키마, 결과 저장, 랭킹 조회 |
| 7 | 게임 MVP | 호출, 합성, 웨이브, 점수 계산 |
| 8 | 관리자 화면 | 최근 기록, suspicious 표시 |
| 9 | Cloudflare 배포 | Pages/Workers/D1/KV 연결 |
| 10 | 베타 테스트 | 밸런스 조정, 버그 수정 |

## 4. 1단계: 프로젝트 초기화

### 목표

저장소에 기본 개발 환경을 만든다.

### 작업

- package manager 선택: pnpm 추천
- TypeScript 설정
- ESLint/Prettier 설정
- apps/web 생성
- apps/api 생성
- packages/game 생성
- packages/types 생성
- packages/ui 생성
- `.env.example` 생성
- `wrangler.toml` 또는 예시 파일 생성

### Codex 지시 예시

```text
docs/06-file-system-guide.md 기준으로 pnpm monorepo 구조를 만들어줘.
아직 실제 게임 구현은 하지 말고, apps/web, apps/api, packages/game, packages/types 폴더와 기본 TypeScript 설정만 구성해줘.
Cloudflare 배포를 고려해서 wrangler.toml 예시와 .env.example도 만들어줘.
```

### 완료 기준

- `pnpm install` 가능
- `pnpm typecheck` 가능
- web 앱이 기본 화면을 띄움
- api 앱이 기본 health check 응답

## 5. 2단계: 게임 규칙 패키지

### 목표

React나 API와 무관한 순수 게임 로직을 먼저 만든다.

### 작업

- 유닛 타입 정의
- 적 타입 정의
- 웨이브 타입 정의
- 게임 상태 타입 정의
- 유닛 데이터 12개 작성
- 적 데이터 3개 작성
- 보스 데이터 2개 작성
- 웨이브 데이터 30개 작성
- 점수 계산 함수
- 소환 함수
- 합성 함수
- 기본 테스트

### 파일 후보

```text
packages/game/src/types/unit.ts
packages/game/src/types/enemy.ts
packages/game/src/types/wave.ts
packages/game/src/types/gameState.ts
packages/game/src/data/units.ts
packages/game/src/data/enemies.ts
packages/game/src/data/waves.ts
packages/game/src/rules/scoring.ts
packages/game/src/systems/summonSystem.ts
packages/game/src/systems/mergeSystem.ts
```

### Codex 지시 예시

```text
packages/game에 랜덤 디펜스 MVP용 순수 게임 로직을 작성해줘.
React 컴포넌트는 만들지 말고, 유닛/적/웨이브 데이터와 점수 계산, 소환, 합성 함수만 작성해줘.
각 함수에는 간단한 테스트를 추가해줘.
```

### 완료 기준

- 소환 결과가 seed 기반 랜덤으로 결정됨
- 같은 등급 3개 합성이 가능함
- 점수 계산 테스트 통과
- React 없이도 게임 규칙 테스트 가능

## 6. 3단계: 프론트 기본 화면

### 목표

웹 사용자가 이동할 수 있는 기본 화면을 만든다.

### 화면

- 홈
- 로그인
- 대시보드
- 게임
- 랭킹
- 프로필
- 관리자

### 작업

- React Router 또는 TanStack Router 구성
- 기본 레이아웃
- 공통 버튼/카드 컴포넌트
- API client 초안
- 로그인 상태 mock
- 게임 화면 placeholder

### Codex 지시 예시

```text
apps/web에 라우팅과 기본 페이지를 구성해줘.
아직 Discord OAuth와 실제 API 연결은 하지 말고 mock 데이터로 대시보드, 랭킹, 게임 페이지 껍데기를 만들어줘.
컴포넌트는 docs/06-file-system-guide.md의 파일 분리 기준을 지켜줘.
```

### 완료 기준

- 각 페이지 이동 가능
- 모바일에서 기본 레이아웃 깨지지 않음
- 게임 시작 버튼이 GamePage로 이동

## 7. 4단계: API 기본 구조

### 목표

Cloudflare Workers API 기본 구조를 만든다.

### 작업

- Hono 설정
- health check
- 에러 핸들러
- auth middleware 초안
- admin middleware 초안
- API 응답 유틸
- 환경 변수 검증

### API

```text
GET /api/health
GET /api/me
GET /api/leaderboard
POST /api/game/runs
GET /api/admin/summary
```

### Codex 지시 예시

```text
apps/api에 Hono 기반 Cloudflare Workers API 구조를 만들어줘.
health check, 공통 response helper, error handler, authRequired/adminRequired 미들웨어 파일을 분리해서 작성해줘.
아직 Discord OAuth와 DB 연결은 mock으로 처리해줘.
```

### 완료 기준

- `/api/health` 응답
- 타입 체크 통과
- 라우트 파일과 서비스 파일이 분리됨

## 8. 5단계: Discord OAuth

### 목표

실제 디스코드 로그인과 서버 멤버 확인을 구현한다.

### 작업

- Discord OAuth URL 생성
- OAuth callback 처리
- access token 교환
- Discord user 조회
- guild membership 확인
- 세션 쿠키 발급
- logout 구현

### 환경 변수

```text
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI
DISCORD_GUILD_ID
SESSION_SECRET
PUBLIC_APP_URL
```

### Codex 지시 예시

```text
apps/api에 Discord OAuth 로그인 흐름을 구현해줘.
환경 변수는 env.ts에서 검증하고, discordOAuth.ts와 discordApi.ts로 로직을 분리해줘.
세션은 암호화 쿠키 또는 서명 쿠키로 시작하고, 민감정보는 클라이언트에 노출하지 말아줘.
```

### 완료 기준

- Discord 로그인 가능
- 로그인 후 `/api/me`에서 유저 정보 반환
- 비로그인 상태에서 보호 API 접근 불가

## 9. 6단계: DB와 랭킹

### 목표

Cloudflare D1에 유저와 게임 기록을 저장한다.

### 작업

- D1 마이그레이션 작성
- users 테이블
- seasons 테이블
- game_runs 테이블
- leaderboard_entries 테이블
- admin_logs 테이블
- repository 계층 작성
- 결과 저장 시 랭킹 갱신

### Codex 지시 예시

```text
docs/05-technical-architecture.md의 DB 스키마를 기준으로 D1 migration을 작성하고, apps/api/src/repositories에 테이블별 repository를 만들어줘.
게임 결과 저장 시 leaderboard_entries의 최고 점수를 갱신하는 service를 작성해줘.
```

### 완료 기준

- 로그인 유저 upsert 가능
- 게임 결과 저장 가능
- 최고 점수 갱신 가능
- 랭킹 조회 가능

## 10. 7단계: 게임 MVP 구현

### 목표

실제로 한 판 플레이 가능한 게임을 만든다.

### MVP 기능

- 게임 시작
- 빈 필드 생성
- 랜덤 유닛 호출
- 웨이브 시작
- 적 이동
- 유닛 자동 공격
- 적 처치
- 자원 획득
- 유닛 합성
- 생명 감소
- 게임 종료
- 결과 제출

### Codex 지시 예시

```text
packages/game의 순수 로직을 사용해서 apps/web의 GamePage에 MVP 게임을 연결해줘.
게임 렌더링은 간단한 DOM 또는 Canvas로 구현해도 되고, 우선 보기 좋게 동작하는 것을 목표로 해줘.
게임 규칙은 React 컴포넌트에 직접 넣지 말고 packages/game 함수를 사용해줘.
```

### 완료 기준

- 한 판 시작/종료 가능
- 점수 계산 가능
- 결과 API 제출 가능
- 랭킹 반영 가능

## 11. 8단계: 관리자 화면

### 목표

운영자가 기본 기록을 확인할 수 있게 한다.

### 기능

- 총 유저 수
- 총 플레이 수
- 최근 플레이 기록
- suspicious 기록 표시
- 랭킹 TOP 확인

### Codex 지시 예시

```text
관리자 페이지와 admin API를 연결해줘.
ADMIN_DISCORD_IDS 또는 is_admin 권한이 있는 유저만 접근 가능해야 해.
최근 게임 기록, 전체 플레이 수, 유저 수, suspicious 기록을 보여줘.
```

### 완료 기준

- 일반 유저 접근 불가
- 관리자만 요약 데이터 확인 가능

## 12. 9단계: Cloudflare 배포

### 목표

GitHub와 Cloudflare를 연결해 실제 배포한다.

### 작업

- Cloudflare Pages 프로젝트 생성
- GitHub 저장소 연결
- 빌드 명령 설정
- Workers 배포 설정
- D1 생성 및 migration 적용
- KV namespace 생성
- 환경 변수/secret 설정
- Discord redirect URI 등록

### 체크리스트

```text
[ ] DISCORD_CLIENT_ID 등록
[ ] DISCORD_CLIENT_SECRET 등록
[ ] DISCORD_REDIRECT_URI 등록
[ ] DISCORD_GUILD_ID 등록
[ ] SESSION_SECRET 등록
[ ] D1 binding 연결
[ ] KV binding 연결
[ ] Pages build 성공
[ ] Workers deploy 성공
[ ] OAuth callback 정상 작동
```

## 13. 10단계: 베타 테스트

### 목표

서버 멤버 몇 명이 실제 플레이하며 문제를 찾는다.

### 확인할 것

- 로그인 실패 여부
- 모바일 화면 문제
- 게임이 너무 쉽거나 어려운지
- 호출/합성 재미가 있는지
- 랭킹 저장 오류
- 비정상 점수 제출 가능성
- 플레이 시간이 적절한지

### 밸런스 조정 우선순위

1. 한 판 플레이 시간
2. 초반 호출 빈도
3. 보스 난이도
4. 전설 유닛 등장 체감
5. 랭킹 점수 분포

## 14. MVP 이후 확장 로드맵

### 14.1 1차 확장

- 유물 10개
- 일일 미션
- 시즌 보상
- 이벤트 배너 관리
- 디스코드 공유 문구

### 14.2 2차 확장

- 마스코트/펫
- 주간 도전 모드
- 하드 모드
- 디스코드 봇 명령어
- 관리자 시즌 생성 UI

### 14.3 3차 확장

- 실시간 듀오 협동
- Durable Objects 방 관리
- 서버 레이드
- 리플레이 검증
- 역할 보상 자동 지급

## 15. 작업 쪼개기 예시

Codex에 줄 수 있는 작은 작업 단위 예시입니다.

1. `pnpm monorepo 초기화만 해줘.`
2. `packages/game 타입과 점수 계산 함수만 만들어줘.`
3. `유닛 데이터 12개와 소환 함수만 만들어줘.`
4. `합성 함수와 테스트만 작성해줘.`
5. `apps/web 라우팅만 구성해줘.`
6. `apps/api health check와 Hono 구조만 만들어줘.`
7. `Discord OAuth 시작/callback 라우트만 구현해줘.`
8. `D1 migration과 userRepository만 작성해줘.`
9. `game_runs 저장 API만 구현해줘.`
10. `leaderboard 조회 API와 화면만 연결해줘.`

이렇게 나누면 큰 파일이 생길 가능성이 줄어듭니다.

## 16. 최종 MVP 완료 정의

다음 조건이 모두 만족되면 MVP 완료로 봅니다.

- GitHub main 브랜치에서 Cloudflare 배포 성공
- Discord 로그인 가능
- 서버 멤버만 대시보드 접근 가능
- 게임 한 판 플레이 가능
- 결과 저장 가능
- 랭킹 조회 가능
- 관리자 기본 화면 접근 가능
- 모바일에서 플레이 가능
- 문서와 실제 구조가 크게 어긋나지 않음

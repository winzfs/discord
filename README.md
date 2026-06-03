# 디스코드 연동 랜덤 디펜스 웹게임

오버워치 디스코드 커뮤니티 서버와 연동되는 웹 대시보드 및 모바일 웹게임 프로젝트입니다.

이 프로젝트는 **운빨존많겜 스타일의 싱글플레이 랜덤 디펜스**를 기반으로 하며, 실제 게임 플레이 화면은 **PixiJS 기반 독립 캔버스 화면**으로 구현합니다.

## 개발 방향

이 프로젝트는 **운빨존많겜 스타일의 랜덤 디펜스**를 기반으로 하되, 메인 플레이는 **싱글플레이 위주**로 설계합니다.

오버워치 영웅, 역할군, 스킬 감성은 팬게임 요소로 활용합니다. 다만 프로젝트 성격은 비상업 팬게임이며, 공식 서비스가 아님을 명확히 고지합니다.

목표는 다음과 같습니다.

- 디스코드 서버 멤버가 웹에서 간단히 접속할 수 있는 커뮤니티용 미니게임
- 싱글플레이 중심의 랜덤 영웅 소환, 등급 성장, 합성, 웨이브 방어 구조
- 오버워치 영웅/스킬 감성을 활용한 팬게임형 유닛 구성
- 2인 협동은 MVP 이후 확장 가능한 선택 콘텐츠로 보류
- GitHub + Cloudflare 기반의 가볍고 유지보수 쉬운 웹서비스
- React 대시보드와 PixiJS 게임 화면을 분리한 구조
- 큰 단일 파일을 피하고 기능별 파일 시스템을 명확히 분리하는 구조

## 현재 구현 방향

현재 게임 플레이는 다음 라우트에서 진행합니다.

```text
/play
```

`/play`는 일반 웹 레이아웃 밖에 있는 독립 게임 화면입니다.

- 헤더/푸터 없음
- 전체화면 PixiJS 캔버스
- 밝은 숲/필드형 배경
- 중앙 영웅 배치판
- 외곽 몬스터 이동 경로
- 상단 웨이브/코어 HP UI
- 하단 대형 소환 버튼
- PixiJS 기반 소환/합성/웨이브 연출

React는 홈, 대시보드, 랭킹, 프로필, 관리자 같은 서비스 UI를 담당하고, PixiJS는 실제 게임 플레이 화면을 담당합니다.

## 팬게임 고지 방향

권장 고지 문구:

```text
이 프로젝트는 오버워치 팬 커뮤니티를 위한 비상업 팬게임입니다.
오버워치 및 관련 명칭, 캐릭터, 설정은 Blizzard Entertainment의 자산입니다.
본 프로젝트는 Blizzard Entertainment와 공식적으로 관련이 없으며, 후원·제휴·승인을 받은 서비스가 아닙니다.
```

## 문서 목록

| 문서 | 내용 |
|---|---|
| `docs/00-project-brief.md` | 프로젝트 개요, 목표, 금지사항, MVP 범위 |
| `docs/01-reference-analysis.md` | 업로드 참고 문서 기반 장르 분석 및 재해석 기준 |
| `docs/02-game-design.md` | 게임 콘셉트, 핵심 루프, 모드, 플레이 흐름 |
| `docs/03-game-systems.md` | 유닛, 소환, 합성, 강화, 유물, 펫, 보상 시스템 |
| `docs/04-discord-dashboard.md` | 디스코드 로그인, 서버 대시보드, 랭킹, 관리자 기능 |
| `docs/05-technical-architecture.md` | GitHub, Cloudflare, 프론트/백엔드 구조 |
| `docs/06-file-system-guide.md` | 유지보수와 확장을 위한 폴더/파일 설계 원칙 |
| `docs/07-mvp-roadmap.md` | Codex용 개발 순서, MVP 단계별 작업 목록 |
| `docs/08-worldview-tone-guide.md` | 싱글플레이 우선 방향, 오버워치 팬게임 세계관/톤 가이드 |
| `docs/09-deployment-guide.md` | Cloudflare Pages/Workers 배포 가이드 |
| `docs/10-pixi-game-client-guide.md` | PixiJS 독립 게임 화면 구현 방향 |

## 권장 기술 스택

- Frontend: React + TypeScript + Vite
- Game Renderer: PixiJS
- Runtime/Deploy: Cloudflare Pages
- API: Cloudflare Workers + Hono
- DB: Cloudflare D1
- Cache/Rate Limit/Session 보조: Cloudflare KV
- Realtime 확장 후보: Durable Objects
- Auth: Discord OAuth2
- Repository: GitHub

## 핵심 원칙

1. 메인은 싱글플레이 랜덤 디펜스로 개발한다.
2. 게임 플레이 화면은 PixiJS 독립 캔버스로 구현한다.
3. React는 대시보드, 랭킹, 로그인, 관리자 등 서비스 UI를 담당한다.
4. 2인 협동은 초기 MVP 필수가 아니라 추후 확장으로 둔다.
5. MVP는 작게 시작하되 시스템 확장을 고려한다.
6. 코드와 데이터 파일을 기능별로 분리한다.
7. 게임 밸런스 값은 코드에 하드코딩하지 않고 설정 파일 또는 DB로 분리한다.
8. 디스코드 커뮤니티 활동과 게임 보상이 자연스럽게 연결되도록 설계한다.

## 현재 상태

- pnpm workspace 기반 monorepo 구성 완료
- Vite + React 웹앱 구성 완료
- Cloudflare Workers + Hono API 기본 구조 구성 완료
- `packages/game` 순수 게임 로직 패키지 구성 중
- PixiJS `/play` 독립 게임 화면 프로토타입 구현 중
- Cloudflare Pages 스마트폰 테스트 배포 진행 중

## 초기 개발 환경 실행

```bash
pnpm install
pnpm typecheck
pnpm dev:web
pnpm dev:api
```

- Web: `apps/web`에서 Vite + React + TypeScript로 실행됩니다.
- Game Play: `/play`에서 PixiJS 기반 독립 게임 화면이 실행됩니다.
- API: `apps/api`에서 Cloudflare Workers + Hono로 실행되며 `/health`와 `/api/health`를 제공합니다.
- Game Logic: `packages/game`은 React/PixiJS와 무관한 순수 TypeScript 패키지입니다.
- 정적 이미지 교체는 `apps/web/public/assets/` 파일 교체 또는 `apps/web/src/assets/assetManifest.ts` 수정으로 처리합니다.

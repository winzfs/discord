# 디스코드 연동 랜덤 디펜스 웹게임

오버워치 디스코드 커뮤니티 서버와 연동되는 웹 대시보드 및 간편 웹게임 프로젝트입니다.

이 저장소는 우선 **문서 중심**으로 시작합니다. 초기 앱 구조, 프론트엔드, 백엔드, Cloudflare 배포 구성은 이후 Codex 또는 별도 개발 단계에서 생성합니다.

## 개발 방향

이 프로젝트는 **운빨존많겜 스타일의 랜덤 디펜스**를 기반으로 하되, 메인 플레이는 **싱글플레이 위주**로 설계합니다.

오버워치 영웅, 역할군, 스킬 감성은 팬게임 요소로 활용합니다. 다만 프로젝트 성격은 비상업 팬게임이며, 공식 서비스가 아님을 명확히 고지합니다.

목표는 다음과 같습니다.

- 디스코드 서버 멤버가 웹에서 간단히 접속할 수 있는 커뮤니티용 미니게임
- 싱글플레이 중심의 랜덤 영웅 소환, 등급 성장, 합성, 웨이브 방어 구조
- 오버워치 영웅/스킬 감성을 활용한 팬게임형 유닛 구성
- 2인 협동은 MVP 이후 확장 가능한 선택 콘텐츠로 보류
- GitHub + Cloudflare 기반의 가볍고 유지보수 쉬운 웹서비스
- 큰 단일 파일을 피하고 기능별 파일 시스템을 명확히 분리하는 구조

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

## 권장 기술 스택 초안

- Frontend: React + TypeScript + Vite 또는 Next.js
- Runtime/Deploy: Cloudflare Pages
- API: Cloudflare Workers
- DB: Cloudflare D1
- Cache/Rate Limit/Session 보조: Cloudflare KV
- Realtime 확장 후보: Durable Objects
- Auth: Discord OAuth2
- Repository: GitHub

## 핵심 원칙

1. 메인은 싱글플레이 랜덤 디펜스로 개발한다.
2. 2인 협동은 초기 MVP 필수가 아니라 추후 확장으로 둔다.
3. MVP는 작게 시작하되 시스템 확장을 고려한다.
4. 코드와 데이터 파일을 기능별로 분리한다.
5. 게임 밸런스 값은 코드에 하드코딩하지 않고 설정 파일 또는 DB로 분리한다.
6. 디스코드 커뮤니티 활동과 게임 보상이 자연스럽게 연결되도록 설계한다.

## 현재 상태

- 문서 기획 단계
- 코드 생성 전
- Codex가 이후 `docs/07-mvp-roadmap.md`를 기준으로 초기 구조를 생성하는 것을 권장

## 초기 개발 환경 실행

이 저장소는 pnpm workspace 기반 monorepo로 구성됩니다.

```bash
pnpm install
pnpm typecheck
pnpm dev:web
pnpm dev:api
```

- Web: `apps/web`에서 Vite + React + TypeScript로 실행됩니다.
- API: `apps/api`에서 Cloudflare Workers + Hono로 실행되며 `/health`와 `/api/health`를 제공합니다.
- Game Logic: `packages/game`은 React와 무관한 순수 TypeScript 패키지입니다.
- 정적 이미지 교체는 `apps/web/public/assets/` 파일 교체 또는 `apps/web/src/assets/assetManifest.ts` 수정으로 처리합니다.

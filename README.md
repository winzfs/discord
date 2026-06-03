# 디스코드 연동 랜덤 협동 디펜스 웹게임

오버워치 디스코드 커뮤니티 서버와 연동되는 웹 대시보드 및 간편 웹게임 프로젝트입니다.

이 저장소는 우선 **문서 중심**으로 시작합니다. 초기 앱 구조, 프론트엔드, 백엔드, Cloudflare 배포 구성은 이후 Codex 또는 별도 개발 단계에서 생성합니다.

## 개발 방향

기존 참고 문서의 핵심 장르 구조는 분석하되, 특정 게임의 고유명사, 캐릭터, 스킬명, 수치, UI, 성장 테이블은 그대로 사용하지 않습니다.

목표는 다음과 같습니다.

- 디스코드 서버 멤버가 웹에서 간단히 접속할 수 있는 커뮤니티용 미니게임
- 랜덤 소환, 등급 성장, 합성, 웨이브 방어, 유물/펫/시즌 보상 구조를 가진 협동형 디펜스
- 오버워치 커뮤니티 감성과 어울리는 별도 세계관과 캐릭터 구성
- GitHub + Cloudflare 기반의 가볍고 유지보수 쉬운 웹서비스
- 큰 단일 파일을 피하고 기능별 파일 시스템을 명확히 분리하는 구조

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

1. 원작 복제가 아니라 장르 재해석으로 개발한다.
2. MVP는 작게 시작하되 시스템 확장을 고려한다.
3. 코드와 데이터 파일을 기능별로 분리한다.
4. 게임 밸런스 값은 코드에 하드코딩하지 않고 설정 파일 또는 DB로 분리한다.
5. 디스코드 커뮤니티 활동과 게임 보상이 자연스럽게 연결되도록 설계한다.

## 현재 상태

- 문서 기획 단계
- 코드 생성 전
- Codex가 이후 `docs/07-mvp-roadmap.md`를 기준으로 초기 구조를 생성하는 것을 권장

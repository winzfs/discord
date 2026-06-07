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

현재 주요 라우트는 다음처럼 나뉩니다.

```text
/game       일반 웹 레이아웃 안의 게임 안내/시작 페이지
/play       PixiJS 기반 전체화면 실제 게임 화면
/play-test  테스트 컨트롤이 포함된 PixiJS 게임 화면
/lobby      로비/상점/성장 화면
```

`/play`는 일반 웹 레이아웃 밖에 있는 독립 게임 화면입니다.

- 헤더/푸터 없음
- 전체화면 PixiJS 캔버스
- 밝은 숲/필드형 배경
- 중앙 4x5 영웅 배치판
- 외곽 몬스터 이동 경로
- 상단 웨이브/코어 HP/화력/재화 UI
- 하단 소환/신화/도박/공격력 강화/웨이브 버튼
- PixiJS 기반 소환/중첩/합성/판매/이동/웨이브/공격 연출
- 적 개체별 HP, 실제 경로 이동, 누수, 처치 보상
- 웨이브 클리어 후 다음 웨이브 자동 진행 및 웨이브별 난이도 상승
- 신화 영웅별 고유 스킬/궁극기 게이지/궁극기 발동
- 영웅별 고유 기본공격 FX와 궁극기 FX
- Tracer, Kiriko, D.Va, Zarya, Cassidy, Winston, Genji, Ana, Illari 스프라이트 시트 적용
- 공격 후 마지막 공격 방향으로 대기, 3초간 공격이 없으면 왼쪽 대기 방향으로 복귀
- Illari는 대기 프레임만 오른쪽/왼쪽 순서 예외 처리, 공격 프레임은 공통 순서 사용
- `Graphics` 풀 기반 이펙트 객체 재사용 최적화
- 게임 종료 시 로그인 상태에서 기록 저장 API 호출
- 기록 저장 시 `durationSeconds` 0 고정 문제 보정
- 서버 기록 1차 suspicious 검증 및 랭킹 hidden/suspicious 필터 적용
- `/play-test` 테스트 컨트롤 상태를 Pixi 게임 인스턴스별로 관리

React는 홈, 대시보드, 로그인, 랭킹, 프로필, 관리자 같은 서비스 UI를 담당하고, PixiJS는 실제 게임 플레이 화면을 담당합니다.

## 현재 우선순위

현재는 **빌드 안정화, 기록/랭킹 검증, PixiJS 회귀 테스트** 단계입니다.

우선순위:

- `pnpm typecheck`, `pnpm build:web` 기준 빌드 안정화
- `/play`, `/play-test` 실제 실행 회귀 테스트
- `/play-test` 진입/이탈/재진입 시 테스트 컨트롤 정상 표시 확인
- 웨이브 클리어/시간 종료/보스 웨이브 진행 검증
- 영웅 스프라이트 방향, 공격 모션, 3초 대기 방향 복귀 검증
- 소환/이동/중첩/합성/판매 UX 검증
- 적 이동/공격/누수/보상/보스 웨이브 검증
- 신화 조합창 재료 표시와 조합 가능 여부 검증
- 신화 영웅 스킬/궁극기 발동 조건과 이펙트 확인
- 로그인 상태에서 게임 기록 저장과 랭킹 반영 확인
- `durationSeconds`가 0이 아닌 값으로 저장되는지 확인
- suspicious/hidden 기록이 랭킹에서 제외되는지 확인
- 로컬 HTTP OAuth 테스트에서 session/state cookie 저장 확인
- `createPixiGame.ts` 비대화를 줄이기 위한 추가 모듈 분리

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
| `docs/10-pixi-game-client-guide.md` | PixiJS 독립 게임 화면 구현 방향과 현재 클라이언트 구조 |
| `docs/11-current-development-status.md` | 현재 개발 상태, 완료된 인프라, 다음 작업 우선순위 |
| `docs/12-recent-implementation-brief.md` | 최근 수정사항, 회귀 테스트 체크리스트, 다음 작업 브리핑 |

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
5. 기존에 동작하던 클라이언트를 새로 만들지 않고, 기존 클라이언트 위에서 부분 패치한다.
6. 코드와 데이터 파일을 기능별로 분리한다.
7. 게임 밸런스 값은 코드에 하드코딩하지 않고 설정 파일 또는 DB로 분리한다.
8. 디스코드 커뮤니티 활동과 게임 보상이 자연스럽게 연결되도록 설계한다.
9. PixiJS 객체는 가능한 한 최초 생성 후 재사용하고, 값만 갱신한다.
10. 문서와 실제 코드 상태가 달라지면 문서를 즉시 갱신한다.

## 현재 상태

- pnpm workspace 기반 monorepo 구성 완료
- Vite + React 웹앱 구성 완료
- `/game` 안내 페이지와 `/play` 독립 게임 화면 분리 완료
- `/play-test` 테스트 화면 추가 완료
- `/lobby` 로비 화면 추가 완료
- Cloudflare Workers + Hono API 구조 구성 완료
- Cloudflare D1 테이블 구성 완료
- Discord OAuth authorize/callback/session cookie 흐름 구현 완료
- 로컬 HTTP OAuth 테스트용 cookie secure 분기 적용
- `/api/me` 현재 유저 조회 구현 완료
- `/api/game/runs` 게임 기록 저장 구현 완료
- 게임 기록 `durationSeconds` 0 고정 문제 보정
- 게임 기록 suspicious 1차 검증 및 랭킹 갱신 차단 구현
- `/api/leaderboard` 랭킹 조회 구현 완료
- 랭킹 hidden/suspicious 기록 제외 구현
- `packages/game` 순수 게임 로직 패키지 구성 진행 중
- PixiJS `/play` 실제 게임 플레이 MVP 구현 진행 중
- 4x5 보드, 자동 웨이브, 적 이동, 유닛 자동 공격, 보스 웨이브 경고, 행운석 보상, 신화 조합 메뉴 구현
- 웨이브 클리어 후 다음 웨이브 자동 증가 및 웨이브별 난이도 상승 흐름 구현
- 신화 영웅별 스킬/궁극기 게이지/궁극기 발동 구현
- D.Va, 자리야, 윈스턴, 트레이서, 캐서디, 겐지, 아나, 키리코, 일리아리 기본공격/궁극기 FX 구현
- Tracer, Kiriko, D.Va, Zarya, Cassidy, Winston, Genji, Ana, Illari 스프라이트 시트 적용
- 영웅 공격 후 마지막 공격 방향 대기, 3초 무공격 시 왼쪽 대기 복귀 적용
- Illari 대기 프레임 오른쪽/왼쪽 순서 예외 처리 적용
- HUD, Controls, EnemyView, BoardView, CombatRuntime, WaveRuntime, SkillRuntime, UltimateRuntime, FX Runtime 등 렌더링/런타임 모듈 분리 진행
- `/play-test` 테스트 컨트롤 전역 상태 제거 및 GameRefs 기반 관리 적용
- `pixiFxPoolRuntime.ts` 기반 `Graphics` 재사용 풀 추가
- 다음 작업은 빌드/타입체크 확인, 회귀 테스트, 점수/보상 검증 강화, 추가 모듈 분리

## 초기 개발 환경 실행

```bash
pnpm install
pnpm typecheck
pnpm dev:web
pnpm dev:api
```

- Web: `apps/web`에서 Vite + React + TypeScript로 실행됩니다.
- Game Play: `/play`에서 PixiJS 기반 독립 게임 화면이 실행됩니다.
- Test Play: `/play-test`에서 테스트 컨트롤이 포함된 게임 화면이 실행됩니다.
- API: `apps/api`에서 Cloudflare Workers + Hono로 실행되며 `/health`와 `/api/health`를 제공합니다.
- Game Logic: `packages/game`은 React/PixiJS와 무관한 순수 TypeScript 패키지입니다.
- 정적 이미지 교체는 `apps/web/public/assets/` 파일 교체 또는 `apps/web/src/assets/assetManifest.ts` 수정으로 처리합니다.

# 07. MVP 개발 로드맵

## 1. 목적

이 문서는 Codex 또는 개발자가 초기 시스템을 구성할 때 따라갈 작업 순서를 정리합니다.

중요 원칙:

- 한 번에 전체 게임을 만들지 않는다.
- 먼저 프로젝트 구조를 만들고, 그다음 작은 기능을 순서대로 붙인다.
- MVP는 싱글플레이 랜덤 디펜스 1개만 목표로 한다.
- 실제 게임 플레이 화면은 React DOM이 아니라 PixiJS 독립 캔버스로 구현한다.
- React는 홈, 로그인, 대시보드, 랭킹, 프로필, 관리자 같은 서비스 UI를 담당한다.
- 2인 협동, 하드 모드, 주간 도전, 서버 레이드는 MVP에서 제외한다.
- 모든 작업은 문서와 파일 시스템 가이드를 기준으로 진행한다.
- 기능 단위로 PR 또는 커밋을 나눈다.

## 2. MVP 최종 목표

MVP가 완료되면 다음이 가능해야 합니다.

1. 유저가 디스코드로 로그인한다.
2. 지정 디스코드 서버 멤버인지 확인한다.
3. 대시보드에서 내 프로필과 랭킹을 본다.
4. `/play`에서 PixiJS 기반 싱글플레이 랜덤 디펜스를 시작한다.
5. 랜덤 영웅을 소환하고 합성하며 30웨이브를 막는다.
6. 게임 결과가 저장된다.
7. 최고 점수가 서버 랭킹에 반영된다.
8. 관리자가 최근 기록을 확인한다.

## 3. 개발 단계 요약

| 단계 | 목표 | 산출물 |
|---|---|---|
| 0 | 문서 정리 | `docs/` 문서 세트 |
| 1 | 프로젝트 초기화 | 앱/패키지 폴더, 설정 파일 |
| 2 | 게임 규칙 패키지 | 순수 함수, 데이터, 테스트 |
| 3 | 프론트 기본 화면 | React 라우팅, 대시보드, 랭킹, `/play` 라우트 |
| 4 | API 기본 구조 | Workers, 라우트, 미들웨어 |
| 5 | PixiJS 게임 화면 | 전체화면 캔버스, 필드맵, 보드, 조작부 |
| 6 | Discord OAuth | 로그인/세션/멤버 확인 |
| 7 | DB/랭킹 | D1 스키마, 결과 저장, 랭킹 조회 |
| 8 | 싱글 게임 MVP | 소환, 합성, 웨이브, 점수, 결과 제출 |
| 9 | 관리자 화면 | 최근 기록, suspicious 표시 |
| 10 | Cloudflare 배포 | Pages/Workers/D1/KV 연결 |
| 11 | 베타 테스트 | 밸런스 조정, 버그 수정 |

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

### 완료 기준

- `pnpm install` 가능
- `pnpm typecheck` 가능
- web 앱이 기본 화면을 띄움
- api 앱이 기본 health check 응답

## 5. 2단계: 게임 규칙 패키지

### 목표

React/PixiJS/API와 무관한 순수 게임 로직을 먼저 만든다.

### 작업

- 영웅 타입 정의
- 스킬 타입 정의
- 적 타입 정의
- 웨이브 타입 정의
- 게임 상태 타입 정의
- 영웅 데이터 12~16개 작성
- 적 데이터 3개 작성
- 보스 데이터 1개 작성
- 웨이브 데이터 30개 작성
- 점수 계산 함수
- 소환 함수
- 합성 함수
- 기본 테스트

### 파일 후보

```text
packages/game/src/types/hero.ts
packages/game/src/types/skill.ts
packages/game/src/types/enemy.ts
packages/game/src/types/wave.ts
packages/game/src/types/gameState.ts
packages/game/src/data/heroes.ts
packages/game/src/data/skills.ts
packages/game/src/data/enemies.ts
packages/game/src/data/waves.ts
packages/game/src/data/balance.ts
packages/game/src/rules/scoring.ts
packages/game/src/systems/summonSystem.ts
packages/game/src/systems/mergeSystem.ts
packages/game/src/systems/waveSystem.ts
```

### 완료 기준

- 소환 결과가 seed 기반 랜덤으로 결정됨
- 같은 등급 3명 합성이 가능함
- 4x4 필드 상태를 관리할 수 있음
- 30웨이브 데이터를 읽을 수 있음
- 점수 계산 테스트 통과
- React/PixiJS 없이도 게임 규칙 테스트 가능

## 6. 3단계: 프론트 기본 화면

### 목표

웹 사용자가 이동할 수 있는 기본 화면과 `/play` 라우트를 만든다.

### 화면

- 홈
- 로그인
- 대시보드
- 게임 진입
- `/play` 독립 게임 화면
- 랭킹
- 프로필
- 관리자

### 작업

- React Router 구성
- 기본 레이아웃
- 공통 버튼/카드 컴포넌트
- API client 초안
- 로그인 상태 mock
- `/play`를 MainLayout 밖 독립 라우트로 구성

### 완료 기준

- 각 페이지 이동 가능
- 모바일에서 기본 레이아웃 깨지지 않음
- 게임 시작 버튼이 `/play`로 이동
- `/play`에서는 헤더/푸터 없이 전체화면 캔버스 host가 뜸

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

### 완료 기준

- `/api/health` 응답
- 타입 체크 통과
- 라우트 파일과 서비스 파일이 분리됨

## 8. 5단계: PixiJS 게임 화면

### 목표

`/play`에서 모바일 게임처럼 보이는 PixiJS 기반 전체화면 플레이 화면을 만든다.

### 현재 방향

- React DOM 보드/HTML 버튼을 사용하지 않는다.
- PixiJS `Application`을 `/play`에 mount한다.
- 게임 조작 버튼도 PixiJS `Container`, `Graphics`, `Text`로 그린다.
- 화면은 운빨존많겜식 밝은 필드맵 방향으로 구성한다.

### MVP 기능

- 전체화면 캔버스
- 상단 WAVE/타이머/코어 HP UI
- 밝은 숲/필드 배경
- 흙길 형태 몬스터 이동 경로
- 중앙 4x4 영웅 배치판
- 하단 대형 소환 버튼
- 일반/희귀/영웅 합성 버튼
- 웨이브 시작 버튼
- 소환 팝업 연출
- 합성 플래시
- 몬스터 이동 연출
- 코인 획득 플로팅 텍스트

### 파일 분리 목표

현재 빠른 프로토타입에서는 `createPixiGame.ts`에 많은 코드가 들어가 있지만, 다음 구조로 분리해야 한다.

```text
apps/web/src/game-client/pixi/
  createPixiGame.ts
  scene/GameScene.ts
  layers/BackgroundLayer.ts
  layers/HudLayer.ts
  layers/MapLayer.ts
  layers/BoardLayer.ts
  layers/MonsterLayer.ts
  layers/ControlLayer.ts
  layers/EffectLayer.ts
  layout/gameLayout.ts
  renderers/heroRenderer.ts
  renderers/monsterRenderer.ts
  animation/animationManager.ts
```

### 완료 기준

- `/play`가 모바일에서 웹페이지가 아니라 게임 화면처럼 보임
- 소환/합성/웨이브 버튼이 PixiJS 안에서 동작함
- 4x4 보드가 PixiJS로 렌더링됨
- 몬스터가 경로를 따라 이동하는 연출이 있음
- `packages/game`의 순수 로직을 사용함

## 9. 6단계: Discord OAuth

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

### 완료 기준

- Discord 로그인 가능
- 로그인 후 `/api/me`에서 유저 정보 반환
- 비로그인 상태에서 보호 API 접근 불가

## 10. 7단계: DB와 랭킹

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

### 완료 기준

- 로그인 유저 upsert 가능
- 게임 결과 저장 가능
- 최고 점수 갱신 가능
- 랭킹 조회 가능

## 11. 8단계: 싱글 게임 MVP 구현

### 목표

실제로 한 판 플레이 가능한 싱글 랜덤 디펜스를 만든다.

### MVP 기능

- 게임 시작
- 4x4 빈 필드 생성
- 랜덤 영웅 소환
- 같은 등급 영웅 3명 합성
- 웨이브 시작
- 몬스터 경로 이동
- 영웅 자동 공격
- 적 처치
- 자원 획득
- 생명 감소
- 5웨이브마다 보스 등장
- 30웨이브 클리어 또는 생명 0으로 종료
- 결과 제출

### 구현 원칙

- 게임 규칙은 React 컴포넌트나 PixiJS 렌더러에 직접 넣지 않는다.
- 소환/합성/웨이브/점수 계산은 `packages/game` 함수를 사용한다.
- PixiJS는 렌더링과 입력 처리만 담당한다.

### 완료 기준

- 한 판 시작/종료 가능
- 4x4 필드에서 소환/합성 가능
- 30웨이브 진행 가능
- 점수 계산 가능
- 결과 API 제출 가능
- 랭킹 반영 가능

## 12. 9단계: 관리자 화면

### 목표

운영자가 기본 기록을 확인할 수 있게 한다.

### 기능

- 총 유저 수
- 총 플레이 수
- 최근 플레이 기록
- suspicious 기록 표시
- 랭킹 TOP 확인

### 완료 기준

- 일반 유저 접근 불가
- 관리자만 요약 데이터 확인 가능

## 13. 10단계: Cloudflare 배포

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
- PWA/standalone 설정 추가 검토

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
[ ] /play 모바일 표시 확인
```

## 14. 11단계: 베타 테스트

### 목표

서버 멤버 몇 명이 실제 플레이하며 문제를 찾는다.

### 확인할 것

- 로그인 실패 여부
- 모바일 화면 문제
- `/play`에서 주소창이 있는 상태에서도 조작이 가능한지
- 게임이 너무 쉽거나 어려운지
- 소환/합성 재미가 있는지
- 30웨이브 길이가 적절한지
- 보스 난이도가 적절한지
- 랭킹 저장 오류
- 비정상 점수 제출 가능성
- 플레이 시간이 적절한지

### 밸런스 조정 우선순위

1. 한 판 플레이 시간
2. 초반 소환 빈도
3. 합성 체감
4. 보스 난이도
5. 전설 영웅 등장 체감
6. 랭킹 점수 분포

## 15. MVP 이후 확장 로드맵

### 15.1 1차 확장

- 영웅/스킬 추가
- 실제 이미지 에셋 적용
- 유닛/몬스터 스프라이트 애니메이션
- 투사체/데미지 숫자/피격 이펙트
- 유물 10개
- 일일 미션
- 시즌 보상
- 이벤트 배너 관리
- 디스코드 공유 문구

### 15.2 2차 확장

- PWA 설치형 앱 모드
- 마스코트/펫
- 디스코드 봇 명령어
- 관리자 시즌 생성 UI
- 30웨이브 이후 무한 진행
- 이벤트 웨이브

### 15.3 3차 확장

- 2인 협동
- Durable Objects 방 관리
- 서버 레이드
- 리플레이 검증
- 역할 보상 자동 지급

## 16. 작업 쪼개기 예시

작은 작업 단위 예시입니다.

1. `pnpm monorepo 초기화만 해줘.`
2. `packages/game 타입과 점수 계산 함수만 만들어줘.`
3. `영웅 데이터 12개와 소환 함수만 만들어줘.`
4. `4x4 필드와 합성 함수 테스트만 작성해줘.`
5. `apps/web 라우팅과 /play 독립 라우트만 구성해줘.`
6. `PixiJS Application을 /play에 mount하는 코드만 작성해줘.`
7. `PixiJS 배경/필드/보드 레이어만 작성해줘.`
8. `PixiJS 소환 버튼과 summonHero 연결만 구현해줘.`
9. `PixiJS 합성 버튼과 mergeHeroes 연결만 구현해줘.`
10. `몬스터 경로 이동 연출만 추가해줘.`
11. `apps/api health check와 Hono 구조만 만들어줘.`
12. `Discord OAuth 시작/callback 라우트만 구현해줘.`
13. `D1 migration과 userRepository만 작성해줘.`
14. `game_runs 저장 API만 구현해줘.`
15. `leaderboard 조회 API와 화면만 연결해줘.`

## 17. 최종 MVP 완료 정의

다음 조건이 모두 만족되면 MVP 완료로 봅니다.

- GitHub main 브랜치에서 Cloudflare 배포 성공
- Discord 로그인 가능
- 서버 멤버만 대시보드 접근 가능
- `/play`에서 PixiJS 게임 한 판 플레이 가능
- 4x4 필드 소환/합성 가능
- 30웨이브 또는 생명 0으로 종료 가능
- 결과 저장 가능
- 랭킹 조회 가능
- 관리자 기본 화면 접근 가능
- 모바일에서 플레이 가능
- 문서와 실제 구조가 크게 어긋나지 않음

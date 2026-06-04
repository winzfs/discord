# 11. 현재 개발 상태 및 다음 작업

## 1. 현재 기준

이 문서는 현재 저장소 상태와 다음 개발 우선순위를 빠르게 확인하기 위한 진행 현황 문서입니다.

현재 프로젝트 방향은 다음과 같습니다.

- MVP는 싱글플레이 랜덤 디펜스 1개를 우선 완성합니다.
- 로그인, 랭킹, 관리자 기능은 게임 기본 재미가 나온 뒤 연결합니다.
- 게임 화면은 `/play`의 PixiJS 독립 캔버스에서 구현합니다.
- `/game`은 일반 웹 레이아웃 안의 게임 안내/시작 페이지로 사용합니다.
- React는 대시보드, 로그인, 랭킹, 프로필, 관리자 UI를 담당합니다.
- 게임 규칙은 `packages/game`의 순수 TypeScript 로직으로 관리합니다.
- 기존에 동작하던 PixiJS 클라이언트를 새로 만들지 않고, 기존 클라이언트에 부분 패치로 기능을 추가합니다.
- 한 파일에 기능을 몰아넣지 않고, 렌더링/컨트롤/보드/적/전투 런타임을 단계적으로 분리합니다.
- 개발은 짧은 단위로 진행하고, 각 단계의 진행상황과 성공/실패 여부를 계속 공유합니다.

## 2. 완료된 인프라

### 2.1 Cloudflare D1

Cloudflare 웹 대시보드에서 D1 데이터베이스를 생성했습니다.

```text
Database name: discord_random_defense
Binding name: DB
```

`apps/api/wrangler.toml`에는 실제 D1 `database_id`가 반영되어 있습니다.

D1 테이블도 Cloudflare 웹 콘솔에서 직접 생성했습니다.

현재 기준 테이블:

- `users`
- `seasons`
- `game_runs`
- `leaderboard_entries`
- `admin_logs`

마이그레이션 기준 파일은 다음 경로에 보관합니다.

```text
apps/api/migrations/0001_initial.sql
```

### 2.2 Cloudflare Workers 자동 배포

GitHub Actions로 Workers 자동 배포가 구성되어 있습니다.

워크플로우 파일:

```text
.github/workflows/deploy-api.yml
```

트리거:

- `main` 브랜치 push
- API, packages, workspace 설정 변경
- GitHub Actions 수동 실행

필요한 GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

자동 배포는 한 차례 성공을 확인했습니다.

### 2.3 API 기본 구조

`apps/api`는 Cloudflare Workers + Hono 기반입니다.

현재 제공되는 기본 라우트:

- `GET /health`
- `GET /api/health`
- `GET /api/auth/discord` placeholder
- `GET /api/auth/callback` placeholder
- `GET /api/me` placeholder/mock 기반
- `GET /api/leaderboard` placeholder
- `POST /api/game/runs` placeholder
- `GET /api/admin/summary` placeholder

현재 API는 구조와 배포 확인이 목적이며, 실제 게임 결과 저장/랭킹 조회는 아직 구현 전입니다.

## 3. 현재 게임 구현 상태

### 3.1 Web 라우팅

현재 게임 관련 라우트는 다음과 같이 나뉩니다.

```text
/game  일반 웹 레이아웃 안의 게임 안내/시작 페이지
/play  PixiJS 전체화면 실제 게임 화면
```

`/play`는 `MainLayout` 밖에서 독립 실행됩니다.

### 3.2 PixiJS 게임 화면

현재 `/play` 구현 상태:

- PixiJS Application 생성
- 전체화면 캔버스 렌더링
- 밝은 숲/필드 배경
- 보드 외곽을 도는 흙길 몬스터 이동 경로
- 중앙 4x4 영웅 배치판
- 상단 WAVE 표시
- 상단 코어 HP 바
- 상단 화력 표시
- 상단 유닛 수 `n / 16` 표시
- 보유 코인/행운석 표시
- 하단 소환 버튼
- 하단 신화 조합 버튼
- 하단 도박 버튼
- 하단 공격력 강화 버튼
- 웨이브 즉시 시작 버튼
- 소환/보상/피해 플로팅 텍스트
- 플로팅 텍스트 및 투사체 잔상 방지용 effect cleanup 패치
- 유닛 3마리 중첩/합성 메뉴
- 유닛 판매 메뉴
- 화면 빈 곳 터치 시 합성/판매 메뉴와 유닛 정보 패널 닫기
- 유닛 클릭/터치 시 하단 유닛 정보 패널 표시
- 유닛 드래그 이동/자리 교환/중첩 이동 연출
- 고유 캐릭터별 보드 실루엣/무기/색상 차이
- 적 개체 생성 및 실제 경로 이동
- 적 개체별 HP바 표시 및 피격 시 갱신
- 유닛 자동 타겟팅 및 투사체 공격 연출
- 영웅 ID 기반 타겟팅/피해/감속/광역/보상 보정 1차 적용
- 적 처치 시 코인 보상 지급
- 일부 영웅 계열 처치 보상 보너스 적용
- 누수 시 코어 HP 감소
- 보스 웨이브 경고 연출
- 웨이브 결과 플로팅 텍스트
- 완벽 방어 시 행운석 보상 지급
- 신화 조합 메뉴 및 조합 시도 연결
- 신화 조합창에 재료 보유 수 / 필요 수 표시
- 신화 조합창에 신화 유닛 설명 표시

### 3.3 PixiJS 파일 분리 현황

초기에는 `createPixiGame.ts`에 대부분의 코드가 있었지만, 현재는 렌더링/전투 보조 기능을 단계적으로 분리했습니다.

현재 PixiJS 관련 파일:

```text
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/gameLayout.ts
apps/web/src/game-client/pixi/gameTheme.ts
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/pixiControlsView.ts
apps/web/src/game-client/pixi/pixiEnemyView.ts
apps/web/src/game-client/pixi/pixiBoardView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

분리 완료 내용:

- `pixiHudView.ts`
  - 상단 HUD 생성/갱신 담당
  - WAVE, 타이머, HP, 화력, 유닛 수, 코인, 행운석 표시
  - Text/Graphics 객체를 최초 생성 후 값만 갱신하는 구조
- `pixiControlsView.ts`
  - 소환/신화/도박/공격력 강화/웨이브 버튼 담당
  - 버튼 객체를 매번 새로 만들지 않고 disabled 상태, 문구, 위치만 갱신
- `pixiEnemyView.ts`
  - 적 몸체, 눈, HP바, 위치 갱신 담당
  - 적 생성 시 view를 만들고, 이동/피격 시 위치와 HP바만 갱신
  - 적 제거 시 부모 컨테이너에서 제거 후 destroy 처리
- `pixiBoardView.ts`
  - 보드 칸, 유닛 모양, 드래그용 고스트, 보드 히트영역 담당
  - `heroId` 기준으로 유닛별 실루엣/무기/색상 차이를 표현
  - `createPixiGame.ts`의 보드 렌더링 부담을 줄임
- `pixiCombatRuntime.ts`
  - 화력 계산
  - 역할군 색상
  - 기본 타겟팅
  - 영웅 ID 기반 타겟팅
  - 영웅 ID 기반 피해 보정
  - 탱커 계열 감속 보정
  - 마법/지원 계열 광역 범위 및 피해율 보정
  - 보상형 유닛 처치 보너스 계산

현재 남아 있는 분리 후보:

```text
pixiWaveRuntime.ts
pixiMythicMenuView.ts
pixiFloatingTextView.ts
pixiBackgroundView.ts
pixiUnitInfoPanelView.ts
animation/animationManager.ts
```

현재는 `scripts/refactor-pixi-combat-runtime.mjs`, `scripts/fix-floating-text-lifetime.mjs`, `scripts/add-unit-info-panel.mjs`가 Cloudflare 빌드 전 `createPixiGame.ts`에 필요한 패치를 적용합니다. 이 방식은 당장 안정적으로 기능을 붙이기 위한 임시 단계이며, 이후에는 실제 소스 모듈로 분리하는 것이 목표입니다.

## 4. 현재 게임 규칙 구현 상태

`packages/game`에는 React/PixiJS/API와 독립적인 순수 게임 규칙을 둡니다.

현재 구현된 핵심 로직:

- 초기 게임 상태 생성
- seed 기반 랜덤 유틸
- 고유 영웅 데이터
- 영웅 역할군 데이터
- 등급별 유닛 데이터
- 적 데이터
- 30웨이브 데이터
- 소환 확률
- 소환 비용 증가
- 4x4 보드 관리
- 같은 등급/조건 기반 3마리 중첩
- 중첩된 유닛 합성
- 유닛 이동/자리 교환
- 유닛 판매
- 공격력 강화
- 행운석 기반 도박 소환
- 신화 조합 레시피/가능 여부 확인
- heroId 기반 신화 조합 재료 조건
- 신화 조합 재료 진행도 계산
- 신화 조합 실행
- 웨이브 시작 상태 처리
- 웨이브별 적 구성 차별화

### 4.1 현재 주요 고유 유닛

현재 소환 풀에는 placeholder 중심 유닛 대신 고유 캐릭터가 들어갑니다.

```text
일반: 스파크 러너, 루키 가드, 미니 메딕
희귀: 펄스 사수, 방벽 수호자, 야전 의무병
영웅: 플라즈마 마도사, 코어 기사, 오버클럭 기술자
전설: 크레딧 해커, 레일건 에이스, 라스트 바스티온
신화: 신화 명사수, 신화 폭풍술사, 신화 방벽대장, 신화 오버클러커, 신화 보물해커
```

### 4.2 신화 조합 방향

현재 신화 조합은 단순히 `영웅 딜러 2개 + 희귀 지원 1개` 같은 등급/역할 조건이 아니라, 특정 고유 유닛을 요구하는 방식입니다.

예시:

```text
신화 명사수 = 펄스 사수 2 + 야전 의무병 1
신화 폭풍술사 = 플라즈마 마도사 1 + 야전 의무병 1 + 스파크 러너 1
신화 방벽대장 = 방벽 수호자 2 + 펄스 사수 1
신화 오버클러커 = 오버클럭 기술자 2 + 방벽 수호자 1
신화 보물해커 = 크레딧 해커 1 + 플라즈마 마도사 1 + 야전 의무병 1
```

### 4.3 등급 표기

현재 등급 표기는 코드 기준으로 다음을 사용합니다.

```text
common
rare
epic
legendary
mythic
```

한국어 표기는 다음처럼 사용합니다.

| 내부값 | 표시명 |
|---|---|
| `common` | 일반 |
| `rare` | 희귀 |
| `epic` | 영웅 |
| `legendary` | 전설 |
| `mythic` | 신화 |

## 5. 현재 전투/웨이브 구현 상태

기존 웨이브는 몬스터 이동 연출 후 전투력 기반으로 자동 완료되는 프로토타입에 가까웠습니다.

현재는 다음처럼 실시간 전투에 가까운 구조로 전환했습니다.

### 5.1 웨이브 진행

- 기본적으로 자동 카운트다운 후 웨이브가 시작됩니다.
- 웨이브 버튼으로 카운트다운을 기다리지 않고 즉시 시작할 수 있습니다.
- 전투 중에는 적 개체가 실제 경로를 따라 이동합니다.
- 적이 끝까지 도달하면 누수 처리되고 코어 HP가 감소합니다.
- 모든 적을 처치하면 결과 단계로 넘어가며, 다음 웨이브를 빠르게 시작할 수 있습니다.
- 보스 웨이브에서는 경고 텍스트와 보스형 적 연출을 사용합니다.

### 5.2 적 이동 경로

현재 적 경로는 보드 외곽을 도는 형태입니다.

```text
왼쪽 아래 시작
→ 왼쪽 위
→ 오른쪽 위
→ 오른쪽 아래
→ 왼쪽 아래 방향으로 복귀
```

즉, 보드 한가운데를 가로지르지 않고 외곽 길을 따라 시계방향으로 이동하도록 수정했습니다.

### 5.3 유닛 공격

현재 유닛 공격 흐름:

1. 보드에 배치된 영웅 목록을 가져옵니다.
2. 각 영웅의 `heroId`, 역할군, 등급에 따라 타겟을 선택합니다.
3. 투사체를 생성해 유닛 위치에서 적 위치로 이동시킵니다.
4. 투사체 도착 시 적 HP를 감소시킵니다.
5. 적 HP가 0이 되면 처치 처리하고 코인 보상을 지급합니다.
6. 탱커 계열은 감속을 적용합니다.
7. 마도사/폭풍 계열은 뭉친 적을 우선 타겟팅하고 광역 피해를 적용합니다.
8. 지원 계열은 보조 스플래시 피해를 적용합니다.
9. 보상형 유닛은 처치 보상 보너스를 적용합니다.

### 5.4 영웅별 전투 효과 1차

현재 1차로 적용된 방향:

```text
펄스/명사수/레일건 계열
- 보스 우선 타겟팅
- 단일 피해 강화

마도사/폭풍 계열
- 뭉친 적 우선 타겟팅
- 광역 범위 증가
- 광역 피해 비율 증가

방벽/가드/기사/바스티온 계열
- 감속 효과 강화

메딕/오버클럭 계열
- 지원형 스플래시 보조 피해

크레딧/보물 계열
- 처치 보상 보너스
```

### 5.5 보상

현재 보상 구조:

- 적 처치 시 코인 지급
- 보상형 유닛 처치 시 추가 코인 보너스 지급
- 웨이브 완벽 방어 시 행운석 지급
- 보스 웨이브 완벽 방어 시 행운석 추가 지급
- 행운석은 도박 소환에 사용
- 신화 조합은 행운석 구매 방식이 아니라 고유 유닛 레시피 재료 기반으로 진행

### 5.6 웨이브 압박 차별화

현재 웨이브는 다음처럼 구성이 강화되었습니다.

```text
초반:
- 기본 잡버그 중심

4웨이브 이후:
- 핑러너 러시 추가

6웨이브 이후:
- 렉덩어리 탱커 추가

11웨이브 이후:
- 엘리트버그 등장

18웨이브 이후:
- 엘리트 중심 웨이브 등장

21웨이브 이후:
- 빠른 적 + 탱커 혼합 압박 강화

보스 웨이브:
- 보스 + 잡몹 + 탱커 + 후반 엘리트 혼합
```

## 6. 최근 리팩터링 및 기능 내역

최근 진행한 핵심 커밋 흐름:

```text
966e1c4b8ef0c1cd2deffdb8130c42c64731073c  Fix play UI layout and wave path controls
084dd0b277fd945086f42f07de3747e3801294aa  Add reusable Pixi HUD view
43f1e018acc35d62439acc2f9d85f19b9da1a84e  Add reusable Pixi controls view
b73e553b4b7ca31f9fb3a4564faa4caaad10d601  Add reusable Pixi enemy view
a8b317444390c0666a9ae39a684801f8a733f538  Add reusable Pixi board view helpers
066b3a9422173880746ccd87ca9fcbc7bef644ea  Connect reusable Pixi HUD controls and enemy views
8b7d9924a9cbe4c0c2b2f328013b88516f14871a  Connect Pixi board view helpers
4470534401c25b0d57dbe5129d80dbfc5383344b  Fix board view connection syntax
6f6ddc59eb37c933c643305e05796a117b8f0040  Add Pixi HUD invalidation helper
b1c93fae011e6223a79da5e4b943d7bcd8b31555  Remove enemy view from parent before destroy
e2aafe6536da94887787741a2bd8fe71a3a702f6  Harden Pixi effect cleanup
2438b48ab8f64e7c0daffc396599aaa53e162b5f  Support hero-specific mythic recipe ingredients
c9607d3c46a34e30aa43ff705077522927a6c7ec  Match mythic ingredients by hero id
978e795eba08f66e09c8034702e969b35e2b451f  Add distinct summonable hero units
9dd5941e9279964dd9804846d82ee5fa010a7144  Differentiate hero unit silhouettes
80d0a4780f4360f402563a7d6f585605796b3052  Add unit info panel patch script
655c255e57530cfe593d7afbb9c8a00c9884b548  Dismiss unit info on empty screen tap
813142cb76e1d8e120cff619b082a5f6c44d24af  Add mythic ingredient progress helper
c500772fd1835f2f91e9907766b33407b572b5b2  Add hero-specific combat helpers
ea618b2298140ef53e4a0b8b68b4f601bef9f8e5  Connect hero-specific combat and mythic progress UI
04bfcbd8767681192d347447b8596c97ebf57fa9  Increase wave pressure variety
```

중요한 개발 원칙:

- 기존에 동작하던 클라이언트를 버리고 새 클라이언트를 만들지 않습니다.
- 전체 파일 재생성 방식은 지양합니다.
- 기능 단위로 작은 패치를 적용합니다.
- PixiJS 객체는 매 프레임 재생성하지 않고, 가능한 한 생성 후 재사용합니다.
- `createPixiGame.ts`는 최종적으로 조립/초기화/루프 연결만 담당하도록 줄입니다.
- 임시 빌드 전 패치 스크립트가 늘어난 상태이므로, 안정화 후 실제 모듈 분리로 되돌리는 작업이 필요합니다.

## 7. 현재 주의할 점

현재 `createPixiGame.ts`는 많이 줄어들었지만 아직 다음 책임이 남아 있습니다.

- 배경/길 렌더링
- 신화 메뉴 렌더링
- 유닛 정보 패널 렌더링
- 플로팅 텍스트
- 애니메이션 큐
- 적 생성/웨이브 런타임
- 전투 루프 연결부
- 웨이브 종료/보상 계산

또한 최근에는 빌드 전 패치 스크립트가 여러 개 연결되어 있으므로, 기능 추가 후 반드시 다음 확인이 필요합니다.

```bash
pnpm build:web
pnpm typecheck
pnpm dev:web
```

확인 포인트:

- `/play` 진입 시 캔버스 정상 표시
- 보드 칸/유닛 표시 정상
- 고유 유닛 실루엣/무기/색상 차이 표시 정상
- 유닛 클릭 시 하단 정보 패널 정상
- 빈 화면 터치 시 합성/판매 메뉴와 정보 패널 닫힘
- 유닛 드래그 이동 정상
- 합성/판매 메뉴 정상
- 소환/신화/도박/공격력 강화/웨이브 버튼 정상
- 적이 왼쪽 아래에서 생성되어 외곽 경로를 따라 이동
- 유닛 투사체가 실제 적을 향해 발사
- 적 HP바 감소/처치/코인 보상 정상
- 플로팅 데미지/보상 텍스트가 짧게 표시 후 사라짐
- 신화창에 재료 보유 수 / 필요 수가 정상 표시
- 신화창 설명 텍스트가 너무 길어 잘리지 않는지 확인
- 신화 조합 가능/불가능 상태 정상
- 마도사/폭풍 계열 광역 피해 체감 확인
- 방벽/탱커 계열 감속 체감 확인
- 보상형 유닛 처치 보너스 확인
- 강화된 웨이브 구성이 과하게 어렵지 않은지 확인

## 8. 다음 작업 우선순위

현재는 게임 개발과 구조 정리를 우선합니다.

### 8.1 완료됨

1. `/game` 안내 페이지와 `/play` 독립 게임 화면 분리
2. PixiJS 전체화면 게임 화면 구성
3. 4x4 보드 표시
4. 랜덤 유닛 소환
5. 유닛 3마리 중첩 표시
6. 유닛 드래그 이동/자리 교환
7. 합성/판매 메뉴
8. 웨이브 자동 진행/타이머화
9. 적 개체 생성 및 경로 이동
10. 유닛 자동 공격/투사체 연출
11. 보스 웨이브 경고 연출
12. 웨이브 보상 행운석 지급
13. 신화 조합 메뉴 및 레시피 기반 조합 연결
14. HUD 재사용 모듈 분리 및 연결
15. Controls 재사용 모듈 분리 및 연결
16. EnemyView 재사용 모듈 분리 및 연결
17. BoardView 모듈 분리 및 연결
18. 캐릭터 고유 이름/데이터/외형 1차 적용
19. heroId 기반 신화 조합 재료 조건 적용
20. 신화 조합 재료 진행도 계산 추가
21. 유닛 클릭 정보 패널 추가
22. 빈 화면 터치 시 메뉴/정보 닫기 UX 추가
23. 유닛별 고유 전투 효과 1차 적용
24. 웨이브 압박 차별화 1차 적용

### 8.2 최우선

1. `pnpm build:web` 기준 빌드 오류 정리
2. `/play` 실제 실행 확인
3. 최근 패치 후 유닛 렌더링/드래그/합성/판매/정보 패널 회귀 테스트
4. 신화 조합창 UI 실제 사용성 확인 및 텍스트 잘림 수정
5. 유닛별 고유 효과 시각 이펙트 추가
6. 전투/타겟팅/투사체 연결부를 실제 소스 모듈로 정리
7. 웨이브 시작/종료/보상 로직을 `pixiWaveRuntime.ts`로 분리
8. 신화 조합창을 `pixiMythicMenuView.ts`로 분리
9. 플로팅 텍스트를 `pixiFloatingTextView.ts`로 분리
10. 배경/길 렌더링을 별도 뷰로 분리

### 8.3 이후

1. 실제 밸런스 조정
2. 웨이브별 적 구성 고도화
3. 신화 유닛별 고유 액티브/패시브 효과
4. 오버드라이브 시스템 구현
5. 전투 로그/결과 팝업 고도화
6. 유닛 도감/조합 도감 추가
7. 게임 결과 저장 API 연결
8. Discord OAuth 연결
9. 시즌 랭킹/리더보드 연결
10. 관리자 밸런스 조정 UI

## 9. 다음 개발 추천

바로 다음 개발은 기능 추가보다 **빌드 안정화 및 회귀 테스트**가 우선입니다.

권장 순서:

```text
1. pnpm build:web 빌드 확인
2. 발생한 타입/문법 오류 수정
3. /play 진입 후 터치 UX 확인
4. 신화 조합창 재료 진행도 확인
5. 유닛별 고유 효과가 실제 전투에 반영되는지 확인
6. 효과가 눈에 잘 안 보이면 전용 이펙트 추가
7. 빌드 전 패치 스크립트를 실제 모듈 파일로 단계적 흡수
```

다음 기능 작업으로는 다음이 가장 적합합니다.

```text
유닛별 고유 효과 시각화 1차
- 마도사/폭풍 광역 피해 원형 이펙트
- 방벽/탱커 감속 파란 링 이펙트
- 보상형 유닛 처치 보너스 금색 +코인 텍스트
- 신화 유닛 공격 전용 링/번개/광선 이펙트
```

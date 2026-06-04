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
- 흙길 형태 몬스터 이동 경로
- 중앙 4x4 영웅 배치판
- 상단 WAVE 표시
- 상단 코어 HP 바
- 상단 전투력 표시
- 상단 유닛 수 `n / 16` 표시
- 보유 코인/점수 표시
- 하단 소환 버튼
- 일반/희귀 합성 버튼
- 웨이브 시작 버튼
- 소환 플로팅 텍스트
- 합성 플래시
- 몬스터 이동 연출
- 웨이브 결과 플로팅 텍스트
- 누수/패배/완벽 방어 메시지
- 전투력/위협도 비교 메시지
- 코인 획득 플로팅 텍스트

### 3.3 PixiJS 파일 분리 현황

초기에는 `createPixiGame.ts`에 대부분의 코드가 있었지만, 일부 분리를 시작했습니다.

현재 분리된 파일:

```text
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/gameLayout.ts
apps/web/src/game-client/pixi/gameTheme.ts
```

다음 분리 후보:

```text
layers/BackgroundLayer.ts
layers/HudLayer.ts
layers/BoardLayer.ts
layers/ControlLayer.ts
layers/MonsterLayer.ts
layers/EffectLayer.ts
ui/text.ts
ui/panel.ts
ui/button.ts
animation/animationManager.ts
```

## 4. 현재 게임 규칙 구현 상태

`packages/game`에는 React/PixiJS/API와 독립적인 순수 게임 규칙을 둡니다.

현재 구현된 핵심 로직:

- 초기 게임 상태 생성
- seed 기반 랜덤 유틸
- 영웅 데이터
- 영웅별 `power`, `attackSpeed`, `range` 전투 스탯
- 적 데이터
- 30웨이브 데이터
- 소환 확률
- 소환 비용 증가
- 4x4 보드 관리
- 같은 등급 3명 합성
- 보드 전체 전투력 계산
- 웨이브 총 위협도 계산
- 전투력 부족 시 `leakedEnemies` 계산
- 웨이브 완료 시 누수/체력 감소/보상 차등 반영
- 점수 계산

현재 등급 표기는 코드 기준으로 다음을 사용합니다.

```text
common
rare
epic
legendary
```

한국어 표기는 다음처럼 사용합니다.

| 내부값 | 표시명 |
|---|---|
| `common` | 일반 |
| `rare` | 희귀 |
| `epic` | 영웅 |
| `legendary` | 전설 |

## 5. 전투 시스템 개발 방향

기존 웨이브는 몬스터 이동 연출 후 자동으로 완료되는 프로토타입에 가까웠습니다.

현재는 1차 전투 판정으로 다음 구조가 구현되었습니다.

```ts
type HeroDefinition = {
  power: number;
  attackSpeed: number;
  range: number;
};
```

현재 웨이브 결과 계산 흐름:

1. 보드에 배치된 영웅들의 전투력을 합산한다.
2. 영웅의 공격 타입, 공격 속도, 사거리, 역할 조합을 전투력 보정에 반영한다.
3. 웨이브의 적 체력, 이동 속도, 보스 여부를 기반으로 위협도를 계산한다.
4. 전투력이 충분하면 웨이브를 완벽 방어한다.
5. 전투력이 부족하면 일부 적이 새고 코어 HP가 감소한다.
6. 남은 코어 HP가 0이면 실패 처리한다.

이 단계에서는 아직 투사체, 개별 적 HP, 실시간 타겟팅을 완성하지 않습니다.

### 5.1 다음 전투 연출 목표

전투력 기반 판정 위에 다음 연출을 붙입니다.

- 영웅 공격 모션
- 간단한 투사체
- 데미지 숫자
- 처치 이펙트
- 누수 발생 시 코어 HP 감소 연출
- 보스 웨이브 경고 연출

### 5.2 이후 실시간 전투 시스템 확장

이후 다음 구조를 추가합니다.

```text
EnemyInstance
Projectile
CombatTickResult
TargetingSystem
DamageSystem
SkillSystem
```

이 단계에서 실제 적 개체별 HP, 이동, 공격, 처치 계산을 구현합니다.

## 6. 다음 작업 우선순위

현재는 게임 개발을 우선합니다.

### 완료됨

1. 영웅 데이터에 `power`, `attackSpeed`, `range` 추가
2. 보드 전체 전투력 계산 함수 추가
3. 웨이브 총 위협도 계산 함수 추가
4. 전투력 부족 시 `leakedEnemies`를 생성하는 함수 추가
5. `completeCurrentWave`가 실제 누수 결과를 반영하도록 연결
6. PixiJS 웨이브 결과 메시지 개선
7. 유닛 수 `n / 16` 표시

### 최우선

1. 소환 버튼 비활성 상태 표시
2. 합성 가능 여부 UI 표시
3. 웨이브 클리어/누수/패배 결과 팝업 고도화
4. 영웅 역할별 도형 실루엣 구분
5. 적 타입별 도형 실루엣 구분
6. 밸런스 조정: 초반 1~5웨이브 체감 난이도 재조정

### 다음

1. 영웅 공격 모션
2. 간단한 투사체 연출
3. 데미지 숫자
4. 처치 이펙트
5. 보스 웨이브 경고 연출
6. 결과 저장 API 연결 준비

### 이후

1. 게임 결과 저장 API 연결
2. 랭킹 API 연결
3. Discord OAuth 실제 구현
4. 대시보드/프로필/랭킹 화면 API 연결
5. 관리자 페이지 실제 데이터 연결

## 7. 현재 보류 항목

게임 기본 재미가 나오기 전까지 다음 작업은 보류합니다.

- Discord OAuth 완성
- 실제 유저 세션 처리
- 랭킹 저장/조회 완성
- 관리자 화면 완성
- 실시간 협동
- Durable Objects
- 복잡한 유물/펫/시즌 보상
- 과금 또는 상점 구조

## 8. 개발 원칙

- 기능 하나를 만들 때마다 작은 단위로 커밋합니다.
- 먼저 게임이 재미있게 돌아가게 만들고, 그다음 저장/랭킹/로그인을 붙입니다.
- PixiJS 렌더링과 게임 규칙 계산을 섞지 않습니다.
- `packages/game`은 브라우저, Cloudflare, React, PixiJS를 몰라야 합니다.
- 밸런스 값은 가능하면 `data/` 또는 `balance.ts`에 둡니다.
- 프로토타입 코드가 커지면 즉시 layer/util 단위로 분리합니다.

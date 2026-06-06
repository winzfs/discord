# 11. 현재 게임 작업 로그

## 2026-06-06 작업

## 전투 결과 화면

### 연결 파일

```text
apps/web/src/game-client/pixi/pixiFinalResultView.ts
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
```

### 동작

최종 전투 상태가 다음 중 하나가 되면 결과 패널을 표시합니다.

```text
failed
cleared
```

결과 패널 표시 내용:

```text
전투 종료 제목
결과 등급 배지
별점
결과 메시지
클리어 웨이브 카드
처치 수 카드
점수 카드
로비 보상 골드 카드
로비 보상 보석 카드
다시 도전 버튼
로비로 버튼
```

버튼 동작:

```text
다시 도전: 현재 /play 화면 새로고침
로비로: /lobby로 이동
```

## 전투 방식 변경: 몬스터 수 기반 순환 모드

### 새 규칙

```text
몬스터는 경로 끝에서 사라지지 않습니다.
몬스터는 필드 외곽 경로를 계속 순환합니다.
전투 타이머가 0이 되면 기존 몬스터는 유지되고 다음 웨이브 몬스터가 추가됩니다.
상단 기존 HP 게이지는 현재 몬스터 수 게이지로 사용합니다.
살아있는 몬스터 수가 100마리 이상이 되면 게임 오버입니다.
```

### 이전 방식 폐기

```text
출구 도착
몬스터 제거
HP 감소
HP 0이면 패배
```

현재 전투 방향과 맞지 않아 해당 방식은 폐기합니다.

## 난이도 조정

### 몬스터 기본 능력치 상향

관련 파일:

```text
packages/game/src/data/enemies.ts
```

주요 변경:

```text
bug-grunt: HP 42 -> 58, speed 0.82 -> 0.86
ping-runner: HP 34 -> 48, speed 1.18 -> 1.26
lag-chunk: HP 120 -> 170, speed 0.58 -> 0.62
elite-bug: HP 210 -> 310, speed 0.72 -> 0.78
server-crasher: HP 620 -> 960, speed 0.48 -> 0.52
```

### 웨이브 압박 상향

관련 파일:

```text
packages/game/src/data/waves.ts
```

주요 변경:

```text
일반 웨이브 기본 수량: 6 + wave * 1.55 -> 8 + wave * 1.85
일반 메인 스폰 최소 간격: 360ms -> 260ms
보스 보조 몬스터 수량: 4 + wave / 2.8 -> 6 + wave / 2.4
후반 추가 그룹 수량/스폰 간격 상향
```

## 유닛 풀 확장

### 목적

신화 조합을 고유 영웅 조합으로 구성하기 위해 일반/희귀/영웅/전설 유닛 풀을 확장했습니다.

관련 파일:

```text
packages/game/src/data/heroes.ts
packages/game/src/data/skills.ts
```

### 추가 스킬

```text
basic-shot
focus-shot
area-burst
piercing-shot
chain-spark
burst-rocket
barrier-guard
team-boost
core-guard
overclock
team-highlight
highlight-barrage
last-stand
freeze-trap
scrap-turret
nano-pack
gravity-mine
orbital-laser
```

### 추가 유닛

일반:

```text
고철 사수
슬로우 봇
충전 조수
```

희귀:

```text
서리 감시자
폭발 정찰병
나노 보조병
```

영웅:

```text
아크 캡틴
중력 간수
전투 기술자
```

전설:

```text
궤도 저격수
이지스 지휘관
크로노 예언자
```

## 신화 조합 방식 변경

### 의도

신화 조합은 아무 등급 유닛을 넣는 방식이 아니라, 신화마다 정해진 고유 영웅 재료를 요구합니다.

조합 비율은 다음 패턴 중 하나를 따릅니다.

```text
패턴 A: 일반 1 + 영웅 2 + 전설 1
패턴 B: 일반 1 + 전설 2
패턴 C: 일반 2 + 영웅 2 + 전설 1
```

### 현재 조합 예시

```text
D.Va: 루키 가드 + 코어 기사 + 전투 기술자 + 라스트 바스티온
자리야: 루키 가드 + 슬로우 봇 + 코어 기사 + 중력 간수 + 이지스 지휘관
윈스턴: 루키 가드 + 아크 캡틴 + 오버클럭 기술자 + 라스트 바스티온
트레이서: 스파크 러너 + 아크 캡틴 + 오버클럭 기술자 + 크로노 예언자
캐서디: 고철 사수 + 레일건 에이스 + 궤도 저격수
겐지: 스파크 러너 + 고철 사수 + 플라즈마 마도사 + 아크 캡틴 + 레일건 에이스
아나: 미니 메딕 + 코어 기사 + 오버클럭 기술자 + 크레딧 해커
키리코: 충전 조수 + 전투 기술자 + 오버클럭 기술자 + 크로노 예언자
일리아리: 미니 메딕 + 크레딧 해커 + 궤도 저격수
```

관련 파일:

```text
packages/game/src/data/mythicRecipes.ts
packages/game/src/systems/mythicCraftSystem.ts
```

### 표시 개선

```text
고유 heroId 재료는 영웅 이름으로 표시
등급 재료가 사용될 경우 일반/희귀/영웅/전설/신화 라벨로 표시
```

## 타입/잔재 정리

### 몬스터 수 기반 실패 상태 보존

관련 파일:

```text
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
```

수정 내용:

```text
finishAutoWave()에서 refs.state.status === failed 상태를 보존
기존 lives <= 0 기준 실패 판정이 100마리 게임오버 상태를 덮지 않도록 수정
failed 상태에서는 남은 몬스터가 있어도 결과 처리로 진입할 수 있도록 보정
```

## 변경 파일

```text
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
packages/game/src/data/enemies.ts
packages/game/src/data/waves.ts
packages/game/src/data/heroes.ts
packages/game/src/data/skills.ts
packages/game/src/data/mythicRecipes.ts
packages/game/src/systems/mythicCraftSystem.ts
```

## 관련 커밋

```text
4caf9efd844f798fafca104d85bfe42fa4067d96
2cdc83c7f39717c4c7efbd7c14b6acba22a2f529
9c6643c13bd9fb42e1a4436299471954a1e6ac19
b109f3060177891d2120389717eebbdaae905b25
05000dc541e44ee2ca71aece846f467f96072a0b
72f4e8822056e4861878a4d9bf6c7c95e8c76b1c
410a93ec22b2249add6d93b36fc2bf1c25d64186
75256e88619941cffe0861476727081fd8e9f65a
3f7670db73fc4ccc84a9ccdbcd9b15982d9bdfb4
b580ef7d90a3accd69d6202209fdc1ff88a3b7ce
516892136d929001daea6899d0b6a5b26875c463
e76438e3aa915dd62bf9450b44ca28b76d2afcb2
```

## 타입/빌드 점검 메모

이 환경에서는 아래 명령을 직접 실행하지 못했습니다.

```bash
pnpm typecheck
pnpm build:web
pnpm dev:web
```

코드 기준으로 확인한 주요 타입 변경점:

```text
updateActiveEnemies 옵션에서 invalidateControls, invalidateHud, floatText 제거
createPixiGame.ts의 updateActiveEnemies 호출부는 getPathPoint만 전달
상단 HUD는 기존 lives/maxLives 필드명을 재사용하지만 실제 값은 몬스터 수 / 100
ActiveEnemy의 leaked/exitQueued 필드는 타입에 남아 있지만 새 이동 로직에서는 사용하지 않음
mythicRecipes는 다시 고유 heroId 기반 조합으로 변경
mythicCraftSystem은 heroId 재료를 영웅 이름으로 표시
```

## 확인할 항목

```text
/play 몬스터가 오른쪽 아래에서 사라지지 않고 계속 도는지
/play 타이머가 0이 되면 기존 몬스터가 남은 상태로 다음 웨이브가 추가되는지
/play 상단 게이지가 ENEMY n / 100으로 보이는지
/play 몬스터를 처치하면 게이지 숫자가 줄어드는지
/play 몬스터가 100마리 이상이 되면 게임 오버 결과창이 뜨는지
/play 기존 HP 감소/출구 제거 문구가 더 이상 뜨지 않는지
/play 초반 웨이브가 너무 쉽지 않은지
/play 중후반에 100마리 제한 압박이 생기는지
/lobby 또는 /play 신화 조합 UI에서 새 고유 재료 조건이 정상 표시되는지
/play 새 고유 신화 조합 재료가 정상 소모되는지
/play 새로 추가된 일반/희귀/영웅/전설 유닛이 소환 풀에 포함되는지
```

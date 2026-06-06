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

## 비신화 유닛 고유 스킬 부여

### 목적

일반/희귀/영웅/전설 유닛이 단순 재료처럼 보이지 않도록, 각 유닛에 타입별 개성을 가진 고유 스킬을 부여했습니다.

규칙:

```text
일반 유닛: 약한 고유 스킬 1개
희귀 유닛: 약한 고유 스킬 1개
영웅 유닛: 약한 고유 스킬 1개
전설 유닛: 고유 스킬 2개
```

스킬 타입 방향:

```text
공격형: 단일 공격, 연쇄 공격, 광역 폭발, 관통, 보스 추가 피해
버프형: 공격속도 증가, 화력 증가, 팀 전체 강화, 궁극기 충전 보조
디버프형: 감속, 빙결, 표식, 취약, 군중 제어
경제형: 코인 보너스, 웨이브 보상 보조
```

### 일반 유닛 스킬

```text
스파크 러너: 스파크 잽
루키 가드: 루키 배시
미니 메딕: 미니 증폭
고철 사수: 고철 도탄
슬로우 봇: 감속 오일
충전 조수: 충전 팁
```

### 희귀 유닛 스킬

```text
펄스 사수: 펄스 표식
방벽 수호자: 방벽 고정
야전 의무병: 전장 격려
서리 감시자: 서리 결계
폭발 정찰병: 폭발 조명탄
나노 보조병: 나노 주입
```

### 영웅 유닛 스킬

```text
플라즈마 마도사: 플라즈마 오브
코어 기사: 코어 앵커
오버클럭 기술자: 가속 회로
아크 캡틴: 아크 전류
중력 간수: 중력 감옥
전투 기술자: 지원 포탑
```

### 전설 유닛 스킬

```text
크레딧 해커: 현상금 해킹 + 네트워크 증폭
레일건 에이스: 레일 관통탄 + 약점 조준
라스트 바스티온: 요새 모드 + 최후 반격
궤도 저격수: 궤도 레이저 + 궤도 락온
이지스 지휘관: 이지스 명령 + 진압 지휘
크로노 예언자: 시간 가속 + 예지 보상
```

### 추가 정리

```text
겐지가 존재하지 않는 genji-deflect 스킬을 참조하던 문제를 수정했습니다.
겐지 신화 스킬은 genji-shuriken + genji-swift-strike + genji-dragonblade로 정리했습니다.
```

## 비신화 유닛 고유 스킬 전투 효과 1차 반영

### 추가 파일

```text
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
```

### 연결 파일

```text
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

### 적용 방식

```text
공격 전: 고유 스킬 태그를 읽어 피해량을 소폭 보정
공격 후: 감속, 광역 피해, 연쇄 추가타, 경제 보너스를 적용
신화 유닛은 기존 신화 스킬 런타임을 그대로 사용
비신화 유닛만 신규 고유 스킬 런타임을 사용
```

### 적용된 태그 효과

```text
attack: 기본 피해량 소폭 증가
boss-killer: 보스/강한 적 대응 피해량 보정
area-damage, burst: 주변 몬스터에게 약한 광역 피해
chain, multi-hit, extra-hit: 앞쪽 다른 몬스터에게 약한 추가타
pierce, beam: 넓은 범위의 약한 관통형 피해
slow, freeze, grouping: 대상 이동 속도 감소
mark, vulnerable: 피해량 보정과 약한 감속
turret, support-fire: 보조 추가타
economy, coin-bonus, wave-reward: 처치 시 소량 코인/점수 보너스
```

## 로비/인게임 스킬 설명 추가

### 목적

스킬 효과가 실제 전투에 반영되었으므로, 로비와 인게임에서도 유닛이 가진 스킬을 읽고 이해할 수 있게 설명 UI를 보강했습니다.

### 수정 파일

```text
apps/web/src/components/lobby/lobbyHeroSkillDetails.ts
apps/web/src/game-client/pixi/pixiUnitInfoView.ts
```

### 로비 변경

```text
기존에는 신화 영웅만 수동 스킬 설명이 있었습니다.
이제 모든 영웅이 hero.skillIds 기준으로 스킬 설명을 생성합니다.
신화 영웅은 기존 수동 상세 설명을 유지합니다.
일반/희귀/영웅/전설 유닛은 스킬 태그 기반으로 설명, 조건, 효과 줄을 자동 생성합니다.
```

### 인게임 변경

```text
기존 인게임 정보창은 skill.tags에 heroId가 들어간 신화 스킬 위주로만 표시했습니다.
이제 getHeroById(heroId).skillIds 기준으로 스킬을 찾습니다.
일반/희귀/영웅/전설 유닛도 선택 시 고유 스킬 설명이 표시됩니다.
전설 유닛은 일반 스킬 카드 2개가 표시됩니다.
신화 유닛은 일반 스킬과 궁극기를 계속 분리 표시합니다.
```

## 핫픽스: Pixi 정보창 크래시 수정

### 증상

```text
Unexpected Application Error
TypeError: this._cancelResize is not a function
```

### 원인 추정

```text
인게임 Pixi 정보창에서 로비 React용 스킬 설명 유틸을 직접 import했습니다.
Pixi 캔버스 객체와 React 화면용 모듈이 불필요하게 결합되면서 라우트 전환/리사이즈/정리 과정에서 Pixi Text 정리 오류가 발생할 수 있었습니다.
```

### 수정 내용

```text
Pixi 전용 스킬 설명 유틸을 새로 분리했습니다.
인게임 정보창은 더 이상 로비 컴포넌트 쪽 유틸을 import하지 않습니다.
Pixi 정보창은 apps/web/src/game-client/pixi/pixiSkillDescriptionRuntime.ts만 사용합니다.
```

### 수정 파일

```text
apps/web/src/game-client/pixi/pixiSkillDescriptionRuntime.ts
apps/web/src/game-client/pixi/pixiUnitInfoView.ts
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
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
apps/web/src/game-client/pixi/pixiUnitInfoView.ts
apps/web/src/game-client/pixi/pixiSkillDescriptionRuntime.ts
apps/web/src/components/lobby/lobbyHeroSkillDetails.ts
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
75148eedc670d30c591146ee760e1543e61e5b9e
d45589fab64c9980d5e33118aba179e16511841b
2bd1e8805a14d264229f4b83d06e24014806b140
2c1c778ed1ca74e91dccdc39403f120f6d61defd
0b07b2c3225733e31dccd62a7b3957bf6265da51
c2a5934ab50e2947d0bbd13a24017a097ded3635
aaa882d5f9f6f42bc15ec6eb984a995729083889
5fe7ba3b8a8e663da71777d7e615c58f57ece153
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
일반/희귀/영웅 유닛은 고유 skillIds 1개
전설 유닛은 고유 skillIds 2개
pixiBaseHeroSkillRuntime.ts에서 비신화 스킬 태그 기반 전투 효과를 처리
pixiCombatRuntime.ts에서 비신화 스킬 피해 보정/후처리를 호출
lobbyHeroSkillDetails.ts에서 비신화 스킬 설명을 자동 생성
pixiUnitInfoView.ts에서 hero.skillIds 기준으로 인게임 스킬 설명 표시
pixiUnitInfoView.ts가 로비 설명 유틸 의존성을 제거하고 Pixi 전용 설명 유틸을 사용
```

## 확인할 항목

```text
/play 진입 시 Unexpected Application Error가 사라졌는지
/play 유닛 선택/해제/다른 유닛 선택 반복 시 크래시가 없는지
/play 화면 회전/리사이즈/새로고침 후 크래시가 없는지
/play 몬스터가 오른쪽 아래에서 사라지지 않고 계속 도는지
/play 타이머가 0이 되면 기존 몬스터가 남은 상태로 다음 웨이브가 추가되는지
/play 상단 게이지가 ENEMY n / 100으로 보이는지
/play 몬스터를 처치하면 게이지 숫자가 줄어드는지
/play 몬스터가 100마리 이상이 되면 게임 오버 결과창이 뜨는지
/lobby 영웅 상세 패널에 일반/희귀/영웅/전설 스킬 설명이 표시되는지
/lobby 신화 영웅 상세 패널은 기존 상세 설명이 유지되는지
/play 유닛 선택 시 일반/희귀/영웅 유닛 고유 스킬 1개가 표시되는지
/play 유닛 선택 시 전설 유닛 고유 스킬 2개가 표시되는지
/play 신화 유닛 선택 시 일반 스킬과 궁극기가 분리 표시되는지
/play 비신화 유닛 고유 스킬 텍스트가 전투 중 표시되는지
/play 감속/광역/연쇄/경제 보너스가 과도하지 않은지
```

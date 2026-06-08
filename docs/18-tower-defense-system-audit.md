# 18. 타워디펜스 시스템/영웅 전술 검토

## 1. 목표

게임의 전반적인 기획, 전투 시스템, 영웅별 공격 타입/공격력/공격속도/스킬/컨셉이 유기적으로 맞물리는지 점검하고 보완했습니다.

이번 작업은 UI가 아니라 전투 설계 기준을 정리하는 작업입니다.

## 2. 참고한 타워디펜스 설계 기준

### 2.1 Kingdom Rush 계열

- 역할이 명확해야 함: 단일, 광역, 감속, 방어, 지원
- 적 타입과 방어 수단의 상성이 읽혀야 함
- 스킬은 화려함보다 상황 대응 수단이어야 함

### 2.2 Bloons TD 계열

- 공격 방식 차이가 곧 빌드 차이여야 함
- 관통, 연쇄, 광역, 감속, 고속타격이 서로 다른 문제를 해결해야 함
- 업그레이드/성장 방향이 한눈에 보여야 함

### 2.3 Arknights 계열

- 직군보다 실제 전술 포지션이 중요함
- 공격속도, 공격 범위, 타겟 우선순위가 전술 정체성을 만든다
- 스킬은 단순 공격력 증가가 아니라 전투 흐름 전환 수단이어야 함

### 2.4 로그라이크 TD 계열

- 매 판 빌드 방향이 달라져야 함
- 상태효과가 많기보다 핵심 효과끼리 연쇄되어야 함
- 플레이어가 `이번 판은 감속+광역`, `이번 판은 표식+저격`처럼 빌드를 설명할 수 있어야 함

## 3. 현재 구조 진단

현재 게임은 다음 장점을 갖고 있습니다.

- 영웅 수집/조각/등급 구조가 있음
- 일반~신화까지 성장 목표가 있음
- 실시간 보드 전투와 소환/합성/이동 구조가 있음
- 영웅별 스킬 태그가 이미 존재함
- 신화 영웅은 개별 스킬 런타임을 가지고 있음

하지만 기존 구조의 문제도 있었습니다.

- `role`은 있지만 실제 전술 포지션이 분명하지 않았음
- `attackType`이 single/area/control/support 정도라 세부 역할을 설명하기 부족했음
- 공격속도와 공격력 관계가 명확히 체계화되어 있지 않았음
- 타겟 우선순위가 대부분 선두/보스 위주라 영웅 차이가 덜 느껴졌음
- 스킬 컨셉은 tags에 흩어져 있고, 데이터 구조로 보기 어려웠음
- 적/웨이브가 단순 카운트 증가 위주라 영웅별 카운터 역할이 덜 살아났음

## 4. 보완 방향

영웅마다 별도 전술 프로필을 추가했습니다.

```text
packages/game/src/types/heroTactics.ts
packages/game/src/data/heroTactics.ts
```

전술 프로필은 다음 정보를 가집니다.

```text
archetype: 전술 타입
damageProfile: 피해 방식
primaryStatus: 핵심 상태/효과
targetPriority: 타겟 우선순위
powerMultiplier: 전투력 보정
attackIntervalMultiplier: 공격간격 보정
concept: 컨셉 요약
combatNote: 운용 설명
```

## 5. 전술 타입 체계

```text
precision: 보스/고체력/중요 적 제거
wave-clear: 군집 웨이브 처리
control-stall: 감속, 빙결, 방벽, 전선 지연
amplifier: 표식, 취약, 피해 증폭
tempo-support: 공격속도, 궁극기 충전, 전투 템포
economy-support: 처치 보상, 코인 흐름, 성장 가속
execution: 낮은 체력 적 마무리, 연속 처치
```

## 6. 스킬 효과 타입 축소

기존 스킬은 `tags`에 많은 의미가 흩어져 있었습니다.

이제 기존 `type`은 호환성을 위해 유지하고, 새로 축소된 `effectType`, `effectGroup`, `summary`를 모든 스킬에 자동 부여합니다.

```text
packages/game/src/types/skill.ts
packages/game/src/data/skills.ts
```

축소된 스킬 효과 타입:

```text
damage: 기본 단일 피해
splash: 광역/폭발/빔 피해
chain: 연쇄/추가타/다중타
control: 감속/빙결/묶기/방해
amplify: 표식/취약/피해 증폭
tempo: 공격속도/궁극기 템포/정화
economy: 보상/코인/웨이브 보상
execute: 마무리/처형/연속 처치
shield: 방어/방벽/지연
summon: 포탑/소환/보조 화력
```

## 7. 적 타입/웨이브 요구 타입 정리

적마다 전술 역할과 카운터 효과를 부여했습니다.

```text
swarm: 다수 잡몹, 광역/연쇄 요구
runner: 빠른 돌파형, 제어/처형 요구
armored: 고체력 탱커형, 증폭/정밀/제어 요구
elite: 중간 보스형, 증폭/처형/제어 요구
boss: 보스형, 증폭/정밀/처형 요구
```

웨이브마다 전술 테마와 추천 효과도 추가했습니다.

```text
swarm: 잡버그 무리
rush: 핑러너 돌파
armored: 렉덩어리 압박
elite: 엘리트 버그 출현
boss: 서버 크래셔 침공
mixed: 혼합 웨이브
```

웨이브 추천 효과가 보드 영웅의 전술 효과와 맞으면 전투력에 최대 12% 대응 보너스를 줍니다.

## 8. 스킬 효과 타입 UI 표시

영웅 상세 drawer에 스킬 효과 타입 배지를 추가했습니다.

표시 방식:

```text
스킬명
기존 분류 + 발동 조건
축소 효과 타입 배지 + 효과 요약
상세 효과 1~3줄
```

## 9. 웨이브 정보 HUD 표시

전투 화면 상단 HUD에 현재 웨이브 정보를 추가했습니다.

```text
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
```

표시 내용:

```text
웨이브 테마 · 웨이브 이름
추천 효과 3개
```

예시:

```text
러시 · W9 핑러너 돌파
추천 제어 · 처형 · 연쇄
```

## 10. 전투 중 효과 팝업 정리

비신화/기본 영웅 스킬의 전투 중 팝업을 축소 스킬 타입 기준으로 통일했습니다.

적용 파일:

```text
apps/web/src/game-client/pixi/pixiSkillEffectLogRuntime.ts
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
```

표시 예시:

```text
광역
연쇄
제어
증폭
템포
경제
처형
방어
소환
```

기존 태그 기반 문구인 `폭발`, `표식`, `지원`, `보상` 등이 스킬 데이터의 `effectType` 기준 라벨로 정리됩니다.

모바일 화면이 지저분해지지 않도록 영웅별 효과 팝업은 0.9초 쿨다운을 둡니다.

신화 영웅 궁극기는 기존 개별 궁극기명/효과 팝업이 이미 있으므로 이번 단계에서는 유지했습니다.

## 11. 공격력/공격속도 설계 기준

공격속도 수치는 이제 단순 표시가 아니라 실시간 전투에서 공격 간격에 직접 반영됩니다.

```text
공격 간격 = 기본 공격 간격 / attackSpeed × 전역 보정 × 전술 보정
```

## 12. 타겟 우선순위 보완

영웅마다 타겟 우선순위를 부여했습니다.

```text
front: 가장 앞선 적
boss: 보스 우선
highest-hp: 체력 높은 적 우선
cluster: 주변에 적이 많은 적 우선
low-hp: 체력 낮은 적 우선
support: 기본 선두 지원
```

## 13. 적용된 코드 변경

```text
packages/game/src/types/heroTactics.ts
packages/game/src/data/heroTactics.ts
packages/game/src/types/skill.ts
packages/game/src/data/skills.ts
packages/game/src/types/enemy.ts
packages/game/src/data/enemies.ts
packages/game/src/types/wave.ts
packages/game/src/data/waves.ts
packages/game/src/systems/combatSystem.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/pixiHudView.ts
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
apps/web/src/game-client/pixi/pixiSkillEffectLogRuntime.ts
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
apps/web/src/components/lobby/lobbyHeroSkillDetails.ts
apps/web/src/components/lobby/LobbyDetailPanel.tsx
apps/web/src/styles/lobby-detail-drawer.css
```

## 14. 남은 보완점

1. 축소 스킬 타입을 실제 전투 효과 계산의 공통 기준으로 점진 이전
   - 기존 개별 영웅 스킬 런타임은 유지
   - 공통 효과는 `effectType` 기반 helper로 이전

2. 신화 궁극기 문구도 축소 타입 라벨과 통일
   - 기존 개별 궁극기명 팝업은 유지
   - 필요 시 `광역 · D.Va 자폭!` 같은 형태로 정리

## 15. 확인 필요

```bash
pnpm typecheck
pnpm build:web
```

테스트 체크리스트:

- 전투가 정상 시작되는지
- 영웅들이 정상 공격하는지
- 캐서디/탈론 추적요원 등 보스 우선 영웅이 보스를 우선 치는지
- 트레이서/겐지가 낮은 체력 적을 우선 치는지
- D.Va/윈스턴/일리아리가 군집 적을 우선 치는지
- 공격속도 차이가 체감되는지
- 신화 스킬/궁극기가 기존처럼 작동하는지
- 영웅 상세 UI에서 스킬 타입 배지가 표시되는지
- 웨이브별 대응 타입 보너스가 전투력 계산에 반영되는지
- 상단 HUD에 웨이브 테마/추천 효과가 보이는지
- 전투 중 비신화 스킬 효과 팝업이 축소 타입 기준으로 보이는지

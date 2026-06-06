# 11. 현재 게임 작업 로그

## 2026-06-06 작업

### 정정 사항

사용자가 요청한 작업은 `영웅 편성 UI`가 아니라 다음 두 가지였습니다.

```text
2. 빌드/타입 오류 가능성 점검 및 수정
3. 전투 결과/보상 화면 개선
```

잘못 추가했던 영웅 편성 UI 관련 변경은 되돌렸습니다.

되돌린 항목:

```text
apps/web/src/components/lobby/LobbyViews.tsx 편성 UI 제거
apps/web/src/pages/LobbyPage.tsx 편성 UI 연결 제거
apps/web/src/styles/lobby-lineup.css 삭제
```

내부 저장 구조의 `lineupHeroIds`는 이전 작업에서 전투 소환 풀 정책으로 들어간 상태이며, 이번 작업에서는 UI를 추가하지 않습니다.

## 전투 결과/보상 화면 개선

### 추가 파일

```text
apps/web/src/game-client/pixi/pixiFinalResultView.ts
```

### 연결 파일

```text
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
클리어/전투 종료 제목
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

### 결과 등급 기준

```text
S: 클리어 상태이며 생명이 시작 생명과 같거나 높음
A: 30웨이브 클리어
B: 클리어했지만 완벽 방어는 아님
C: 패배
```

별점 기준:

```text
★★★: 클리어 상태이며 생명이 시작 생명과 같거나 높음
★★☆: 클리어 상태이며 생명이 시작 생명의 50% 이상
★☆☆: 패배 또는 생명 50% 미만 클리어
```

`GameState`에는 `maxLives`가 없으므로, 결과 등급/별점 계산은 `initialBalance.startingLives`를 기준으로 합니다.

### 보상 계산

보상 계산은 기존에 추가된 다음 파일을 사용합니다.

```text
apps/web/src/game-client/pixi/pixiLobbyBattleRewards.ts
```

현재 공식:

```text
골드 = defeatedEnemies * 8 + clearedWaves * 50
보석 = defeatedBosses * 20
30웨이브 클리어 시 보석 +200
```

테스트 모드에서는 로비 보상 저장을 하지 않습니다.

## 몬스터 누수/결과창 버그 수정

### 문제

```text
몬스터가 오른쪽 아래 도착 지점에 들어오면 HP가 줄고 그 몬스터만 사라져야 하는데,
여러 몬스터가 한꺼번에 사라지거나 도착 지점 이후로 더 이동하는 문제가 있었습니다.

몬스터가 겹쳐 있을 때 한 마리가 들어가도 여러 몬스터가 같은 프레임에 한꺼번에 사라지는 문제가 있었습니다.

전투 타이머가 0이 되는 순간 finishAutoWave()가 남은 몬스터를 전부 정리해서,
한 마리가 들어간 직후 전체가 사라지는 것처럼 보이는 문제가 있었습니다.

몬스터가 출구에서 처리되어도 refs.waveLostLives만 증가하고 refs.state.lives는 즉시 감소하지 않아,
상단 HP가 바로 줄지 않는 문제가 있었습니다.

결과창은 버튼을 누르지 않았는데도 클릭 즉시 사라지는 문제가 있었습니다.
```

### 원인

```text
경로를 한 바퀴 루프로 복구하면서 실제 의도와 다르게 몬스터가 오른쪽 아래 출구를 지나 아래쪽 가로 구간까지 이동했습니다.

프레임 단위로 progress >= 1인 몬스터를 처리하면,
몬스터가 겹쳐 있거나 같은 프레임에 출구에 도달했을 때 여러 마리가 동시에 제거될 수 있었습니다.

createPixiGame.ts에 combatTimer <= 0이면 finishAutoWave()를 호출하는 로직이 있었습니다.
finishAutoWave() 내부에도 살아있는 몬스터를 강제로 destroy하는 로직이 남아 있었습니다.
이 두 가지 때문에 한 마리 누수 직후 남은 몬스터 전체가 정리될 수 있었습니다.

새 웨이브 스폰 시 spawnWaveMonsters()가 기존 activeEnemies를 전부 지우는 구조였습니다.
이 때문에 타이머 종료/다음 웨이브 시작과 몬스터 이동 처리가 충돌했습니다.

겹치는 웨이브 구조로 바뀐 뒤에도 HP 감소는 waveLostLives에만 누적되고,
실제 lives 반영은 finishAutoWave() 시점에만 처리되어 즉시 HP 감소가 보이지 않았습니다.

한꺼번에 사라지는 문제를 피하려고 스폰 progress 간격을 넓혔지만,
체감상 몬스터 소환 간격이 지나치게 멀어졌습니다.

결과창은 refs.menu에 올라가는데, 전역 stage pointerdown에서 빈칸 클릭 시 메뉴를 정리하는 로직이 결과창 클릭까지 처리할 수 있었습니다.
```

### 수정 파일

```text
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiWaveRuntime.ts
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiRenderRuntime.ts
apps/web/src/game-client/pixi/pixiFinalResultView.ts
```

### 수정 내용

```text
ActiveEnemy에 leaked 플래그 추가
ActiveEnemy에 exitQueued 플래그 추가
GameRefs에 nextEnemyLeakAt 추가
적 이동 경로를 오른쪽 아래 출구에서 끝나는 열린 경로로 변경
출구 끝점은 오른쪽 아래까지 내려간 좌표로 조정
출구에 도달한 몬스터는 exitQueued 상태로 대기
0.22초 간격으로 대기 중인 몬스터를 id 순서대로 1마리씩 누수 처리
누수 처리된 몬스터는 다시 처리하지 않도록 방어
출구 누수 처리 시 refs.state.lives를 즉시 감소
생명이 0이 되면 즉시 status failed 처리
HP 즉시 갱신을 위해 updateActiveEnemies 옵션에 invalidateHud 추가
combatTimer <= 0만으로 웨이브 결과 처리하지 않도록 수정
타이머가 끝나면 기존 몬스터를 유지한 채 다음 웨이브를 추가 스폰
spawnWaveMonsters()가 기존 activeEnemies를 삭제하지 않도록 수정
spawnWaveMonsters()의 progress 간격을 0.04/0.18에서 0.018/0.09로 축소해 몬스터 출현을 다시 촘촘하게 조정
finishAutoWave()가 살아있는 몬스터를 강제로 제거하지 않도록 수정
finishAutoWave()는 모든 몬스터가 처치/누수 처리된 뒤에만 요약 처리
finishAutoWave()에서 lives를 다시 차감하지 않도록 중복 차감 제거
웨이브 종료 시 누수 몬스터 수와 생명 피해량 계산 분리
HUD의 countdown/combat timer는 Math.max(0, timer)로 음수 표시 방지
최종 결과 상태에서는 stage 클릭으로 메뉴를 닫지 않도록 방어
결과창 root/panel/button 이벤트 전파 차단
```

## 타입/빌드 점검 메모

이 환경에서는 `pnpm typecheck`, `pnpm build:web` 명령을 직접 실행하지 못했습니다.

코드 기준으로 확인한 주요 타입 위험 지점:

```text
HeroesView props 원복 완료
LobbyPage의 편성 UI props 제거 완료
lobby-lineup.css import 제거 완료
pixiFinalResultView.ts는 Pixi Container/Graphics/Text 기반
pixiWaveFlowRuntime.ts는 최종 상태에서만 showFinalResultPanel 호출
GameState.maxLives 사용 제거 완료
결과 등급/별점은 initialBalance.startingLives 기준으로 수정
ActiveEnemy.leaked는 optional boolean으로 추가
ActiveEnemy.exitQueued는 optional boolean으로 추가
GameRefs.nextEnemyLeakAt 초기화 완료
updateActiveEnemies 옵션에 invalidateHud 전달 완료
```

다음 로컬 확인 명령:

```bash
pnpm typecheck
pnpm build:web
pnpm dev:web
```

확인할 화면:

```text
/lobby 영웅 탭이 기존 카드 목록으로 정상 표시되는지
/play 몬스터가 오른쪽 중간에서 사라지지 않는지
/play 몬스터가 오른쪽 아래 출구에서 멈추고 처리되는지
/play 몬스터가 오른쪽 아래 출구 이후 아래쪽 가로 구간으로 이동하지 않는지
/play 몬스터가 겹쳐도 출구에서 0.22초 간격으로 1마리씩 누수 처리되는지
/play 몬스터 소환 간격이 너무 벌어지지 않고 자연스럽게 이어지는지
/play 전투 타이머가 0이 되면 다음 웨이브가 기존 몬스터를 지우지 않고 추가 스폰되는지
/play 진행 중이던 몬스터가 오른쪽 아래 출구로 들어가며 HP를 즉시 깎는지
/play 타이머가 음수로 표시되지 않는지
/play 누수 시 HP가 해당 몬스터 damageToLife만큼 바로 줄어드는지
/play 전투 종료 시 결과 패널이 뜨는지
결과창을 클릭해도 닫히지 않는지
결과 등급/별점/보상 카드가 잘 보이는지
다시 도전 버튼이 동작하는지
로비로 버튼이 /lobby로 이동하는지
전투 종료 후 로비 골드/보석이 증가하는지
```

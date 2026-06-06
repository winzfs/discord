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

결과창은 버튼을 누르지 않았는데도 클릭 즉시 사라지는 문제가 있었습니다.
```

### 원인

```text
경로를 오른쪽 아래에서 끝나는 열린 경로로 바꿨지만,
실제 화면에서는 아래쪽 가로 이동 구간이 빠져 오른쪽 중간 부근에서 종료 판정처럼 보이는 문제가 생겼습니다.

결과창은 refs.menu에 올라가는데, 전역 stage pointerdown에서 빈칸 클릭 시 메뉴를 정리하는 로직이 결과창 클릭까지 처리할 수 있었습니다.
```

### 수정 파일

```text
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiEnemyMovementRuntime.ts
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiFinalResultView.ts
```

### 수정 내용

```text
ActiveEnemy에 leaked 플래그 추가
적 이동 경로를 외곽 한 바퀴 전체 경로로 복구
오른쪽 하단과 아래쪽 가로 구간을 지나 시작점 쪽 출구에 도달할 때 progress 1 처리
progress가 1에 도달하면 해당 몬스터 1마리만 누수 처리
누수 처리된 몬스터는 다시 처리하지 않도록 방어
웨이브 종료 시 누수 몬스터 수와 생명 피해량 계산 분리
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
/play 몬스터가 오른쪽 하단과 아래쪽 가로 구간까지 이동하는지
/play 몬스터가 최종 출구에서 1마리씩 누수 처리되는지
/play 누수 시 HP가 해당 몬스터 damageToLife만큼 줄어드는지
/play 전투 종료 시 결과 패널이 뜨는지
결과창을 클릭해도 닫히지 않는지
결과 등급/별점/보상 카드가 잘 보이는지
다시 도전 버튼이 동작하는지
로비로 버튼이 /lobby로 이동하는지
전투 종료 후 로비 골드/보석이 증가하는지
```

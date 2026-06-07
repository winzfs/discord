# 15. Pixi 테스트 컨트롤 확장 브리핑

## 1. 목적

`/play-test`에서 신화 영웅만 소환할 수 있던 테스트 UI를 전체 유닛 소환 테스트 도구로 확장했습니다.

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiTestControlsRuntime.ts
apps/web/src/game-client/pixi/pixiTestControlsView.ts
apps/web/src/game-client/pixi/pixiGameTypes.ts
```

## 3. 구현 내용

### 3.1 모든 유닛 테스트 소환

`pixiTestHeroIds`에 일반, 희귀, 영웅, 전설, 신화 유닛 전체를 등록했습니다.

`/play-test`에서 버튼을 누르면 해당 유닛이 보드의 빈칸에 직접 배치됩니다.

### 3.2 접기/펼치기

테스트 패널 상단에 `접기` / `펼치기` 버튼을 추가했습니다.

접힌 상태에서는 작은 바만 남아 전투 화면을 덜 가립니다.

### 3.3 스크롤형 목록

Pixi 캔버스 내부에서 안정적으로 동작하도록 마우스 휠 대신 `▲` / `▼` 버튼형 스크롤을 적용했습니다.

- 3열 그리드
- 한 화면에 4행 표시
- 위/아래 버튼으로 다음 유닛 목록 확인

### 3.4 몬스터 HP 배율 유지

기존 몬스터 HP 배율 버튼은 그대로 유지했습니다.

## 4. 확인 필요

```bash
pnpm typecheck
pnpm build:web
```

브라우저 확인 항목:

- `/play-test`에서 일반~신화 전체 유닛 버튼이 표시되는지
- `▲` / `▼`로 목록 이동이 되는지
- `접기` / `펼치기`가 정상 동작하는지
- 각 유닛 버튼을 눌렀을 때 보드 빈칸에 배치되는지
- 보드가 가득 찼을 때 오류 없이 무시되는지
- 몬스터 HP 배율 버튼이 기존처럼 동작하는지

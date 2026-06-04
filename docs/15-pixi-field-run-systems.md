# 15. Pixi 전장 이미지 / 인게임 성장 시스템 갱신 기록

## 1. 문서 목적

이 문서는 `/play` Pixi 게임 화면의 최근 변경 사항을 추적하기 위한 기록입니다.

최근 반영 범위:

- 전장 배경 이미지 적용
- 필드 이미지 cover 렌더 기준 정리
- 유닛 보드와 몬스터 경로를 필드 이미지 기준으로 정렬
- 선택형 인게임 강화 시스템 추가
- 웨이브 클리어 보상 카드 추가
- 배포 후 확인해야 할 항목 정리

작업 원칙:

- 큰 메인 파일에 코드를 계속 넣지 않는다.
- `createPixiGame.ts`에는 연결 역할만 남긴다.
- 규칙, 렌더, 메뉴, 경로 계산은 작은 파일로 분리한다.
- 모바일 세로 화면 기준으로 실제 플레이 화면을 우선한다.

---

## 2. 전장 배경 이미지

현재 전장 이미지 위치:

```text
apps/web/public/assets/backgrounds/field.png
```

배포 후 접근 경로:

```text
/assets/backgrounds/field.png
```

Pixi에서 사용하는 경로는 아래 파일에서 관리합니다.

```text
apps/web/src/game-client/pixi/pixiFieldFrame.ts
```

현재 설정:

```ts
export const FIELD_TEXTURE_PATH = "/assets/backgrounds/field.png?v=20260605-field2";
export const FIELD_SOURCE_WIDTH = 609;
export const FIELD_SOURCE_HEIGHT = 1082;
```

`?v=20260605-field2`는 브라우저와 Cloudflare Pages 캐시를 피하기 위한 버전 쿼리입니다. 필드 이미지를 다시 교체하면 이 값을 갱신합니다.

---

## 3. 필드 cover 렌더 기준

필드 이미지는 찌그러뜨리지 않고 원본 비율을 유지한 채 화면을 꽉 채우는 `cover` 방식으로 렌더합니다.

공통 계산 함수:

```ts
export function getPixiFieldCoverFrame(width: number, height: number): PixiFieldFrame {
  const scale = Math.max(width / FIELD_SOURCE_WIDTH, height / FIELD_SOURCE_HEIGHT);
  const frameWidth = FIELD_SOURCE_WIDTH * scale;
  const frameHeight = FIELD_SOURCE_HEIGHT * scale;

  return {
    x: (width - frameWidth) / 2,
    y: (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
    scale,
  };
}
```

이 함수는 아래 파일들이 공통으로 사용합니다.

```text
gameLayout.ts
pixiBackgroundView.ts
pixiPathRuntime.ts
```

즉 배경, 보드 위치, 몬스터 경로가 모두 같은 기준 좌표를 사용합니다.

---

## 4. 배경 이미지 로딩 구조

대상 파일:

```text
apps/web/src/game-client/pixi/pixiBackgroundView.ts
```

기존에는 URL을 바로 `Texture.from()`으로 Sprite에 넣었습니다.

현재는 Pixi v8 환경에서 더 안정적으로 동작하도록 `Assets.load()`로 이미지를 비동기 로드한 뒤 다시 그리는 구조입니다.

현재 흐름:

```text
1. 먼저 fallback 초록 배경을 그림
2. fieldTexture가 없으면 Assets.load(FIELD_TEXTURE_PATH) 요청
3. 로드 완료 시 fieldTexture 저장
4. drawPixiBackgroundView()를 다시 호출해서 field.png Sprite 표시
```

정상 동작이라면 첫 프레임에는 초록색이 잠깐 보일 수 있지만, 이미지 로드 후 필드 배경이 표시됩니다.

---

## 5. 유닛 보드 정렬

대상 파일:

```text
apps/web/src/game-client/pixi/gameLayout.ts
```

현재 보드 위치는 필드 이미지 cover frame 기준 비율 좌표로 관리합니다.

```ts
const BOARD_LEFT = 0.22;
const BOARD_TOP = 0.33;
const BOARD_WIDTH = 0.56;
const BOARD_HEIGHT = 0.405;
```

필드 이미지가 다시 바뀌어 중앙 보드 위치가 달라지면 위 4개 값만 조정합니다.

---

## 6. 몬스터 경로 정렬

대상 파일:

```text
apps/web/src/game-client/pixi/pixiPathRuntime.ts
```

몬스터 경로는 필드 이미지의 노란 외곽 길을 따라가도록 비율 좌표로 관리합니다.

현재 경로 기준:

```ts
const FIELD_PATH_POINTS = [
  { x: 0.115, y: 0.805 },
  { x: 0.115, y: 0.395 },
  { x: 0.235, y: 0.27 },
  { x: 0.765, y: 0.27 },
  { x: 0.885, y: 0.395 },
  { x: 0.885, y: 0.805 },
  { x: 0.765, y: 0.875 },
  { x: 0.235, y: 0.875 },
  { x: 0.115, y: 0.805 },
];
```

실제 모바일 스크린샷 기준으로 노란 길과 어긋나면 이 배열을 조정합니다.

---

## 7. 선택형 인게임 강화 시스템

기존 공격력 강화 버튼은 단일 공격력 강화 기능이었습니다. 현재는 버튼을 누르면 이번 판 전용 강화 메뉴가 열리는 구조로 확장했습니다.

게임 패키지 파일:

```text
packages/game/src/types/runBoost.ts
packages/game/src/data/runBoosts.ts
packages/game/src/systems/runChoiceSystem.ts
```

Pixi 파일:

```text
apps/web/src/game-client/pixi/pixiRunBoostMenuView.ts
apps/web/src/game-client/pixi/pixiRunBoostRuntime.ts
```

현재 강화 종류:

```text
attack  - 공격 강화
economy - 경제 강화
summon  - 소환 강화
luck    - 행운 강화
```

`GameState`에는 다음 필드가 추가되었습니다.

```ts
runBoosts: RunBoostState;
```

동작 흐름:

```text
공격력 강화 버튼 터치
→ 이번 판 강화 메뉴 열림
→ 공격 / 경제 / 소환 / 행운 중 선택
→ 코인 소모
→ runBoosts 레벨 증가
```

현재 반영 상태:

```text
공격 강화 - attackMultiplier 경로에 반영
경제 강화 - economyMultiplier 경로에 반영
행운 강화 - 완벽 방어 행운석 보상 확률 경로에 반영
소환 강화 - 소환 버튼 표시 비용 및 실제 차감 비용에 반영
```

소환 비용 실제 차감은 `summonSystem.ts`를 크게 수정하지 않고 `pixiControlActionRuntime.ts`의 `summonAction()`에서 할인분을 보정하는 방식으로 처리했습니다.

---

## 8. 웨이브 보상 선택 카드

웨이브 종료 후 특정 조건을 만족하면 보상 카드 메뉴가 뜹니다.

추가 파일:

```text
apps/web/src/game-client/pixi/pixiWaveRewardMenuView.ts
apps/web/src/game-client/pixi/pixiWaveRewardRuntime.ts
```

연결 파일:

```text
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
```

보상 발생 조건:

```text
완벽 방어
또는 3웨이브마다
또는 보스 웨이브 클리어
```

보상 종류:

```text
코인 보급   - 즉시 코인 획득
행운석 충전 - 행운석 +1
코어 수리   - 체력 일부 회복
```

웨이브 종료 흐름:

```text
finishAutoWave()
→ 웨이브 결과 계산
→ showWaveResult()
→ 조건 만족 시 showWaveRewardMenu()
→ 보상 선택
→ resultTimer 짧게 조정
→ 다음 웨이브 카운트다운
```

---

## 9. 배포 후 확인 항목

Cloudflare Pages 배포 후 `/play`에서 아래를 확인합니다.

```text
1. /assets/backgrounds/field.png?v=20260605-field2 직접 접근 시 이미지가 열리는지
2. /play?v=field4 등 캐시 회피 URL에서 필드 이미지가 보이는지
3. 필드 이미지가 원본 비율을 유지하고 화면을 꽉 채우는지
4. 중앙 유닛 칸이 필드 이미지의 보드 영역에 맞는지
5. 몬스터가 노란 외곽 경로를 따라 이동하는지
6. 공격력 강화 버튼 터치 시 선택형 강화 메뉴가 열리는지
7. 강화 선택 후 코인 차감과 효과 반영이 되는지
8. 웨이브 종료 후 조건 만족 시 보상 카드가 뜨는지
9. 보상 선택 후 다음 웨이브 진행이 정상인지
10. 모바일에서 하단 버튼이 화면 밖으로 밀리지 않는지
```

---

## 10. 다음 작업 후보

### 10.1 필드 정렬 미세조정

실제 모바일 스크린샷을 기준으로 조정할 값:

```text
BOARD_LEFT
BOARD_TOP
BOARD_WIDTH
BOARD_HEIGHT
FIELD_PATH_POINTS
```

### 10.2 배경 로딩 확인

필드가 계속 초록색으로 남는 경우 확인할 것:

```text
1. /assets/backgrounds/field.png?v=20260605-field2 직접 접근 가능 여부
2. Cloudflare Pages 최신 배포가 완료됐는지
3. 브라우저 캐시가 남아 있는지
4. Pixi Assets.load 실패가 콘솔에 찍히는지
```

### 10.3 신화 조합 UI 개선

추천 작업:

```text
신화 메뉴에서 재료 보유/부족 상태 표시
재료별 현재 보유 여부 표시
조합 가능 항목 강조
부족 재료 안내
```

### 10.4 보스 웨이브 패턴

추천 작업:

```text
5웨이브  - 기본 보스
10웨이브 - 빠른 잡몹 동반
15웨이브 - 보호막 보스
20웨이브 - 공격속도 감소 디버프
25웨이브 - 누수 피해 증가
30웨이브 - 최종 보스
```

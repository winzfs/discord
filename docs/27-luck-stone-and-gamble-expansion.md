# 27. 행운석 보상 / 도박 확장

## 1. 목적

중간보스 및 보스 처치의 보상감을 높이고, 도박 버튼을 단일 영웅 도박에서 선택형 도박 메뉴로 확장했습니다.

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/pixiControlActionRuntime.ts
apps/web/src/game-client/pixi/pixiGambleMenuView.ts
packages/game/src/data/gamble.ts
packages/game/src/systems/gambleSystem.ts
```

## 3. 중간보스/보스 행운석 보상

보스 판정 enemy를 처치하면 행운석을 얻습니다.

```text
보스 처치: 행운석 +1
```

현재 Pixi 전투에서는 `enemy.boss`가 true인 적이 보스 보상 대상입니다.

보상 처리:

```text
골드 보상 지급
행운석 +1 지급
행운석 +1 플로팅 텍스트 표시
상단 HUD/컨트롤 갱신
```

## 4. 도박 메뉴 확장

기존에는 도박 버튼을 누르면 바로 `epic-gamble`만 실행했습니다.

변경 후:

```text
도박 버튼 클릭
→ 도박 선택 메뉴 표시
→ 코인 도박 / 전설 도박 중 선택
```

## 5. 도박 종류

### 5.1 코인 도박

내부 tier:

```text
epic-gamble
```

효과:

```text
행운석 2개 소모
성공 시 영웅 유닛
실패 시 희귀 유닛
성공률 38%
```

### 5.2 전설 도박

내부 tier:

```text
legendary-gamble
```

효과:

```text
행운석 4개 소모
성공 시 전설 유닛
실패 시 영웅 유닛
성공률 16%
```

## 6. UI 규칙

도박 메뉴에는 다음 정보를 표시합니다.

```text
보유 행운석
도박 이름
성공/실패 결과 설명
성공 확률
소모 행운석
```

행운석이 부족한 항목은 비활성화합니다.

## 7. 테스트 체크리스트

- 보스 처치 시 행운석 +1이 지급되는지 확인
- 보스 처치 시 `행운석 +1` 플로팅 텍스트가 보이는지 확인
- 도박 버튼을 누르면 선택 메뉴가 뜨는지 확인
- 행운석이 부족한 도박 항목은 비활성화되는지 확인
- 코인 도박 성공 시 영웅 유닛이 생성되는지 확인
- 코인 도박 실패 시 희귀 유닛이 생성되는지 확인
- 전설 도박 성공 시 전설 유닛이 생성되는지 확인
- 전설 도박 실패 시 영웅 유닛이 생성되는지 확인
- 도박 후 행운석이 정상 차감되는지 확인

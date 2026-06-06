# 14. 계정 레벨과 패스 레벨 장기 성장

## 1. 목적

계정 레벨과 패스 레벨은 한 판이 끝난 뒤에도 남는 장기 목표입니다.

기대 효과:

- 플레이할수록 누적 성장감이 생깁니다.
- 로비에 돌아왔을 때 다음 목표가 보입니다.
- 영웅/유물 성장 외에 계정 단위 목표가 생깁니다.
- 패스 시즌 단위로 반복 플레이 명분을 만들 수 있습니다.

## 2. 현재 적용 범위

적용 위치:

```text
apps/web/src/game-lobby/lobbyAccountProgress.ts
apps/web/src/game-lobby/lobbyProgressStorage.ts
apps/web/src/game-client/pixi/pixiLobbyBattleRewards.ts
apps/web/src/components/lobby/LobbyViews.tsx
apps/web/src/pages/LobbyPage.tsx
apps/web/src/styles/lobby.css
```

현재는 localStorage 기반 로비 진행도에 계정/패스 진행도를 저장합니다.

저장 필드:

```ts
accountProgress: {
  accountLevel: number;
  accountExp: number;
  passLevel: number;
  passExp: number;
  passSeasonId: string;
}
```

## 3. 계정 레벨

계정 레벨은 플레이 누적 성장입니다.

현재 규칙:

```text
기본 레벨: 1
최대 레벨: 100
필요 경험치: 120 + (현재 레벨 - 1) * 35
```

전투 종료 시 다음 기준으로 계정 EXP를 얻습니다.

```text
웨이브 EXP = 클리어 웨이브 * 18
처치 EXP = 처치 수 * 1.6 내림
보스 EXP = 보스 처치 수 * 40
최종 클리어 보너스 = 250
최소 지급 EXP = 20
```

## 4. 패스 레벨

패스 레벨은 시즌 단위 목표입니다.

현재 규칙:

```text
기본 레벨: 1
최대 레벨: 50
필요 경험치: 레벨당 100
시즌 ID: season-1
```

패스 EXP는 계정 EXP를 기반으로 지급합니다.

```text
패스 EXP = 계정 EXP * 0.72 + 보스 처치 수 * 20
```

## 5. 로비 표시

로비 전투 탭에 다음 카드가 표시됩니다.

```text
계정 Lv.N
현재 EXP / 필요 EXP

패스 Lv.N
현재 EXP / 필요 EXP
시즌 ID
```

## 6. 전투 보상 연결

게임 종료 후 로비 보상 지급 시 다음이 함께 저장됩니다.

- 골드
- 보석
- 계정 EXP
- 패스 EXP
- 계정 레벨업 수
- 패스 레벨업 수

결과 플로팅 텍스트 예시:

```text
+500G / +40보석 · 계정EXP +320 / 패스EXP +250 · 계정 +1Lv / 패스 +2Lv
```

## 7. 다음 개선 후보

- 패스 레벨 보상표 추가
- 특정 패스 레벨 도달 시 보석/영웅 조각/유물 조각 지급
- 계정 레벨에 따라 시작 코인, 시작 행운석, 최대 라인업 수 보너스 지급
- 일일/주간 퀘스트 EXP 보상 연결
- 시즌 초기화 및 시즌별 보상 기록

## 8. 테스트 체크리스트

- 기존 localStorage 데이터가 있어도 로비가 깨지지 않는지 확인
- 전투 종료 후 계정 EXP가 증가하는지 확인
- 전투 종료 후 패스 EXP가 증가하는지 확인
- EXP가 요구량을 넘으면 레벨업되는지 확인
- 로비 전투 탭에 계정/패스 진행도가 표시되는지 확인
- 새 저장 필드가 localStorage에 저장되는지 확인

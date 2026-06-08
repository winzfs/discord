# 22. 영웅 상세 전투 분류 / 발동조건 문구 정리

## 1. 목적

영웅 상세 화면에서 영어 태그가 그대로 노출되던 문제를 수정하고, 전투 분류와 스킬 설명의 역할을 분리했습니다.

기존 예시:

```text
태그 overwatch / cadet / single-target / fast
특징 research · cairo · 의...
```

## 2. 표시 구조

상세 화면의 큰 분류는 포지션과 공격타입만 보여줍니다.

```text
포지션: 탱커 / 딜러 / 지원
공격타입: 단일 / 범위 / 제어 / 보조 / 지속 강화
특징: 오버워치 / 신입 / 고속 / 카이로 / 연구소 / 보스 대응 등
```

스킬효과는 아래 스킬 카드에 이미 표시되므로 전투 분류 영역에서는 제거했습니다.

## 3. 자리야 공격타입 정리

자리야는 스킬효과가 아니라 공격타입 자체를 다음처럼 표시합니다.

```text
공격타입: 지속 강화
```

의미:

```text
같은 대상을 계속 공격할수록 공격 차지가 쌓이고 피해량이 증가합니다.
```

자리야 `입자포` 카드도 확률 스킬이 아니라 공격타입 설명으로 분리했습니다.

```text
조건: 공격타입: 지속 강화
설명: 같은 대상을 계속 공격할수록 강해지는 기본 공격
```

## 4. 영어 태그 한글화

기존에는 `hero.tags`를 그대로 출력했습니다.

```ts
`태그 ${hero.tags.join(" / ")}`
```

이 방식을 제거하고, 의미 있는 특징 태그만 한글로 변환합니다.

예시:

```text
research → 연구소
cairo → 카이로
single-target → 단일 집중
boss-killer → 보스 대응
wave-clear → 웨이브 정리
fast → 고속
slow → 감속
```

## 5. 스킬 발동조건 문구 정리

모든 일반 스킬은 일정 확률로 발동하는 구조로 설명합니다.

기존 문구:

```text
공격 시 적용
기본 공격 시 항상 적용
42%
30%
24%
게이지 100%
```

변경 문구:

```text
기본 공격 시 42% 확률
기본 공격 시 30% 확률
기본 공격 시 24% 확률
궁극기 게이지 100%
```

자리야의 기본 빔 강화는 스킬 발동조건이 아니라 공격타입 설명으로 분리했습니다.

## 6. 적용 파일

구조화 데이터:

```text
apps/web/src/game-lobby/lobbyData.ts
apps/web/src/pages/LobbyPage.tsx
```

상세 패널 렌더링:

```text
apps/web/src/components/lobby/LobbyDetailPanel.tsx
apps/web/src/styles/lobby-detail-drawer.css
```

발동조건 문구 정리:

```text
apps/web/src/components/lobby/lobbyHeroSkillDetails.ts
apps/web/src/game-client/pixi/pixiSkillDescriptionRuntime.ts
```

## 7. 확인 필요

```bash
pnpm typecheck
pnpm build:web
```

테스트 체크리스트:

- 영웅 상세에서 영어 태그 줄이 사라졌는지
- 전투 분류에서 스킬효과 칸이 사라졌는지
- 특징이 한글로 표시되는지
- 자리야 공격타입이 `지속 강화`로 보이는지
- 자리야 입자포가 확률 스킬이 아니라 공격타입 설명으로 보이는지
- 일반 스킬 카드의 발동조건이 확률 기준으로 보이는지
- 인게임 유닛 정보에서도 같은 발동조건 문구가 보이는지

# 22. 영웅 상세 전투 분류 / 발동조건 문구 정리

## 1. 목적

영웅 상세 화면에서 영어 태그가 그대로 노출되던 문제를 수정했습니다.

기존 예시:

```text
태그 overwatch / cadet / single-target / fast
```

이제 포지션을 큰 카테고리로 두고, 그 아래에 공격타입과 스킬효과가 나뉘는 구조로 표시합니다.

## 2. 표시 구조

```text
포지션: 탱커 / 딜러 / 지원
공격타입: 단일 / 범위 / 제어 / 보조
스킬효과: 피해 / 광역 / 연쇄 / 제어 / 증폭 / 지원 / 경제 / 처형 / 방어 / 소환
특징: 오버워치 / 신입 / 고속 / 보스 대응 등
```

`경제`는 코인, 처치 보상, 웨이브 보상 같은 자원 흐름을 늘리는 효과를 뜻합니다.

예시:

```text
포지션: 딜러
공격타입: 단일
스킬효과: 피해
특징: 오버워치 · 신입 · 단일 집중 · 고속
```

## 3. 적용 파일

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

## 4. 영어 태그 제거

기존에는 `hero.tags`를 그대로 출력했습니다.

```ts
`태그 ${hero.tags.join(" / ")}`
```

이 방식을 제거하고, `combatProfile`을 만들어 한글 구조로 표시합니다.

## 5. 스킬 발동조건 문구 정리

기존 문구:

```text
공격 시 적용
42%
30%
24%
게이지 100%
```

변경 문구:

```text
기본 공격 시 항상 적용
기본 공격 시 42% 확률
기본 공격 시 30% 확률
기본 공격 시 24% 확률
궁극기 게이지 100%
```

수동 신화 스킬 설명도 같은 기준으로 정리했습니다.

## 6. 확인 필요

```bash
pnpm typecheck
pnpm build:web
```

테스트 체크리스트:

- 영웅 상세에서 영어 태그 줄이 사라졌는지
- 전투 분류가 포지션/공격타입/스킬효과/특징으로 보이는지
- `성장` 대신 `경제`로 표시되는지
- 스킬 카드의 발동조건이 구체적으로 보이는지
- 인게임 유닛 정보에서도 같은 발동조건 문구가 보이는지

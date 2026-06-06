# 30. 로비 영웅 카드 상세창 표시 수정

## 1. 문제

로비에서 영웅 카드를 클릭해도 상세창이 보이지 않는 문제가 있었습니다.

코드 확인 결과:

```text
HeroesView의 button onClick → onDetail(detail)는 정상 연결
LobbyPage의 detail 상태와 LobbyDetailPanel 렌더 조건도 정상
```

하지만 상세창을 화면 위로 띄우는 `detail-drawer` 관련 CSS가 없어, 렌더링되어도 로비 화면/하단 네비 뒤에 묻혀 보이지 않을 수 있었습니다.

## 2. 적용 파일

```text
apps/web/src/styles/lobby-detail-drawer.css
apps/web/src/pages/LobbyPage.tsx
```

## 3. 변경 내용

상세창 전용 CSS를 추가했습니다.

```text
.detail-drawer
.detail-scroll-area
.detail-hero-header
.detail-badges
.detail-stat-grid
.detail-skill-section
.detail-skill-card
```

핵심 스타일:

```text
position: fixed
bottom: calc(88px + env(safe-area-inset-bottom))
z-index: 80
max-height: min(74dvh, 620px)
overflow-y: auto
```

하단 네비가 `z-index: 30`이므로 상세창은 `z-index: 80`으로 더 위에 뜹니다.

## 4. import 연결

`LobbyPage.tsx`에 다음 import를 추가했습니다.

```ts
import "../styles/lobby-detail-drawer.css";
```

## 5. 테스트 체크리스트

- 로비 영웅 탭에서 보유 영웅 카드를 클릭하면 상세창이 뜨는지 확인
- 상세창이 하단 네비 위에 뜨는지 확인
- 상세창 내부 스크롤이 되는지 확인
- 닫기 버튼으로 상세창이 닫히는지 확인
- 업그레이드 버튼이 하단에 보이는지 확인
- 유물 카드 상세창도 동일하게 뜨는지 확인

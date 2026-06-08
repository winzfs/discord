# 25. 로비 상세 UI 줄바꿈 규칙

## 1. 목적

영웅 상세창에서 중요한 설명이 말줄임 처리되어 정보가 생략되는 문제를 방지합니다.

사용자 기준:

```text
UI는 글을 생략하면 안 되고, 줄바꿈을 적절하게 해야 한다.
```

## 2. 적용 파일

```text
apps/web/src/styles/lobby-detail-drawer.css
```

## 3. 변경 내용

다음 스타일을 제거했습니다.

```css
text-overflow: ellipsis;
white-space: nowrap;
overflow: hidden;
```

대신 긴 문구는 줄바꿈되도록 처리했습니다.

```css
overflow-wrap: anywhere;
white-space: normal;
line-height: 1.32;
```

## 4. 적용 영역

```text
영웅 이름
영웅 부제목
전투 분류
특징
스킬명
스킬 조건
스킬효과 설명
스킬 요약
스킬 상세 bullet
업그레이드 버튼 문구
```

## 5. 기대 결과

```text
특징이 길어도 생략되지 않고 2줄 이상으로 표시
스킬 조건이 길어도 줄바꿈으로 표시
스킬효과 설명이 말줄임 없이 표시
상세창은 필요하면 내부 스크롤로 읽기 가능
```

## 6. 확인 필요

```bash
pnpm typecheck
pnpm build:web
```

테스트 체크리스트:

- 긴 특징 문구가 말줄임 없이 보이는지
- 자리야 `공격타입: 지속 강화` 설명이 잘리지 않는지
- 스킬 조건 문구가 한 줄에 안 들어가도 줄바꿈되는지
- 스킬 카드가 길어져도 상세창 내부 스크롤로 읽을 수 있는지

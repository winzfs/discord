# 14. Pixi prebuild 안정화 기록

## 1. 배경

최근 `/play` 관련 수정은 `createPixiGame.ts`에 직접 반영되지 않고 빌드 전 패치 스크립트로 적용되고 있습니다.

현재 유지 중인 핵심 패치:

- 플로팅 텍스트 자동 제거
- 영웅 터치 정보 패널
- 메뉴 내부 터치 시 바로 닫히지 않도록 처리
- 신화 레시피 고유 영웅명 표시
- 게임 종료 시 결과 저장 요청

## 2. 최근 빌드 실패 원인

`fix-mythic-ingredient-type.mjs`가 먼저 `ingredientText` 함수 시그니처를 변경한 뒤, `fix-mythic-recipe-display.mjs`가 다른 함수 형태를 찾으면서 호출부만 바뀌는 문제가 있었습니다.

결과적으로 TypeScript에서 다음 문제가 발생했습니다.

```text
Expected 3 arguments, but got 1.
```

## 3. 적용한 안정화

`package.json`의 `prebuild:web`에서 `fix-mythic-ingredient-type.mjs`를 제거했습니다.

현재 실행 순서:

```text
node scripts/fix-floating-text-lifetime.mjs
node scripts/add-unit-info-panel.mjs
node scripts/fix-mythic-recipe-display.mjs
node scripts/add-game-run-submission.mjs
```

## 4. 이유

신화 레시피 표시는 이제 `fix-mythic-recipe-display.mjs`가 직접 처리합니다.

따라서 별도로 `ingredientText(grade, role, count)`의 타입만 넓히는 선행 패치는 필요하지 않고, 오히려 후속 패치와 충돌할 수 있습니다.

## 5. 다음 구조 개선 목표

현재 방식은 여전히 빌드 전 소스 변조입니다. 다음 단계에서는 아래 내용을 실제 소스 파일로 흡수해야 합니다.

우선순위:

1. `pixiFloatingTextView.ts` 생성 후 floating text cleanup 흡수
2. `pixiUnitInfoPanelView.ts` 생성 후 영웅 정보 패널 흡수
3. `pixiMythicMenuView.ts` 생성 후 신화창 표시/터치 처리 흡수
4. `submitGameRun.ts`는 이미 실제 파일로 분리됨. `createPixiGame.ts` 연결부만 직접 반영
5. 위 작업 후 `prebuild:web`에서 임시 패치 스크립트 제거

## 6. 배포 후 확인 항목

- Cloudflare Pages `pnpm build:web` 통과
- 신화창 내부 터치 시 닫히지 않음
- 신화 레시피가 고유 영웅명으로 표시됨
- 영웅 합성/판매 버튼 터치 가능
- 게임 종료 시 기록 저장 메시지 표시

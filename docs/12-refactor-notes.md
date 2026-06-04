# 12. Pixi 클라이언트 리팩터링 노트

## 1. 현재 문제

`apps/web/src/game-client/pixi/createPixiGame.ts`는 아직 게임 초기화, 보드 입력, 배경 렌더링, 전투, 웨이브, 신화 조합 메뉴, 플로팅 텍스트, 애니메이션 루프를 한 파일에서 많이 담당합니다.

문서 기준상 500줄 이상 파일은 특별한 이유가 없으면 분리해야 하므로, `createPixiGame.ts`는 계속 분리 대상입니다.

## 2. 빌드 전 패치 스크립트 위험

현재 루트 빌드 과정에는 `createPixiGame.ts`를 문자열 기반으로 직접 수정하는 스크립트들이 포함되어 있습니다.

이 방식은 다음 위험이 있습니다.

- 빌드할 때마다 소스 파일이 변형될 수 있습니다.
- 이미 패치된 코드에 다시 패치가 적용되면 실패할 수 있습니다.
- 함수 이름이나 공백이 조금만 바뀌어도 스크립트가 실패할 수 있습니다.
- 실제 소스와 빌드 산출물 사이의 차이를 추적하기 어렵습니다.

따라서 최종 목표는 패치 내용을 실제 TypeScript 모듈로 옮기고, 빌드 전 소스 변형 스크립트를 제거하는 것입니다.

## 3. 추가된 분리 기반 파일

다음 파일은 기능 연결 전, 안전한 분리 기반으로 추가했습니다.

```text
apps/web/src/game-client/pixi/pixiSharedView.ts
apps/web/src/game-client/pixi/animation/animationManager.ts
apps/web/src/game-client/pixi/pixiPathRuntime.ts
apps/web/src/game-client/pixi/pixiFloatingTextView.ts
apps/web/src/game-client/pixi/pixiHeroLabels.ts
```

## 4. 연결용 1회성 스크립트

다음 스크립트를 추가했습니다.

```text
scripts/apply-pixi-client-refactor.mjs
```

이 스크립트는 자동 빌드 과정에 연결하지 않습니다.

역할:

- `createPixiGame.ts`의 공통 텍스트/패널/컨테이너 정리 함수를 `pixiSharedView.ts`로 위임
- 애니메이션 타입/추가/갱신 일부를 `animationManager.ts`로 위임
- 몬스터 경로 좌표 계산을 `pixiPathRuntime.ts`로 위임

사용 전 주의:

1. 로컬에서 현재 변경사항을 커밋하거나 백업합니다.
2. 스크립트를 한 번 실행합니다.
3. `pnpm typecheck`를 실행합니다.
4. `pnpm build:web`을 실행합니다.
5. 정상 확인 후 기존 빌드 전 소스 변형 스크립트 제거를 검토합니다.

## 5. 다음 작업 순서

1. 로컬에서 `scripts/apply-pixi-client-refactor.mjs` 실행
2. 타입체크와 빌드 확인
3. 플로팅 텍스트 helper 실제 연결
4. 신화 조합 메뉴 라벨 helper 실제 연결
5. 배경 렌더링 모듈 분리
6. 신화 조합 메뉴 분리
7. 웨이브 런타임 분리
8. 빌드 전 소스 변형 스크립트 제거

## 6. 주의사항

- 기존 동작하는 PixiJS 클라이언트를 새로 만들지 않습니다.
- 기능별로 작게 연결하고 매 단계마다 typecheck/build를 확인합니다.
- `createPixiGame.ts` 전체 교체는 피하고, 검증 가능한 작은 diff로 진행합니다.
- GitHub 도구 응답이 큰 파일을 중간에서 자를 수 있으므로, 대형 파일은 통째로 덮어쓰지 않습니다.

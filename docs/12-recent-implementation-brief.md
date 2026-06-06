# 12. 최근 구현 브리핑 및 다음 작업

## 1. 기준

이 문서는 최근 `/play` PixiJS 전투 화면에서 수정한 내용과 다음 작업 우선순위를 정리합니다.

기준 커밋 범위는 최근 스프라이트/웨이브/영웅 성장/신화 조합 UX 안정화 작업 이후 상태입니다.

## 2. 최근 반영 사항

### 2.1 Illari 스프라이트 시트 적용

`apps/web/public/assets/heroes/illari.png` 파일을 PixiJS 영웅 스프라이트 로더에 연결했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
```

반영 내용:

- `illari` 텍스처 경로 추가
- 스프라이트 렌더 가능 영웅 목록에 `illari` 추가
- Illari 전용 스케일 값 추가
- 사전 로딩 대상에 자동 포함

### 2.2 Illari 공격 모션 활성화

Illari는 이미지 경로만 연결된 상태에서는 공격 모션 트리거 목록에 포함되지 않아 idle 프레임만 표시될 수 있었습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

반영 내용:

- `SPRITE_ATTACK_HERO_IDS`에 `illari` 추가
- 공격 시 `attackLeft` / `attackRight` 프레임으로 전환되도록 처리

### 2.3 공격 후 대기 방향 유지

영웅이 공격한 뒤 바로 기본 왼쪽 대기로 돌아가면 어색해 보이기 때문에, 마지막 공격 방향을 잠시 유지하도록 변경했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiGameTypes.ts
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
apps/web/src/game-client/pixi/pixiGenjiDashRuntime.ts
```

반영 내용:

- `HeroSpriteAttackState`에 `idleUntil` 추가
- 공격 후 마지막 공격 방향으로 대기
- 3초간 공격이 없으면 왼쪽 대기 모션으로 복귀
- Genji 질풍참 전용 방향 상태에도 `idleUntil` 추가

### 2.4 Illari 대기 프레임 순서 예외 처리

Illari 스프라이트 시트는 대기 프레임만 `오른쪽, 왼쪽` 순서이고, 공격 프레임은 다른 영웅과 동일한 순서입니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
```

반영 내용:

- `HERO_REVERSED_IDLE_IDS`에 `illari` 추가
- Illari는 idle 프레임 선택 시에만 좌우를 반전
- 공격 프레임은 공통 `attackLeft`, `attackRight` 순서 유지

### 2.5 웨이브 클리어 후 다음 웨이브 진행 수정

몬스터를 빨리 모두 처치해서 `finishAutoWave()`로 웨이브가 종료되는 경우 `currentWave`가 증가하지 않아 1웨이브가 반복될 수 있었습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiWaveFlowRuntime.ts
```

반영 내용:

- 웨이브 클리어 시 `clearedWave` 기록
- 실패 상태가 아니고 최종 웨이브가 아니면 `currentWave + 1`
- `clearedWaves`를 실제 클리어한 웨이브 기준으로 보정
- 다음 카운트다운 후 증가된 웨이브 번호의 몬스터 구성 사용

### 2.6 웨이브 난이도 상승 구조 확인

난이도 상승 데이터는 이미 `packages/game/src/data/waves.ts`에 구현되어 있습니다.

현재 구조:

- 웨이브 번호가 오를수록 기본 적 수 증가
- 웨이브 번호가 오를수록 스폰 간격 감소
- 특정 웨이브부터 추가 적 그룹 등장
- 보스 웨이브는 별도 구성 사용
- 20웨이브 이후 보스 웨이브 구성 강화

### 2.7 영웅별 개성 1차 강화

일반~전설 영웅의 태그 기반 개성을 더 체감할 수 있도록 전투 시너지 런타임을 추가했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiHeroSynergyRuntime.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

반영 내용:

- 주변 8칸 안의 지원형 영웅이 공격 보너스를 제공합니다.
- `buff`, `haste`, `power-up`, `attack-speed`, `team-wide` 계열 지원 영웅이 연계 보너스 대상입니다.
- `commander`, `team-wide` 계열 영웅은 전역 지휘 보너스를 제공합니다.
- 보너스는 최대 35%까지 누적됩니다.
- 전투 중 첫 공격자 기준으로 `연계 +N%` 플로팅 텍스트를 표시합니다.

### 2.8 장기 성장 1차 강화

로비 영웅 레벨이 단순 공격력 상승 외에도 스킬 효과에 영향을 주도록 확장했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiProgressBonuses.ts
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
```

반영 내용:

- `getProgressHeroMasteryEffect()` 추가
- 영웅 레벨이 오를수록 일반~전설 스킬 효과가 강화됩니다.
- 범위 피해, 연쇄 피해, 감속/제어 효과, 경제 보너스가 레벨에 따라 상승합니다.
- 5레벨 이상 영웅은 경제형 스킬 보너스 코인을 추가로 얻습니다.

### 2.9 영웅 개성/성장 표시 1차 개선

영웅 개성과 장기 성장 효과가 적용되어도 유저가 알기 어려웠기 때문에, 선택 정보 패널과 범위 표시를 개선했습니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiSelectionRuntime.ts
apps/web/src/game-client/pixi/pixiUnitInfoView.ts
apps/web/src/game-client/pixi/pixiUnitRangeView.ts
apps/web/src/game-client/pixi/pixiHeroSynergyRuntime.ts
```

반영 내용:

- 선택한 영웅 정보 패널에 `연계 효과` 문구를 표시합니다.
- 선택한 영웅 정보 패널에 `숙련 Lv.N` 문구를 표시합니다.
- 지원형 버프 영웅을 선택하면 주변 8칸 버프 범위를 초록색 셀로 표시합니다.
- 시너지 판정 헬퍼를 export하여 정보 패널/범위 표시에서 재사용합니다.

### 2.10 신화 조합 재료 보유 표시

신화 조합 메뉴에서 해당 재료를 현재 보유 중인지 바로 알 수 있도록 재료 진행도를 표시합니다.

적용 위치:

```text
apps/web/src/game-client/pixi/pixiMythicMenuView.ts
packages/game/src/systems/mythicCraftSystem.ts
```

반영 내용:

- 신화 조합 메뉴의 각 조합 행에 재료별 `보유/필요` 수량을 표시합니다.
- 충족한 재료는 `✓ 재료명 보유/필요` 형태로 표시합니다.
- 부족한 재료는 `부족 재료명 보유/필요` 형태로 표시합니다.
- 일부라도 보유한 조합식은 초록색, 완성 가능한 조합식은 노란색으로 표시합니다.
- 조합 가능한 행에는 `조합 가능 ·` 접두어를 표시합니다.

## 3. 현재 주의할 점

### 3.1 빌드 재확인 필요

최근 타입 수정 이후 Cloudflare Pages 또는 로컬에서 다시 확인해야 합니다.

권장 확인 명령:

```bash
pnpm typecheck
pnpm build:web
```

### 3.2 실제 플레이 회귀 테스트 필요

특히 다음 항목은 브라우저에서 직접 확인해야 합니다.

- `/play` 진입 후 1웨이브 시작 여부
- 1웨이브 클리어 후 2웨이브로 넘어가는지
- 2, 3, 4웨이브에서 적 수와 구성이 증가하는지
- 보스 웨이브 진입 시 경고와 보스 생성이 정상인지
- Illari idle 방향이 왼쪽으로 복귀하는지
- Illari 공격 방향은 다른 영웅과 동일하게 동작하는지
- Genji 질풍참 후 타입/방향 오류가 없는지
- 지원형 영웅 주변 배치 시 `연계 +N%`가 표시되는지
- 레벨이 높은 일반~전설 영웅의 스킬 효과가 체감되는지
- 영웅 선택 패널에 연계/숙련 문구가 표시되는지
- 지원형 영웅 선택 시 주변 8칸 버프 범위가 표시되는지
- 신화 조합 메뉴에서 재료별 보유/필요 수량이 표시되는지
- 조합 가능 상태에서 행 터치로 정상 조합되는지

## 4. 다음 작업 우선순위

### 1순위: 빌드 안정화

가장 먼저 `pnpm typecheck`, `pnpm build:web` 기준으로 깨지는 타입/빌드 오류를 모두 정리합니다.

이유:

- Cloudflare 배포가 막히면 실제 테스트가 불가능합니다.
- 최근 타입 변경이나 import 변경처럼 다른 런타임에서 깨질 수 있는 지점을 빨리 확인해야 합니다.

### 2순위: 웨이브 회귀 테스트

웨이브가 자동으로 올라가는지, 난이도가 실제 체감되는지 확인합니다.

체크 항목:

- 빠른 클리어 시 다음 웨이브 증가
- 시간 만료 시 다음 웨이브 증가
- 결과 보상 선택 후 다음 웨이브 카운트다운 복귀
- 보스 웨이브 도달
- 실패/클리어 상태에서 더 이상 웨이브가 진행되지 않는지

### 3순위: 스프라이트 방향/모션 검수

최근 여러 영웅 스프라이트가 추가되었으므로, 방향 행 순서를 영웅별로 점검합니다.

체크 항목:

- 기본 왼쪽 idle
- 오른쪽 공격 후 오른쪽 idle 유지
- 3초 무공격 후 왼쪽 idle 복귀
- 공격 프레임 좌/우 일치
- Illari idle만 예외 처리되는지

### 4순위: 영웅 개성 2차 강화

1차는 태그 기반 패시브와 주변 지원 연계를 강화했습니다.

다음 개선:

- 보드 위 신화 재료 영웅 테두리 강조
- 특정 영웅별 고유 타겟팅 추가: 최고 체력 우선, 낮은 체력 우선, 선두 적 우선
- 탱커 오라형 감속 범위 표시
- 지원형 버프 범위에 실제 적용 대상 표시

### 5순위: 기록 저장 정확도 개선

현재 `durationSeconds`는 아직 실제 플레이 시간 기반으로 완전히 신뢰할 수 있는 값이 아닙니다.

다음 개선:

- 전투 시작 시각 저장
- 종료 시 실제 플레이 시간 계산
- 서버 기록 저장 시 `durationSeconds` 반영
- 서버에서 score/wave/kills/duration 상한 검증

### 6순위: `createPixiGame.ts` 추가 분리

아직 `createPixiGame.ts`가 앱 초기화, tick, 렌더, 입력, 런타임 연결을 많이 가지고 있습니다.

다음 분리 후보:

- tick loop 전용 런타임
- game refs 생성 전용 팩토리
- input/stage pointer 처리 전용 모듈
- result submit/lobby reward 연결 모듈

## 5. 다음 작업 권장 순서

```text
1. pnpm typecheck / pnpm build:web 확인
2. 배포 로그 재확인
3. /play-test에서 웨이브 1~5 진행 확인
4. Illari / Genji / Ana / Winston 스프라이트 방향 확인
5. 지원형 주변 배치 연계 보너스 확인
6. 로비 영웅 레벨에 따른 스킬 강화 체감 확인
7. 영웅 정보 패널에 연계/숙련 효과 설명 표시 확인
8. 지원형 영웅 선택 시 주변 8칸 버프 범위 확인
9. 신화 조합 메뉴 재료 보유/필요 표시 확인
10. 보드 위 신화 재료 영웅 테두리 강조
11. durationSeconds 실제 측정 적용
12. 점수/웨이브/킬 수 서버 검증 추가
13. createPixiGame.ts tick/init 분리
```

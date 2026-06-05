# 16. 오버워치 신화 영웅 / 신화 실험실 테스트 모드

## 1. 문서 목적

이 문서는 Pixi 인게임에 추가한 오버워치 기반 신화 영웅 구성과 테스트 모드 분리 작업을 기록합니다.

이번 변경은 일반 플레이와 개발 테스트 플레이를 분리하고, 신화 영웅 밸런스와 스킬 체감을 빠르게 확인하기 위한 기반 작업입니다.

---

## 2. 적용 범위

주요 반영 내용:

```text
- 기존 신화 영웅 제거
- 오버워치 기반 신화 영웅 9명 추가
- 각 신화 영웅에 일반 스킬 2개 + 궁극기 1개 구성
- 신화 조합법 9개로 교체
- 로비 영웅 목록에 새 신화 영웅 표시
- 테스트 전용 게임 모드 추가
- 일반 플레이 /play 와 테스트 플레이 /play-test 분리
- /play-test 전용 신화 실험실 패널 추가
- 테스트 모드에서 신화 영웅 자유 소환
- 테스트 모드에서 몬스터 HP 배율 조정
```

---

## 3. 신화 영웅 로스터

기존 신화 영웅은 제거하고, 아래 9명을 모두 신화 등급으로 추가했습니다.

```text
탱커
- D.Va
- 자리야
- 윈스턴

딜러
- 트레이서
- 캐서디
- 겐지

지원
- 아나
- 키리코
- 일리아리
```

관련 파일:

```text
packages/game/src/data/heroes.ts
packages/game/src/data/skills.ts
packages/game/src/data/mythicRecipes.ts
apps/web/src/game-lobby/lobbyData.ts
```

---

## 4. 제거된 기존 신화 영웅

아래 기존 신화 영웅은 제거했습니다.

```text
mythic-sharpshooter
mythic-storm-caller
mythic-shield-anchor
mythic-overclocker
mythic-treasure-hacker
```

---

## 5. 스킬 구성 원칙

각 신화 영웅은 테스트 버전 기준으로 다음 구조를 가집니다.

```text
일반 스킬 1개
일반 스킬 1개
궁극기 1개
```

원래 기획은 영웅 레벨에 따라 스킬이 해금되는 구조지만, 현재 테스트 버전에서는 모든 스킬을 처음부터 해금된 상태로 둡니다.

현재 스킬 데이터는 `SkillDefinition`의 기본 구조에 맞춰 `id`, `displayName`, `type`, `assetKey`, `tags` 중심으로 등록했습니다.
실제 전투 효과는 이후 별도 런타임에서 연결합니다.

---

## 6. 영웅별 스킬 목록

### D.Va

```text
일반: 융합포
일반: 방어 매트릭스
궁극기: 자폭
```

방향:

```text
광역 폭발 / 방어 매트릭스 / 넓은 범위 제압형 탱커
```

### 자리야

```text
일반: 입자포
일반: 방벽 충전
궁극기: 중력자탄
```

방향:

```text
에너지 충전 / 방벽 / 몬스터 묶기 제어형 탱커
```

### 윈스턴

```text
일반: 테슬라 캐논
일반: 점프 팩
궁극기: 원시의 분노
```

방향:

```text
연쇄 전기 피해 / 점프 진입 / 감속과 방해형 탱커
```

### 트레이서

```text
일반: 펄스 쌍권총
일반: 점멸
궁극기: 펄스 폭탄
```

방향:

```text
빠른 연사 / 추가 공격 / 단일 대상 폭발형 딜러
```

### 캐서디

```text
일반: 피스키퍼
일반: 자력 수류탄
궁극기: 황야의 무법자
```

방향:

```text
치명타 / 표식 / 보스 저격형 딜러
```

### 겐지

```text
일반: 수리검
일반: 튕겨내기
궁극기: 용검
```

방향:

```text
다중 투사체 / 반사 피해 / 처치 연쇄형 딜러
```

### 아나

```text
일반: 생체 소총
일반: 수면총
궁극기: 나노 강화제
```

방향:

```text
받는 피해 증가 / 감속 / 아군 공격 강화 지원가
```

### 키리코

```text
일반: 쿠나이
일반: 정화의 방울
궁극기: 여우길
```

방향:

```text
치명타 / 공격속도 보조 / 팀 버프 지원가
```

### 일리아리

```text
일반: 태양 소총
일반: 치유 파일론
궁극기: 태양 작렬
```

방향:

```text
충전형 한 방 / 보조 버프 / 표식 폭발형 공격 지원가
```

---

## 7. 신화 조합법

신화 조합법은 새 9명 기준으로 교체했습니다.

관련 파일:

```text
packages/game/src/data/mythicRecipes.ts
```

현재 조합법은 실제 밸런스 확정 전 테스트용입니다.
추후 조합 메뉴에서 아래 기능을 추가할 예정입니다.

```text
- 재료 보유 여부 표시
- 부족 재료 표시
- 조합 가능 항목 강조
- 재료 상세 보기
```

---

## 8. 로비 반영

관련 파일:

```text
apps/web/src/game-lobby/lobbyData.ts
```

반영 내용:

```text
- 새 신화 영웅 9명을 로비 보유 영웅으로 추가
- 테스트 편의를 위해 신화 영웅은 레벨 6으로 표시
```

---

## 9. 테스트 전용 모드

테스트 전용 모드로 `mythic-lab`을 추가했습니다.

관련 파일:

```text
packages/game/src/data/gameModes.ts
```

모드 정보:

```text
id: mythic-lab
이름: 신화 실험실
type: test
energyCost: 0
maxWave: 20
```

용도:

```text
- 신화 영웅 자유 소환
- 몬스터 HP 수동 설정
- 기록 저장 제외
```

---

## 10. 일반 플레이와 테스트 플레이 분리

라우트를 분리했습니다.

```text
/play      - 일반 게임
/play-test - 신화 실험실 테스트 모드
```

관련 파일:

```text
apps/web/src/app/router.tsx
apps/web/src/pages/GamePage.tsx
apps/web/src/game-client/pixi/createPixiGame.ts
apps/web/src/game-client/pixi/pixiGameTypes.ts
```

흐름:

```text
GamePage({ testMode })
→ createPixiGame(host, { testMode })
→ refs.isTestMode 저장
→ 테스트 모드일 때만 테스트 컨트롤 표시
```

일반 `/play`에서는 테스트 패널이 표시되지 않습니다.
`/play-test`에서만 신화 영웅 자유 소환과 몬스터 HP 배율 조정 UI가 표시됩니다.

테스트 모드에서는 최종 기록 저장을 건너뜁니다.

---

## 11. 신화 실험실 테스트 컨트롤

추가 파일:

```text
apps/web/src/game-client/pixi/pixiTestControlsRuntime.ts
apps/web/src/game-client/pixi/pixiTestControlsView.ts
```

기능:

```text
- 신화 영웅 9명 버튼 제공
- 버튼 터치 시 빈 칸에 해당 신화 영웅 즉시 배치
- 몬스터 HP 배율 변경 버튼 제공
- HP 배율: x0.5 / x1 / x2 / x5 / x10
```

적 HP 적용 위치:

```text
apps/web/src/game-client/pixi/pixiEnemyRuntime.ts
```

적 생성 시 아래 값을 곱합니다.

```ts
const testMultiplier = Math.max(0.1, refs.testEnemyHpMultiplier || 1);
const maxHp = Math.round(definition.health * hpScale * testMultiplier);
```

UI 보정 기록:

```text
- 버튼 좌표 x/y를 실제로 적용하지 않아 모든 버튼이 0,0에 겹치던 문제 수정
- 테스트 패널을 상단 HUD 영역과 덜 겹치도록 아래쪽으로 이동
- 버튼 클릭 후 render(refs)를 즉시 호출해서 소환 딜레이를 줄임
```

---

## 12. 현재 한계

현재 구현은 테스트 기반입니다.

```text
- 스킬 데이터는 등록되어 있으나 실제 전투 효과는 아직 대부분 연결 전
- 영웅 레벨별 스킬 해금은 아직 제한으로 적용하지 않음
- 신화 조합법은 테스트용 밸런스
- 테스트 컨트롤은 개발용 단순 패널
- HP 직접 숫자 입력은 아직 없음
```

---

## 13. 배포 후 확인 항목

`/play`에서 확인할 것:

```text
1. 테스트 패널이 보이지 않는지
2. 일반 소환/도박/웨이브/강화 버튼이 정상 동작하는지
3. 일반 게임 결과 저장이 기존처럼 동작하는지
```

`/play-test`에서 확인할 것:

```text
1. 신화 실험실 패널이 보이는지
2. 신화 영웅 버튼 9개가 서로 겹치지 않는지
3. 신화 영웅 버튼을 누르면 즉시 보드에 배치되는지
4. 몬스터 HP 배율 버튼이 x0.5 / x1 / x2 / x5 / x10으로 표시되는지
5. HP 배율 선택 후 새로 생성되는 몬스터 체력에 반영되는지
6. 테스트 모드 결과가 기록 저장으로 제출되지 않는지
```

---

## 14. 다음 작업 후보

### 14.1 오버워치 신화 스킬 실제 효과 연결

현재는 스킬 데이터와 태그 중심으로 구성되어 있습니다.
다음 단계에서 `pixiCombatRuntime.ts` 또는 별도 스킬 런타임으로 실제 효과를 분리 적용합니다.

추천 분리 방향:

```text
pixiHeroSkillRuntime.ts
pixiHeroSkillEffects.ts
pixiHeroStatusRuntime.ts
```

우선순위:

```text
1. 캐서디 치명타/보스 저격
2. 트레이서 빠른 연사/펄스 폭탄
3. 윈스턴 연쇄 피해
4. 아나 받는 피해 증가/나노 강화
5. 키리코 공속 버프
6. 자리야 중력자탄
7. D.Va 자폭
8. 겐지 처치 연쇄
9. 일리아리 표식 폭발
```

### 14.2 테스트 모드 UI 개선

```text
- 패널 접기/펼치기
- 버튼 2열/3열 자동 배치 개선
- 테스트 모드 전용 상단 제목 표시
- HP 직접 숫자 입력
- 웨이브/몬스터 종류 선택
- 보드 초기화 버튼
```

### 14.3 신화 조합 UI 개선

```text
- 조합 재료 보유 여부 표시
- 부족 재료 표시
- 조합 가능 항목 강조
- 재료 상세 보기
```

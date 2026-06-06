# 21. 스킬 이펙트 렌더링 규칙

## 1. 목적

일반~전설 유닛도 스킬 태그에 맞는 시각 이펙트를 가지도록 공통 스킬 이펙트 렌더러를 추가했습니다.

기존에는 신화 영웅 위주로 고유 공격 이펙트가 있었고, 일반~전설 유닛은 텍스트 플로팅 중심이라 스킬 차이가 잘 보이지 않았습니다.

## 2. 적용 파일

```text
apps/web/src/game-client/pixi/pixiBaseSkillFxRuntime.ts
apps/web/src/game-client/pixi/pixiBaseHeroSkillRuntime.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

## 3. 이펙트 매핑

| 스킬 계열 | 태그 | 이펙트 |
|---|---|---|
| 기본 공격 강화 | attack | 노란 타격선 |
| 보스/약점 공격 | boss-killer | 주황 타격선 |
| 광역/폭발 | area-damage, burst | 주황 원형 폭발 파동 |
| 연쇄/추가타 | chain, multi-hit, extra-hit | 하늘색 전기 체인 |
| 관통/빔 | pierce, beam | 밝은 직선 빔 |
| 제어/감속/빙결 | debuff, slow, freeze, grouping | 파란 제어 링 |
| 표식/취약 | mark, vulnerable | 붉은 표식 타격선 |
| 지원/버프 | buff, haste, power-up, team-wide | 초록 지원 펄스 |
| 포탑/지원화력 | turret, support-fire | 보라 타격선 |
| 경제/보상 | economy, coin-bonus, wave-reward | 금색 코인 반짝임 |

## 4. 구현 방식

공통 이펙트 렌더러는 `pixiBaseSkillFxRuntime.ts`에 분리했습니다.

사용하는 방식:

```text
스킬 태그 확인
→ SkillProfile.fxKind 지정
→ 피해/제어/보상 처리
→ spawnBaseSkillFx() 호출
```

이펙트는 `pixiFxPoolRuntime.ts`의 Graphics 풀을 재사용합니다.

## 5. 성능 기준

- 이미지 애셋을 새로 만들지 않습니다.
- Pixi Graphics 기반으로 가볍게 렌더링합니다.
- 이펙트가 끝나면 풀에 반환합니다.
- 일반~전설 스킬에만 적용합니다.
- 신화 영웅은 기존 고유 이펙트를 우선 사용합니다.

## 6. 현재 한계

1차 구현은 태그 기반 공통 이펙트입니다.

아직 다음은 개별 고유화되지 않았습니다.

- 유닛별 전용 색상
- 유닛별 전용 이펙트 모양
- 영웅별 고유 사운드
- 버프가 실제 적용되는 아군 위치까지 연결되는 선

## 7. 다음 개선 후보

- 버프형 유닛은 주변 8칸 아군에게 초록 연결선 표시
- 제어형 유닛은 감속된 적 밑에 지속 링 표시
- 경제형 유닛은 처치 시 코인 아이콘 플로팅 추가
- 전설 유닛은 더 두껍고 긴 이펙트 적용
- 세력별 색상 팔레트 적용

# 12. 에셋 작업 로그

## 2026-06-06

## 아나 신화 영웅 이미지 적용

### 추가된 이미지 위치

```text
apps/web/public/assets/heroes/ana.png
```

### 연결 파일

```text
apps/web/src/game-client/pixi/pixiHeroSpriteView.ts
apps/web/src/game-client/pixi/pixiCombatRuntime.ts
```

### 적용 내용

```text
heroId ana에 /assets/heroes/ana.png 경로 연결
아나를 스프라이트 렌더링 대상에 추가
아나 전용 스케일 1.22 적용
아나를 공격 모션 트리거 대상에 추가
```

### 구현 상세

```text
pixiHeroSpriteView.ts
- HERO_TEXTURE_PATHS에 ana 추가
- SPRITE_HERO_IDS에 ana 추가
- HERO_SPRITE_SCALE에 ana: 1.22 추가
- /assets/heroes/ana.png?v=20260606-ana1 캐시 버전 적용

pixiCombatRuntime.ts
- SPRITE_ATTACK_HERO_IDS에 ana 추가
- 아나 공격 시 idle 프레임에서 attack 프레임으로 전환 가능
```

### 관련 커밋

```text
ac643af5a7c49b19b32c62e3ebb74debfbcadd06
aa989900ed8c4f98e93da190e71a78ef8a2fb715
40f1efd0aa63ea6697d7374c7f5d4a961cf3d3d1
31f7dfc153f6c5ed6a8792f8e2166f69a3bdff2a
```

### 확인 항목

```text
/play에서 아나 소환 시 기본 도형 대신 이미지가 표시되는지
/play에서 아나 공격 시 공격 프레임으로 전환되는지
/play에서 이미지 크기가 너무 작거나 크지 않은지
/play에서 이미지가 캐시 때문에 안 보이면 강력 새로고침 후 재확인
```

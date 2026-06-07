# 33-1. 정커 고철총잡이 공격 모션 적용 보충

`pixiCombatRuntime.ts`의 `SPRITE_ATTACK_HERO_IDS`에 `scrap-gunner`를 추가했습니다.

이제 정커 고철총잡이도 공격 시 다음 처리를 탑니다.

```text
공격 방향 계산
공격 행 프레임 표시
공격 후 해당 방향 대기 유지
3초 후 왼쪽 대기 복귀
```

관련 asset:

```text
/apps/web/public/assets/heroes/junkgunner.png
```

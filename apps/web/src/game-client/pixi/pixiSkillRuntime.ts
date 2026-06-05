import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";

export type PixiSkillRuntimeOptions = {
  damageEnemy: (refs: GameRefs, enemy: ActiveEnemy, damage: number) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

function liveEnemies(refs: GameRefs) {
  return refs.activeEnemies.filter((enemy) => enemy.alive);
}

function nearbyEnemies(refs: GameRefs, target: ActiveEnemy, radius: number) {
  return liveEnemies(refs).filter(
    (enemy) => enemy.id !== target.id && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= radius,
  );
}

function frontEnemies(refs: GameRefs, target: ActiveEnemy, count: number) {
  return liveEnemies(refs)
    .filter((enemy) => enemy.id !== target.id)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, count);
}

function maybeShowSkillText(
  refs: GameRefs,
  options: PixiSkillRuntimeOptions,
  label: string,
  target: ActiveEnemy,
  color: number,
  chance = 0.18,
) {
  if (refs.random() <= chance) {
    options.floatText(refs, label, target.x, target.y - 34, color);
  }
}

export function applyMythicHeroSkillEffects(
  refs: GameRefs,
  options: PixiSkillRuntimeOptions,
  hero: BoardHero,
  role: HeroRole,
  target: ActiveEnemy,
  baseDamage: number,
) {
  if (hero.grade !== "mythic") return baseDamage;

  if (hero.heroId === "dva") {
    nearbyEnemies(refs, target, 70).slice(0, 3).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.28)));
    });
    target.speed = Math.max(0.2, target.speed * 0.9);
    maybeShowSkillText(refs, options, "융합포", target, 0xff78d8);
    return Math.round(baseDamage * 1.08);
  }

  if (hero.heroId === "zarya") {
    return baseDamage;
  }

  if (hero.heroId === "winston") {
    nearbyEnemies(refs, target, 95).slice(0, 2).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.45)));
      enemy.speed = Math.max(0.2, enemy.speed * 0.86);
    });
    maybeShowSkillText(refs, options, "테슬라 연쇄", target, 0x87b7ff);
    return Math.round(baseDamage * 0.92);
  }

  if (hero.heroId === "tracer") {
    frontEnemies(refs, target, 1).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.55)));
    });
    maybeShowSkillText(refs, options, "점멸 사격", target, 0xffc857);
    return Math.round(baseDamage * 1.08);
  }

  if (hero.heroId === "cassidy") {
    target.speed = Math.max(0.2, target.speed * 0.72);
    const critical = refs.random() < 0.26;
    maybeShowSkillText(refs, options, critical ? "피스키퍼 치명타" : "자력 수류탄", target, 0xffd166, critical ? 0.35 : 0.18);
    return Math.round(baseDamage * (critical ? 1.82 : 1.18));
  }

  if (hero.heroId === "genji") {
    frontEnemies(refs, target, 2).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.38)));
    });
    maybeShowSkillText(refs, options, "수리검 연속", target, 0x7dff7a);
    return Math.round(baseDamage * 1.04);
  }

  if (hero.heroId === "ana") {
    target.speed = Math.max(0.18, target.speed * 0.68);
    maybeShowSkillText(refs, options, "수면총", target, 0x7dffb2);
    return Math.round(baseDamage * 1.22);
  }

  if (hero.heroId === "kiriko") {
    const precision = target.boss || target.progress > 0.66 || refs.random() < 0.22;
    maybeShowSkillText(refs, options, precision ? "쿠나이 급소" : "정화의 방울", target, 0xff8ad8, precision ? 0.34 : 0.14);
    return Math.round(baseDamage * (precision ? 1.72 : 1.06));
  }

  if (hero.heroId === "illari") {
    nearbyEnemies(refs, target, 82).slice(0, 2).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.32)));
    });
    maybeShowSkillText(refs, options, "태양 소총", target, colors.yellow);
    return Math.round(baseDamage * 1.2);
  }

  return role === "damage" ? Math.round(baseDamage * 1.06) : baseDamage;
}

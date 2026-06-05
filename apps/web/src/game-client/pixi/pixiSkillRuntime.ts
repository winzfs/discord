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

function bossOrFrontEnemy(refs: GameRefs, target: ActiveEnemy) {
  return liveEnemies(refs).find((enemy) => enemy.boss) ?? target;
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

function applyDvaSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Fusion Cannons - close spread damage.
  nearbyEnemies(refs, target, 78).slice(0, 4).forEach((enemy) => {
    options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.24)));
  });

  // Skill 2: Defense Matrix - suppresses the lead enemy instead of adding more splash.
  const lead = bossOrFrontEnemy(refs, target);
  lead.speed = Math.max(0.18, lead.speed * 0.62);
  maybeShowSkillText(refs, options, lead.id === target.id ? "융합포" : "방어 매트릭스", lead, 0xff78d8);

  return Math.round(baseDamage * 1.04);
}

function applyZaryaSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, hero: BoardHero, target: ActiveEnemy, baseDamage: number) {
  const beamCharge = refs.zaryaBeamCharges[hero.instanceId]?.charge ?? 1;

  // Skill 1 is handled as the continuous beam in combat runtime.
  // Skill 2: Barrier Charge - high beam charge briefly hardens the beam and slows the target.
  if (beamCharge >= 3) {
    target.speed = Math.max(0.18, target.speed * 0.72);
    maybeShowSkillText(refs, options, "방벽 충전", target, 0xff7de9, 0.28);
    return Math.round(baseDamage * 1.08);
  }

  return baseDamage;
}

function applyWinstonSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Tesla Cannon - chain damage.
  nearbyEnemies(refs, target, 100).slice(0, 3).forEach((enemy) => {
    options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.34)));
  });

  // Skill 2: Jump Pack - hits the furthest front target with a slow impact.
  const front = frontEnemies(refs, target, 1)[0];
  if (front) {
    front.speed = Math.max(0.18, front.speed * 0.58);
    options.damageEnemy(refs, front, Math.max(1, Math.round(baseDamage * 0.52)));
  }

  maybeShowSkillText(refs, options, front ? "점프 팩 충격" : "테슬라 캐논", target, 0x87b7ff);
  return Math.round(baseDamage * 0.9);
}

function applyTracerSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Pulse Pistols - main target multi-hit.
  const multiHitBonus = Math.round(baseDamage * 0.18);
  options.damageEnemy(refs, target, Math.max(1, multiHitBonus));

  // Skill 2: Blink - skips to a front enemy for a smaller extra shot.
  frontEnemies(refs, target, 1).forEach((enemy) => {
    options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.48)));
  });

  maybeShowSkillText(refs, options, "점멸 연사", target, 0xffc857);
  return Math.round(baseDamage * 0.96);
}

function applyCassidySkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Peacekeeper - precision critical.
  const critical = refs.random() < 0.22;

  // Skill 2: Magnetic Grenade - mark/slow instead of just another damage bonus.
  target.speed = Math.max(0.18, target.speed * 0.64);
  const markedDamageBonus = target.boss ? 1.24 : 1.14;

  maybeShowSkillText(refs, options, critical ? "피스키퍼 치명타" : "자력 수류탄 표식", target, 0xffd166, critical ? 0.35 : 0.2);
  return Math.round(baseDamage * markedDamageBonus * (critical ? 1.55 : 1));
}

function applyGenjiSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Shuriken - fan spread to two front enemies.
  frontEnemies(refs, target, 2).forEach((enemy) => {
    options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.32)));
  });

  // Skill 2: Deflect - punishes boss/front threat with a stronger reflected strike.
  const reflectTarget = bossOrFrontEnemy(refs, target);
  if (reflectTarget.id !== target.id || reflectTarget.boss) {
    options.damageEnemy(refs, reflectTarget, Math.max(1, Math.round(baseDamage * 0.62)));
    maybeShowSkillText(refs, options, "튕겨내기", reflectTarget, 0x7dff7a, 0.34);
  } else {
    maybeShowSkillText(refs, options, "수리검", target, 0x7dff7a);
  }

  return Math.round(baseDamage * 0.98);
}

function applyAnaSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Biotic Rifle - vulnerability damage.
  const vulnerableDamage = target.boss ? 1.38 : 1.22;

  // Skill 2: Sleep Dart - strong control, distinct from rifle damage.
  if (refs.random() < 0.36 || target.boss) {
    target.speed = Math.max(0.08, target.speed * 0.36);
    maybeShowSkillText(refs, options, "수면총", target, 0x7dffb2, 0.42);
  } else {
    maybeShowSkillText(refs, options, "생체 소총", target, 0x7dffb2);
  }

  return Math.round(baseDamage * vulnerableDamage);
}

function applyKirikoSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Kunai - precision critical.
  const precision = target.boss || target.progress > 0.7 || refs.random() < 0.24;

  // Skill 2: Protection Suzu - brief team tempo buff represented as tiny attack multiplier growth.
  if (refs.random() < 0.2) {
    refs.progressBonuses.attackMultiplier *= 1.006;
    maybeShowSkillText(refs, options, "정화의 방울", target, 0xff8ad8, 0.36);
  } else {
    maybeShowSkillText(refs, options, precision ? "쿠나이 급소" : "쿠나이", target, 0xff8ad8, precision ? 0.32 : 0.12);
  }

  return Math.round(baseDamage * (precision ? 1.68 : 1.02));
}

function applyIllariSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  // Skill 1: Solar Rifle - charged single-target burst.
  const charged = refs.random() < 0.34 || target.boss;

  // Skill 2: Healing Pylon - damage support aura as nearby bonus shots.
  nearbyEnemies(refs, target, 86).slice(0, 2).forEach((enemy) => {
    options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.26)));
  });

  maybeShowSkillText(refs, options, charged ? "태양 소총 충전" : "치유 파일론 증폭", target, colors.yellow, charged ? 0.34 : 0.18);
  return Math.round(baseDamage * (charged ? 1.52 : 1.08));
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

  if (hero.heroId === "dva") return applyDvaSkills(refs, options, target, baseDamage);
  if (hero.heroId === "zarya") return applyZaryaSkills(refs, options, hero, target, baseDamage);
  if (hero.heroId === "winston") return applyWinstonSkills(refs, options, target, baseDamage);
  if (hero.heroId === "tracer") return applyTracerSkills(refs, options, target, baseDamage);
  if (hero.heroId === "cassidy") return applyCassidySkills(refs, options, target, baseDamage);
  if (hero.heroId === "genji") return applyGenjiSkills(refs, options, target, baseDamage);
  if (hero.heroId === "ana") return applyAnaSkills(refs, options, target, baseDamage);
  if (hero.heroId === "kiriko") return applyKirikoSkills(refs, options, target, baseDamage);
  if (hero.heroId === "illari") return applyIllariSkills(refs, options, target, baseDamage);

  return role === "damage" ? Math.round(baseDamage * 1.06) : baseDamage;
}

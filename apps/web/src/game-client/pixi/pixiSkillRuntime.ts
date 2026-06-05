import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";
import { spawnGenjiDashStrike } from "./pixiGenjiDashRuntime";

export type PixiSkillRuntimeOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  damageEnemy: (refs: GameRefs, enemy: ActiveEnemy, damage: number) => void;
  drawBoard: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

type Point = { x: number; y: number };

const ATTACK_SKILL_CHANCE = 0.42;
const CONTROL_SKILL_CHANCE = 0.3;
const SUPPORT_SKILL_CHANCE = 0.24;
const GENJI_SWIFT_STRIKE_CHANCE = 0.22;

function roll(refs: GameRefs, chance: number) {
  return refs.random() < chance;
}

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

function showSkillText(
  options: PixiSkillRuntimeOptions,
  refs: GameRefs,
  label: string,
  target: ActiveEnemy,
  color: number,
) {
  options.floatText(refs, label, target.x, target.y - 34, color);
}

function applyDvaSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  let damage = baseDamage;

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    nearbyEnemies(refs, target, 78).slice(0, 4).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.24)));
    });
    damage = Math.round(damage * 1.04);
    showSkillText(options, refs, "융합포", target, 0xff78d8);
  }

  if (roll(refs, CONTROL_SKILL_CHANCE)) {
    const lead = bossOrFrontEnemy(refs, target);
    lead.speed = Math.max(0.18, lead.speed * 0.62);
    showSkillText(options, refs, "방어 매트릭스", lead, 0xff78d8);
  }

  return damage;
}

function applyZaryaSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, hero: BoardHero, target: ActiveEnemy, baseDamage: number) {
  const beamCharge = refs.zaryaBeamCharges[hero.instanceId]?.charge ?? 1;

  if (beamCharge >= 3 && roll(refs, SUPPORT_SKILL_CHANCE)) {
    target.speed = Math.max(0.18, target.speed * 0.72);
    showSkillText(options, refs, "방벽 충전", target, 0xff7de9);
    return Math.round(baseDamage * 1.08);
  }

  return baseDamage;
}

function applyWinstonSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  let damage = Math.round(baseDamage * 0.86);

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    nearbyEnemies(refs, target, 86).slice(0, 2).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.26)));
    });
    showSkillText(options, refs, "테슬라 과충전", target, 0x87b7ff);
  }

  if (roll(refs, CONTROL_SKILL_CHANCE)) {
    const front = frontEnemies(refs, target, 1)[0];
    if (front) {
      front.speed = Math.max(0.18, front.speed * 0.58);
      options.damageEnemy(refs, front, Math.max(1, Math.round(baseDamage * 0.42)));
      showSkillText(options, refs, "점프 팩 충격", front, 0x87b7ff);
    }
  }

  return damage;
}

function applyTracerSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  let damage = baseDamage;

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    options.damageEnemy(refs, target, Math.max(1, Math.round(baseDamage * 0.18)));
    damage = Math.round(damage * 0.96);
    showSkillText(options, refs, "펄스 쌍권총", target, 0xffc857);
  }

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    frontEnemies(refs, target, 1).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.48)));
      showSkillText(options, refs, "점멸", enemy, 0xffc857);
    });
  }

  return damage;
}

function applyCassidySkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  let damage = baseDamage;

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    damage = Math.round(damage * 1.55);
    showSkillText(options, refs, "피스키퍼 치명타", target, 0xffd166);
  }

  if (roll(refs, CONTROL_SKILL_CHANCE)) {
    target.speed = Math.max(0.18, target.speed * 0.64);
    damage = Math.round(damage * (target.boss ? 1.24 : 1.14));
    showSkillText(options, refs, "자력 수류탄", target, 0xffd166);
  }

  return damage;
}

function applyGenjiSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, hero: BoardHero, from: Point, target: ActiveEnemy, baseDamage: number) {
  let damage = baseDamage;

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    frontEnemies(refs, target, 2).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.32)));
    });
    damage = Math.round(damage * 0.98);
    showSkillText(options, refs, "수리검", target, 0x7dff7a);
  }

  if (roll(refs, GENJI_SWIFT_STRIKE_CHANCE)) {
    spawnGenjiDashStrike(refs, options, hero, from, baseDamage);
  }

  return damage;
}

function applyAnaSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  let damage = baseDamage;

  if (roll(refs, SUPPORT_SKILL_CHANCE)) {
    damage = Math.round(damage * (target.boss ? 1.38 : 1.22));
    showSkillText(options, refs, "생체 소총", target, 0x7dffb2);
  }

  if (roll(refs, CONTROL_SKILL_CHANCE)) {
    target.sleepUntil = Date.now() + 3000;
    showSkillText(options, refs, "수면총 3초", target, 0x7dffb2);
  }

  return damage;
}

function applyKirikoSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  let damage = baseDamage;

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    const precision = target.boss || target.progress > 0.7 || refs.random() < 0.24;
    damage = Math.round(damage * (precision ? 1.68 : 1.02));
    showSkillText(options, refs, precision ? "쿠나이 급소" : "쿠나이", target, 0xff8ad8);
  }

  if (roll(refs, SUPPORT_SKILL_CHANCE)) {
    refs.progressBonuses.attackMultiplier *= 1.006;
    showSkillText(options, refs, "정화의 방울", target, 0xff8ad8);
  }

  return damage;
}

function applyIllariSkills(refs: GameRefs, options: PixiSkillRuntimeOptions, target: ActiveEnemy, baseDamage: number) {
  let damage = baseDamage;

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    damage = Math.round(damage * (target.boss ? 1.52 : 1.34));
    showSkillText(options, refs, "태양 소총 충전", target, colors.yellow);
  }

  if (roll(refs, SUPPORT_SKILL_CHANCE)) {
    nearbyEnemies(refs, target, 86).slice(0, 2).forEach((enemy) => {
      options.damageEnemy(refs, enemy, Math.max(1, Math.round(baseDamage * 0.26)));
    });
    showSkillText(options, refs, "치유 파일론 증폭", target, colors.yellow);
  }

  return damage;
}

export function applyMythicHeroSkillEffects(
  refs: GameRefs,
  options: PixiSkillRuntimeOptions,
  hero: BoardHero,
  role: HeroRole,
  target: ActiveEnemy,
  baseDamage: number,
  from: Point,
) {
  if (hero.grade !== "mythic") return baseDamage;

  if (hero.heroId === "dva") return applyDvaSkills(refs, options, target, baseDamage);
  if (hero.heroId === "zarya") return applyZaryaSkills(refs, options, hero, target, baseDamage);
  if (hero.heroId === "winston") return applyWinstonSkills(refs, options, target, baseDamage);
  if (hero.heroId === "tracer") return applyTracerSkills(refs, options, target, baseDamage);
  if (hero.heroId === "cassidy") return applyCassidySkills(refs, options, target, baseDamage);
  if (hero.heroId === "genji") return applyGenjiSkills(refs, options, hero, from, target, baseDamage);
  if (hero.heroId === "ana") return applyAnaSkills(refs, options, target, baseDamage);
  if (hero.heroId === "kiriko") return applyKirikoSkills(refs, options, target, baseDamage);
  if (hero.heroId === "illari") return applyIllariSkills(refs, options, target, baseDamage);

  return role === "damage" ? Math.round(baseDamage * 1.06) : baseDamage;
}

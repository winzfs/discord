import { Graphics } from "pixi.js";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";

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
const GENJI_DASH_MAX_TARGETS = 3;
const GENJI_DASH_DURATION = 260;
const GENJI_DASH_STAGGER = 118;

function roll(refs: GameRefs, chance: number) {
  return refs.random() < chance;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - clamp01(progress), 3);
}

function easeInCubic(progress: number) {
  const local = clamp01(progress);
  return local * local * local;
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

function lowestHpEnemies(refs: GameRefs, count: number) {
  return liveEnemies(refs)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
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

function drawDashSlash(fx: Graphics, point: Point, local: number, color: number) {
  const alpha = Math.max(0, 1 - local);
  const radius = 18 + local * 18;
  const startAngle = -1.45 + local * 0.85;

  fx.arc(point.x, point.y, radius, startAngle, startAngle + 1.85);
  fx.stroke({ color, width: Math.max(1, 7 * alpha), alpha: 0.55 * alpha });
  fx.arc(point.x, point.y, radius * 0.72, startAngle + 0.12, startAngle + 1.54);
  fx.stroke({ color: 0xffffff, width: Math.max(1, 2.4 * alpha), alpha: 0.86 * alpha });
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

  // Particle Cannon is always on. Barrier Charge is a support proc once beam is built up.
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

function setGenjiDashOffset(refs: GameRefs, hero: BoardHero, from: Point, point: Point) {
  refs.heroSpriteOffsets[hero.instanceId] = {
    x: point.x - from.x,
    y: point.y - from.y,
    until: Date.now() + 90,
  };
}

function spawnGenjiDashAnimation(
  refs: GameRefs,
  options: PixiSkillRuntimeOptions,
  hero: BoardHero,
  from: Point,
  target: ActiveEnemy,
  damage: number,
  order: number,
) {
  const fx = new Graphics();
  const targetAtDash = { x: target.x, y: target.y };
  const delay = order * GENJI_DASH_STAGGER;
  const totalDuration = delay + GENJI_DASH_DURATION;
  let hitApplied = false;

  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: totalDuration,
    update: (progress) => {
      const elapsed = progress * totalDuration;
      if (elapsed < delay) return;

      const local = clamp01((elapsed - delay) / GENJI_DASH_DURATION);
      const toTargetProgress = local < 0.58
        ? easeOutCubic(local / 0.58)
        : 1 - easeInCubic((local - 0.58) / 0.42);
      const point = {
        x: lerp(from.x, targetAtDash.x, toTargetProgress),
        y: lerp(from.y, targetAtDash.y, toTargetProgress),
      };

      refs.heroSpriteAttacks[hero.instanceId] = {
        direction: targetAtDash.x < from.x ? "left" : "right",
        until: Date.now() + 120,
      };
      setGenjiDashOffset(refs, hero, from, point);

      fx.clear();
      if (local >= 0.32) {
        drawDashSlash(fx, targetAtDash, clamp01((local - 0.32) / 0.5), 0x7dff7a);
      }
      if (local < 0.72) {
        fx.moveTo(from.x, from.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color: 0x7dff7a, width: 4.5, alpha: 0.28 * (1 - local * 0.45) });
        fx.moveTo(from.x, from.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color: 0xffffff, width: 1.4, alpha: 0.62 * (1 - local * 0.5) });
      }

      if (!hitApplied && local >= 0.46) {
        hitApplied = true;
        if (target.alive) {
          options.damageEnemy(refs, target, damage);
          options.floatText(refs, order === 0 ? "질풍참" : `질풍참 ${order + 1}`, targetAtDash.x, targetAtDash.y - 34, 0x7dff7a);
        }
      }

      options.drawBoard(refs);
    },
    done: () => {
      fx.destroy();
      delete refs.heroSpriteOffsets[hero.instanceId];
      options.drawBoard(refs);
    },
  });
}

function applyGenjiDashStrike(refs: GameRefs, options: PixiSkillRuntimeOptions, hero: BoardHero, from: Point, baseDamage: number) {
  const targets = lowestHpEnemies(refs, GENJI_DASH_MAX_TARGETS);
  if (targets.length === 0) return;

  const dashDamage = Math.max(1, Math.round(baseDamage * 1.08));
  targets.forEach((target, index) => spawnGenjiDashAnimation(refs, options, hero, from, target, dashDamage, index));
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

  if (roll(refs, ATTACK_SKILL_CHANCE)) {
    applyGenjiDashStrike(refs, options, hero, from, baseDamage);
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

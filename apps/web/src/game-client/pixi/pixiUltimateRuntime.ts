import { Graphics } from "pixi.js";
import { getAllBoardHeroes, getHeroById } from "@discord-random-defense/game";
import type { BoardHero } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";

export const MYTHIC_ULTIMATE_MAX_CHARGE = 100;
const MYTHIC_ULTIMATE_TIME_CHARGE_PER_SECOND = 2.8;
const MYTHIC_ULTIMATE_ATTACK_CHARGE = 12;

export type PixiUltimateRuntimeOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
  damageEnemy: (refs: GameRefs, enemy: ActiveEnemy, damage: number) => void;
};

function ensureUltimateCharges(refs: GameRefs) {
  refs.mythicUltimateCharges ??= {};
  return refs.mythicUltimateCharges;
}

function isMythicHero(hero: Pick<BoardHero, "grade">) {
  return hero.grade === "mythic";
}

export function getMythicUltimateCharge(refs: GameRefs, hero: Pick<BoardHero, "instanceId" | "grade">) {
  if (!isMythicHero(hero)) return 0;
  return ensureUltimateCharges(refs)[hero.instanceId]?.charge ?? 0;
}

export function addMythicUltimateCharge(refs: GameRefs, hero: Pick<BoardHero, "instanceId" | "grade">, amount: number) {
  if (!isMythicHero(hero)) return 0;

  const charges = ensureUltimateCharges(refs);
  const previous = charges[hero.instanceId]?.charge ?? 0;
  const next = Math.min(MYTHIC_ULTIMATE_MAX_CHARGE, previous + amount);

  charges[hero.instanceId] = {
    charge: next,
    lastUltimateAt: charges[hero.instanceId]?.lastUltimateAt ?? 0,
  };

  return next;
}

function consumeMythicUltimateCharge(refs: GameRefs, hero: Pick<BoardHero, "instanceId" | "grade">) {
  if (!isMythicHero(hero)) return false;
  const charges = ensureUltimateCharges(refs);
  const current = charges[hero.instanceId]?.charge ?? 0;
  if (current < MYTHIC_ULTIMATE_MAX_CHARGE) return false;

  charges[hero.instanceId] = {
    charge: 0,
    lastUltimateAt: Date.now(),
  };

  return true;
}

export function chargeMythicUltimatesOverTime(refs: GameRefs, deltaSeconds: number) {
  if (refs.wavePhase !== "combat") return;

  getAllBoardHeroes(refs.state.board).forEach((hero) => {
    addMythicUltimateCharge(refs, hero, MYTHIC_ULTIMATE_TIME_CHARGE_PER_SECOND * deltaSeconds);
  });
}

function showUltimatePulse(refs: GameRefs, options: PixiUltimateRuntimeOptions, x: number, y: number, color: number, radius = 92) {
  const pulse = new Graphics();
  refs.effects.addChild(pulse);

  options.addAnimation(refs, {
    duration: 520,
    update: (progress) => {
      pulse.clear();
      pulse.circle(x, y, radius * (0.35 + progress * 0.8));
      pulse.stroke({ color, width: 7 * (1 - progress), alpha: 0.72 * (1 - progress) });
      pulse.circle(x, y, radius * (0.18 + progress * 0.48));
      pulse.fill({ color, alpha: 0.16 * (1 - progress) });
    },
    done: () => pulse.destroy(),
  });
}

function liveEnemies(refs: GameRefs) {
  return refs.activeEnemies.filter((enemy) => enemy.alive);
}

function damageEnemiesInRadius(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  x: number,
  y: number,
  radius: number,
  damage: number,
) {
  liveEnemies(refs).forEach((enemy) => {
    if (Math.hypot(enemy.x - x, enemy.y - y) <= radius) {
      options.damageEnemy(refs, enemy, damage);
    }
  });
}

function slowEnemiesInRadius(refs: GameRefs, x: number, y: number, radius: number, multiplier: number) {
  liveEnemies(refs).forEach((enemy) => {
    if (Math.hypot(enemy.x - x, enemy.y - y) <= radius) {
      enemy.speed = Math.max(0.16, enemy.speed * multiplier);
    }
  });
}

export function tryTriggerMythicUltimate(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  hero: BoardHero,
  from: { x: number; y: number },
  target: ActiveEnemy,
  baseDamage: number,
) {
  if (!isMythicHero(hero)) return false;
  if (!consumeMythicUltimateCharge(refs, hero)) return false;

  const definition = getHeroById(hero.heroId);
  const label = definition?.displayName ?? hero.heroId;
  const center = { x: target.x, y: target.y };

  if (hero.heroId === "dva") {
    showUltimatePulse(refs, options, center.x, center.y, 0xff78d8, 150);
    damageEnemiesInRadius(refs, options, center.x, center.y, 165, Math.round(baseDamage * 4.2));
    options.floatText(refs, `${label} 자폭!`, center.x, center.y - 42, 0xff78d8);
    return true;
  }

  if (hero.heroId === "zarya") {
    showUltimatePulse(refs, options, center.x, center.y, 0xff7de9, 135);
    slowEnemiesInRadius(refs, center.x, center.y, 150, 0.38);
    damageEnemiesInRadius(refs, options, center.x, center.y, 145, Math.round(baseDamage * 2.2));
    options.floatText(refs, `${label} 중력자탄!`, center.x, center.y - 42, 0xff7de9);
    return true;
  }

  if (hero.heroId === "winston") {
    showUltimatePulse(refs, options, from.x, from.y, 0x87b7ff, 130);
    slowEnemiesInRadius(refs, from.x, from.y, 170, 0.52);
    damageEnemiesInRadius(refs, options, from.x, from.y, 170, Math.round(baseDamage * 2.4));
    options.floatText(refs, `${label} 원시의 분노!`, from.x, from.y - 42, 0x87b7ff);
    return true;
  }

  if (hero.heroId === "tracer") {
    showUltimatePulse(refs, options, center.x, center.y, 0xffc857, 112);
    damageEnemiesInRadius(refs, options, center.x, center.y, 118, Math.round(baseDamage * 3.5));
    options.floatText(refs, `${label} 펄스 폭탄!`, center.x, center.y - 42, 0xffc857);
    return true;
  }

  if (hero.heroId === "cassidy") {
    const targets = liveEnemies(refs).sort((a, b) => b.progress - a.progress).slice(0, 4);
    targets.forEach((enemy) => options.damageEnemy(refs, enemy, Math.round(baseDamage * 2.6)));
    showUltimatePulse(refs, options, from.x, from.y, 0xffd166, 118);
    options.floatText(refs, `${label} 황야의 무법자!`, from.x, from.y - 42, 0xffd166);
    return true;
  }

  if (hero.heroId === "genji") {
    const targets = liveEnemies(refs).sort((a, b) => b.progress - a.progress).slice(0, 5);
    targets.forEach((enemy) => options.damageEnemy(refs, enemy, Math.round(baseDamage * 2.1)));
    showUltimatePulse(refs, options, from.x, from.y, 0x7dff7a, 122);
    options.floatText(refs, `${label} 용검!`, from.x, from.y - 42, 0x7dff7a);
    return true;
  }

  if (hero.heroId === "ana") {
    addMythicUltimateCharge(refs, hero, 0);
    refs.progressBonuses.attackMultiplier *= 1.12;
    showUltimatePulse(refs, options, from.x, from.y, 0x7dffb2, 126);
    options.floatText(refs, `${label} 나노 강화제!`, from.x, from.y - 42, 0x7dffb2);
    return true;
  }

  if (hero.heroId === "kiriko") {
    refs.progressBonuses.attackMultiplier *= 1.1;
    showUltimatePulse(refs, options, from.x, from.y, 0xff8ad8, 136);
    options.floatText(refs, `${label} 여우길!`, from.x, from.y - 42, 0xff8ad8);
    return true;
  }

  if (hero.heroId === "illari") {
    showUltimatePulse(refs, options, center.x, center.y, 0xfff06a, 140);
    damageEnemiesInRadius(refs, options, center.x, center.y, 150, Math.round(baseDamage * 3));
    options.floatText(refs, `${label} 태양 작렬!`, center.x, center.y - 42, 0xfff06a);
    return true;
  }

  damageEnemiesInRadius(refs, options, center.x, center.y, 120, Math.round(baseDamage * 2.6));
  options.floatText(refs, `${label} 궁극기!`, center.x, center.y - 42, colors.yellow);
  return true;
}

export function chargeMythicUltimateFromAttack(refs: GameRefs, hero: BoardHero) {
  return addMythicUltimateCharge(refs, hero, MYTHIC_ULTIMATE_ATTACK_CHARGE);
}

import { updateEnemyViewPosition } from "./pixiEnemyView";
import { getAllBoardHeroes, getHeroById } from "@discord-random-defense/game";
import type { BoardHero } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";
import {
  spawnAnaNanoBoostFx,
  spawnCassidyDeadeyeFx,
  spawnDvaSelfDestructFx,
  spawnIllariCaptiveSunFx,
  spawnKirikoKitsuneRushFx,
  spawnTracerPulseBombFx,
  spawnWinstonPrimalRageFx,
  spawnZaryaGravitonFx,
} from "./pixiUltimateFxRuntime";
import { spawnGenjiDragonbladeFx } from "./pixiGenjiDragonbladeFxRuntime";

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
  if (refs.wavePhase !== "combat") return false;

  let changed = false;
  getAllBoardHeroes(refs.state.board).forEach((hero) => {
    const before = Math.floor(getMythicUltimateCharge(refs, hero));
    const after = Math.floor(addMythicUltimateCharge(refs, hero, MYTHIC_ULTIMATE_TIME_CHARGE_PER_SECOND * deltaSeconds));
    if (before !== after) changed = true;
  });

  return changed;
}

export function getAttackIntervalMultiplier(refs: GameRefs) {
  const now = Date.now();
  return refs.kitsuneRushUntil && refs.kitsuneRushUntil > now ? 0.5 : 1;
}

function liveEnemies(refs: GameRefs) {
  return refs.activeEnemies.filter((enemy) => enemy.alive);
}

function enemiesInRadius(refs: GameRefs, x: number, y: number, radius: number) {
  return liveEnemies(refs).filter((enemy) => Math.hypot(enemy.x - x, enemy.y - y) <= radius);
}

function damageEnemiesInRadius(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  x: number,
  y: number,
  radius: number,
  damage: number,
) {
  enemiesInRadius(refs, x, y, radius).forEach((enemy) => options.damageEnemy(refs, enemy, damage));
}

function slowEnemiesInRadius(refs: GameRefs, x: number, y: number, radius: number, multiplier: number) {
  enemiesInRadius(refs, x, y, radius).forEach((enemy) => {
    enemy.speed = Math.max(0.16, enemy.speed * multiplier);
  });
}

function fxOptions(options: PixiUltimateRuntimeOptions) {
  return { addAnimation: options.addAnimation };
}

function triggerDvaSelfDestruct(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  from: { x: number; y: number },
  baseDamage: number,
) {
  const radius = 210;
  spawnDvaSelfDestructFx(refs, fxOptions(options), from, radius);
  damageEnemiesInRadius(refs, options, from.x, from.y, radius, Math.round(baseDamage * 4.5));
  options.floatText(refs, `${label} 자폭! 공격력 450%`, from.x, from.y - 54, 0xff78d8);
}

function triggerZaryaGraviton(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  center: { x: number; y: number },
  baseDamage: number,
) {
  const radius = 112;
  const pullRadius = 205;
  const duration = 3000;
  const until = Date.now() + duration;
  const originalSpeeds = new Map<number, number>();

  options.floatText(refs, `${label} 중력자탄! 흡입/속박`, center.x, center.y - 54, 0xff7de9);

  spawnZaryaGravitonFx(
    refs,
    fxOptions(options),
    center,
    radius,
    pullRadius,
    duration,
    () => {
      enemiesInRadius(refs, center.x, center.y, pullRadius).forEach((enemy) => {
        if (!originalSpeeds.has(enemy.id)) originalSpeeds.set(enemy.id, enemy.speed);

        const sourceX = enemy.controlX ?? enemy.x;
        const sourceY = enemy.controlY ?? enemy.y;
        const dx = center.x - sourceX;
        const dy = center.y - sourceY;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const pullStrength = distance <= radius ? 0.48 : 0.26;
        const nextX = distance <= radius * 0.22 ? center.x : sourceX + dx * pullStrength;
        const nextY = distance <= radius * 0.22 ? center.y : sourceY + dy * pullStrength;

        enemy.speed = 0;
        enemy.controlUntil = until;
        enemy.controlX = nextX;
        enemy.controlY = nextY;
        enemy.x = nextX;
        enemy.y = nextY;
        updateEnemyViewPosition(enemy.view, enemy.x, enemy.y, enemy.progress);
      });
    },
    () => {
      originalSpeeds.forEach((speed, enemyId) => {
        const enemy = refs.activeEnemies.find((candidate) => candidate.id === enemyId && candidate.alive);
        if (enemy) {
          enemy.speed = Math.max(enemy.speed, speed);
          enemy.controlUntil = undefined;
          enemy.controlX = undefined;
          enemy.controlY = undefined;
        }
      });
      damageEnemiesInRadius(refs, options, center.x, center.y, radius + 8, Math.round(baseDamage * 2.4));
    },
  );
}

function triggerTracerPulseBomb(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  target: ActiveEnemy,
  baseDamage: number,
) {
  const explosionRadius = 105;
  options.floatText(refs, `${label} 펄스 폭탄 부착!`, target.x, target.y - 44, 0xffc857);
  spawnTracerPulseBombFx(refs, fxOptions(options), target, explosionRadius, (x, y) => {
    damageEnemiesInRadius(refs, options, x, y, explosionRadius, Math.round(baseDamage * 5.2));
    options.floatText(refs, `펄스 폭발! 공격력 520%`, x, y - 44, 0xffc857);
  });
}

function getCassidyDeadeyeLockRatio(baseDamage: number) {
  return Math.max(0.18, Math.min(0.82, baseDamage / 520));
}

function triggerCassidyDeadeye(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  from: { x: number; y: number },
  baseDamage: number,
) {
  const targets = liveEnemies(refs);
  const duration = 3000;
  options.floatText(refs, `${label} 황야의 무법자!`, from.x, from.y - 54, 0xffd166);

  spawnCassidyDeadeyeFx(
    refs,
    fxOptions(options),
    from,
    targets,
    duration,
    (progress) => Math.min(1, progress * getCassidyDeadeyeLockRatio(baseDamage)),
    () => {
      const lockRatio = Math.min(1, getCassidyDeadeyeLockRatio(baseDamage));
      const damage = lockRatio >= 1 ? Number.POSITIVE_INFINITY : Math.round(baseDamage * 4 * lockRatio);
      targets.forEach((enemy) => {
        if (!enemy.alive) return;
        options.damageEnemy(refs, enemy, Number.isFinite(damage) ? damage : enemy.hp);
      });
      options.floatText(refs, lockRatio >= 1 ? "전원 락온 처치!" : `락온 ${Math.round(lockRatio * 100)}% 피해`, from.x, from.y - 72, 0xffd166);
    },
  );
}

function triggerWinstonPrimalRage(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  from: { x: number; y: number },
  baseDamage: number,
) {
  spawnWinstonPrimalRageFx(refs, fxOptions(options), from, 170);
  slowEnemiesInRadius(refs, from.x, from.y, 170, 0.52);
  damageEnemiesInRadius(refs, options, from.x, from.y, 170, Math.round(baseDamage * 2.4));
  options.floatText(refs, `${label} 원시의 분노! 공격력 240%`, from.x, from.y - 48, 0x87b7ff);
}

function triggerGenjiDragonblade(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  from: { x: number; y: number },
  baseDamage: number,
) {
  const targets = liveEnemies(refs).sort((a, b) => b.progress - a.progress).slice(0, 5);
  options.floatText(refs, `${label} 용검!`, from.x, from.y - 48, 0x7dff7a);
  spawnGenjiDragonbladeFx(refs, fxOptions(options), from, targets, () => {
    targets.forEach((enemy) => {
      if (enemy.alive) options.damageEnemy(refs, enemy, Math.round(baseDamage * 2.1));
    });
    options.floatText(refs, `용검 베기 공격력 210%`, from.x, from.y - 68, 0x7dff7a);
  });
}

function triggerAnaNanoBoost(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  from: { x: number; y: number },
) {
  refs.progressBonuses.attackMultiplier *= 1.12;
  spawnAnaNanoBoostFx(refs, fxOptions(options), from);
  options.floatText(refs, `${label} 나노 강화제! 공격력 +12%`, from.x, from.y - 48, 0x7dffb2);
}

function triggerKirikoKitsuneRush(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  from: { x: number; y: number },
) {
  refs.kitsuneRushUntil = Date.now() + 5000;
  spawnKirikoKitsuneRushFx(refs, fxOptions(options), from);
  options.floatText(refs, `${label} 여우길! 공격속도 200%`, from.x, from.y - 48, 0xff8ad8);
}

function triggerIllariCaptiveSun(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  center: { x: number; y: number },
  baseDamage: number,
) {
  const radius = 150;
  options.floatText(refs, `${label} 태양 작렬!`, center.x, center.y - 48, 0xfff06a);
  spawnIllariCaptiveSunFx(refs, fxOptions(options), center, radius, () => {
    damageEnemiesInRadius(refs, options, center.x, center.y, radius, Math.round(baseDamage * 3));
    options.floatText(refs, `태양 폭발 공격력 300%`, center.x, center.y - 68, 0xfff06a);
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
    triggerDvaSelfDestruct(refs, options, label, from, baseDamage);
    return true;
  }
  if (hero.heroId === "zarya") {
    triggerZaryaGraviton(refs, options, label, center, baseDamage);
    return true;
  }
  if (hero.heroId === "tracer") {
    triggerTracerPulseBomb(refs, options, label, target, baseDamage);
    return true;
  }
  if (hero.heroId === "cassidy") {
    triggerCassidyDeadeye(refs, options, label, from, baseDamage);
    return true;
  }
  if (hero.heroId === "winston") {
    triggerWinstonPrimalRage(refs, options, label, from, baseDamage);
    return true;
  }
  if (hero.heroId === "genji") {
    triggerGenjiDragonblade(refs, options, label, from, baseDamage);
    return true;
  }
  if (hero.heroId === "ana") {
    triggerAnaNanoBoost(refs, options, label, from);
    return true;
  }
  if (hero.heroId === "kiriko") {
    triggerKirikoKitsuneRush(refs, options, label, from);
    return true;
  }
  if (hero.heroId === "illari") {
    triggerIllariCaptiveSun(refs, options, label, center, baseDamage);
    return true;
  }

  damageEnemiesInRadius(refs, options, center.x, center.y, 120, Math.round(baseDamage * 2.6));
  options.floatText(refs, `${label} 궁극기! 공격력 260%`, center.x, center.y - 42, colors.yellow);
  return true;
}

export function chargeMythicUltimateFromAttack(refs: GameRefs, hero: BoardHero) {
  return addMythicUltimateCharge(refs, hero, MYTHIC_ULTIMATE_ATTACK_CHARGE);
}

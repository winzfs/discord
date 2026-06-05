import { updateEnemyViewPosition } from "./pixiEnemyView";
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
  if (refs.wavePhase !== "combat") return false;

  let changed = false;
  getAllBoardHeroes(refs.state.board).forEach((hero) => {
    const before = Math.floor(getMythicUltimateCharge(refs, hero));
    const after = Math.floor(addMythicUltimateCharge(refs, hero, MYTHIC_ULTIMATE_TIME_CHARGE_PER_SECOND * deltaSeconds));
    if (before !== after) changed = true;
  });

  return changed;
}

function showUltimatePulse(refs: GameRefs, options: PixiUltimateRuntimeOptions, x: number, y: number, color: number, radius = 92, duration = 520) {
  const pulse = new Graphics();
  refs.effects.addChild(pulse);

  options.addAnimation(refs, {
    duration,
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

function enemiesInRadius(refs: GameRefs, x: number, y: number, radius: number) {
  return liveEnemies(refs).filter((enemy) => Math.hypot(enemy.x - x, enemy.y - y) <= radius);
}

function slowEnemiesInRadius(refs: GameRefs, x: number, y: number, radius: number, multiplier: number) {
  enemiesInRadius(refs, x, y, radius).forEach((enemy) => {
    enemy.speed = Math.max(0.16, enemy.speed * multiplier);
  });
}

function triggerDvaSelfDestruct(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  from: { x: number; y: number },
  baseDamage: number,
) {
  const radius = 210;
  showUltimatePulse(refs, options, from.x, from.y, 0xff78d8, radius, 680);
  damageEnemiesInRadius(refs, options, from.x, from.y, radius, Math.round(baseDamage * 4.5));
  options.floatText(refs, `${label} 자폭! 공격력 450%`, from.x, from.y - 46, 0xff78d8);
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
  const originalSpeeds = new Map<number, number>();
  const vortex = new Graphics();

  refs.effects.addChild(vortex);
  options.floatText(refs, `${label} 중력자탄! 좁은 범위 3초 속박`, center.x, center.y - 48, 0xff7de9);

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      vortex.clear();
      vortex.circle(center.x, center.y, radius * (0.9 + Math.sin(progress * Math.PI * 12) * 0.05));
      vortex.stroke({ color: 0xff7de9, width: 7, alpha: 0.58 });
      vortex.circle(center.x, center.y, pullRadius);
      vortex.stroke({ color: 0xffb6f4, width: 2, alpha: 0.18 });

      enemiesInRadius(refs, center.x, center.y, pullRadius).forEach((enemy) => {
        if (!originalSpeeds.has(enemy.id)) originalSpeeds.set(enemy.id, enemy.speed);

        const dx = center.x - enemy.x;
        const dy = center.y - enemy.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const pullStrength = distance <= radius ? 0.34 : 0.18;

        enemy.speed = 0;
        enemy.x += dx * pullStrength;
        enemy.y += dy * pullStrength;

        if (distance <= radius * 0.28) {
          enemy.x = center.x;
          enemy.y = center.y;
        }

        updateEnemyViewPosition(enemy.view, enemy.x, enemy.y, enemy.progress);
      });
    },
    done: () => {
      vortex.destroy();
      originalSpeeds.forEach((speed, enemyId) => {
        const enemy = refs.activeEnemies.find((candidate) => candidate.id === enemyId && candidate.alive);
        if (enemy) enemy.speed = Math.max(enemy.speed, speed);
      });
      damageEnemiesInRadius(refs, options, center.x, center.y, radius + 8, Math.round(baseDamage * 2.4));
    },
  });
}

function triggerTracerPulseBomb(
  refs: GameRefs,
  options: PixiUltimateRuntimeOptions,
  label: string,
  target: ActiveEnemy,
  baseDamage: number,
) {
  const bomb = new Graphics();
  const explosionRadius = 105;
  refs.effects.addChild(bomb);
  options.floatText(refs, `${label} 펄스 폭탄 부착!`, target.x, target.y - 44, 0xffc857);

  options.addAnimation(refs, {
    duration: 500,
    update: (progress) => {
      bomb.clear();
      if (!target.alive) return;
      const pulse = 0.8 + Math.sin(progress * Math.PI * 12) * 0.18;
      bomb.circle(target.x, target.y - 10, 9 * pulse);
      bomb.fill({ color: 0xffc857, alpha: 0.95 });
      bomb.circle(target.x, target.y - 10, 16 * pulse);
      bomb.stroke({ color: 0xffffff, width: 2, alpha: 0.75 });
    },
    done: () => {
      const x = target.x;
      const y = target.y;
      bomb.destroy();
      showUltimatePulse(refs, options, x, y, 0xffc857, explosionRadius, 420);
      damageEnemiesInRadius(refs, options, x, y, explosionRadius, Math.round(baseDamage * 5.2));
      options.floatText(refs, `펄스 폭발! 공격력 520%`, x, y - 42, 0xffc857);
    },
  });
}

function getCassidyDeadeyeLockRatio(baseDamage: number) {
  const attackFactor = Math.max(0.18, Math.min(0.82, baseDamage / 520));
  return attackFactor;
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
  const lock = new Graphics();
  refs.effects.addChild(lock);
  options.floatText(refs, `${label} 황야의 무법자! 느린 락온`, from.x, from.y - 48, 0xffd166);

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      lock.clear();
      const lockRatio = Math.min(1, progress * getCassidyDeadeyeLockRatio(baseDamage));
      targets.forEach((enemy) => {
        if (!enemy.alive) return;
        lock.moveTo(from.x, from.y);
        lock.lineTo(enemy.x, enemy.y);
        lock.stroke({ color: 0xffd166, width: 2, alpha: 0.12 + lockRatio * 0.36 });
        lock.circle(enemy.x, enemy.y, 11 + lockRatio * 15);
        lock.stroke({ color: lockRatio >= 1 ? 0xfff06a : 0xffd166, width: 3, alpha: 0.28 + lockRatio * 0.44 });
      });
    },
    done: () => {
      lock.destroy();
      const lockRatio = Math.min(1, getCassidyDeadeyeLockRatio(baseDamage));
      const damage = lockRatio >= 1 ? Number.POSITIVE_INFINITY : Math.round(baseDamage * 4 * lockRatio);
      targets.forEach((enemy) => {
        if (!enemy.alive) return;
        options.damageEnemy(refs, enemy, Number.isFinite(damage) ? damage : enemy.hp);
      });
      options.floatText(
        refs,
        lockRatio >= 1 ? "전원 락온 처치!" : `락온 ${Math.round(lockRatio * 100)}% 피해`,
        from.x,
        from.y - 68,
        0xffd166,
      );
    },
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
    showUltimatePulse(refs, options, from.x, from.y, 0x87b7ff, 130);
    slowEnemiesInRadius(refs, from.x, from.y, 170, 0.52);
    damageEnemiesInRadius(refs, options, from.x, from.y, 170, Math.round(baseDamage * 2.4));
    options.floatText(refs, `${label} 원시의 분노! 공격력 240%`, from.x, from.y - 42, 0x87b7ff);
    return true;
  }

  if (hero.heroId === "genji") {
    const targets = liveEnemies(refs).sort((a, b) => b.progress - a.progress).slice(0, 5);
    targets.forEach((enemy) => options.damageEnemy(refs, enemy, Math.round(baseDamage * 2.1)));
    showUltimatePulse(refs, options, from.x, from.y, 0x7dff7a, 122);
    options.floatText(refs, `${label} 용검! 공격력 210%`, from.x, from.y - 42, 0x7dff7a);
    return true;
  }

  if (hero.heroId === "ana") {
    refs.progressBonuses.attackMultiplier *= 1.12;
    showUltimatePulse(refs, options, from.x, from.y, 0x7dffb2, 126);
    options.floatText(refs, `${label} 나노 강화제! 공격력 +12%`, from.x, from.y - 42, 0x7dffb2);
    return true;
  }

  if (hero.heroId === "kiriko") {
    refs.progressBonuses.attackMultiplier *= 1.1;
    showUltimatePulse(refs, options, from.x, from.y, 0xff8ad8, 136);
    options.floatText(refs, `${label} 여우길! 공격력 +10%`, from.x, from.y - 42, 0xff8ad8);
    return true;
  }

  if (hero.heroId === "illari") {
    showUltimatePulse(refs, options, center.x, center.y, 0xfff06a, 140);
    damageEnemiesInRadius(refs, options, center.x, center.y, 150, Math.round(baseDamage * 3));
    options.floatText(refs, `${label} 태양 작렬! 공격력 300%`, center.x, center.y - 42, 0xfff06a);
    return true;
  }

  damageEnemiesInRadius(refs, options, center.x, center.y, 120, Math.round(baseDamage * 2.6));
  options.floatText(refs, `${label} 궁극기! 공격력 260%`, center.x, center.y - 42, colors.yellow);
  return true;
}

export function chargeMythicUltimateFromAttack(refs: GameRefs, hero: BoardHero) {
  return addMythicUltimateCharge(refs, hero, MYTHIC_ULTIMATE_ATTACK_CHARGE);
}

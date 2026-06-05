import { Graphics } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";

type Point = { x: number; y: number };

export type PixiGenjiDashRuntimeOptions = {
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

const GENJI_DASH_MAX_TARGETS = 3;
const GENJI_DASH_DURATION = 260;
const GENJI_DASH_STAGGER = 1000;
const GENJI_RETURN_DURATION = 220;
const GENJI_OFFSET_HOLD_MS = GENJI_DASH_STAGGER + GENJI_RETURN_DURATION + 120;
const GENJI_TRAIL_LENGTH = 76;
const GENJI_GREEN = 0x7dff7a;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - clamp01(progress), 3);
}

function easeInOutCubic(progress: number) {
  const local = clamp01(progress);
  return local < 0.5
    ? 4 * local * local * local
    : 1 - Math.pow(-2 * local + 2, 3) / 2;
}

function pointBetween(from: Point, to: Point, progress: number) {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
  };
}

function distanceBetween(from: Point, to: Point) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function trailStartPoint(from: Point, point: Point) {
  const distance = distanceBetween(from, point);
  if (distance <= GENJI_TRAIL_LENGTH) return from;

  const ratio = (distance - GENJI_TRAIL_LENGTH) / distance;
  return pointBetween(from, point, ratio);
}

function drawShortTrail(fx: Graphics, from: Point, point: Point, local: number, alphaScale = 1) {
  const trailStart = trailStartPoint(from, point);
  const alpha = Math.max(0, 1 - local * 0.42) * alphaScale;

  fx.moveTo(trailStart.x, trailStart.y);
  fx.lineTo(point.x, point.y);
  fx.stroke({ color: GENJI_GREEN, width: 4.5, alpha: 0.3 * alpha });
  fx.moveTo(trailStart.x, trailStart.y);
  fx.lineTo(point.x, point.y);
  fx.stroke({ color: 0xffffff, width: 1.4, alpha: 0.66 * alpha });
}

function lowHpTargets(enemies: ActiveEnemy[]) {
  return enemies
    .filter((enemy) => enemy.alive)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
    .slice(0, GENJI_DASH_MAX_TARGETS);
}

function drawDashSlash(fx: Graphics, point: Point, local: number) {
  const alpha = Math.max(0, 1 - local);
  const radius = 18 + local * 18;
  const startAngle = -1.45 + local * 0.85;

  fx.arc(point.x, point.y, radius, startAngle, startAngle + 1.85);
  fx.stroke({ color: GENJI_GREEN, width: Math.max(1, 7 * alpha), alpha: 0.55 * alpha });
  fx.arc(point.x, point.y, radius * 0.72, startAngle + 0.12, startAngle + 1.54);
  fx.stroke({ color: 0xffffff, width: Math.max(1, 2.4 * alpha), alpha: 0.86 * alpha });
}

function setDashOffset(refs: GameRefs, hero: BoardHero, origin: Point, point: Point) {
  refs.heroSpriteOffsets[hero.instanceId] = {
    x: point.x - origin.x,
    y: point.y - origin.y,
    until: Date.now() + GENJI_OFFSET_HOLD_MS,
  };
}

function setDashDirection(refs: GameRefs, hero: BoardHero, from: Point, to: Point) {
  refs.heroSpriteAttacks[hero.instanceId] = {
    direction: to.x < from.x ? "left" : "right",
    until: Date.now() + GENJI_DASH_DURATION,
  };
}

function spawnDashAnimation(
  refs: GameRefs,
  options: PixiGenjiDashRuntimeOptions,
  hero: BoardHero,
  origin: Point,
  from: Point,
  target: ActiveEnemy,
  damage: number,
  order: number,
) {
  const fx = acquireFxGraphics(refs);
  const targetAtDash = { x: target.x, y: target.y };
  const delay = order * GENJI_DASH_STAGGER;
  const totalDuration = delay + GENJI_DASH_DURATION;
  let hitApplied = false;

  options.addAnimation(refs, {
    duration: totalDuration,
    update: (progress) => {
      const elapsed = progress * totalDuration;
      if (elapsed < delay) return;

      const local = clamp01((elapsed - delay) / GENJI_DASH_DURATION);
      const moveProgress = easeOutCubic(local);
      const point = pointBetween(from, targetAtDash, moveProgress);

      setDashDirection(refs, hero, from, targetAtDash);
      setDashOffset(refs, hero, origin, point);

      fx.clear();
      if (local >= 0.32) drawDashSlash(fx, targetAtDash, clamp01((local - 0.32) / 0.5));
      if (local < 0.86) drawShortTrail(fx, from, point, local);

      if (!hitApplied && local >= 0.46) {
        hitApplied = true;
        if (target.alive) {
          options.damageEnemy(refs, target, damage);
          options.floatText(refs, order === 0 ? "질풍참" : `질풍참 ${order + 1}`, targetAtDash.x, targetAtDash.y - 34, GENJI_GREEN);
        }
      }

      options.drawBoard(refs);
    },
    done: () => {
      releaseFxGraphics(refs, fx);
      options.drawBoard(refs);
    },
  });
}

function spawnReturnAnimation(
  refs: GameRefs,
  options: PixiGenjiDashRuntimeOptions,
  hero: BoardHero,
  origin: Point,
  from: Point,
  delay: number,
) {
  const fx = acquireFxGraphics(refs);
  const totalDuration = delay + GENJI_RETURN_DURATION;

  options.addAnimation(refs, {
    duration: totalDuration,
    update: (progress) => {
      const elapsed = progress * totalDuration;
      if (elapsed < delay) return;

      const local = clamp01((elapsed - delay) / GENJI_RETURN_DURATION);
      const point = pointBetween(from, origin, easeInOutCubic(local));

      setDashDirection(refs, hero, from, origin);
      setDashOffset(refs, hero, origin, point);

      fx.clear();
      if (local < 0.9) drawShortTrail(fx, from, point, local, 0.58);

      options.drawBoard(refs);
    },
    done: () => {
      releaseFxGraphics(refs, fx);
      delete refs.heroSpriteOffsets[hero.instanceId];
      options.drawBoard(refs);
    },
  });
}

export function spawnGenjiDashStrike(
  refs: GameRefs,
  options: PixiGenjiDashRuntimeOptions,
  hero: BoardHero,
  from: Point,
  baseDamage: number,
) {
  const targets = lowHpTargets(refs.activeEnemies);
  if (targets.length === 0) return;

  const dashDamage = Math.max(1, Math.round(baseDamage * 1.08));
  const targetPoints = targets.map((target) => ({ x: target.x, y: target.y }));

  targets.forEach((target, index) => {
    const dashFrom = index === 0 ? from : targetPoints[index - 1];
    spawnDashAnimation(refs, options, hero, from, dashFrom, target, dashDamage, index);
  });

  spawnReturnAnimation(
    refs,
    options,
    hero,
    from,
    targetPoints[targetPoints.length - 1],
    targets.length * GENJI_DASH_STAGGER,
  );
}

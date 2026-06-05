import { Graphics } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";

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
const GENJI_DASH_STAGGER = 118;
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

function easeInCubic(progress: number) {
  const local = clamp01(progress);
  return local * local * local;
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

function setDashOffset(refs: GameRefs, hero: BoardHero, from: Point, point: Point) {
  refs.heroSpriteOffsets[hero.instanceId] = {
    x: point.x - from.x,
    y: point.y - from.y,
    until: Date.now() + 90,
  };
}

function spawnDashAnimation(
  refs: GameRefs,
  options: PixiGenjiDashRuntimeOptions,
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
      setDashOffset(refs, hero, from, point);

      fx.clear();
      if (local >= 0.32) drawDashSlash(fx, targetAtDash, clamp01((local - 0.32) / 0.5));
      if (local < 0.72) {
        fx.moveTo(from.x, from.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color: GENJI_GREEN, width: 4.5, alpha: 0.28 * (1 - local * 0.45) });
        fx.moveTo(from.x, from.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color: 0xffffff, width: 1.4, alpha: 0.62 * (1 - local * 0.5) });
      }

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
      fx.destroy();
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
  targets.forEach((target, index) => spawnDashAnimation(refs, options, hero, from, target, dashDamage, index));
}

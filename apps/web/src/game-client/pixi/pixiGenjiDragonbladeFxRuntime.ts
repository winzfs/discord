import { Graphics } from "pixi.js";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";

type Point = { x: number; y: number };

export type PixiGenjiDragonbladeFxOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
};

const DRAGONBLADE_GREEN = 0x7dff7a;
const DRAGONBLADE_DURATION = 640;
const MAX_DRAGONBLADE_FX_TARGETS = 4;
const SLASH_DELAY = 0.13;
const SLASH_WINDOW = 0.3;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function drawSeparatedArc(graphics: Graphics, center: Point, radius: number, startAngle: number, endAngle: number, color: number, width: number, alpha: number) {
  const start = {
    x: center.x + Math.cos(startAngle) * radius,
    y: center.y + Math.sin(startAngle) * radius,
  };

  graphics.moveTo(start.x, start.y);
  graphics.arc(center.x, center.y, radius, startAngle, endAngle);
  graphics.stroke({ color, width, alpha });
}

function drawBladeSweep(graphics: Graphics, center: Point, local: number, angleOffset: number, radius: number) {
  const alpha = Math.max(0, 1 - local * 0.78);
  const startAngle = -2.35 + local * 0.82 + angleOffset;
  const endAngle = startAngle + 1.85;

  drawSeparatedArc(graphics, center, radius, startAngle, endAngle, DRAGONBLADE_GREEN, 12 * alpha, 0.28 * alpha);
  drawSeparatedArc(graphics, center, radius * 0.68, startAngle + 0.14, endAngle - 0.24, 0xffffff, 2.6 * alpha, 0.9 * alpha);
}

function drawBladeCutLine(graphics: Graphics, center: Point, local: number, angle: number, length: number) {
  const alpha = Math.max(0, 1 - local * 0.86);
  const half = length * (0.5 + local * 0.42) * 0.5;
  const start = {
    x: center.x - Math.cos(angle) * half,
    y: center.y - Math.sin(angle) * half,
  };
  const end = {
    x: center.x + Math.cos(angle) * half,
    y: center.y + Math.sin(angle) * half,
  };

  graphics.moveTo(start.x, start.y);
  graphics.lineTo(end.x, end.y);
  graphics.stroke({ color: 0xffffff, width: Math.max(1, 3 * alpha), alpha: 0.78 * alpha });
}

function drawBladeSpark(graphics: Graphics, center: Point, local: number, angleOffset: number) {
  const alpha = Math.max(0, 1 - local);
  const baseAngle = -0.5 + angleOffset;

  for (let index = 0; index < 3; index += 1) {
    const angle = baseAngle + index * 0.62;
    const inner = 6 + local * 6;
    const outer = 18 + local * (18 + index * 4);
    graphics.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
    graphics.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
    graphics.stroke({ color: index % 2 === 0 ? DRAGONBLADE_GREEN : 0xffffff, width: index % 2 === 0 ? 1.7 : 1, alpha: 0.42 * alpha });
  }
}

function drawUnsheatheAura(graphics: Graphics, center: Point, progress: number) {
  const local = clamp01(progress / 0.2);
  const alpha = Math.max(0, 1 - local);
  if (alpha <= 0) return;

  graphics.circle(center.x, center.y, 18 + local * 34);
  graphics.stroke({ color: DRAGONBLADE_GREEN, width: 3.5 * alpha, alpha: 0.26 * alpha });
}

function drawEnemyBladeHit(graphics: Graphics, target: Point, local: number, index: number) {
  const mainAngle = index % 2 === 0 ? -0.7 : 0.78;
  const sweepOffset = index % 2 === 0 ? -0.18 : 1.18;

  drawBladeCutLine(graphics, target, local, mainAngle, 86);
  drawBladeSweep(graphics, target, local, sweepOffset, 42 + (index % 2) * 6);
  if (local < 0.68) drawBladeSpark(graphics, target, local, sweepOffset);
}

export function spawnGenjiDragonbladeFx(
  refs: GameRefs,
  options: PixiGenjiDragonbladeFxOptions,
  from: Point,
  targets: ActiveEnemy[],
  onDone: () => void,
) {
  const fx = acquireFxGraphics(refs);
  const targetSnapshots = targets.slice(0, MAX_DRAGONBLADE_FX_TARGETS).map((enemy) => ({ x: enemy.x, y: enemy.y }));

  options.addAnimation(refs, {
    duration: DRAGONBLADE_DURATION,
    update: (progress) => {
      fx.clear();
      drawUnsheatheAura(fx, from, progress);

      targetSnapshots.forEach((target, index) => {
        const slashStart = index * SLASH_DELAY;
        const local = clamp01((progress - slashStart) / SLASH_WINDOW);
        if (local <= 0 || local >= 1) return;

        drawEnemyBladeHit(fx, target, local, index);
      });
    },
    done: () => {
      releaseFxGraphics(refs, fx);
      onDone();
    },
  });
}

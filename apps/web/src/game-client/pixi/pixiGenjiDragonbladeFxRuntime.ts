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
const DRAGONBLADE_DURATION = 880;
const SLASH_DELAY = 0.12;
const SLASH_WINDOW = 0.36;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function pointAt(from: Point, to: Point, progress: number) {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
  };
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - clamp01(progress), 3);
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
  const alpha = Math.max(0, 1 - local * 0.72);
  const sweep = 1.9;
  const startAngle = -2.45 + local * 1.05 + angleOffset;
  const endAngle = startAngle + sweep;

  drawSeparatedArc(graphics, center, radius, startAngle, endAngle, DRAGONBLADE_GREEN, 16 * alpha, 0.2 * alpha);
  drawSeparatedArc(graphics, center, radius * 0.84, startAngle + 0.08, endAngle - 0.12, DRAGONBLADE_GREEN, 9 * alpha, 0.46 * alpha);
  drawSeparatedArc(graphics, center, radius * 0.68, startAngle + 0.16, endAngle - 0.24, 0xffffff, 3.2 * alpha, 0.9 * alpha);
}

function drawBladeSpark(graphics: Graphics, center: Point, local: number, angleOffset: number) {
  const alpha = Math.max(0, 1 - local);
  const baseAngle = -0.6 + angleOffset;

  for (let index = 0; index < 6; index += 1) {
    const angle = baseAngle + index * 0.42;
    const inner = 8 + local * 10;
    const outer = 24 + local * (28 + index * 3);
    graphics.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
    graphics.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
    graphics.stroke({ color: index % 2 === 0 ? DRAGONBLADE_GREEN : 0xffffff, width: index % 2 === 0 ? 2.2 : 1.1, alpha: 0.62 * alpha });
  }
}

function drawDashAfterimage(graphics: Graphics, from: Point, to: Point, local: number) {
  const head = easeOutCubic(local);
  const tail = Math.max(0, head - 0.12);
  const headPoint = pointAt(from, to, head);
  const tailPoint = pointAt(from, to, tail);
  const alpha = Math.max(0, 1 - local * 0.6);

  graphics.moveTo(tailPoint.x, tailPoint.y);
  graphics.lineTo(headPoint.x, headPoint.y);
  graphics.stroke({ color: DRAGONBLADE_GREEN, width: 8, alpha: 0.14 * alpha });
  graphics.moveTo(tailPoint.x, tailPoint.y);
  graphics.lineTo(headPoint.x, headPoint.y);
  graphics.stroke({ color: 0xffffff, width: 1.8, alpha: 0.48 * alpha });
}

function drawUnsheatheAura(graphics: Graphics, center: Point, progress: number) {
  const local = clamp01(progress / 0.28);
  const alpha = Math.max(0, 1 - local);

  graphics.circle(center.x, center.y, 22 + local * 42);
  graphics.stroke({ color: DRAGONBLADE_GREEN, width: 5 * alpha, alpha: 0.36 * alpha });
  graphics.circle(center.x, center.y, 10 + local * 18);
  graphics.fill({ color: 0xffffff, alpha: 0.14 * alpha });
}

export function spawnGenjiDragonbladeFx(
  refs: GameRefs,
  options: PixiGenjiDragonbladeFxOptions,
  from: Point,
  targets: ActiveEnemy[],
  onDone: () => void,
) {
  const fx = acquireFxGraphics(refs);
  const targetSnapshots = targets.map((enemy) => ({ x: enemy.x, y: enemy.y }));

  options.addAnimation(refs, {
    duration: DRAGONBLADE_DURATION,
    update: (progress) => {
      fx.clear();
      drawUnsheatheAura(fx, from, progress);

      targetSnapshots.forEach((target, index) => {
        const slashStart = index * SLASH_DELAY;
        const local = clamp01((progress - slashStart) / SLASH_WINDOW);
        if (local <= 0 || local >= 1) return;

        const previous = index === 0 ? from : targetSnapshots[index - 1];
        drawDashAfterimage(fx, previous, target, local);
        drawBladeSweep(fx, target, local, index % 2 === 0 ? -0.22 : 1.15, 48 + (index % 2) * 8);
        drawBladeSpark(fx, target, local, index % 2 === 0 ? -0.2 : 1.1);
      });
    },
    done: () => {
      releaseFxGraphics(refs, fx);
      onDone();
    },
  });
}

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
const DRAGONBLADE_DURATION = 760;
const SLASH_DELAY = 0.11;
const SLASH_WINDOW = 0.34;

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
  const alpha = Math.max(0, 1 - local * 0.72);
  const sweep = 1.95;
  const startAngle = -2.4 + local * 0.9 + angleOffset;
  const endAngle = startAngle + sweep;

  drawSeparatedArc(graphics, center, radius, startAngle, endAngle, DRAGONBLADE_GREEN, 18 * alpha, 0.22 * alpha);
  drawSeparatedArc(graphics, center, radius * 0.82, startAngle + 0.08, endAngle - 0.12, DRAGONBLADE_GREEN, 10 * alpha, 0.52 * alpha);
  drawSeparatedArc(graphics, center, radius * 0.66, startAngle + 0.16, endAngle - 0.24, 0xffffff, 3.4 * alpha, 0.95 * alpha);
}

function drawBladeCutLine(graphics: Graphics, center: Point, local: number, angle: number, length: number) {
  const alpha = Math.max(0, 1 - local * 0.82);
  const grow = 0.48 + local * 0.52;
  const half = length * grow * 0.5;
  const normal = angle + Math.PI / 2;
  const offset = Math.sin(local * Math.PI) * 7;
  const start = {
    x: center.x - Math.cos(angle) * half + Math.cos(normal) * offset,
    y: center.y - Math.sin(angle) * half + Math.sin(normal) * offset,
  };
  const end = {
    x: center.x + Math.cos(angle) * half + Math.cos(normal) * offset,
    y: center.y + Math.sin(angle) * half + Math.sin(normal) * offset,
  };

  graphics.moveTo(start.x, start.y);
  graphics.lineTo(end.x, end.y);
  graphics.stroke({ color: DRAGONBLADE_GREEN, width: 12 * alpha, alpha: 0.16 * alpha });
  graphics.moveTo(start.x, start.y);
  graphics.lineTo(end.x, end.y);
  graphics.stroke({ color: 0xffffff, width: Math.max(1, 3 * alpha), alpha: 0.82 * alpha });
}

function drawBladeSpark(graphics: Graphics, center: Point, local: number, angleOffset: number) {
  const alpha = Math.max(0, 1 - local);
  const baseAngle = -0.6 + angleOffset;

  for (let index = 0; index < 5; index += 1) {
    const angle = baseAngle + index * 0.46;
    const inner = 6 + local * 8;
    const outer = 18 + local * (24 + index * 3);
    graphics.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
    graphics.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
    graphics.stroke({ color: index % 2 === 0 ? DRAGONBLADE_GREEN : 0xffffff, width: index % 2 === 0 ? 2 : 1, alpha: 0.54 * alpha });
  }
}

function drawUnsheatheAura(graphics: Graphics, center: Point, progress: number) {
  const local = clamp01(progress / 0.24);
  const alpha = Math.max(0, 1 - local);

  graphics.circle(center.x, center.y, 20 + local * 40);
  graphics.stroke({ color: DRAGONBLADE_GREEN, width: 5 * alpha, alpha: 0.34 * alpha });
  graphics.circle(center.x, center.y, 9 + local * 17);
  graphics.fill({ color: 0xffffff, alpha: 0.12 * alpha });
}

function drawEnemyBladeHit(graphics: Graphics, target: Point, local: number, index: number) {
  const mainAngle = index % 2 === 0 ? -0.7 : 0.78;
  const crossAngle = mainAngle + Math.PI * 0.58;
  const sweepOffset = index % 2 === 0 ? -0.18 : 1.18;

  drawBladeCutLine(graphics, target, local, mainAngle, 92);
  if (local > 0.16) drawBladeCutLine(graphics, target, clamp01((local - 0.16) / 0.84), crossAngle, 64);
  drawBladeSweep(graphics, target, local, sweepOffset, 44 + (index % 2) * 7);
  drawBladeSpark(graphics, target, local, sweepOffset);
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

        drawEnemyBladeHit(fx, target, local, index);
      });
    },
    done: () => {
      releaseFxGraphics(refs, fx);
      onDone();
    },
  });
}

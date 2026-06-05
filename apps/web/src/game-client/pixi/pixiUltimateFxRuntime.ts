import { Graphics } from "pixi.js";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";

export type PixiUltimateFxOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
};

type Point = { x: number; y: number };

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function pointAt(from: Point, to: Point, progress: number) {
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress) };
}

function drawLine(graphics: Graphics, from: Point, to: Point, color: number, alpha: number, width: number) {
  graphics.moveTo(from.x, from.y);
  graphics.lineTo(to.x, to.y);
  graphics.stroke({ color, width, alpha });
}

function drawRing(graphics: Graphics, point: Point, radius: number, color: number, alpha: number, width = 4) {
  graphics.circle(point.x, point.y, radius);
  graphics.stroke({ color, width, alpha });
}

function drawBurst(graphics: Graphics, point: Point, color: number, progress: number, radius: number, count = 14) {
  const local = clamp01(progress);
  const alpha = 1 - local;
  if (alpha <= 0) return;

  drawRing(graphics, point, radius * (0.2 + local * 1.05), color, 0.6 * alpha, 7 * alpha);
  drawRing(graphics, point, radius * (0.08 + local * 0.62), 0xffffff, 0.42 * alpha, 2.5 * alpha);

  for (let index = 0; index < count; index += 1) {
    const angle = index * ((Math.PI * 2) / count) + local * 1.8;
    const inner = radius * (0.08 + local * 0.18);
    const outer = radius * (0.42 + local * (0.42 + (index % 4) * 0.06));
    graphics.moveTo(point.x + Math.cos(angle) * inner, point.y + Math.sin(angle) * inner);
    graphics.lineTo(point.x + Math.cos(angle) * outer, point.y + Math.sin(angle) * outer);
    graphics.stroke({ color, width: 2.5 * alpha, alpha: 0.65 * alpha });
  }
}

function drawEnergyCore(graphics: Graphics, point: Point, color: number, progress: number, radius: number) {
  const pulse = 0.78 + Math.sin(progress * Math.PI * 12) * 0.16;
  graphics.circle(point.x, point.y, radius * 1.8 * pulse);
  graphics.fill({ color, alpha: 0.08 });
  graphics.circle(point.x, point.y, radius * 0.9 * pulse);
  graphics.fill({ color, alpha: 0.24 });
  graphics.circle(point.x, point.y, radius * 0.34 * pulse);
  graphics.fill({ color: 0xffffff, alpha: 0.78 });
}

function drawLightning(graphics: Graphics, from: Point, to: Point, color: number, progress: number, width = 4) {
  const segments = 6;
  const phase = progress * 8;
  graphics.moveTo(from.x, from.y);
  for (let index = 1; index <= segments; index += 1) {
    const t = index / segments;
    const base = pointAt(from, to, t);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const jitter = Math.sin((index * 2.3 + phase) * Math.PI) * 9 * (1 - Math.abs(0.5 - t));
    graphics.lineTo(base.x + normalX * jitter, base.y + normalY * jitter);
  }
  graphics.stroke({ color, width: width * 2.2, alpha: 0.18 });
  graphics.moveTo(from.x, from.y);
  for (let index = 1; index <= segments; index += 1) {
    const t = index / segments;
    const base = pointAt(from, to, t);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const jitter = Math.sin((index * 2.3 + phase) * Math.PI) * 5 * (1 - Math.abs(0.5 - t));
    graphics.lineTo(base.x + normalX * jitter, base.y + normalY * jitter);
  }
  graphics.stroke({ color: 0xffffff, width: Math.max(1, width * 0.42), alpha: 0.86 });
}

function drawSlash(graphics: Graphics, center: Point, color: number, progress: number, radius: number, offset: number) {
  const local = clamp01(progress);
  const alpha = 1 - local * 0.45;
  const angle = -1.45 + local * 2.5 + offset;
  graphics.arc(center.x, center.y, radius, angle, angle + 1.45);
  graphics.stroke({ color, width: 13 * (1 - local * 0.38), alpha: 0.24 * alpha });
  graphics.arc(center.x, center.y, radius * 0.78, angle + 0.08, angle + 1.28);
  graphics.stroke({ color, width: 6 * (1 - local * 0.24), alpha: 0.52 * alpha });
  graphics.arc(center.x, center.y, radius * 0.56, angle + 0.14, angle + 1.04);
  graphics.stroke({ color: 0xffffff, width: 2.2, alpha: 0.9 * alpha });
}

export function spawnDvaSelfDestructFx(refs: GameRefs, options: PixiUltimateFxOptions, center: Point, radius: number) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration: 820,
    update: (progress) => {
      fx.clear();
      const blast = clamp01(progress / 0.72);
      const fade = 1 - progress;
      drawBurst(fx, center, 0xff78d8, blast, radius, 22);
      drawBurst(fx, center, 0x7ee8ff, clamp01((progress - 0.08) / 0.7), radius * 0.72, 16);
      fx.circle(center.x, center.y, radius * (0.12 + blast * 0.34));
      fx.fill({ color: 0xffffff, alpha: 0.38 * fade });
      fx.circle(center.x, center.y, radius * (0.22 + blast * 0.48));
      fx.fill({ color: 0xff78d8, alpha: 0.1 * fade });
    },
    done: () => fx.destroy(),
  });
}

export function spawnZaryaGravitonFx(
  refs: GameRefs,
  options: PixiUltimateFxOptions,
  center: Point,
  radius: number,
  pullRadius: number,
  duration: number,
  onFrame: (progress: number) => void,
  onDone: () => void,
) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      fx.clear();
      onFrame(progress);
      drawEnergyCore(fx, center, 0xff7de9, progress, 18);
      for (let index = 0; index < 4; index += 1) {
        const ringProgress = (progress * 2.2 + index * 0.25) % 1;
        drawRing(fx, center, radius * (0.45 + ringProgress * 0.8), 0xff7de9, 0.48 * (1 - ringProgress), 5 * (1 - ringProgress));
      }
      for (let index = 0; index < 18; index += 1) {
        const angle = index * ((Math.PI * 2) / 18) - progress * Math.PI * 4;
        const outer = pullRadius * (0.58 + (index % 3) * 0.08);
        const inner = radius * (0.28 + (index % 4) * 0.04);
        fx.moveTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
        fx.lineTo(center.x + Math.cos(angle + 0.75) * inner, center.y + Math.sin(angle + 0.75) * inner);
        fx.stroke({ color: index % 2 === 0 ? 0xff7de9 : 0xffffff, width: index % 2 === 0 ? 2.5 : 1.2, alpha: index % 2 === 0 ? 0.26 : 0.42 });
      }
    },
    done: () => {
      fx.destroy();
      onDone();
    },
  });
}

export function spawnTracerPulseBombFx(
  refs: GameRefs,
  options: PixiUltimateFxOptions,
  target: ActiveEnemy,
  radius: number,
  onExplode: (x: number, y: number) => void,
) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration: 520,
    update: (progress) => {
      fx.clear();
      if (!target.alive) return;
      const center = { x: target.x, y: target.y - 10 };
      drawEnergyCore(fx, center, 0xffc857, progress, 9 + progress * 8);
      drawRing(fx, center, 17 + Math.sin(progress * Math.PI * 12) * 3, 0xffffff, 0.78, 2.2);
      drawRing(fx, center, radius * (0.18 + progress * 0.22), 0xffc857, 0.16 + progress * 0.2, 2);
    },
    done: () => {
      const x = target.x;
      const y = target.y;
      fx.destroy();
      const explosion = new Graphics();
      refs.effects.addChild(explosion);
      options.addAnimation(refs, {
        duration: 520,
        update: (progress) => {
          explosion.clear();
          drawBurst(explosion, { x, y }, 0xffc857, progress, radius, 18);
          drawBurst(explosion, { x, y }, 0xffffff, clamp01(progress * 1.25), radius * 0.5, 10);
        },
        done: () => explosion.destroy(),
      });
      onExplode(x, y);
    },
  });
}

export function spawnCassidyDeadeyeFx(
  refs: GameRefs,
  options: PixiUltimateFxOptions,
  from: Point,
  targets: ActiveEnemy[],
  duration: number,
  getLockRatio: (progress: number) => number,
  onDone: () => void,
) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      fx.clear();
      drawEnergyCore(fx, from, 0xffd166, progress, 18);
      targets.forEach((enemy, index) => {
        if (!enemy.alive) return;
        const lockRatio = getLockRatio(progress);
        const color = lockRatio >= 1 ? 0xfff06a : 0xffd166;
        drawLine(fx, from, enemy, color, 0.1 + lockRatio * 0.32, 1.8);
        drawRing(fx, enemy, 12 + lockRatio * 22, color, 0.38 + lockRatio * 0.4, 3.4);
        drawRing(fx, enemy, 6 + lockRatio * 9, 0xffffff, 0.18 + lockRatio * 0.48, 1.6);
        const tick = (progress * 5 + index * 0.17) % 1;
        drawRing(fx, enemy, 28 + tick * 16, color, 0.18 * (1 - tick), 2.2 * (1 - tick));
      });
    },
    done: () => {
      fx.destroy();
      onDone();
    },
  });
}

export function spawnWinstonPrimalRageFx(refs: GameRefs, options: PixiUltimateFxOptions, center: Point, radius: number) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration: 620,
    update: (progress) => {
      fx.clear();
      drawBurst(fx, center, 0x87b7ff, progress, radius, 16);
      for (let index = 0; index < 9; index += 1) {
        const angle = index * ((Math.PI * 2) / 9) + progress * 1.2;
        const end = { x: center.x + Math.cos(angle) * radius * (0.34 + progress * 0.55), y: center.y + Math.sin(angle) * radius * (0.34 + progress * 0.55) };
        drawLightning(fx, center, end, 0x87b7ff, progress + index * 0.1, 3.2);
      }
    },
    done: () => fx.destroy(),
  });
}

export function spawnGenjiDragonbladeFx(refs: GameRefs, options: PixiUltimateFxOptions, from: Point, targets: ActiveEnemy[], onDone: () => void) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration: 620,
    update: (progress) => {
      fx.clear();
      drawEnergyCore(fx, from, 0x7dff7a, progress, 12);
      targets.forEach((enemy, index) => {
        if (!enemy.alive) return;
        const local = clamp01((progress - index * 0.08) / 0.72);
        if (local <= 0 || local >= 1) return;
        const slashPoint = pointAt(from, enemy, Math.min(1, local * 1.6));
        drawLine(fx, from, enemy, 0x7dff7a, 0.12 * (1 - local), 5);
        drawSlash(fx, slashPoint, 0x7dff7a, local, 42, index * 0.45);
      });
    },
    done: () => {
      fx.destroy();
      onDone();
    },
  });
}

export function spawnAnaNanoBoostFx(refs: GameRefs, options: PixiUltimateFxOptions, center: Point) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration: 720,
    update: (progress) => {
      fx.clear();
      drawBurst(fx, center, 0x7dffb2, progress, 120, 14);
      drawEnergyCore(fx, center, 0x7dffb2, progress, 18);
      for (let index = 0; index < 8; index += 1) {
        const angle = index * ((Math.PI * 2) / 8) - progress * Math.PI * 2;
        const p = { x: center.x + Math.cos(angle) * 48, y: center.y + Math.sin(angle) * 48 };
        drawRing(fx, p, 7 + progress * 8, 0x7dffb2, 0.28 * (1 - progress), 2);
      }
    },
    done: () => fx.destroy(),
  });
}

export function spawnKirikoKitsuneRushFx(refs: GameRefs, options: PixiUltimateFxOptions, center: Point) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration: 1200,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.38;
      for (let index = 0; index < 5; index += 1) {
        const y = center.y + (index - 2) * 18;
        fx.moveTo(center.x - 140, y);
        fx.lineTo(center.x + 140, y + Math.sin(progress * Math.PI * 4 + index) * 8);
        fx.stroke({ color: index % 2 === 0 ? 0xff8ad8 : 0xffffff, width: index % 2 === 0 ? 5 : 1.6, alpha: (index % 2 === 0 ? 0.24 : 0.52) * alpha });
      }
      drawEnergyCore(fx, center, 0xff8ad8, progress, 16);
      drawBurst(fx, center, 0xff8ad8, clamp01(progress * 0.8), 132, 12);
    },
    done: () => fx.destroy(),
  });
}

export function spawnIllariCaptiveSunFx(refs: GameRefs, options: PixiUltimateFxOptions, center: Point, radius: number, onDone: () => void) {
  const fx = new Graphics();
  refs.effects.addChild(fx);
  options.addAnimation(refs, {
    duration: 720,
    update: (progress) => {
      fx.clear();
      drawEnergyCore(fx, center, 0xfff06a, progress, 26 + progress * 8);
      for (let index = 0; index < 16; index += 1) {
        const angle = index * ((Math.PI * 2) / 16) + progress * Math.PI;
        const end = { x: center.x + Math.cos(angle) * radius * (0.3 + progress * 0.62), y: center.y + Math.sin(angle) * radius * (0.3 + progress * 0.62) };
        drawLine(fx, center, end, index % 2 === 0 ? 0xfff06a : 0xffffff, 0.18 + 0.16 * (1 - progress), index % 2 === 0 ? 4 : 1.8);
      }
      if (progress > 0.42) drawBurst(fx, center, 0xfff06a, (progress - 0.42) / 0.58, radius, 20);
    },
    done: () => {
      fx.destroy();
      onDone();
    },
  });
}

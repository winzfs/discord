import { Graphics } from "pixi.js";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";

export type PixiHeroAttackFxOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  applyDamage: (enemy: ActiveEnemy, damage: number) => void;
  floatText: (value: string, x: number, y: number, color: number) => void;
};

type Point = { x: number; y: number };

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function drawTrail(graphics: Graphics, from: Point, to: Point, color: number, alpha: number, width: number) {
  graphics.moveTo(from.x, from.y);
  graphics.lineTo(to.x, to.y);
  graphics.stroke({ color, width, alpha });
}

function drawShortTracer(graphics: Graphics, from: Point, to: Point, progress: number, color: number, alpha: number, width: number, tail = 0.18) {
  const head = easeOutCubic(progress);
  const startT = Math.max(0, head - tail);
  const headPoint = { x: lerp(from.x, to.x, head), y: lerp(from.y, to.y, head) };
  const tailPoint = { x: lerp(from.x, to.x, startT), y: lerp(from.y, to.y, startT) };
  drawTrail(graphics, tailPoint, headPoint, color, alpha, width);
}

function drawImpactBurst(graphics: Graphics, point: Point, color: number, progress: number, size = 18, sparks = 7) {
  const local = Math.max(0, Math.min(1, progress));
  const alpha = Math.max(0, 1 - local);
  const radius = size * (0.22 + local * 0.92);

  graphics.circle(point.x, point.y, radius);
  graphics.stroke({ color, width: Math.max(1, 4 * alpha), alpha: 0.58 * alpha });
  graphics.circle(point.x, point.y, radius * 0.3);
  graphics.fill({ color: 0xffffff, alpha: 0.5 * alpha });

  for (let index = 0; index < sparks; index += 1) {
    const angle = index * ((Math.PI * 2) / sparks) + local * 1.8;
    const inner = radius * 0.25;
    const outer = radius * (0.65 + (index % 3) * 0.13);
    graphics.moveTo(point.x + Math.cos(angle) * inner, point.y + Math.sin(angle) * inner);
    graphics.lineTo(point.x + Math.cos(angle) * outer, point.y + Math.sin(angle) * outer);
    graphics.stroke({ color, width: 1.7, alpha: 0.62 * alpha });
  }
}

function drawMuzzleFlash(graphics: Graphics, point: Point, angle: number, progress: number, color: number, size = 18) {
  const alpha = Math.max(0, 1 - progress * 1.6);
  const length = size * alpha;
  graphics.moveTo(point.x + Math.cos(angle) * length, point.y + Math.sin(angle) * length);
  graphics.lineTo(point.x + Math.cos(angle + 2.35) * length * 0.45, point.y + Math.sin(angle + 2.35) * length * 0.45);
  graphics.lineTo(point.x + Math.cos(angle + Math.PI) * length * 0.28, point.y + Math.sin(angle + Math.PI) * length * 0.28);
  graphics.lineTo(point.x + Math.cos(angle - 2.35) * length * 0.45, point.y + Math.sin(angle - 2.35) * length * 0.45);
  graphics.fill({ color, alpha: 0.68 * alpha });
  graphics.circle(point.x, point.y, size * 0.24 * alpha);
  graphics.fill({ color: 0xffffff, alpha: 0.62 * alpha });
}

function drawSlash(graphics: Graphics, center: Point, progress: number, color: number, radius = 34) {
  const angle = -0.9 + progress * 1.8;
  const alpha = 0.85 * (1 - progress * 0.35);
  graphics.arc(center.x, center.y, radius, angle, angle + 1.15);
  graphics.stroke({ color, width: 7 * (1 - progress * 0.45), alpha: alpha * 0.35 });
  graphics.arc(center.x, center.y, radius * 0.72, angle + 0.08, angle + 1.02);
  graphics.stroke({ color: 0xffffff, width: 2.4, alpha });
}

function spawnDvaFusionCannons(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = new Graphics();
  const targetAtFire = { x: target.x, y: target.y };
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 185,
    update: (progress) => {
      const alpha = 1 - progress * 0.35;
      const angle = Math.atan2(targetAtFire.y - from.y, targetAtFire.x - from.x);
      fx.clear();
      drawMuzzleFlash(fx, from, angle, progress, 0xff9be5, 18);

      const pellets = [-2, -1, 0, 1, 2, 3];
      pellets.forEach((offset, index) => {
        const fireDelay = index * 0.045;
        const local = Math.max(0, Math.min(1, (progress - fireDelay) / 0.55));
        if (local <= 0 || local >= 1) return;

        const spreadX = (offset - 0.5) * 9;
        const spreadY = (Math.abs(offset) % 2 === 0 ? -1 : 1) * (5 + index);
        const end = { x: targetAtFire.x + spreadX, y: targetAtFire.y + spreadY };
        const color = index % 2 === 0 ? 0xff78d8 : 0x7ee8ff;

        drawShortTracer(fx, from, end, local, color, 0.52 * alpha, index % 2 === 0 ? 3.4 : 2.8, 0.16);
        const head = easeOutCubic(local);
        const point = { x: lerp(from.x, end.x, head), y: lerp(from.y, end.y, head) };
        fx.circle(point.x, point.y, 2.4);
        fx.fill({ color: 0xffffff, alpha: 0.82 * alpha });
      });

      if (progress > 0.48) {
        drawImpactBurst(fx, targetAtFire, 0xff78d8, (progress - 0.48) / 0.52, 20, 8);
      }
    },
    done: () => {
      fx.destroy();
      options.applyDamage(target, damage);
      options.floatText(`${damage}`, target.x, target.y - 18, 0xff78d8);
    },
  });
}

function spawnTracerPulsePistols(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = new Graphics();
  const targetAtFire = { x: target.x, y: target.y };
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 220,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.15;
      const shots = [0, 0.16, 0.32, 0.48];
      shots.forEach((delay, index) => {
        const local = Math.max(0, Math.min(1, (progress - delay) / 0.52));
        if (local <= 0 || local >= 1) return;
        const side = index % 2 === 0 ? -1 : 1;
        const start = { x: from.x + side * 7, y: from.y - 3 };
        const end = { x: targetAtFire.x + side * 5, y: targetAtFire.y + side * 2 };
        const point = { x: lerp(start.x, end.x, easeOutCubic(local)), y: lerp(start.y, end.y, easeOutCubic(local)) };
        drawShortTracer(fx, start, end, local, 0xffd166, 0.5 * alpha, 3, 0.17);
        fx.circle(point.x, point.y, 3.6);
        fx.fill({ color: 0xffffff, alpha });
      });
    },
    done: () => {
      fx.destroy();
      options.applyDamage(target, damage);
      options.floatText(`${damage}`, target.x, target.y - 18, 0xffc857);
    },
  });
}

function spawnCassidyPeacekeeper(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = new Graphics();
  const targetAtFire = { x: target.x, y: target.y };
  const angle = Math.atan2(targetAtFire.y - from.y, targetAtFire.x - from.x);
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 210,
    update: (progress) => {
      fx.clear();
      drawMuzzleFlash(fx, from, angle, progress, 0xffc04d, 25);
      drawShortTracer(fx, from, targetAtFire, progress, 0xd8c08a, 0.52 * (1 - progress * 0.25), 3.2, 0.13);
      drawShortTracer(fx, from, targetAtFire, progress, 0xffffff, 0.86 * (1 - progress * 0.15), 1.4, 0.08);

      const bulletT = easeOutCubic(progress);
      const bullet = { x: lerp(from.x, targetAtFire.x, bulletT), y: lerp(from.y, targetAtFire.y, bulletT) };
      fx.circle(bullet.x, bullet.y, 3.8);
      fx.fill({ color: 0xffe0a0, alpha: 0.95 });

      if (progress > 0.62) {
        drawImpactBurst(fx, targetAtFire, 0xffd166, (progress - 0.62) / 0.38, 24, 9);
      }
    },
    done: () => {
      fx.destroy();
      options.applyDamage(target, damage);
      options.floatText(`${damage}`, target.x, target.y - 18, 0xffd166);
    },
  });
}

function spawnGenjiShuriken(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = new Graphics();
  const targetAtFire = { x: target.x, y: target.y };
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 240,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.16;
      [-1, 0, 1].forEach((offset) => {
        const end = { x: targetAtFire.x + offset * 9, y: targetAtFire.y - Math.abs(offset) * 4 };
        const point = { x: lerp(from.x, end.x, easeOutCubic(progress)), y: lerp(from.y, end.y, easeOutCubic(progress)) };
        drawShortTracer(fx, from, end, progress, 0x7dff7a, 0.3 * alpha, 4, 0.18);
        drawSlash(fx, point, progress, 0x7dff7a, 12 + Math.abs(offset) * 2);
      });
      if (progress > 0.62) drawImpactBurst(fx, targetAtFire, 0x7dff7a, (progress - 0.62) / 0.38, 18, 6);
    },
    done: () => {
      fx.destroy();
      options.applyDamage(target, damage);
      options.floatText(`${damage}`, target.x, target.y - 18, 0x7dff7a);
    },
  });
}

function spawnAnaBioticShot(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = new Graphics();
  const targetAtFire = { x: target.x, y: target.y };
  const angle = Math.atan2(targetAtFire.y - from.y, targetAtFire.x - from.x);
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 170,
    update: (progress) => {
      fx.clear();
      drawMuzzleFlash(fx, from, angle, progress, 0x7dffb2, 16);
      drawShortTracer(fx, from, targetAtFire, progress, 0x7dffb2, 0.44 * (1 - progress * 0.18), 3.4, 0.1);
      drawShortTracer(fx, from, targetAtFire, progress, 0xffffff, 0.78 * (1 - progress * 0.12), 1.2, 0.06);
      if (progress > 0.56) drawImpactBurst(fx, targetAtFire, 0x7dffb2, (progress - 0.56) / 0.44, 16, 6);
    },
    done: () => {
      fx.destroy();
      options.applyDamage(target, damage);
      options.floatText(`${damage}`, target.x, target.y - 18, 0x7dffb2);
    },
  });
}

function spawnKirikoKunai(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = new Graphics();
  const targetAtFire = { x: target.x, y: target.y };
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 235,
    update: (progress) => {
      fx.clear();
      const arc = Math.sin(progress * Math.PI) * -18;
      const eased = easeOutCubic(progress);
      const point = { x: lerp(from.x, targetAtFire.x, eased), y: lerp(from.y, targetAtFire.y, eased) + arc };
      drawShortTracer(fx, from, targetAtFire, progress, 0xff8ad8, 0.28, 4, 0.17);
      fx.moveTo(point.x, point.y - 7);
      fx.lineTo(point.x + 8, point.y);
      fx.lineTo(point.x, point.y + 7);
      fx.lineTo(point.x - 3, point.y);
      fx.fill({ color: 0xffffff, alpha: 0.95 });
      fx.stroke({ color: 0xff8ad8, width: 2, alpha: 0.8 });
      if (progress > 0.66) drawImpactBurst(fx, targetAtFire, 0xff8ad8, (progress - 0.66) / 0.34, 15, 5);
    },
    done: () => {
      fx.destroy();
      options.applyDamage(target, damage);
      options.floatText(`${damage}`, target.x, target.y - 18, 0xff8ad8);
    },
  });
}

function spawnIllariSolarShot(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = new Graphics();
  const targetAtFire = { x: target.x, y: target.y };
  const angle = Math.atan2(targetAtFire.y - from.y, targetAtFire.x - from.x);
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 190,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.2;
      drawMuzzleFlash(fx, from, angle, progress, 0xfff06a, 20);
      drawShortTracer(fx, from, targetAtFire, progress, 0xfff06a, 0.52 * alpha, 5.6, 0.13);
      drawShortTracer(fx, from, targetAtFire, progress, 0xffffff, 0.92 * alpha, 1.8, 0.07);
      const point = { x: lerp(from.x, targetAtFire.x, easeOutCubic(progress)), y: lerp(from.y, targetAtFire.y, easeOutCubic(progress)) };
      fx.circle(point.x, point.y, 5.5 + Math.sin(progress * Math.PI * 10) * 1.4);
      fx.fill({ color: 0xfff06a, alpha: 0.84 * alpha });
      if (progress > 0.58) drawImpactBurst(fx, targetAtFire, 0xfff06a, (progress - 0.58) / 0.42, 22, 8);
    },
    done: () => {
      fx.destroy();
      options.applyDamage(target, damage);
      options.floatText(`${damage}`, target.x, target.y - 18, 0xfff06a);
    },
  });
}

export function spawnDistinctHeroAttackFx(
  refs: GameRefs,
  options: PixiHeroAttackFxOptions,
  heroId: string,
  from: Point,
  target: ActiveEnemy,
  damage: number,
) {
  if (heroId === "dva") {
    spawnDvaFusionCannons(refs, options, from, target, damage);
    return true;
  }
  if (heroId === "tracer") {
    spawnTracerPulsePistols(refs, options, from, target, damage);
    return true;
  }
  if (heroId === "cassidy") {
    spawnCassidyPeacekeeper(refs, options, from, target, damage);
    return true;
  }
  if (heroId === "genji") {
    spawnGenjiShuriken(refs, options, from, target, damage);
    return true;
  }
  if (heroId === "ana") {
    spawnAnaBioticShot(refs, options, from, target, damage);
    return true;
  }
  if (heroId === "kiriko") {
    spawnKirikoKunai(refs, options, from, target, damage);
    return true;
  }
  if (heroId === "illari") {
    spawnIllariSolarShot(refs, options, from, target, damage);
    return true;
  }

  return false;
}

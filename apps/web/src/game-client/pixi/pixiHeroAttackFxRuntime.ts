import { Graphics } from "pixi.js";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";

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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - clamp01(progress), 3);
}

function easeOutExpo(progress: number) {
  return progress >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(progress));
}

function pointAt(from: Point, to: Point, progress: number) {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
  };
}

function angleBetween(from: Point, to: Point) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function drawLine(graphics: Graphics, from: Point, to: Point, color: number, alpha: number, width: number) {
  graphics.moveTo(from.x, from.y);
  graphics.lineTo(to.x, to.y);
  graphics.stroke({ color, width, alpha });
}

function drawShortTracer(
  graphics: Graphics,
  from: Point,
  to: Point,
  progress: number,
  color: number,
  alpha: number,
  width: number,
  tail = 0.14,
) {
  const head = easeOutExpo(progress);
  const tailProgress = Math.max(0, head - tail);
  const headPoint = pointAt(from, to, head);
  const tailPoint = pointAt(from, to, tailProgress);

  drawLine(graphics, tailPoint, headPoint, color, alpha * 0.28, width * 2.4);
  drawLine(graphics, tailPoint, headPoint, color, alpha * 0.72, width);
  drawLine(graphics, tailPoint, headPoint, 0xffffff, alpha * 0.9, Math.max(1, width * 0.36));
}

function drawSoftOrb(graphics: Graphics, point: Point, color: number, radius: number, alpha: number) {
  graphics.circle(point.x, point.y, radius * 1.9);
  graphics.fill({ color, alpha: alpha * 0.08 });
  graphics.circle(point.x, point.y, radius * 1.1);
  graphics.fill({ color, alpha: alpha * 0.28 });
  graphics.circle(point.x, point.y, radius * 0.42);
  graphics.fill({ color: 0xffffff, alpha: alpha * 0.72 });
}

function drawMuzzleFlash(graphics: Graphics, point: Point, angle: number, progress: number, color: number, size = 20) {
  const alpha = Math.max(0, 1 - progress * 2.2);
  if (alpha <= 0) return;

  const long = size * alpha;
  const side = size * 0.45 * alpha;
  const back = size * 0.24 * alpha;
  graphics.moveTo(point.x + Math.cos(angle) * long, point.y + Math.sin(angle) * long);
  graphics.lineTo(point.x + Math.cos(angle + 2.25) * side, point.y + Math.sin(angle + 2.25) * side);
  graphics.lineTo(point.x - Math.cos(angle) * back, point.y - Math.sin(angle) * back);
  graphics.lineTo(point.x + Math.cos(angle - 2.25) * side, point.y + Math.sin(angle - 2.25) * side);
  graphics.fill({ color, alpha: 0.62 * alpha });
  graphics.circle(point.x, point.y, size * 0.32 * alpha);
  graphics.fill({ color: 0xffffff, alpha: 0.7 * alpha });
}

function drawImpactBurst(graphics: Graphics, point: Point, color: number, progress: number, size = 22, sparks = 9) {
  const local = clamp01(progress);
  const alpha = 1 - local;
  if (alpha <= 0) return;

  const ringRadius = size * (0.24 + local * 1.05);
  graphics.circle(point.x, point.y, ringRadius);
  graphics.stroke({ color, width: Math.max(1, 4.6 * alpha), alpha: 0.58 * alpha });
  graphics.circle(point.x, point.y, ringRadius * 0.48);
  graphics.stroke({ color: 0xffffff, width: Math.max(1, 1.7 * alpha), alpha: 0.7 * alpha });
  graphics.circle(point.x, point.y, size * 0.2 * alpha);
  graphics.fill({ color: 0xffffff, alpha: 0.62 * alpha });

  for (let index = 0; index < sparks; index += 1) {
    const angle = index * ((Math.PI * 2) / sparks) + local * 2.4;
    const inner = ringRadius * 0.22;
    const outer = ringRadius * (0.64 + (index % 4) * 0.13);
    graphics.moveTo(point.x + Math.cos(angle) * inner, point.y + Math.sin(angle) * inner);
    graphics.lineTo(point.x + Math.cos(angle) * outer, point.y + Math.sin(angle) * outer);
    graphics.stroke({ color, width: 1.8, alpha: 0.72 * alpha });
  }
}

function drawArcSlash(graphics: Graphics, center: Point, progress: number, color: number, radius = 24, angleOffset = 0) {
  const local = clamp01(progress);
  const alpha = 0.9 * (1 - local * 0.4);
  const angle = -1.35 + local * 2.05 + angleOffset;
  const outerStart = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  const innerRadius = radius * 0.64;
  const innerAngle = angle + 0.08;
  const innerStart = { x: center.x + Math.cos(innerAngle) * innerRadius, y: center.y + Math.sin(innerAngle) * innerRadius };

  graphics.moveTo(outerStart.x, outerStart.y);
  graphics.arc(center.x, center.y, radius, angle, angle + 1.1);
  graphics.stroke({ color, width: 5.2 * (1 - local * 0.36), alpha: alpha * 0.38 });
  graphics.moveTo(innerStart.x, innerStart.y);
  graphics.arc(center.x, center.y, innerRadius, innerAngle, angle + 0.92);
  graphics.stroke({ color: 0xffffff, width: 1.6, alpha });
}

function drawShuriken(graphics: Graphics, point: Point, angle: number, color: number, alpha: number, size = 8) {
  for (let index = 0; index < 4; index += 1) {
    const bladeAngle = angle + index * (Math.PI / 2);
    const tip = { x: point.x + Math.cos(bladeAngle) * size, y: point.y + Math.sin(bladeAngle) * size };
    const left = { x: point.x + Math.cos(bladeAngle + 2.45) * size * 0.34, y: point.y + Math.sin(bladeAngle + 2.45) * size * 0.34 };
    const right = { x: point.x + Math.cos(bladeAngle - 2.45) * size * 0.34, y: point.y + Math.sin(bladeAngle - 2.45) * size * 0.34 };
    graphics.moveTo(tip.x, tip.y);
    graphics.lineTo(left.x, left.y);
    graphics.lineTo(point.x, point.y);
    graphics.lineTo(right.x, right.y);
    graphics.fill({ color: index % 2 === 0 ? 0xffffff : color, alpha: alpha * (index % 2 === 0 ? 0.9 : 0.72) });
  }
  graphics.circle(point.x, point.y, size * 0.18);
  graphics.fill({ color, alpha });
}

function finishHit(refs: GameRefs, fx: Graphics, options: PixiHeroAttackFxOptions, target: ActiveEnemy, damage: number, color: number) {
  releaseFxGraphics(refs, fx);
  options.applyDamage(target, damage);
  options.floatText(`${damage}`, target.x, target.y - 18, color);
}

function spawnDvaFusionCannons(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = acquireFxGraphics(refs);
  const targetAtFire = { x: target.x, y: target.y };
  const angle = angleBetween(from, targetAtFire);

  options.addAnimation(refs, {
    duration: 205,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.36;
      drawMuzzleFlash(fx, { x: from.x - 6, y: from.y - 2 }, angle, progress, 0xff74dd, 16);
      drawMuzzleFlash(fx, { x: from.x + 6, y: from.y - 2 }, angle, Math.max(0, progress - 0.08), 0x6eeaff, 15);

      const pellets = [-3, -2, -1, 0, 1, 2, 3, 4];
      pellets.forEach((offset, index) => {
        const local = clamp01((progress - index * 0.035) / 0.52);
        if (local <= 0 || local >= 1) return;
        const end = {
          x: targetAtFire.x + (offset - 0.5) * 8,
          y: targetAtFire.y + (index % 2 === 0 ? -1 : 1) * (5 + Math.abs(offset)),
        };
        const start = { x: from.x + (index % 2 === 0 ? -5 : 5), y: from.y - 2 };
        const color = index % 2 === 0 ? 0xff78d8 : 0x7ee8ff;
        drawShortTracer(fx, start, end, local, color, 0.66 * alpha, 3.2, 0.12);
        drawSoftOrb(fx, pointAt(start, end, easeOutExpo(local)), color, 2.4, 0.85 * alpha);
      });

      if (progress > 0.42) {
        drawImpactBurst(fx, targetAtFire, 0xff78d8, (progress - 0.42) / 0.58, 26, 10);
        drawImpactBurst(fx, { x: targetAtFire.x + 7, y: targetAtFire.y - 4 }, 0x7ee8ff, (progress - 0.5) / 0.5, 18, 7);
      }
    },
    done: () => finishHit(refs, fx, options, target, damage, 0xff78d8),
  });
}

function spawnTracerPulsePistols(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = acquireFxGraphics(refs);
  const targetAtFire = { x: target.x, y: target.y };
  const angle = angleBetween(from, targetAtFire);

  options.addAnimation(refs, {
    duration: 210,
    update: (progress) => {
      fx.clear();
      const shots = [0, 0.11, 0.22, 0.34, 0.46, 0.58];
      shots.forEach((delay, index) => {
        const local = clamp01((progress - delay) / 0.38);
        if (local <= 0 || local >= 1) return;
        const side = index % 2 === 0 ? -1 : 1;
        const start = { x: from.x + side * 7, y: from.y - 3 };
        const end = { x: targetAtFire.x + side * 4, y: targetAtFire.y + (index % 3 - 1) * 4 };
        drawMuzzleFlash(fx, start, angle, local * 0.65, 0xffd166, 10);
        drawShortTracer(fx, start, end, local, 0xffd166, 0.62, 2.8, 0.12);
        drawSoftOrb(fx, pointAt(start, end, easeOutExpo(local)), 0xfff06a, 2.8, 0.88);
      });

      if (progress > 0.52) drawImpactBurst(fx, targetAtFire, 0xffd166, (progress - 0.52) / 0.48, 20, 8);
    },
    done: () => finishHit(refs, fx, options, target, damage, 0xffc857),
  });
}

function spawnCassidyPeacekeeper(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = acquireFxGraphics(refs);
  const targetAtFire = { x: target.x, y: target.y };
  const angle = angleBetween(from, targetAtFire);

  options.addAnimation(refs, {
    duration: 220,
    update: (progress) => {
      fx.clear();
      drawMuzzleFlash(fx, from, angle, progress, 0xffb14a, 30);
      drawShortTracer(fx, from, targetAtFire, progress, 0xc99649, 0.48, 3.8, 0.1);
      drawShortTracer(fx, from, targetAtFire, progress, 0xffffff, 0.84, 1.4, 0.055);

      const bullet = pointAt(from, targetAtFire, easeOutExpo(progress));
      graphicsBullet(fx, bullet, angle, 0xffd166, 0.95 * (1 - progress * 0.18));
      if (progress > 0.6) drawImpactBurst(fx, targetAtFire, 0xffd166, (progress - 0.6) / 0.4, 30, 10);
    },
    done: () => finishHit(refs, fx, options, target, damage, 0xffd166),
  });
}

function graphicsBullet(graphics: Graphics, point: Point, angle: number, color: number, alpha: number) {
  const length = 7;
  graphics.moveTo(point.x + Math.cos(angle) * length, point.y + Math.sin(angle) * length);
  graphics.lineTo(point.x + Math.cos(angle + 2.55) * 3.2, point.y + Math.sin(angle + 2.55) * 3.2);
  graphics.lineTo(point.x + Math.cos(angle - 2.55) * 3.2, point.y + Math.sin(angle - 2.55) * 3.2);
  graphics.fill({ color, alpha });
  graphics.circle(point.x, point.y, 2.2);
  graphics.fill({ color: 0xffffff, alpha: alpha * 0.7 });
}

function spawnGenjiShuriken(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = acquireFxGraphics(refs);
  const targetAtFire = { x: target.x, y: target.y };
  const angle = angleBetween(from, targetAtFire);

  options.addAnimation(refs, {
    duration: 230,
    update: (progress) => {
      fx.clear();
      [-1, 0, 1].forEach((offset, index) => {
        const local = clamp01((progress - index * 0.06) / 0.78);
        if (local <= 0 || local >= 1) return;
        const end = { x: targetAtFire.x + offset * 10, y: targetAtFire.y - Math.abs(offset) * 5 };
        const point = pointAt(from, end, easeOutExpo(local));
        drawShortTracer(fx, from, end, local, 0x7dff7a, 0.14, 1.8, 0.035);
        drawSoftOrb(fx, point, 0x7dff7a, 2.4, 0.58);
        drawShuriken(fx, point, angle + local * Math.PI * 8 + offset * 0.4, 0x7dff7a, 0.92, 6.5);
      });

      if (progress > 0.66) {
        const hitProgress = (progress - 0.66) / 0.34;
        drawArcSlash(fx, targetAtFire, hitProgress, 0x7dff7a, 18, -0.3);
        drawArcSlash(fx, targetAtFire, hitProgress, 0x7dff7a, 14, 1.4);
        drawImpactBurst(fx, targetAtFire, 0x7dff7a, hitProgress, 18, 7);
      }
    },
    done: () => finishHit(refs, fx, options, target, damage, 0x7dff7a),
  });
}

function spawnAnaBioticShot(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = acquireFxGraphics(refs);
  const targetAtFire = { x: target.x, y: target.y };
  const angle = angleBetween(from, targetAtFire);

  options.addAnimation(refs, {
    duration: 165,
    update: (progress) => {
      fx.clear();
      drawMuzzleFlash(fx, from, angle, progress, 0x7dffb2, 18);
      drawShortTracer(fx, from, targetAtFire, progress, 0x6fffd0, 0.48, 3.8, 0.08);
      drawShortTracer(fx, from, targetAtFire, progress, 0xffffff, 0.88, 1.2, 0.045);
      const tip = pointAt(from, targetAtFire, easeOutExpo(progress));
      drawSoftOrb(fx, tip, 0x7dffb2, 3.4, 0.72);
      if (progress > 0.54) drawImpactBurst(fx, targetAtFire, 0x7dffb2, (progress - 0.54) / 0.46, 20, 7);
    },
    done: () => finishHit(refs, fx, options, target, damage, 0x7dffb2),
  });
}

function spawnKirikoKunai(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = acquireFxGraphics(refs);
  const targetAtFire = { x: target.x, y: target.y };

  options.addAnimation(refs, {
    duration: 230,
    update: (progress) => {
      fx.clear();
      const eased = easeOutExpo(progress);
      const arc = Math.sin(progress * Math.PI) * -20;
      const point = { x: lerp(from.x, targetAtFire.x, eased), y: lerp(from.y, targetAtFire.y, eased) + arc };
      drawShortTracer(fx, from, targetAtFire, progress, 0xff8ad8, 0.36, 4.2, 0.16);
      drawSoftOrb(fx, point, 0xff8ad8, 3.2, 0.65);
      graphicsKunai(fx, point, angleBetween(from, targetAtFire), 0xff8ad8, 0.96);
      if (progress > 0.64) drawImpactBurst(fx, targetAtFire, 0xff8ad8, (progress - 0.64) / 0.36, 19, 7);
    },
    done: () => finishHit(refs, fx, options, target, damage, 0xff8ad8),
  });
}

function graphicsKunai(graphics: Graphics, point: Point, angle: number, color: number, alpha: number) {
  const tip = { x: point.x + Math.cos(angle) * 9, y: point.y + Math.sin(angle) * 9 };
  const left = { x: point.x + Math.cos(angle + 2.55) * 5, y: point.y + Math.sin(angle + 2.55) * 5 };
  const right = { x: point.x + Math.cos(angle - 2.55) * 5, y: point.y + Math.sin(angle - 2.55) * 5 };
  graphics.moveTo(tip.x, tip.y);
  graphics.lineTo(left.x, left.y);
  graphics.lineTo(point.x - Math.cos(angle) * 4, point.y - Math.sin(angle) * 4);
  graphics.lineTo(right.x, right.y);
  graphics.fill({ color: 0xffffff, alpha });
  graphics.stroke({ color, width: 2, alpha: alpha * 0.86 });
}

function spawnIllariSolarShot(refs: GameRefs, options: PixiHeroAttackFxOptions, from: Point, target: ActiveEnemy, damage: number) {
  const fx = acquireFxGraphics(refs);
  const targetAtFire = { x: target.x, y: target.y };
  const angle = angleBetween(from, targetAtFire);

  options.addAnimation(refs, {
    duration: 185,
    update: (progress) => {
      fx.clear();
      drawMuzzleFlash(fx, from, angle, progress, 0xfff06a, 24);
      drawShortTracer(fx, from, targetAtFire, progress, 0xffc857, 0.52, 6.4, 0.1);
      drawShortTracer(fx, from, targetAtFire, progress, 0xffffff, 0.95, 1.8, 0.05);
      const tip = pointAt(from, targetAtFire, easeOutExpo(progress));
      drawSoftOrb(fx, tip, 0xfff06a, 6.2 + Math.sin(progress * Math.PI * 10) * 1.2, 0.88);
      if (progress > 0.56) drawImpactBurst(fx, targetAtFire, 0xfff06a, (progress - 0.56) / 0.44, 30, 11);
    },
    done: () => finishHit(refs, fx, options, target, damage, 0xfff06a),
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

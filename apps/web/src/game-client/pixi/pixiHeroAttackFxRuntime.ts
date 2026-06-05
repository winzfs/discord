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

function drawTrail(graphics: Graphics, from: Point, to: Point, color: number, alpha: number, width: number) {
  graphics.moveTo(from.x, from.y);
  graphics.lineTo(to.x, to.y);
  graphics.stroke({ color, width, alpha });
}

function drawHitFlash(graphics: Graphics, point: Point, color: number, progress: number, size = 18) {
  const radius = size * (0.35 + progress * 0.8);
  const alpha = Math.max(0, 0.75 * (1 - progress));
  graphics.circle(point.x, point.y, radius);
  graphics.stroke({ color, width: 3 * (1 - progress), alpha });
  graphics.circle(point.x, point.y, radius * 0.34);
  graphics.fill({ color: 0xffffff, alpha: alpha * 0.55 });
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
    duration: 260,
    update: (progress) => {
      const alpha = 1 - progress * 0.2;
      const spread = 15;
      fx.clear();

      [-1, 0, 1].forEach((offset) => {
        const end = { x: targetAtFire.x + offset * spread, y: targetAtFire.y + Math.abs(offset) * 7 };
        const mid = { x: lerp(from.x, end.x, progress), y: lerp(from.y, end.y, progress) };
        drawTrail(fx, from, mid, offset === 0 ? 0x7ee8ff : 0xff78d8, 0.32 * alpha, offset === 0 ? 7 : 4);
        fx.circle(mid.x, mid.y, offset === 0 ? 5 : 3.5);
        fx.fill({ color: offset === 0 ? 0xffffff : 0xffb7ea, alpha });
      });
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
        const point = { x: lerp(start.x, end.x, local), y: lerp(start.y, end.y, local) };
        drawTrail(fx, start, point, 0xffd166, 0.42 * alpha, 3);
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
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 300,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.28;
      const flashRadius = 14 * (1 - progress);
      fx.circle(from.x, from.y, flashRadius);
      fx.fill({ color: 0xfff06a, alpha: 0.55 * alpha });
      drawTrail(fx, from, targetAtFire, 0xffd166, 0.18 * alpha, 8);
      drawTrail(fx, from, targetAtFire, 0xffffff, 0.82 * alpha, 2.2);
      drawHitFlash(fx, targetAtFire, 0xffd166, progress, 20);
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
    duration: 260,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.16;
      [-1, 0, 1].forEach((offset) => {
        const end = { x: targetAtFire.x + offset * 9, y: targetAtFire.y - Math.abs(offset) * 4 };
        const point = { x: lerp(from.x, end.x, progress), y: lerp(from.y, end.y, progress) };
        drawTrail(fx, from, point, 0x7dff7a, 0.24 * alpha, 4);
        drawSlash(fx, point, progress, 0x7dff7a, 12 + Math.abs(offset) * 2);
      });
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
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 300,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.22;
      const point = { x: lerp(from.x, targetAtFire.x, progress), y: lerp(from.y, targetAtFire.y, progress) };
      drawTrail(fx, from, point, 0x7dffb2, 0.34 * alpha, 5);
      drawTrail(fx, from, point, 0xffffff, 0.76 * alpha, 1.8);
      fx.circle(point.x, point.y, 4.5);
      fx.fill({ color: 0x7dffb2, alpha });
      drawHitFlash(fx, targetAtFire, 0x7dffb2, progress, 15);
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
    duration: 250,
    update: (progress) => {
      fx.clear();
      const arc = Math.sin(progress * Math.PI) * -18;
      const point = { x: lerp(from.x, targetAtFire.x, progress), y: lerp(from.y, targetAtFire.y, progress) + arc };
      drawTrail(fx, from, point, 0xff8ad8, 0.26, 4);
      fx.moveTo(point.x, point.y - 7);
      fx.lineTo(point.x + 8, point.y);
      fx.lineTo(point.x, point.y + 7);
      fx.lineTo(point.x - 3, point.y);
      fx.fill({ color: 0xffffff, alpha: 0.95 });
      fx.stroke({ color: 0xff8ad8, width: 2, alpha: 0.8 });
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
  refs.effects.addChild(fx);

  options.addAnimation(refs, {
    duration: 320,
    update: (progress) => {
      fx.clear();
      const alpha = 1 - progress * 0.18;
      const point = { x: lerp(from.x, targetAtFire.x, progress), y: lerp(from.y, targetAtFire.y, progress) };
      drawTrail(fx, from, point, 0xfff06a, 0.38 * alpha, 8);
      drawTrail(fx, from, point, 0xffffff, 0.9 * alpha, 2.4);
      fx.circle(point.x, point.y, 8 + Math.sin(progress * Math.PI * 8) * 2);
      fx.fill({ color: 0xfff06a, alpha: 0.8 * alpha });
      drawHitFlash(fx, targetAtFire, 0xfff06a, progress, 22);
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

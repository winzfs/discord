import { Graphics } from "pixi.js";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";

export type PixiWinstonBeamRuntimeOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  applyDamage: (enemy: ActiveEnemy, damage: number) => void;
};

type Point = { x: number; y: number };

const WINSTON_BEAM_PULSE_TIMES = [0.18, 0.48, 0.78];

export function pickWinstonBeamTargets(refs: GameRefs, target: ActiveEnemy) {
  const nearby = refs.activeEnemies
    .filter((enemy) => enemy.alive && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 86)
    .sort((a, b) => b.progress - a.progress);

  return [target, ...nearby.filter((enemy) => enemy.id !== target.id)].slice(0, 4);
}

function electricPoint(start: Point, end: Point, step: number, totalSteps: number, phase: number, strength: number) {
  const t = step / totalSteps;
  const x = start.x + (end.x - start.x) * t;
  const y = start.y + (end.y - start.y) * t;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const normalX = -dy / length;
  const normalY = dx / length;
  const zigzag = Math.sin((step * 2.7 + phase) * Math.PI) * strength;
  const jitter = Math.cos((step * 5.1 + phase * 0.7) * Math.PI) * strength * 0.42;

  return {
    x: x + normalX * (zigzag + jitter),
    y: y + normalY * (zigzag - jitter),
  };
}

function drawLightningPath(graphics: Graphics, start: Point, end: Point, phase: number, width: number, color: number, alpha: number, strength: number) {
  const segments = 6;
  const points = Array.from({ length: segments + 1 }, (_, index) =>
    index === 0 ? start : index === segments ? end : electricPoint(start, end, index, segments, phase, strength),
  );

  graphics.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
  graphics.stroke({ color, width, alpha });
}

function drawElectricSpark(graphics: Graphics, center: Point, phase: number, radius: number, alpha: number) {
  for (let index = 0; index < 5; index += 1) {
    const angle = phase * Math.PI * 2 + index * 1.256;
    const length = radius * (0.45 + ((index % 3) * 0.16));
    const startX = center.x + Math.cos(angle) * radius * 0.22;
    const startY = center.y + Math.sin(angle) * radius * 0.22;
    const endX = center.x + Math.cos(angle) * length;
    const endY = center.y + Math.sin(angle) * length;
    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.stroke({ color: 0xb8f3ff, width: 1.6, alpha });
  }

  graphics.circle(center.x, center.y, radius * 0.26);
  graphics.fill({ color: 0xffffff, alpha: alpha * 0.65 });
}

function splitPulseDamage(totalDamage: number, pulseCount: number) {
  const base = Math.floor(totalDamage / pulseCount);
  const remainder = totalDamage - base * pulseCount;
  return Array.from({ length: pulseCount }, (_, index) => Math.max(1, base + (index < remainder ? 1 : 0)));
}

export function spawnWinstonElectricBeam(
  refs: GameRefs,
  options: PixiWinstonBeamRuntimeOptions,
  from: { x: number; y: number },
  targets: ActiveEnemy[],
  baseDamage: number,
  done?: () => void,
) {
  const beam = acquireFxGraphics(refs);
  const appliedPulseIndexes = new Set<number>();

  options.addAnimation(refs, {
    duration: 560,
    update: (progress) => {
      const alpha = 0.95 - progress * 0.35;
      const phase = progress * 12;
      const pulseWave = WINSTON_BEAM_PULSE_TIMES.some((time) => Math.abs(progress - time) < 0.07) ? 1.18 : 0.92;
      const flicker = (0.78 + Math.sin(progress * Math.PI * 30) * 0.22) * pulseWave;
      beam.clear();

      targets.forEach((enemy, index) => {
        if (!enemy.alive) return;
        const start = index === 0 ? from : targets[index - 1];
        const end = { x: enemy.x, y: enemy.y };
        const branchPhase = phase + index * 0.67;

        drawLightningPath(beam, start, end, branchPhase, 12 * flicker, 0x45bfff, 0.16 * alpha, 9);
        drawLightningPath(beam, start, end, branchPhase + 0.31, 6 * flicker, 0x81e7ff, 0.34 * alpha, 7);
        drawLightningPath(beam, start, end, branchPhase + 0.62, 2.2, 0xffffff, 0.92 * alpha, 4);

        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        drawElectricSpark(beam, mid, branchPhase, 13, 0.4 * alpha);
        drawElectricSpark(beam, end, branchPhase + 0.2, 16, 0.72 * alpha);
      });

      WINSTON_BEAM_PULSE_TIMES.forEach((time, pulseIndex) => {
        if (progress < time || appliedPulseIndexes.has(pulseIndex)) return;
        appliedPulseIndexes.add(pulseIndex);

        targets.forEach((enemy, index) => {
          if (!enemy.alive) return;
          const multiplier = index === 0 ? 0.72 : 0.46;
          const totalDamage = Math.max(1, Math.round(baseDamage * multiplier));
          const pulseDamage = splitPulseDamage(totalDamage, WINSTON_BEAM_PULSE_TIMES.length)[pulseIndex] ?? 1;
          options.applyDamage(enemy, pulseDamage);
          if (pulseIndex === 0) enemy.speed = Math.max(0.2, enemy.speed * 0.88);
        });
      });
    },
    done: () => {
      releaseFxGraphics(refs, beam);
      done?.();
    },
  });
}

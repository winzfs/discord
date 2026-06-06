import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";

export type BaseSkillFxKind =
  | "attack"
  | "boss"
  | "area"
  | "chain"
  | "beam"
  | "control"
  | "mark"
  | "support"
  | "turret"
  | "economy";

export type BaseSkillFxOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeOut(progress: number) {
  const value = clamp01(progress);
  return 1 - Math.pow(1 - value, 3);
}

function skillColor(kind: BaseSkillFxKind) {
  if (kind === "boss") return 0xff8a3d;
  if (kind === "area") return 0xffb13d;
  if (kind === "chain") return 0x5ee7ff;
  if (kind === "beam") return 0xbde7ff;
  if (kind === "control") return 0x7fd9ff;
  if (kind === "mark") return 0xff5f5f;
  if (kind === "support") return 0x7dffb2;
  if (kind === "turret") return 0xd486ff;
  if (kind === "economy") return 0xffdf5a;
  return 0xffd166;
}

function drawRing(refs: GameRefs, options: BaseSkillFxOptions, enemy: ActiveEnemy, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = kind === "control" ? 760 : kind === "support" ? 660 : 620;
  const baseRadius = kind === "area" ? 62 : kind === "support" ? 54 : kind === "economy" ? 42 : 50;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const local = easeOut(progress);
      const alpha = Math.max(0, 1 - progress * 0.84);
      const radius = baseRadius * (0.35 + local * 1.32);
      fx.clear();

      if (kind === "support") {
        fx.circle(enemy.x, enemy.y, radius * 1.25);
        fx.stroke({ color, width: Math.max(2, 9 * alpha), alpha: 0.42 * alpha });
        fx.circle(enemy.x, enemy.y, radius * 0.72);
        fx.stroke({ color: 0xffffff, width: Math.max(1.5, 3.5 * alpha), alpha: 0.78 * alpha });
        fx.circle(enemy.x, enemy.y, 8 + local * 10);
        fx.fill({ color, alpha: 0.25 * alpha });
        return;
      }

      if (kind === "economy") {
        for (let index = 0; index < 8; index += 1) {
          const angle = index * (Math.PI / 4) + progress * 4.2;
          const x = enemy.x + Math.cos(angle) * radius;
          const y = enemy.y + Math.sin(angle) * radius * 0.72;
          fx.circle(x, y, 3.5 + alpha * 4);
          fx.fill({ color, alpha: 0.92 * alpha });
        }
        fx.circle(enemy.x, enemy.y, radius * 0.46);
        fx.stroke({ color: 0xffffff, width: Math.max(1.5, 3.4 * alpha), alpha: 0.7 * alpha });
        return;
      }

      fx.circle(enemy.x, enemy.y, radius);
      fx.stroke({ color, width: Math.max(2, (kind === "area" ? 12 : 9) * alpha), alpha: 0.78 * alpha });
      fx.circle(enemy.x, enemy.y, radius * 0.52);
      fx.stroke({ color: 0xffffff, width: Math.max(1.5, 3.4 * alpha), alpha: 0.78 * alpha });
      fx.circle(enemy.x, enemy.y, 7 + local * 10);
      fx.fill({ color, alpha: 0.2 * alpha });

      if (kind === "control") {
        for (let index = 0; index < 10; index += 1) {
          const angle = index * (Math.PI / 5) + progress * 1.6;
          const inner = radius * 0.32;
          const outer = radius * 0.95;
          fx.moveTo(enemy.x + Math.cos(angle) * inner, enemy.y + Math.sin(angle) * inner);
          fx.lineTo(enemy.x + Math.cos(angle) * outer, enemy.y + Math.sin(angle) * outer);
          fx.stroke({ color, width: 2.5, alpha: 0.72 * alpha });
        }
      }
    },
    done: () => releaseFxGraphics(refs, fx),
  });
}

function drawChain(refs: GameRefs, options: BaseSkillFxOptions, from: ActiveEnemy, to: ActiveEnemy | null, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = kind === "beam" ? 560 : 500;
  const end = to ?? from;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const alpha = Math.max(0, 1 - progress * 0.68);
      fx.clear();

      const segmentCount = kind === "chain" ? 6 : 1;
      let previous = { x: from.x, y: from.y };
      for (let index = 1; index <= segmentCount; index += 1) {
        const ratio = index / segmentCount;
        const wobble = kind === "chain" ? Math.sin(progress * 15 + index * 1.7) * 12 : 0;
        const point = {
          x: from.x + (end.x - from.x) * ratio,
          y: from.y + (end.y - from.y) * ratio + wobble,
        };
        fx.moveTo(previous.x, previous.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color, width: kind === "beam" ? 13 : 8, alpha: 0.34 * alpha });
        fx.moveTo(previous.x, previous.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color: 0xffffff, width: kind === "beam" ? 4.4 : 2.4, alpha: 0.94 * alpha });
        previous = point;
      }

      fx.circle(from.x, from.y, 5 + progress * 9);
      fx.stroke({ color, width: Math.max(1.5, 3.8 * alpha), alpha: 0.7 * alpha });
      fx.circle(end.x, end.y, 8 + progress * 16);
      fx.stroke({ color, width: Math.max(1.5, 4.4 * alpha), alpha: 0.8 * alpha });
    },
    done: () => releaseFxGraphics(refs, fx),
  });
}

function drawStrike(refs: GameRefs, options: BaseSkillFxOptions, enemy: ActiveEnemy, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = kind === "boss" || kind === "mark" ? 460 : 400;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const alpha = Math.max(0, 1 - progress * 0.9);
      const offset = 32 * (1 - easeOut(progress));
      fx.clear();
      fx.moveTo(enemy.x - 36 - offset, enemy.y - 22);
      fx.lineTo(enemy.x + 36 + offset, enemy.y + 22);
      fx.stroke({ color, width: 10, alpha: 0.46 * alpha });
      fx.moveTo(enemy.x - 26 - offset, enemy.y - 15);
      fx.lineTo(enemy.x + 26 + offset, enemy.y + 15);
      fx.stroke({ color: 0xffffff, width: 3, alpha: 0.9 * alpha });
      fx.moveTo(enemy.x + 30 + offset * 0.6, enemy.y - 20);
      fx.lineTo(enemy.x - 30 - offset * 0.6, enemy.y + 20);
      fx.stroke({ color, width: 5.5, alpha: 0.32 * alpha });
      fx.circle(enemy.x, enemy.y, 10 + progress * 21);
      fx.stroke({ color, width: Math.max(1.5, 4.5 * alpha), alpha: 0.62 * alpha });
    },
    done: () => releaseFxGraphics(refs, fx),
  });
}

export function spawnBaseSkillFx(
  refs: GameRefs,
  options: BaseSkillFxOptions | undefined,
  kind: BaseSkillFxKind | null,
  target: ActiveEnemy,
  secondaryTarget?: ActiveEnemy | null,
) {
  if (!options || !kind) return;

  if (kind === "chain" || kind === "beam") {
    drawChain(refs, options, target, secondaryTarget ?? null, kind);
    return;
  }

  if (kind === "attack" || kind === "boss" || kind === "mark" || kind === "turret") {
    drawStrike(refs, options, target, kind);
    return;
  }

  drawRing(refs, options, target, kind);
}

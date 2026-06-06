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
  if (kind === "mark") return 0xff6f5d;
  if (kind === "support") return 0x7dffb2;
  if (kind === "turret") return 0xd8c1ff;
  if (kind === "economy") return 0xffdf5a;
  return 0xffd166;
}

function drawRing(refs: GameRefs, options: BaseSkillFxOptions, enemy: ActiveEnemy, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = kind === "control" ? 520 : 420;
  const baseRadius = kind === "area" ? 34 : kind === "support" ? 30 : kind === "economy" ? 24 : 26;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const local = easeOut(progress);
      const alpha = 1 - progress;
      const radius = baseRadius * (0.45 + local * 1.25);
      fx.clear();

      if (kind === "support") {
        fx.circle(enemy.x, enemy.y, radius * 1.28);
        fx.stroke({ color, width: Math.max(1, 5 * alpha), alpha: 0.28 * alpha });
        fx.circle(enemy.x, enemy.y, radius * 0.66);
        fx.stroke({ color: 0xffffff, width: Math.max(1, 2 * alpha), alpha: 0.6 * alpha });
        return;
      }

      if (kind === "economy") {
        for (let index = 0; index < 6; index += 1) {
          const angle = index * (Math.PI / 3) + progress * 3.4;
          const x = enemy.x + Math.cos(angle) * radius;
          const y = enemy.y + Math.sin(angle) * radius * 0.72;
          fx.circle(x, y, 2.2 + alpha * 2.4);
          fx.fill({ color, alpha: 0.75 * alpha });
        }
        fx.circle(enemy.x, enemy.y, radius * 0.38);
        fx.stroke({ color: 0xffffff, width: Math.max(1, 2 * alpha), alpha: 0.55 * alpha });
        return;
      }

      fx.circle(enemy.x, enemy.y, radius);
      fx.stroke({ color, width: Math.max(1, (kind === "area" ? 7 : 5) * alpha), alpha: 0.55 * alpha });
      fx.circle(enemy.x, enemy.y, radius * 0.48);
      fx.stroke({ color: 0xffffff, width: Math.max(1, 2 * alpha), alpha: 0.58 * alpha });

      if (kind === "control") {
        for (let index = 0; index < 8; index += 1) {
          const angle = index * (Math.PI / 4) + progress * 1.2;
          const inner = radius * 0.38;
          const outer = radius * 0.88;
          fx.moveTo(enemy.x + Math.cos(angle) * inner, enemy.y + Math.sin(angle) * inner);
          fx.lineTo(enemy.x + Math.cos(angle) * outer, enemy.y + Math.sin(angle) * outer);
          fx.stroke({ color, width: 1.6, alpha: 0.5 * alpha });
        }
      }
    },
    done: () => releaseFxGraphics(refs, fx),
  });
}

function drawChain(refs: GameRefs, options: BaseSkillFxOptions, from: ActiveEnemy, to: ActiveEnemy | null, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = kind === "beam" ? 360 : 300;
  const end = to ?? from;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const alpha = 1 - progress * 0.75;
      fx.clear();

      const segmentCount = kind === "chain" ? 5 : 1;
      let previous = { x: from.x, y: from.y };
      for (let index = 1; index <= segmentCount; index += 1) {
        const ratio = index / segmentCount;
        const wobble = kind === "chain" ? Math.sin(progress * 12 + index * 1.7) * 7 : 0;
        const point = {
          x: from.x + (end.x - from.x) * ratio,
          y: from.y + (end.y - from.y) * ratio + wobble,
        };
        fx.moveTo(previous.x, previous.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color, width: kind === "beam" ? 7 : 4, alpha: 0.22 * alpha });
        fx.moveTo(previous.x, previous.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color: 0xffffff, width: kind === "beam" ? 2.4 : 1.5, alpha: 0.72 * alpha });
        previous = point;
      }

      fx.circle(end.x, end.y, 4 + progress * 10);
      fx.stroke({ color, width: Math.max(1, 3 * (1 - progress)), alpha: 0.55 * alpha });
    },
    done: () => releaseFxGraphics(refs, fx),
  });
}

function drawStrike(refs: GameRefs, options: BaseSkillFxOptions, enemy: ActiveEnemy, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = 260;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const alpha = 1 - progress;
      const offset = 18 * (1 - easeOut(progress));
      fx.clear();
      fx.moveTo(enemy.x - 20 - offset, enemy.y - 12);
      fx.lineTo(enemy.x + 20 + offset, enemy.y + 12);
      fx.stroke({ color, width: 5, alpha: 0.35 * alpha });
      fx.moveTo(enemy.x - 14 - offset, enemy.y - 8);
      fx.lineTo(enemy.x + 14 + offset, enemy.y + 8);
      fx.stroke({ color: 0xffffff, width: 1.7, alpha: 0.7 * alpha });
      fx.circle(enemy.x, enemy.y, 5 + progress * 12);
      fx.stroke({ color, width: Math.max(1, 2.4 * alpha), alpha: 0.45 * alpha });
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

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
  const duration = kind === "control" ? 520 : kind === "support" ? 470 : 430;
  const baseRadius = kind === "area" ? 36 : kind === "support" ? 30 : kind === "economy" ? 26 : 28;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const local = easeOut(progress);
      const alpha = Math.max(0, 1 - progress);
      const radius = baseRadius * (0.45 + local * 1.08);
      fx.clear();

      if (kind === "support") {
        fx.circle(enemy.x, enemy.y, radius * 1.18);
        fx.stroke({ color, width: Math.max(1, 4.5 * alpha), alpha: 0.26 * alpha });
        fx.circle(enemy.x, enemy.y, radius * 0.68);
        fx.stroke({ color: 0xffffff, width: Math.max(1, 1.8 * alpha), alpha: 0.46 * alpha });
        return;
      }

      if (kind === "economy") {
        for (let index = 0; index < 5; index += 1) {
          const angle = index * ((Math.PI * 2) / 5) + progress * 2.2;
          const x = enemy.x + Math.cos(angle) * radius;
          const y = enemy.y + Math.sin(angle) * radius * 0.72;
          fx.circle(x, y, 2 + alpha * 2);
          fx.fill({ color, alpha: 0.58 * alpha });
        }
        return;
      }

      fx.circle(enemy.x, enemy.y, radius);
      fx.stroke({ color, width: Math.max(1, (kind === "area" ? 5 : 4) * alpha), alpha: 0.42 * alpha });
      fx.circle(enemy.x, enemy.y, radius * 0.48);
      fx.stroke({ color: 0xffffff, width: Math.max(1, 1.6 * alpha), alpha: 0.42 * alpha });

      if (kind === "control") {
        for (let index = 0; index < 6; index += 1) {
          const angle = index * (Math.PI / 3) + progress * 0.85;
          const inner = radius * 0.35;
          const outer = radius * 0.78;
          fx.moveTo(enemy.x + Math.cos(angle) * inner, enemy.y + Math.sin(angle) * inner);
          fx.lineTo(enemy.x + Math.cos(angle) * outer, enemy.y + Math.sin(angle) * outer);
          fx.stroke({ color, width: 1.2, alpha: 0.38 * alpha });
        }
      }
    },
    done: () => releaseFxGraphics(refs, fx),
  });
}

function drawChain(refs: GameRefs, options: BaseSkillFxOptions, from: ActiveEnemy, to: ActiveEnemy | null, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = kind === "beam" ? 380 : 340;
  const end = to ?? from;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const alpha = Math.max(0, 1 - progress);
      fx.clear();

      const segmentCount = kind === "chain" ? 4 : 1;
      let previous = { x: from.x, y: from.y };
      for (let index = 1; index <= segmentCount; index += 1) {
        const ratio = index / segmentCount;
        const wobble = kind === "chain" ? Math.sin(progress * 10 + index * 1.7) * 5 : 0;
        const point = {
          x: from.x + (end.x - from.x) * ratio,
          y: from.y + (end.y - from.y) * ratio + wobble,
        };
        fx.moveTo(previous.x, previous.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color, width: kind === "beam" ? 5 : 3.2, alpha: 0.22 * alpha });
        fx.moveTo(previous.x, previous.y);
        fx.lineTo(point.x, point.y);
        fx.stroke({ color: 0xffffff, width: kind === "beam" ? 1.5 : 1.1, alpha: 0.55 * alpha });
        previous = point;
      }
    },
    done: () => releaseFxGraphics(refs, fx),
  });
}

function drawStrike(refs: GameRefs, options: BaseSkillFxOptions, enemy: ActiveEnemy, kind: BaseSkillFxKind) {
  const fx = acquireFxGraphics(refs);
  const color = skillColor(kind);
  const duration = kind === "boss" || kind === "mark" ? 320 : 260;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      const alpha = Math.max(0, 1 - progress);
      const offset = 16 * (1 - easeOut(progress));
      fx.clear();
      fx.moveTo(enemy.x - 18 - offset, enemy.y - 10);
      fx.lineTo(enemy.x + 18 + offset, enemy.y + 10);
      fx.stroke({ color, width: 4.2, alpha: 0.32 * alpha });
      fx.moveTo(enemy.x - 13 - offset, enemy.y - 7);
      fx.lineTo(enemy.x + 13 + offset, enemy.y + 7);
      fx.stroke({ color: 0xffffff, width: 1.3, alpha: 0.55 * alpha });
      fx.circle(enemy.x, enemy.y, 5 + progress * 9);
      fx.stroke({ color, width: Math.max(1, 1.8 * alpha), alpha: 0.35 * alpha });
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

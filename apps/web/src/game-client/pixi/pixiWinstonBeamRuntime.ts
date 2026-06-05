import { Graphics } from "pixi.js";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";

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

export function pickWinstonBeamTargets(refs: GameRefs, target: ActiveEnemy) {
  const nearby = refs.activeEnemies
    .filter((enemy) => enemy.alive && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 86)
    .sort((a, b) => b.progress - a.progress);

  return [target, ...nearby.filter((enemy) => enemy.id !== target.id)].slice(0, 4);
}

export function spawnWinstonElectricBeam(
  refs: GameRefs,
  options: PixiWinstonBeamRuntimeOptions,
  from: { x: number; y: number },
  targets: ActiveEnemy[],
  baseDamage: number,
  done?: () => void,
) {
  const beam = new Graphics();
  refs.effects.addChild(beam);

  options.addAnimation(refs, {
    duration: 360,
    update: (progress) => {
      const alpha = 0.9 - progress * 0.25;
      const flicker = 0.75 + Math.sin(progress * Math.PI * 18) * 0.22;
      beam.clear();

      targets.forEach((enemy, index) => {
        if (!enemy.alive) return;
        const start = index === 0 ? from : targets[index - 1];
        beam.moveTo(start.x, start.y);
        beam.lineTo(enemy.x, enemy.y);
        beam.stroke({ color: 0x7ed7ff, width: 7 * flicker, alpha: 0.22 * alpha });
        beam.moveTo(start.x, start.y);
        beam.lineTo(enemy.x, enemy.y);
        beam.stroke({ color: 0xffffff, width: 2.5, alpha });
      });
    },
    done: () => {
      beam.destroy();
      targets.forEach((enemy, index) => {
        if (!enemy.alive) return;
        const multiplier = index === 0 ? 0.72 : 0.46;
        options.applyDamage(enemy, Math.max(1, Math.round(baseDamage * multiplier)));
        enemy.speed = Math.max(0.2, enemy.speed * 0.88);
      });
      done?.();
    },
  });
}

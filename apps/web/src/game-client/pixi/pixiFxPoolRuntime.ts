import { Graphics } from "pixi.js";
import type { GameRefs } from "./pixiGameTypes";

const MAX_POOLED_GRAPHICS_PER_GAME = 96;
const pools = new WeakMap<GameRefs, Graphics[]>();

function getPool(refs: GameRefs) {
  let pool = pools.get(refs);
  if (!pool) {
    pool = [];
    pools.set(refs, pool);
  }
  return pool;
}

export function acquireFxGraphics(refs: GameRefs) {
  const pool = getPool(refs);
  const graphics = pool.pop() ?? new Graphics();
  graphics.clear();
  graphics.alpha = 1;
  graphics.visible = true;
  graphics.x = 0;
  graphics.y = 0;
  graphics.rotation = 0;
  graphics.scale.set(1);
  graphics.pivot.set(0);
  refs.effects.addChild(graphics);
  return graphics;
}

export function releaseFxGraphics(refs: GameRefs, graphics: Graphics) {
  graphics.clear();
  graphics.alpha = 1;
  graphics.visible = false;
  graphics.removeFromParent();

  const pool = getPool(refs);
  if (pool.length >= MAX_POOLED_GRAPHICS_PER_GAME) {
    graphics.destroy();
    return;
  }

  pool.push(graphics);
}

export function destroyFxGraphicsPool(refs: GameRefs) {
  const pool = pools.get(refs);
  if (!pool) return;

  pool.forEach((graphics) => graphics.destroy());
  pool.length = 0;
  pools.delete(refs);
}

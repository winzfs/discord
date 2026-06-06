import { Graphics } from "pixi.js";
import type { ActiveEnemy, GameRefs, PixiControlZone } from "./pixiGameTypes";
import { updateEnemyControlTint } from "./pixiEnemyView";

export type ControlEffectMode = "single" | "zone";

export type ControlEffectConfig = {
  mode: ControlEffectMode;
  durationMs: number;
  slowMultiplier: number;
  radius: number;
  tintColor: number;
};

const SINGLE_CONTROL_COLOR = 0x45cfff;
const FREEZE_CONTROL_COLOR = 0x7df4ff;
const AREA_CONTROL_COLOR = 0x8f75ff;

export function createSingleControlConfig(frozen = false): ControlEffectConfig {
  return {
    mode: "single",
    durationMs: frozen ? 1250 : 1050,
    slowMultiplier: frozen ? 0 : 0.38,
    radius: 0,
    tintColor: frozen ? FREEZE_CONTROL_COLOR : SINGLE_CONTROL_COLOR,
  };
}

export function createAreaControlConfig(): ControlEffectConfig {
  return {
    mode: "zone",
    durationMs: 1650,
    slowMultiplier: 0.34,
    radius: 48,
    tintColor: AREA_CONTROL_COLOR,
  };
}

export function applySingleControl(target: ActiveEnemy, config: ControlEffectConfig) {
  const until = Date.now() + config.durationMs;
  target.controlSlowUntil = Math.max(target.controlSlowUntil ?? 0, until);
  target.controlSlowMultiplier = Math.min(target.controlSlowMultiplier ?? 1, config.slowMultiplier);
  target.controlTintUntil = Math.max(target.controlTintUntil ?? 0, until);
  target.controlTintColor = config.tintColor;

  if (config.slowMultiplier <= 0.05) {
    target.sleepUntil = Math.max(target.sleepUntil ?? 0, until);
  }
}

function drawZoneGraphics(graphics: Graphics, zone: PixiControlZone, now: number) {
  const remaining = Math.max(0, zone.until - now);
  const total = Math.max(1, zone.until - (zone.until - 1650));
  const alpha = Math.max(0.16, Math.min(0.42, remaining / total));

  graphics.clear();
  graphics.circle(zone.x, zone.y, zone.radius);
  graphics.fill({ color: zone.tintColor, alpha: 0.1 });
  graphics.stroke({ color: zone.tintColor, width: 2, alpha });
  graphics.circle(zone.x, zone.y, Math.max(8, zone.radius * 0.36));
  graphics.stroke({ color: 0xffffff, width: 1, alpha: alpha * 0.7 });
}

export function createControlZone(refs: GameRefs, target: ActiveEnemy, config: ControlEffectConfig) {
  const zone: PixiControlZone = {
    id: refs.nextControlZoneId,
    x: target.x,
    y: target.y,
    radius: config.radius,
    until: Date.now() + config.durationMs,
    slowMultiplier: config.slowMultiplier,
    tintColor: config.tintColor,
    root: new Graphics(),
  };

  refs.nextControlZoneId += 1;
  drawZoneGraphics(zone.root, zone, Date.now());
  refs.effects.addChild(zone.root);
  refs.controlZones.push(zone);
}

function applyZoneToEnemy(enemy: ActiveEnemy, zone: PixiControlZone, now: number) {
  if (!enemy.alive) return;
  if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) > zone.radius) return;

  enemy.controlSlowUntil = Math.max(enemy.controlSlowUntil ?? 0, Math.min(zone.until, now + 260));
  enemy.controlSlowMultiplier = Math.min(enemy.controlSlowMultiplier ?? 1, zone.slowMultiplier);
  enemy.controlTintUntil = Math.max(enemy.controlTintUntil ?? 0, Math.min(zone.until, now + 260));
  enemy.controlTintColor = zone.tintColor;
}

export function updateControlZones(refs: GameRefs, now = Date.now()) {
  refs.controlZones = refs.controlZones.filter((zone) => {
    if (zone.until <= now) {
      zone.root.parent?.removeChild(zone.root);
      zone.root.destroy();
      return false;
    }

    drawZoneGraphics(zone.root, zone, now);
    refs.activeEnemies.forEach((enemy) => applyZoneToEnemy(enemy, zone, now));
    return true;
  });
}

export function updateEnemyControlVisual(enemy: ActiveEnemy, now = Date.now()) {
  if (enemy.controlTintUntil && enemy.controlTintUntil > now && enemy.controlTintColor !== undefined) {
    updateEnemyControlTint(enemy.view, enemy.controlTintColor);
    return;
  }

  enemy.controlTintColor = undefined;
  updateEnemyControlTint(enemy.view, null);
}

export function getEnemyControlSpeedMultiplier(enemy: ActiveEnemy, now = Date.now()) {
  if (!enemy.controlSlowUntil || enemy.controlSlowUntil <= now) {
    enemy.controlSlowMultiplier = undefined;
    return 1;
  }

  return Math.max(0, Math.min(1, enemy.controlSlowMultiplier ?? 1));
}

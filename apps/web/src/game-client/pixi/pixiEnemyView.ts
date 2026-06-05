import { Container, Graphics } from "pixi.js";
import { colors } from "./gameTheme";

export type EnemyView = {
  root: Container;
  shadow: Graphics;
  body: Graphics;
  eyes: Graphics;
  hpBackground: Graphics;
  hpFill: Graphics;
  hpWidth: number;
  boss: boolean;
};

function enemyFillColor(enemyId: string, boss: boolean) {
  if (enemyId === "ping-runner") return 0x4aa9d8;
  if (enemyId === "lag-chunk") return 0x807366;
  if (enemyId === "elite-bug") return 0x8d55c4;
  return boss ? 0x8b3d34 : 0x4c9f3a;
}

function enemyAccentColor(enemyId: string, boss: boolean) {
  if (enemyId === "ping-runner") return 0x9be8ff;
  if (enemyId === "lag-chunk") return 0xc3b39a;
  if (enemyId === "elite-bug") return 0xd5a4ff;
  return boss ? 0xffb14f : 0x8be05b;
}

function enemySize(enemyType: string, boss: boolean) {
  if (boss) return 25;
  if (enemyType === "tank" || enemyType === "elite") return 17;
  return 13;
}

function drawEnemyBody(graphics: Graphics, enemyId: string, enemyType: string, boss: boolean, size: number) {
  const width = size * (boss ? 2.55 : enemyType === "runner" ? 1.7 : 1.9);
  const height = size * (boss ? 2.08 : 1.5);
  const fill = enemyFillColor(enemyId, boss);
  const accent = enemyAccentColor(enemyId, boss);

  graphics.clear();

  if (boss) {
    graphics.roundRect(-width / 2, -height * 0.62, width, height, size * 0.34);
    graphics.fill({ color: 0x111111, alpha: 0.16 });
    graphics.roundRect(-width / 2, -height * 0.78, width, height, size * 0.34);
    graphics.fill({ color: fill, alpha: 1 });
    graphics.stroke({ color: 0x341815, width: 4, alpha: 0.95 });
    graphics.roundRect(-width * 0.34, -height * 0.7, width * 0.68, height * 0.34, size * 0.18);
    graphics.fill({ color: accent, alpha: 0.28 });
    graphics.moveTo(-width * 0.34, -height * 0.86);
    graphics.lineTo(-width * 0.5, -height * 1.12);
    graphics.lineTo(-width * 0.18, -height * 0.94);
    graphics.moveTo(width * 0.34, -height * 0.86);
    graphics.lineTo(width * 0.5, -height * 1.12);
    graphics.lineTo(width * 0.18, -height * 0.94);
    graphics.stroke({ color: 0x3a1712, width: 3, alpha: 0.95 });
    return;
  }

  graphics.ellipse(0, -height * 0.1, width * 0.5, height * 0.55);
  graphics.fill({ color: 0x111111, alpha: 0.14 });
  graphics.ellipse(0, -height * 0.28, width * 0.5, height * 0.56);
  graphics.fill({ color: fill, alpha: 1 });
  graphics.stroke({ color: 0x23311f, width: 2.4, alpha: 0.95 });
  graphics.ellipse(-width * 0.12, -height * 0.52, width * 0.23, height * 0.16);
  graphics.fill({ color: accent, alpha: 0.22 });

  if (enemyType === "runner") {
    graphics.moveTo(-width * 0.36, -height * 0.08);
    graphics.lineTo(-width * 0.6, height * 0.1);
    graphics.moveTo(width * 0.36, -height * 0.08);
    graphics.lineTo(width * 0.6, height * 0.1);
    graphics.stroke({ color: 0x23311f, width: 2, alpha: 0.82 });
  } else if (enemyType === "elite") {
    graphics.moveTo(0, -height * 0.86);
    graphics.lineTo(-width * 0.16, -height * 1.05);
    graphics.moveTo(0, -height * 0.86);
    graphics.lineTo(width * 0.16, -height * 1.05);
    graphics.stroke({ color: accent, width: 2, alpha: 0.8 });
  }
}

function drawEnemyEyes(graphics: Graphics, enemyType: string, boss: boolean, size: number) {
  graphics.clear();
  const eyeY = boss ? -size * 0.48 : -size * 0.42;
  const eyeRadius = boss ? size * 0.13 : Math.max(1.4, size * 0.09);
  const eyeGap = enemyType === "runner" ? size * 0.31 : size * 0.28;
  graphics.circle(-eyeGap, eyeY, eyeRadius);
  graphics.circle(eyeGap, eyeY, eyeRadius);
  graphics.fill({ color: boss ? colors.yellow : 0xf4ffe8, alpha: boss ? 1 : 0.92 });
}

export function createEnemyView(enemyId: string, enemyType: string, boss: boolean): EnemyView {
  const root = new Container();
  const shadow = new Graphics();
  const body = new Graphics();
  const eyes = new Graphics();
  const hpBackground = new Graphics();
  const hpFill = new Graphics();
  const size = enemySize(enemyType, boss);
  const hpWidth = boss ? 58 : 20;

  shadow.ellipse(0, size * 0.24, size * (boss ? 1.35 : 0.78), size * 0.24);
  shadow.fill({ color: 0x000000, alpha: boss ? 0.28 : 0.16 });

  drawEnemyBody(body, enemyId, enemyType, boss, size);
  drawEnemyEyes(eyes, enemyType, boss, size);

  hpBackground.y = boss ? -42 : -20;
  hpBackground.roundRect(-hpWidth / 2, 0, hpWidth, boss ? 5 : 2, 2);
  hpBackground.fill({ color: 0x2a1515, alpha: boss ? 0.9 : 0.34 });

  hpFill.y = hpBackground.y;
  hpFill.roundRect(-hpWidth / 2, 0, hpWidth, boss ? 5 : 2, 2);
  hpFill.fill({ color: boss ? colors.red : 0x6fd15f, alpha: boss ? 1 : 0.52 });

  root.addChild(shadow, body, eyes, hpBackground, hpFill);
  return { root, shadow, body, eyes, hpBackground, hpFill, hpWidth, boss };
}

export function updateEnemyViewPosition(view: EnemyView, x: number, y: number, progress: number) {
  view.root.x = x;
  view.root.y = y;
  view.root.rotation = Math.sin(progress * 16) * (view.boss ? 0.025 : 0.035);
}

export function updateEnemyViewHp(view: EnemyView, hp: number, maxHp: number) {
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  const height = view.boss ? 5 : 2;
  view.hpFill.clear();
  view.hpFill.y = view.boss ? -42 : -20;
  view.hpFill.roundRect(-view.hpWidth / 2, 0, view.hpWidth * ratio, height, 2);
  view.hpFill.fill({ color: view.boss ? colors.red : 0x6fd15f, alpha: view.boss ? 1 : 0.52 });
}

export function destroyEnemyView(view: EnemyView) {
  view.root.parent?.removeChild(view.root);
  view.root.destroy({ children: true });
}

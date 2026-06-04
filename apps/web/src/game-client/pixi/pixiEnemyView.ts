import { Container, Graphics } from "pixi.js";
import { colors } from "./gameTheme";

export type EnemyView = {
  root: Container;
  body: Graphics;
  eyes: Graphics;
  hpBackground: Graphics;
  hpFill: Graphics;
  hpWidth: number;
  boss: boolean;
};

function enemyFillColor(enemyId: string, boss: boolean) {
  if (enemyId === "ping-runner") return 0x56c8ff;
  if (enemyId === "lag-chunk") return 0x8b7d69;
  if (enemyId === "elite-bug") return 0xa45bd8;
  return boss ? 0x8b3d34 : 0x54b336;
}

function enemySize(enemyType: string, boss: boolean) {
  if (boss) return 24;
  if (enemyType === "tank" || enemyType === "elite") return 16;
  return 12;
}

export function createEnemyView(enemyId: string, enemyType: string, boss: boolean): EnemyView {
  const root = new Container();
  const body = new Graphics();
  const eyes = new Graphics();
  const hpBackground = new Graphics();
  const hpFill = new Graphics();
  const size = enemySize(enemyType, boss);
  const hpWidth = boss ? 56 : 32;

  body.roundRect(-size * (boss ? 1.25 : 1), -size * 0.85, size * (boss ? 2.5 : 2), size * (boss ? 2.1 : 1.7), size * 0.4);
  body.fill({ color: enemyFillColor(enemyId, boss), alpha: 1 });
  body.stroke({ color: 0x2b331d, width: boss ? 4 : 2 });

  eyes.circle(-size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eyes.circle(size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eyes.fill({ color: boss ? colors.yellow : colors.white, alpha: 1 });

  hpBackground.y = boss ? -38 : -24;
  hpBackground.roundRect(-hpWidth / 2, 0, hpWidth, 5, 3);
  hpBackground.fill({ color: 0x2a1515, alpha: 0.9 });

  hpFill.y = hpBackground.y;
  hpFill.roundRect(-hpWidth / 2, 0, hpWidth, 5, 3);
  hpFill.fill({ color: boss ? colors.red : colors.green, alpha: 1 });

  root.addChild(body, eyes, hpBackground, hpFill);
  return { root, body, eyes, hpBackground, hpFill, hpWidth, boss };
}

export function updateEnemyViewPosition(view: EnemyView, x: number, y: number, progress: number) {
  view.root.x = x;
  view.root.y = y;
  view.root.rotation = Math.sin(progress * 24) * (view.boss ? 0.04 : 0.08);
}

export function updateEnemyViewHp(view: EnemyView, hp: number, maxHp: number) {
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  view.hpFill.clear();
  view.hpFill.y = view.boss ? -38 : -24;
  view.hpFill.roundRect(-view.hpWidth / 2, 0, view.hpWidth * ratio, 5, 3);
  view.hpFill.fill({ color: view.boss ? colors.red : colors.green, alpha: 1 });
}

export function destroyEnemyView(view: EnemyView) {
  view.root.parent?.removeChild(view.root);
  view.root.destroy({ children: true });
}

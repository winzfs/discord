import { Container, Graphics } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import { getHeroById } from "@discord-random-defense/game";
import { colors, gradeColor } from "./gameTheme";

export type BoardMetrics = {
  cols: number;
  rows: number;
  cell: number;
  gap: number;
  startX: number;
  startY: number;
};

export type BoardPointerHandlers = {
  canDrag: boolean;
  onCellPointerDown: (cellIndex: number, globalX: number, globalY: number, cellSize: number) => void;
};

function roleAccent(role: string | undefined) {
  if (role === "tank") return 0x87b7ff;
  if (role === "support") return 0x7dffb2;
  return 0xffd166;
}

function heroAccent(heroId: string, fallback: number) {
  if (heroId.includes("spark")) return 0xfff06a;
  if (heroId.includes("guard") || heroId.includes("knight") || heroId.includes("bastion") || heroId.includes("anchor")) return 0x7eb6ff;
  if (heroId.includes("medic") || heroId.includes("mender")) return 0x86ffc3;
  if (heroId.includes("pulse") || heroId.includes("ranger") || heroId.includes("sharpshooter")) return 0xffb45c;
  if (heroId.includes("mage") || heroId.includes("storm")) return 0xa97cff;
  if (heroId.includes("tech") || heroId.includes("overclock")) return 0x61e8ff;
  if (heroId.includes("hacker") || heroId.includes("treasure")) return 0x83ff72;
  if (heroId.includes("railgun")) return 0xff6d7a;
  return fallback;
}

function drawWeapon(target: Container, heroId: string, cell: number, scale: number, accent: number) {
  const weapon = new Graphics();

  if (heroId.includes("ranger") || heroId.includes("sharpshooter") || heroId.includes("railgun")) {
    weapon.roundRect(cell * 0.08 * scale, -cell * 0.04 * scale, cell * 0.3 * scale, cell * 0.07 * scale, cell * 0.03 * scale);
    weapon.fill({ color: heroId.includes("railgun") ? 0xdde8ff : 0x2f2f35, alpha: 1 });
    weapon.circle(cell * 0.38 * scale, -cell * 0.01 * scale, cell * 0.035 * scale);
    weapon.fill({ color: accent, alpha: 1 });
  } else if (heroId.includes("mage") || heroId.includes("storm")) {
    weapon.moveTo(0, -cell * 0.42 * scale).lineTo(cell * 0.08 * scale, -cell * 0.28 * scale).lineTo(-cell * 0.08 * scale, -cell * 0.28 * scale);
    weapon.fill({ color: accent, alpha: 0.95 });
    weapon.circle(0, -cell * 0.47 * scale, cell * 0.05 * scale);
    weapon.fill({ color: 0xffffff, alpha: 0.9 });
  } else if (heroId.includes("guard") || heroId.includes("knight") || heroId.includes("bastion") || heroId.includes("anchor")) {
    weapon.roundRect(-cell * 0.36 * scale, -cell * 0.08 * scale, cell * 0.13 * scale, cell * 0.3 * scale, cell * 0.04 * scale);
    weapon.fill({ color: accent, alpha: 0.95 });
    weapon.stroke({ color: colors.black, width: Math.max(1.5, 2 * scale), alpha: 0.6 });
  } else if (heroId.includes("medic") || heroId.includes("mender")) {
    weapon.roundRect(-cell * 0.27 * scale, -cell * 0.05 * scale, cell * 0.13 * scale, cell * 0.13 * scale, cell * 0.03 * scale);
    weapon.fill({ color: 0xffffff, alpha: 1 });
    weapon.rect(-cell * 0.235 * scale, -cell * 0.02 * scale, cell * 0.06 * scale, cell * 0.015 * scale);
    weapon.rect(-cell * 0.212 * scale, -cell * 0.043 * scale, cell * 0.015 * scale, cell * 0.06 * scale);
    weapon.fill({ color: accent, alpha: 1 });
  } else if (heroId.includes("tech") || heroId.includes("hacker") || heroId.includes("overclock") || heroId.includes("treasure")) {
    weapon.roundRect(cell * 0.16 * scale, -cell * 0.12 * scale, cell * 0.15 * scale, cell * 0.18 * scale, cell * 0.04 * scale);
    weapon.fill({ color: 0x1b2631, alpha: 1 });
    weapon.circle(cell * 0.235 * scale, -cell * 0.03 * scale, cell * 0.025 * scale);
    weapon.fill({ color: accent, alpha: 1 });
  } else {
    weapon.circle(cell * 0.22 * scale, -cell * 0.02 * scale, cell * 0.055 * scale);
    weapon.fill({ color: accent, alpha: 1 });
  }

  target.addChild(weapon);
}

export function drawUnitShape(target: Container, hero: Pick<BoardHero, "grade" | "heroId">, cell: number, scale = 1) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const accent = heroAccent(hero.heroId, roleAccent(role));
  const baseColor = gradeColor(hero.grade);

  const shadow = new Graphics();
  shadow.ellipse(0, cell * 0.24 * scale, cell * 0.2 * scale, cell * 0.06 * scale);
  shadow.fill({ color: 0x244f1e, alpha: 0.28 });
  target.addChild(shadow);

  if (role === "support" || hero.grade === "mythic") {
    const aura = new Graphics();
    aura.circle(0, 0, cell * (hero.grade === "mythic" ? 0.36 : 0.31) * scale);
    aura.stroke({ color: accent, width: Math.max(2, 3 * scale), alpha: hero.grade === "mythic" ? 0.85 : 0.58 });
    target.addChild(aura);
  }

  const body = new Graphics();
  if (role === "tank") {
    body.roundRect(-cell * 0.26 * scale, -cell * 0.12 * scale, cell * 0.52 * scale, cell * 0.45 * scale, cell * 0.1 * scale);
  } else if (role === "support") {
    body.circle(0, cell * 0.02 * scale, cell * 0.21 * scale);
  } else if (hero.heroId.includes("mage") || hero.heroId.includes("storm")) {
    body.moveTo(0, -cell * 0.28 * scale)
      .lineTo(cell * 0.27 * scale, cell * 0.23 * scale)
      .lineTo(-cell * 0.27 * scale, cell * 0.23 * scale)
      .lineTo(0, -cell * 0.28 * scale);
  } else {
    body.moveTo(0, -cell * 0.24 * scale)
      .lineTo(cell * 0.24 * scale, cell * 0.2 * scale)
      .lineTo(-cell * 0.24 * scale, cell * 0.2 * scale)
      .lineTo(0, -cell * 0.24 * scale);
  }
  body.fill({ color: baseColor, alpha: 1 });
  body.stroke({ color: colors.black, width: Math.max(2, 3 * scale), alpha: 0.58 });
  target.addChild(body);

  const trim = new Graphics();
  trim.circle(0, cell * 0.08 * scale, cell * 0.07 * scale);
  trim.fill({ color: accent, alpha: 0.9 });
  target.addChild(trim);

  const head = new Graphics();
  head.circle(0, -cell * 0.2 * scale, cell * 0.13 * scale);
  head.fill({ color: 0xffd0a6, alpha: 1 });
  head.stroke({ color: colors.black, width: Math.max(1.5, 2 * scale), alpha: 0.56 });
  target.addChild(head);

  drawWeapon(target, hero.heroId, cell, scale, accent);

  if (hero.grade === "mythic") {
    const halo = new Graphics();
    halo.circle(0, -cell * 0.04 * scale, cell * 0.39 * scale);
    halo.stroke({ color: colors.yellow, width: Math.max(2, 4 * scale), alpha: 0.88 });
    halo.circle(0, -cell * 0.04 * scale, cell * 0.27 * scale);
    halo.stroke({ color: accent, width: Math.max(1.5, 2.5 * scale), alpha: 0.7 });
    target.addChild(halo);
  }
}

export function createUnitGhost(hero: Pick<BoardHero, "grade" | "heroId">, cell: number, alpha = 0.92) {
  const ghost = new Container();
  ghost.alpha = alpha;
  drawUnitShape(ghost, hero, cell, 0.94);
  return ghost;
}

function getStackOffset(stackCount: number, index: number, cell: number) {
  if (stackCount <= 1) return { x: 0, y: 0, scale: 1 };
  if (stackCount === 2) return index === 0 ? { x: -cell * 0.16, y: cell * 0.02, scale: 0.82 } : { x: cell * 0.16, y: cell * 0.02, scale: 0.82 };
  if (index === 0) return { x: 0, y: -cell * 0.15, scale: 0.74 };
  if (index === 1) return { x: -cell * 0.17, y: cell * 0.13, scale: 0.74 };
  return { x: cell * 0.17, y: cell * 0.13, scale: 0.74 };
}

function drawUnitMarker(target: Container, x: number, y: number, cell: number, hero: BoardHero, stackCount: number, stackIndex: number) {
  const offset = getStackOffset(stackCount, stackIndex, cell);
  const marker = new Container();
  marker.x = x + cell / 2 + offset.x;
  marker.y = y + cell * 0.48 + offset.y;
  drawUnitShape(marker, hero, cell, offset.scale);
  target.addChild(marker);
}

export function drawBoardCells(target: Container, board: Array<{ units: BoardHero[] }>, metrics: BoardMetrics, canMergeCell: (cellIndex: number) => boolean, handlers: BoardPointerHandlers) {
  target.removeChildren();

  board.forEach((boardCell, index) => {
    const row = Math.floor(index / metrics.cols);
    const col = index % metrics.cols;
    const x = metrics.startX + col * (metrics.cell + metrics.gap);
    const y = metrics.startY + row * (metrics.cell + metrics.gap);
    const units = boardCell.units;
    const firstUnit = units[0];
    const canMerge = canMergeCell(index);

    const cell = new Graphics();
    cell.roundRect(x, y, metrics.cell, metrics.cell, 12);
    cell.fill({ color: units.length > 0 ? 0x6ac144 : 0x539832, alpha: units.length > 0 ? 0.96 : 0.45 });
    cell.stroke({ color: canMerge ? colors.yellow : firstUnit ? gradeColor(firstUnit.grade) : 0x3e7629, width: units.length >= 3 ? 4 : units.length > 0 ? 3 : 2, alpha: 0.9 });
    target.addChild(cell);

    units.forEach((unit, unitIndex) => drawUnitMarker(target, x, y, metrics.cell, unit, units.length, unitIndex));

    const hit = new Graphics();
    hit.roundRect(x, y, metrics.cell, metrics.cell, 12);
    hit.fill({ color: 0xffffff, alpha: 0.001 });
    hit.eventMode = units.length > 0 && handlers.canDrag ? "static" : "none";
    hit.cursor = units.length > 0 && handlers.canDrag ? "grab" : "default";
    hit.on("pointerdown", (event: any) => {
      event.stopPropagation();
      handlers.onCellPointerDown(index, event.global.x, event.global.y, metrics.cell);
    });
    target.addChild(hit);
  });
}

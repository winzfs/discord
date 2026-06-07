import { Container, Graphics } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import { getHeroById } from "@discord-random-defense/game";
import { colors, gradeColor } from "./gameTheme";
import { canDrawHeroSprite, drawHeroSprite } from "./pixiHeroSpriteView";
import type { HeroSpriteAttackState, HeroSpriteOffsetState, MythicUltimateChargeState } from "./pixiGameTypes";

export type BoardMetrics = {
  cols: number;
  rows: number;
  cell: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  startX: number;
  startY: number;
};

export type BoardPointerHandlers = {
  canDrag: boolean;
  onCellPointerDown: (cellIndex: number, globalX: number, globalY: number, cellSize: number) => void;
};

export type BoardRenderState = {
  heroSpriteAttacks: Record<string, HeroSpriteAttackState>;
  heroSpriteOffsets?: Record<string, HeroSpriteOffsetState>;
  mythicUltimateCharges?: Record<string, MythicUltimateChargeState>;
  now: number;
};

type DrawableBoardHero = Pick<BoardHero, "grade" | "heroId"> & Partial<Pick<BoardHero, "instanceId">>;

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

function drawFallbackUnitShape(target: Container, hero: Pick<BoardHero, "grade" | "heroId">, cell: number, scale = 1) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const accent = heroAccent(hero.heroId, roleAccent(role));
  const baseColor = gradeColor(hero.grade);

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

export function drawUnitShape(
  target: Container,
  hero: DrawableBoardHero,
  cell: number,
  scale = 1,
  renderState?: BoardRenderState,
) {
  const attackState = hero.instanceId ? renderState?.heroSpriteAttacks[hero.instanceId] : null;
  if (canDrawHeroSprite(hero) && drawHeroSprite(target, hero, cell, scale, attackState, renderState?.now)) return;
  drawFallbackUnitShape(target, hero, cell, scale);
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

function drawCellUnitShadow(target: Container, x: number, y: number, cellWidth: number, cellHeight: number, cell: number, hero: BoardHero) {
  const centerX = x + cellWidth / 2;
  const centerY = y + cellHeight * 0.78;

  if (hero.grade === "mythic") {
    const glowOuter = new Graphics();
    glowOuter.ellipse(centerX, centerY, cell * 0.76, cell * 0.33);
    glowOuter.fill({ color: colors.mythicGlow, alpha: 0.24 });
    target.addChild(glowOuter);

    const glowMid = new Graphics();
    glowMid.ellipse(centerX, centerY, cell * 0.62, cell * 0.27);
    glowMid.fill({ color: 0xffa12d, alpha: 0.34 });
    target.addChild(glowMid);

    const glowInner = new Graphics();
    glowInner.ellipse(centerX, centerY, cell * 0.52, cell * 0.22);
    glowInner.fill({ color: colors.mythicGlow, alpha: 0.48 });
    target.addChild(glowInner);
  }

  const base = new Graphics();
  base.ellipse(centerX, centerY, cell * 0.44, cell * 0.18);
  base.fill({ color: gradeColor(hero.grade), alpha: hero.grade === "mythic" ? 0.92 : 0.78 });
  if (hero.grade === "mythic") {
    base.stroke({ color: colors.mythicGlow, width: Math.max(2, cell * 0.045), alpha: 0.94 });
  }
  target.addChild(base);
}

function drawUltimateChargeBar(target: Container, hero: BoardHero, cell: number, scale: number, renderState?: BoardRenderState) {
  if (hero.grade !== "mythic") return;

  const charge = hero.instanceId ? (renderState?.mythicUltimateCharges?.[hero.instanceId]?.charge ?? 0) : 0;
  const ratio = Math.max(0, Math.min(1, charge / 100));
  const width = cell * 0.58 * scale;
  const height = Math.max(3, cell * 0.055 * scale);
  const x = -width / 2;
  const y = cell * 0.43 * scale;
  const bar = new Graphics();

  bar.roundRect(x, y, width, height, height / 2);
  bar.fill({ color: 0x19140b, alpha: 0.82 });
  bar.stroke({ color: colors.black, width: 1.2, alpha: 0.55 });

  if (ratio > 0) {
    bar.roundRect(x, y, width * ratio, height, height / 2);
    bar.fill({ color: ratio >= 1 ? 0xfff06a : 0xffc857, alpha: 0.98 });
  }

  target.addChild(bar);
}

function getTransientSpriteOffset(hero: BoardHero, renderState?: BoardRenderState) {
  if (!hero.instanceId || !renderState) return { x: 0, y: 0 };

  const offset = renderState.heroSpriteOffsets?.[hero.instanceId];
  if (!offset || offset.until <= renderState.now) return { x: 0, y: 0 };

  return { x: offset.x, y: offset.y };
}

function drawUnitMarker(
  target: Container,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number,
  hero: BoardHero,
  stackCount: number,
  stackIndex: number,
  renderState?: BoardRenderState,
) {
  const unitCell = Math.min(cellWidth, cellHeight);
  const offset = getStackOffset(stackCount, stackIndex, unitCell);
  const transientOffset = getTransientSpriteOffset(hero, renderState);
  const marker = new Container();
  marker.x = x + cellWidth / 2 + offset.x + transientOffset.x;
  marker.y = y + cellHeight * 0.48 + offset.y + transientOffset.y;
  drawUnitShape(marker, hero, unitCell, offset.scale, renderState);
  drawUltimateChargeBar(marker, hero, unitCell, offset.scale, renderState);
  target.addChild(marker);
}

export function drawBoardCells(
  target: Container,
  board: Array<{ units: BoardHero[] }>,
  metrics: BoardMetrics,
  canMergeCell: (cellIndex: number) => boolean,
  handlers: BoardPointerHandlers,
  renderState?: BoardRenderState,
) {
  target.removeChildren();

  board.forEach((boardCell, index) => {
    const row = Math.floor(index / metrics.cols);
    const col = index % metrics.cols;
    const x = metrics.startX + col * (metrics.cellWidth + metrics.gap);
    const y = metrics.startY + row * (metrics.cellHeight + metrics.gap);
    const units = boardCell.units;
    const canMerge = canMergeCell(index);

    if (canMerge) {
      const mergeHint = new Graphics();
      mergeHint.ellipse(x + metrics.cellWidth / 2, y + metrics.cellHeight * 0.78, metrics.cell * 0.34, metrics.cell * 0.1);
      mergeHint.fill({ color: colors.yellow, alpha: 0.5 });
      target.addChild(mergeHint);
    }

    if (units.length > 0) {
      drawCellUnitShadow(target, x, y, metrics.cellWidth, metrics.cellHeight, metrics.cell, units[0]);
    }

    units.forEach((unit, unitIndex) => drawUnitMarker(target, x, y, metrics.cellWidth, metrics.cellHeight, unit, units.length, unitIndex, renderState));

    const hit = new Graphics();
    hit.roundRect(x, y, metrics.cellWidth, metrics.cellHeight, 12);
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

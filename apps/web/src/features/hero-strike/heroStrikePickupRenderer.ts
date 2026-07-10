import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikePickup, HeroStrikeState, PickupKind } from "./heroStrikeTypes";

function diamondPath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}

function pickupColor(kind: PickupKind) {
  if (kind === "heal") return HERO_STRIKE_COLORS.green;
  if (kind === "charge") return HERO_STRIKE_COLORS.gold;
  if (kind === "shield") return HERO_STRIKE_COLORS.shield;
  if (kind === "bomb" || kind === "missile") return HERO_STRIKE_COLORS.orange;
  if (kind === "support-drone") return HERO_STRIKE_COLORS.lime;
  if (kind === "time-warp" || kind === "xp-core") return HERO_STRIKE_COLORS.xp;
  return HERO_STRIKE_COLORS.purple;
}

function drawXpPickup(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  const pulse = 1 + Math.sin(pickup.life * 8 + pickup.id) * 0.08;
  const radius = pickup.radius * pulse;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.fillRect(pickup.x - 1.5, pickup.y + radius, 3, 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(2,18,34,.96)";
  diamondPath(ctx, pickup.x, pickup.y, radius + 3);
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  diamondPath(ctx, pickup.x, pickup.y, radius);
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  diamondPath(ctx, pickup.x, pickup.y, radius * 0.34);
  ctx.fill();
}

function drawHeal(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.fillRect(pickup.x - 2, pickup.y - 7, 4, 14);
  ctx.fillRect(pickup.x - 7, pickup.y - 2, 14, 4);
}

function drawCharge(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.beginPath();
  ctx.moveTo(pickup.x + 2, pickup.y - 8);
  ctx.lineTo(pickup.x - 5, pickup.y + 1);
  ctx.lineTo(pickup.x, pickup.y + 1);
  ctx.lineTo(pickup.x - 2, pickup.y + 9);
  ctx.lineTo(pickup.x + 6, pickup.y - 2);
  ctx.lineTo(pickup.x + 1, pickup.y - 2);
  ctx.closePath();
  ctx.fill();
}

function drawShield(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.beginPath();
  ctx.moveTo(pickup.x, pickup.y - 8);
  ctx.lineTo(pickup.x + 7, pickup.y - 4);
  ctx.lineTo(pickup.x + 5, pickup.y + 5);
  ctx.lineTo(pickup.x, pickup.y + 9);
  ctx.lineTo(pickup.x - 5, pickup.y + 5);
  ctx.lineTo(pickup.x - 7, pickup.y - 4);
  ctx.closePath();
  ctx.stroke();
}

function drawBomb(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.beginPath();
  ctx.arc(pickup.x, pickup.y + 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pickup.x + 3, pickup.y - 4);
  ctx.lineTo(pickup.x + 7, pickup.y - 8);
  ctx.stroke();
}

function drawOverdrive(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const radius = index % 2 === 0 ? 8 : 3.5;
    const angle = -Math.PI / 2 + index * Math.PI / 4;
    const x = pickup.x + Math.cos(angle) * radius;
    const y = pickup.y + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawMissile(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.beginPath();
  ctx.moveTo(pickup.x, pickup.y - 9);
  ctx.lineTo(pickup.x + 5, pickup.y + 4);
  ctx.lineTo(pickup.x, pickup.y + 1);
  ctx.lineTo(pickup.x - 5, pickup.y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(pickup.x - 1.5, pickup.y + 4, 3, 5);
}

function drawSupportDrone(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.fillRect(pickup.x - 4, pickup.y - 4, 8, 8);
  ctx.fillRect(pickup.x - 10, pickup.y - 2, 5, 4);
  ctx.fillRect(pickup.x + 5, pickup.y - 2, 5, 4);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.fillRect(pickup.x - 1, pickup.y - 1, 2, 2);
}

function drawTimeWarp(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  ctx.beginPath();
  ctx.arc(pickup.x, pickup.y, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pickup.x, pickup.y);
  ctx.lineTo(pickup.x, pickup.y - 5);
  ctx.moveTo(pickup.x, pickup.y);
  ctx.lineTo(pickup.x + 4, pickup.y + 2);
  ctx.stroke();
}

function drawXpCore(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  diamondPath(ctx, pickup.x, pickup.y, 8);
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  diamondPath(ctx, pickup.x, pickup.y, 3.2);
  ctx.fill();
}

function drawSpecialIcon(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  if (pickup.kind === "heal") drawHeal(ctx, pickup);
  else if (pickup.kind === "charge") drawCharge(ctx, pickup);
  else if (pickup.kind === "shield") drawShield(ctx, pickup);
  else if (pickup.kind === "bomb") drawBomb(ctx, pickup);
  else if (pickup.kind === "overdrive") drawOverdrive(ctx, pickup);
  else if (pickup.kind === "missile") drawMissile(ctx, pickup);
  else if (pickup.kind === "support-drone") drawSupportDrone(ctx, pickup);
  else if (pickup.kind === "time-warp") drawTimeWarp(ctx, pickup);
  else drawXpCore(ctx, pickup);
}

function drawSpecialPickup(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  const color = pickupColor(pickup.kind);
  const radius = pickup.radius + Math.sin(pickup.life * 5 + pickup.id) * 0.8;
  ctx.fillStyle = "rgba(2,10,24,.94)";
  ctx.strokeStyle = color;
  ctx.lineWidth = pickup.kind === "xp-core" ? 3.2 : 2.5;
  ctx.beginPath();
  ctx.arc(pickup.x, pickup.y, radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  drawSpecialIcon(ctx, pickup);
}

export function drawHeroStrikePickups(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  for (const pickup of state.pickups) {
    if (pickup.kind === "xp") drawXpPickup(ctx, pickup);
    else drawSpecialPickup(ctx, pickup);
  }
}
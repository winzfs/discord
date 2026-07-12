import { getTracerImage } from "./heroStrikeAssets";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { getHeroStrikeLobbySnapshot } from "./heroStrikeLobbyData";
import type { HeroStrikeState } from "./heroStrikeTypes";

type LobbySnapshot = ReturnType<typeof getHeroStrikeLobbySnapshot>;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawHeroSilhouette(ctx: CanvasRenderingContext2D) {
  const image = getTracerImage();
  if (!image?.complete || image.naturalWidth <= 0) return;
  const frameHeight = image.naturalHeight / 4;
  const targetHeight = 250;
  const targetWidth = image.naturalWidth * (targetHeight / frameHeight);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    frameHeight,
    326 - targetWidth / 2,
    70,
    targetWidth,
    targetHeight,
  );
  ctx.restore();
}

function drawOperationCard(ctx: CanvasRenderingContext2D, snapshot: LobbySnapshot) {
  const mission = snapshot.mission;
  roundedRect(ctx, 22, 248, 376, 148, 17);
  ctx.fillStyle = "rgba(5,16,31,.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.28)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "1000 8px system-ui";
  ctx.fillText("CURRENT OPERATION", 38, 270);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 21px system-ui";
  ctx.fillText(mission.name, 38, 296);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 8px system-ui";
  ctx.fillText(mission.subtitle, 38, 312);

  const chips = [
    ["MISSION", `${mission.encounters} ENCOUNTERS`, HERO_STRIKE_COLORS.cyan],
    ["BOSS", mission.bossName, HERO_STRIKE_COLORS.red],
    ["ETA", `~${mission.estimatedMinutes} MIN`, HERO_STRIKE_COLORS.gold],
  ] as const;
  chips.forEach(([label, value, accent], index) => {
    const x = 38 + index * 116;
    roundedRect(ctx, x, 330, 108, 47, 10);
    ctx.fillStyle = "rgba(255,255,255,.035)";
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.font = "1000 6px system-ui";
    ctx.fillText(label, x + 9, 344);
    ctx.fillStyle = HERO_STRIKE_COLORS.white;
    ctx.font = "900 8px system-ui";
    ctx.fillText(value, x + 9, 362);
  });
}

function drawSystemChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
  title: string,
  subtitle: string,
  accent: string,
) {
  roundedRect(ctx, x, y, 180, 54, 12);
  ctx.fillStyle = "rgba(5,15,29,.88)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "1000 18px system-ui";
  ctx.fillText(icon, x + 12, y + 31);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 8px system-ui";
  ctx.fillText(title, x + 42, y + 21);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 7px system-ui";
  ctx.fillText(subtitle, x + 42, y + 37);
}

function drawSystemGrid(ctx: CanvasRenderingContext2D) {
  drawSystemChip(ctx, 22, 414, "◎", "MISSION OBJECTIVES", "SWEEP · HOLD · INTERCEPT", HERO_STRIKE_COLORS.cyan);
  drawSystemChip(ctx, 218, 414, "◆", "TACTICAL BUILDS", "무기 태그와 진화 경로", HERO_STRIKE_COLORS.orange);
  drawSystemChip(ctx, 22, 478, "⬡", "BOSS CORE", "패턴 공략과 BREAK", HERO_STRIKE_COLORS.purple);
  drawSystemChip(ctx, 218, 478, "⌁", "FIELD ARMORY", "SALVAGE 구역 정비", HERO_STRIKE_COLORS.lime);
}

function drawBlueprintCard(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
  snapshot: LobbySnapshot,
) {
  roundedRect(ctx, 22, 548, 376, 72, 13);
  ctx.fillStyle = "rgba(5,15,29,.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(187,134,252,.22)";
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.purple;
  ctx.font = "1000 8px system-ui";
  ctx.fillText(`BLUEPRINT RANK ${snapshot.blueprint.rank}`, 36, 568);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 9px system-ui";
  ctx.fillText(snapshot.blueprint.nextTitle, 36, 585);

  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 8px system-ui";
  ctx.fillText(`${snapshot.blueprint.unlocked}/${snapshot.blueprint.total} UNLOCKED`, 384, 568);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 7px system-ui";
  ctx.fillText(`BEST ${state.highScore.toLocaleString()}`, 384, 585);

  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(36, 600, 348, 6);
  const fill = ctx.createLinearGradient(36, 0, 384, 0);
  fill.addColorStop(0, HERO_STRIKE_COLORS.cyan);
  fill.addColorStop(1, HERO_STRIKE_COLORS.purple);
  ctx.fillStyle = fill;
  ctx.fillRect(36, 600, 348 * snapshot.blueprint.ratio, 6);
  ctx.textAlign = "left";
}

export function drawHeroStrikeTitlePanels(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
  snapshot: LobbySnapshot,
) {
  drawHeroSilhouette(ctx);
  drawOperationCard(ctx, snapshot);
  drawSystemGrid(ctx);
  drawBlueprintCard(ctx, state, snapshot);
  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 7px system-ui";
  ctx.fillText("OMNIC TACTICAL NETWORK // AUTHORIZED PILOT", 22, 736);
  ctx.textAlign = "right";
  ctx.fillText(`DATA ${snapshot.blueprint.data}`, HERO_STRIKE_WIDTH - 22, 736);
  ctx.textAlign = "left";
}

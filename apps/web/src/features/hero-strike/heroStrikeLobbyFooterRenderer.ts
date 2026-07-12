import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { getHeroStrikeLobbySnapshot } from "./heroStrikeLobbyData";
import {
  HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS,
  HERO_STRIKE_LOBBY_BLUEPRINT_BOUNDS,
  HERO_STRIKE_LOBBY_SLOT_BOUNDS,
  type HeroStrikeRect,
} from "./heroStrikeLoadoutLayout";
import type { HeroStrikeState } from "./heroStrikeTypes";

type LobbySnapshot = ReturnType<typeof getHeroStrikeLobbySnapshot>;

function roundedRect(ctx: CanvasRenderingContext2D, bounds: HeroStrikeRect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
}

function drawLoadoutSlots(ctx: CanvasRenderingContext2D, snapshot: LobbySnapshot) {
  snapshot.slots.forEach((slot, index) => {
    const bounds = HERO_STRIKE_LOBBY_SLOT_BOUNDS[index];
    roundedRect(ctx, bounds, 10);
    ctx.fillStyle = "rgba(5,15,29,.9)";
    ctx.fill();
    ctx.strokeStyle = slot.accent;
    ctx.globalAlpha = 0.28;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.fillStyle = slot.accent;
    ctx.font = "1000 6px system-ui";
    ctx.fillText(slot.label, bounds.x + 8, bounds.y + 13);
    ctx.fillStyle = slot.accent;
    ctx.font = "1000 17px system-ui";
    ctx.fillText(slot.option.icon, bounds.x + 8, bounds.y + 36);
    ctx.fillStyle = HERO_STRIKE_COLORS.white;
    ctx.font = "900 9px system-ui";
    ctx.fillText(slot.option.title, bounds.x + 31, bounds.y + 34);
    ctx.fillStyle = HERO_STRIKE_COLORS.muted;
    ctx.font = "700 6px system-ui";
    ctx.fillText(slot.option.metric, bounds.x + 8, bounds.y + 52);
  });
}

function drawBlueprintProgress(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
  snapshot: LobbySnapshot,
) {
  const bounds = HERO_STRIKE_LOBBY_BLUEPRINT_BOUNDS;
  roundedRect(ctx, bounds, 13);
  ctx.fillStyle = "rgba(5,15,29,.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.2)";
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "1000 8px system-ui";
  ctx.fillText(`BLUEPRINT NETWORK · RANK ${snapshot.blueprint.rank}`, bounds.x + 12, bounds.y + 17);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 10px system-ui";
  ctx.fillText(
    snapshot.blueprint.nextTitle === "ALL BLUEPRINTS UNLOCKED"
      ? snapshot.blueprint.nextTitle
      : `NEXT · RANK ${snapshot.blueprint.nextRank} ${snapshot.blueprint.nextTitle}`,
    bounds.x + 12,
    bounds.y + 35,
  );

  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 8px system-ui";
  ctx.fillText(
    `${snapshot.blueprint.unlocked}/${snapshot.blueprint.total} UNLOCKED`,
    bounds.x + bounds.width - 12,
    bounds.y + 17,
  );
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 7px system-ui";
  ctx.fillText(`BEST ${state.highScore.toLocaleString()}`, bounds.x + bounds.width - 12, bounds.y + 35);

  const barX = bounds.x + 12;
  const barY = bounds.y + 48;
  const barWidth = bounds.width - 24;
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(barX, barY, barWidth, 7);
  const progress = snapshot.blueprint.nextTitle === "ALL BLUEPRINTS UNLOCKED" ? 1 : snapshot.blueprint.ratio;
  const bar = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  bar.addColorStop(0, HERO_STRIKE_COLORS.cyan);
  bar.addColorStop(1, HERO_STRIKE_COLORS.purple);
  ctx.fillStyle = bar;
  ctx.fillRect(barX, barY, barWidth * progress, 7);

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 7px system-ui";
  ctx.fillText(
    snapshot.blueprint.nextTitle === "ALL BLUEPRINTS UNLOCKED"
      ? `DATA ${snapshot.blueprint.data} · NETWORK COMPLETE`
      : `RESEARCH DATA ${snapshot.blueprint.data} / ${snapshot.blueprint.nextData}`,
    barX,
    bounds.y + 72,
  );
  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 7px system-ui";
  ctx.fillText("MISSIONS · BUILDS · CORES · ARMORY", bounds.x + bounds.width - 12, bounds.y + 72);
  ctx.textAlign = "left";
}

function drawDeployPanel(ctx: CanvasRenderingContext2D, snapshot: LobbySnapshot) {
  const bounds = HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS;
  const legend = snapshot.mission.threatLabel === "EXTREME";
  roundedRect(ctx, bounds, 17);
  const fill = ctx.createLinearGradient(bounds.x, 0, bounds.x + bounds.width, 0);
  fill.addColorStop(0, legend ? "#ff5f6d" : "#ff8a32");
  fill.addColorStop(1, legend ? "#c8417b" : "#ffd166");
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.42)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(17,24,39,.72)";
  ctx.font = "1000 7px system-ui";
  ctx.fillText(
    `${snapshot.mission.operationCode} · ${snapshot.mission.name} · ${snapshot.mission.threatLabel}`,
    bounds.x + 18,
    bounds.y + 19,
  );
  ctx.fillStyle = "#101827";
  ctx.font = "1000 23px system-ui";
  ctx.fillText(legend ? "DEPLOY: LEGEND" : "DEPLOY OPERATION", bounds.x + 18, bounds.y + 45);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(17,24,39,.76)";
  ctx.font = "1000 8px system-ui";
  ctx.fillText(`SCORE ×${snapshot.mission.scoreMultiplier.toFixed(2)}`, bounds.x + bounds.width - 44, bounds.y + 22);
  ctx.fillText(`DATA ×${snapshot.mission.researchMultiplier.toFixed(2)}`, bounds.x + bounds.width - 44, bounds.y + 38);

  ctx.fillStyle = "#101827";
  ctx.font = "1000 26px system-ui";
  ctx.fillText("››", bounds.x + bounds.width - 14, bounds.y + 43);
  ctx.textAlign = "left";

  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 7px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("장비 구성을 확인하고 터치하여 출격", HERO_STRIKE_WIDTH / 2, 744);
  ctx.textAlign = "left";
}

export function drawHeroStrikeLobbyFooter(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
  snapshot: LobbySnapshot,
) {
  drawLoadoutSlots(ctx, snapshot);
  drawBlueprintProgress(ctx, state, snapshot);
  drawDeployPanel(ctx, snapshot);
}

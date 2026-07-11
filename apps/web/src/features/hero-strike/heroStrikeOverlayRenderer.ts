import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH, UPGRADE_CARD_BOUNDS } from "./heroStrikeConfig";
import { drawHeroStrikeLoadout } from "./heroStrikeLoadoutRenderer";
import { drawHeroStrikeProtocolReward } from "./heroStrikeProtocolRenderer";
import { drawHeroStrikeResult } from "./heroStrikeResultRenderer";
import { getCurrentHeroStrikeStage, HERO_STRIKE_STAGES } from "./heroStrikeStages";
import { drawHeroStrikeTitle } from "./heroStrikeTitleRenderer";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawUpgradeCards(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  ctx.fillStyle = "rgba(2,6,16,.86)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 12px system-ui";
  ctx.fillText("LEVEL UP", HERO_STRIKE_WIDTH / 2, 305);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 31px system-ui";
  ctx.fillText("강화 하나를 선택하세요", HERO_STRIKE_WIDTH / 2, 347);

  state.upgradeChoices.forEach((upgrade, index) => {
    const bounds = UPGRADE_CARD_BOUNDS[index];
    const accent = upgrade.rarity === "epic" ? HERO_STRIKE_COLORS.purple : upgrade.rarity === "rare" ? HERO_STRIKE_COLORS.cyan : HERO_STRIKE_COLORS.orange;
    roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 18);
    ctx.fillStyle = "rgba(13,26,48,.96)";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = "900 36px system-ui";
    ctx.fillText(upgrade.icon, bounds.x + bounds.width / 2, bounds.y + 57);
    ctx.fillStyle = HERO_STRIKE_COLORS.white;
    ctx.font = "900 15px system-ui";
    ctx.fillText(upgrade.title, bounds.x + bounds.width / 2, bounds.y + 96);
    ctx.fillStyle = HERO_STRIKE_COLORS.muted;
    ctx.font = "700 11px system-ui";
    const words = upgrade.description.split(" ");
    let line = "";
    let lineY = bounds.y + 126;
    for (const word of words) {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > bounds.width - 18 && line) {
        ctx.fillText(line.trim(), bounds.x + bounds.width / 2, lineY);
        line = `${word} `;
        lineY += 17;
      } else line = test;
    }
    ctx.fillText(line.trim(), bounds.x + bounds.width / 2, lineY);
    ctx.fillStyle = accent;
    ctx.font = "800 8px system-ui";
    ctx.fillText(upgrade.rarity.toUpperCase(), bounds.x + bounds.width / 2, bounds.y + bounds.height - 30);
    ctx.font = "900 10px system-ui";
    ctx.fillText(`LV.${upgrade.currentLevel} → ${upgrade.nextLevel} / ${upgrade.maxLevel}`, bounds.x + bounds.width / 2, bounds.y + bounds.height - 15);
  });
  ctx.textAlign = "left";
}

function drawStageBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.stageBanner <= 0 || state.phase !== "playing") return;
  const stage = getCurrentHeroStrikeStage(state);
  const alpha = Math.min(1, state.stageBanner / 0.5, (2.8 - state.stageBanner) / 0.45 + 0.2);
  ctx.fillStyle = `rgba(2,6,16,${0.35 * alpha})`;
  ctx.fillRect(0, 205, HERO_STRIKE_WIDTH, 120);
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 13px system-ui";
  ctx.fillText(`STAGE ${state.stageIndex + 1} / ${HERO_STRIKE_STAGES.length}`, HERO_STRIKE_WIDTH / 2, 242);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 29px system-ui";
  ctx.fillText(stage.name, HERO_STRIKE_WIDTH / 2, 279);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 12px system-ui";
  ctx.fillText(stage.subtitle, HERO_STRIKE_WIDTH / 2, 303);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawPaused(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(2,6,16,.78)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 38px system-ui";
  ctx.fillText("PAUSED", HERO_STRIKE_WIDTH / 2, 340);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 14px system-ui";
  ctx.fillText("화면을 눌러 계속", HERO_STRIKE_WIDTH / 2, 376);
  ctx.textAlign = "left";
}

function drawBossWarning(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.bossWarning <= 0) return;
  const stage = getCurrentHeroStrikeStage(state);
  ctx.fillStyle = `rgba(255,95,109,${Math.min(0.22, state.bossWarning * 0.1)})`;
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.red;
  ctx.font = "1000 31px system-ui";
  ctx.fillText("WARNING", HERO_STRIKE_WIDTH / 2, 350);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "800 12px system-ui";
  ctx.fillText(`${stage.bossName} APPROACHING`, HERO_STRIKE_WIDTH / 2, 378);
  ctx.textAlign = "left";
}

export function drawHeroStrikeOverlay(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  drawStageBanner(ctx, state);
  drawBossWarning(ctx, state);
  if (state.phase === "title") drawHeroStrikeTitle(ctx, state);
  else if (state.phase === "loadout") drawHeroStrikeLoadout(ctx, state);
  else if (state.phase === "level-up") drawUpgradeCards(ctx, state);
  else if (state.phase === "stage-clear") drawHeroStrikeProtocolReward(ctx, state);
  else if (state.phase === "game-over" || state.phase === "victory") drawHeroStrikeResult(ctx, state);
  else if (state.phase === "paused") drawPaused(ctx);
}

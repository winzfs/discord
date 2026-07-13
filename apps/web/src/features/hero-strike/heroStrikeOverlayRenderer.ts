import {
  getHeroStrikeBuildTags,
  getHeroStrikeDominantBuildTags,
  getHeroStrikeEvolutionHint,
  getHeroStrikeUpgradeRoleLabel,
  getHeroStrikeUpgradeSynergy,
} from "./heroStrikeBuildCatalog";
import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_WIDTH,
  UPGRADE_CARD_BOUNDS,
  UPGRADE_REROLL_BOUNDS,
} from "./heroStrikeConfig";
import { drawHeroStrikeLoadout } from "./heroStrikeLoadoutRenderer";
import { drawHeroStrikeProtocolReward } from "./heroStrikeProtocolRenderer";
import { drawHeroStrikeResult } from "./heroStrikeResultRenderer";
import { getCurrentHeroStrikeStage, HERO_STRIKE_STAGES } from "./heroStrikeStages";
import { drawHeroStrikeTitle } from "./heroStrikeTitleRenderer";
import type { HeroStrikeState, UpgradeOption } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
) {
  const words = text.split(" ");
  let line = "";
  let lineY = startY;
  let lines = 0;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), centerX, lineY);
      lines += 1;
      if (lines >= maxLines) return;
      line = `${word} `;
      lineY += lineHeight;
    } else line = test;
  }
  if (lines < maxLines) ctx.fillText(line.trim(), centerX, lineY);
}

function drawUpgradeCard(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
  upgrade: UpgradeOption,
  index: number,
) {
  const bounds = UPGRADE_CARD_BOUNDS[index];
  const rarityAccent = upgrade.rarity === "epic"
    ? HERO_STRIKE_COLORS.purple
    : upgrade.rarity === "rare"
      ? HERO_STRIKE_COLORS.cyan
      : HERO_STRIKE_COLORS.orange;
  const tags = getHeroStrikeBuildTags(upgrade.id);
  const evolution = getHeroStrikeEvolutionHint(state, upgrade.id);
  const synergy = getHeroStrikeUpgradeSynergy(state, upgrade.id);
  const accent = synergy.strength >= 2 ? synergy.accent : rarityAccent;

  roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 18);
  ctx.fillStyle = "rgba(13,26,48,.96)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = synergy.strength >= 2 ? 3 : 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = synergy.accent;
  ctx.font = "1000 7px system-ui";
  ctx.fillText(synergy.label, bounds.x + bounds.width / 2, bounds.y + 15);

  ctx.fillStyle = rarityAccent;
  ctx.font = "900 32px system-ui";
  ctx.fillText(upgrade.icon, bounds.x + bounds.width / 2, bounds.y + 48);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 14px system-ui";
  ctx.fillText(upgrade.title, bounds.x + bounds.width / 2, bounds.y + 76);

  ctx.fillStyle = rarityAccent;
  ctx.font = "900 8px system-ui";
  ctx.fillText(getHeroStrikeUpgradeRoleLabel(upgrade.id), bounds.x + bounds.width / 2, bounds.y + 94);

  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  drawWrappedText(
    ctx,
    upgrade.description,
    bounds.x + bounds.width / 2,
    bounds.y + 117,
    bounds.width - 18,
    15,
  );

  ctx.fillStyle = "rgba(255,255,255,.08)";
  roundedRect(ctx, bounds.x + 8, bounds.y + 147, bounds.width - 16, 20, 7);
  ctx.fill();
  ctx.fillStyle = rarityAccent;
  ctx.font = "900 8px system-ui";
  ctx.fillText(tags.join(" · "), bounds.x + bounds.width / 2, bounds.y + 160);

  if (evolution) {
    ctx.fillStyle = HERO_STRIKE_COLORS.gold;
    ctx.font = "800 8px system-ui";
    ctx.fillText(`${evolution.title} ${evolution.progress}`, bounds.x + bounds.width / 2, bounds.y + 181);
  }

  ctx.fillStyle = accent;
  ctx.font = "900 9px system-ui";
  ctx.fillText(
    `LV.${upgrade.currentLevel} → ${upgrade.nextLevel} / ${upgrade.maxLevel}`,
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height - 12,
  );
}

function drawCurrentBuildIdentity(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const dominant = getHeroStrikeDominantBuildTags(state);
  ctx.textAlign = "center";
  ctx.font = "900 8px system-ui";
  if (dominant.length === 0) {
    ctx.fillStyle = HERO_STRIKE_COLORS.muted;
    ctx.fillText("BUILD · 미확정 — 첫 핵심 방향을 선택하세요", HERO_STRIKE_WIDTH / 2, 392);
    return;
  }
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.fillText(
    `CURRENT BUILD · ${dominant.map(({ tag, level }) => `${tag} ${level}`).join("  /  ")}`,
    HERO_STRIKE_WIDTH / 2,
    392,
  );
}

function drawUpgradeCards(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  ctx.fillStyle = "rgba(2,6,16,.86)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 12px system-ui";
  ctx.fillText("TACTICAL DRAFT", HERO_STRIKE_WIDTH / 2, 305);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 29px system-ui";
  ctx.fillText("빌드의 다음 방향을 선택하세요", HERO_STRIKE_WIDTH / 2, 347);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("진화 경로와 현재 시너지를 기준으로 추천 강도를 표시합니다", HERO_STRIKE_WIDTH / 2, 371);
  drawCurrentBuildIdentity(ctx, state);

  state.upgradeChoices.forEach((upgrade, index) => drawUpgradeCard(ctx, state, upgrade, index));

  const rerollEnabled = state.upgradeRerolls > 0;
  roundedRect(
    ctx,
    UPGRADE_REROLL_BOUNDS.x,
    UPGRADE_REROLL_BOUNDS.y,
    UPGRADE_REROLL_BOUNDS.width,
    UPGRADE_REROLL_BOUNDS.height,
    14,
  );
  ctx.fillStyle = rerollEnabled ? "rgba(14,41,61,.96)" : "rgba(45,52,65,.72)";
  ctx.fill();
  ctx.strokeStyle = rerollEnabled ? HERO_STRIKE_COLORS.cyan : HERO_STRIKE_COLORS.muted;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = rerollEnabled ? HERO_STRIKE_COLORS.cyan : HERO_STRIKE_COLORS.muted;
  ctx.font = "900 12px system-ui";
  ctx.fillText(`↻ 재추첨  ${state.upgradeRerolls}`, HERO_STRIKE_WIDTH / 2, UPGRADE_REROLL_BOUNDS.y + 26);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 9px system-ui";
  ctx.fillText("현재 세 장을 제외하고 다시 제안", HERO_STRIKE_WIDTH / 2, 705);
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

import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH, UPGRADE_CARD_BOUNDS } from "./heroStrikeConfig";
import { getCurrentHeroStrikeStage, getHeroStrikeStage, HERO_STRIKE_STAGES } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawTitle(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  ctx.fillStyle = "rgba(2,6,16,.5)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 12px system-ui";
  ctx.fillText("6-STAGE ARCADE CAMPAIGN", HERO_STRIKE_WIDTH / 2, 225);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 46px system-ui";
  ctx.fillText("HERO STRIKE", HERO_STRIKE_WIDTH / 2, 278);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 15px system-ui";
  ctx.fillText("드래그로 이동 · 공격은 자동", HERO_STRIKE_WIDTH / 2, 318);
  ctx.fillText("아이템을 모아 6개 작전을 돌파하세요", HERO_STRIKE_WIDTH / 2, 342);
  roundedRect(ctx, 88, 390, HERO_STRIKE_WIDTH - 176, 64, 20);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 19px system-ui";
  ctx.fillText("작전 시작", HERO_STRIKE_WIDTH / 2, 430);
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "800 12px system-ui";
  ctx.fillText(`BEST  ${state.highScore.toLocaleString()}`, HERO_STRIKE_WIDTH / 2, 487);
  ctx.textAlign = "left";
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

function drawStageClear(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const nextStage = getHeroStrikeStage(state.stageIndex + 1);
  ctx.fillStyle = "rgba(2,6,16,.86)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 13px system-ui";
  ctx.fillText(`STAGE ${state.stageIndex + 1} CLEAR`, HERO_STRIKE_WIDTH / 2, 238);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 38px system-ui";
  ctx.fillText(stage.name, HERO_STRIKE_WIDTH / 2, 289);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 13px system-ui";
  ctx.fillText(`클리어 보너스  +${stage.clearBonus.toLocaleString()}`, HERO_STRIKE_WIDTH / 2, 329);
  ctx.fillText("체력 +1 · 보호막 +1 · 궁극기 +25%", HERO_STRIKE_WIDTH / 2, 355);
  ctx.fillText("다음 작전 보조 아이템 지급", HERO_STRIKE_WIDTH / 2, 378);

  roundedRect(ctx, 72, 414, HERO_STRIKE_WIDTH - 144, 78, 22);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 19px system-ui";
  ctx.fillText("다음 스테이지", HERO_STRIKE_WIDTH / 2, 449);
  ctx.font = "800 11px system-ui";
  ctx.fillText(`${nextStage.name}  →`, HERO_STRIKE_WIDTH / 2, 471);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 11px system-ui";
  ctx.fillText("화면을 눌러 계속", HERO_STRIKE_WIDTH / 2, 530);
  ctx.textAlign = "left";
}

function drawResult(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const victory = state.phase === "victory";
  ctx.fillStyle = "rgba(2,6,16,.84)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = victory ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.red;
  ctx.font = "900 12px system-ui";
  ctx.fillText(victory ? "ALL STAGES COMPLETE" : "MISSION FAILED", HERO_STRIKE_WIDTH / 2, 270);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 42px system-ui";
  ctx.fillText(victory ? "완전 승리" : "작전 종료", HERO_STRIKE_WIDTH / 2, 322);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 13px system-ui";
  ctx.fillText(`SCORE  ${state.score.toLocaleString()}`, HERO_STRIKE_WIDTH / 2, 366);
  ctx.fillText(`KILLS  ${state.kills}   ·   LEVEL  ${state.player.level}`, HERO_STRIKE_WIDTH / 2, 390);
  roundedRect(ctx, 92, 430, HERO_STRIKE_WIDTH - 184, 62, 20);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 18px system-ui";
  ctx.fillText("다시 출격", HERO_STRIKE_WIDTH / 2, 469);
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
  if (state.phase === "title") drawTitle(ctx, state);
  else if (state.phase === "level-up") drawUpgradeCards(ctx, state);
  else if (state.phase === "stage-clear") drawStageClear(ctx, state);
  else if (state.phase === "game-over" || state.phase === "victory") drawResult(ctx, state);
  else if (state.phase === "paused") drawPaused(ctx);
}
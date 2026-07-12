import { getStageObjectiveResearch, getStageObjectiveScore } from "./heroStrikeBalance";
import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_WIDTH,
  UPGRADE_CARD_BOUNDS,
} from "./heroStrikeConfig";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import { getCurrentHeroStrikeStage, getHeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState, StageProtocolOption } from "./heroStrikeTypes";

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
) {
  const words = text.split(" ");
  let line = "";
  let lineY = startY;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), centerX, lineY);
      line = `${word} `;
      lineY += 16;
    } else line = test;
  }
  ctx.fillText(line.trim(), centerX, lineY);
}

function drawCoreModuleCard(
  ctx: CanvasRenderingContext2D,
  module: StageProtocolOption,
  index: number,
) {
  const bounds = UPGRADE_CARD_BOUNDS[index];
  const accent = HERO_STRIKE_COLORS.purple;
  roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 18);
  ctx.fillStyle = "rgba(13,26,48,.97)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "900 34px system-ui";
  ctx.fillText(module.icon, bounds.x + bounds.width / 2, bounds.y + 52);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 12px system-ui";
  ctx.fillText(module.title, bounds.x + bounds.width / 2, bounds.y + 88);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  drawWrappedText(
    ctx,
    module.description,
    bounds.x + bounds.width / 2,
    bounds.y + 116,
    bounds.width - 18,
  );

  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 9px system-ui";
  ctx.fillText("UNIQUE CORE", bounds.x + bounds.width / 2, bounds.y + bounds.height - 17);
}

function drawContinueCard(ctx: CanvasRenderingContext2D, nextStageName: string) {
  roundedRect(ctx, 76, 405, HERO_STRIKE_WIDTH - 152, 156, 24);
  ctx.fillStyle = "rgba(13,26,48,.97)";
  ctx.fill();
  ctx.strokeStyle = HERO_STRIKE_COLORS.orange;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.font = "900 36px system-ui";
  ctx.fillText("▶", HERO_STRIKE_WIDTH / 2, 460);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 21px system-ui";
  ctx.fillText("다음 작전", HERO_STRIKE_WIDTH / 2, 499);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 11px system-ui";
  ctx.fillText(nextStageName, HERO_STRIKE_WIDTH / 2, 526);
}

export function drawHeroStrikeProtocolReward(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const nextStage = getHeroStrikeStage(state.stageIndex + 1);
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const clearScore = Math.round(stage.clearBonus * difficulty.score);
  const hasModule = state.protocolChoices.length > 0;

  ctx.fillStyle = "rgba(2,6,16,.92)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 12px system-ui";
  ctx.fillText(`STAGE ${state.stageIndex + 1} CLEAR`, HERO_STRIKE_WIDTH / 2, 185);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 31px system-ui";
  ctx.fillText(stage.name, HERO_STRIKE_WIDTH / 2, 226);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 12px system-ui";
  ctx.fillText(`SCORE +${clearScore.toLocaleString()} · PERFECT ${state.stageHits === 0 ? "YES" : "NO"}`, HERO_STRIKE_WIDTH / 2, 258);

  ctx.fillStyle = state.objectiveComplete ? HERO_STRIKE_COLORS.green : HERO_STRIKE_COLORS.red;
  ctx.font = "900 12px system-ui";
  const objectiveText = state.objectiveComplete
    ? `OBJECTIVE CLEAR · +${Math.round(getStageObjectiveScore(state.stageIndex) * difficulty.score)} · DATA +${Math.round(getStageObjectiveResearch(state.stageIndex) * difficulty.research)}`
    : "OBJECTIVE FAILED · 기본 보상만 획득";
  ctx.fillText(objectiveText, HERO_STRIKE_WIDTH / 2, 286);

  ctx.fillStyle = hasModule ? HERO_STRIKE_COLORS.purple : HERO_STRIKE_COLORS.orange;
  ctx.font = "1000 14px system-ui";
  ctx.fillText(hasModule ? "CORE MODULE 획득" : "정비 완료", HERO_STRIKE_WIDTH / 2, 316);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 11px system-ui";
  ctx.fillText(hasModule ? "플레이 방식을 바꿀 모듈 하나를 선택하세요" : `NEXT · ${nextStage.name}`, HERO_STRIKE_WIDTH / 2, 340);

  if (hasModule) {
    state.protocolChoices.forEach((module, index) => drawCoreModuleCard(ctx, module, index));
  } else {
    drawContinueCard(ctx, nextStage.name);
  }
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText(hasModule ? "선택한 모듈은 이번 작전 동안 유지됩니다" : "화면을 눌러 다음 스테이지 시작", HERO_STRIKE_WIDTH / 2, 654);
  ctx.textAlign = "left";
}

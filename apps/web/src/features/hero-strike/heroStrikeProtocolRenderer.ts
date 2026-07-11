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

function drawProtocolCard(
  ctx: CanvasRenderingContext2D,
  protocol: StageProtocolOption,
  index: number,
) {
  const bounds = UPGRADE_CARD_BOUNDS[index];
  const accent = protocol.rarity === "epic" ? HERO_STRIKE_COLORS.purple : HERO_STRIKE_COLORS.cyan;
  roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 18);
  ctx.fillStyle = "rgba(13,26,48,.97)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "900 34px system-ui";
  ctx.fillText(protocol.icon, bounds.x + bounds.width / 2, bounds.y + 52);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 14px system-ui";
  ctx.fillText(protocol.title, bounds.x + bounds.width / 2, bounds.y + 88);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  drawWrappedText(
    ctx,
    protocol.description,
    bounds.x + bounds.width / 2,
    bounds.y + 116,
    bounds.width - 18,
  );

  ctx.fillStyle = accent;
  ctx.font = "900 10px system-ui";
  ctx.fillText(
    `LV.${protocol.currentLevel} → ${protocol.nextLevel} / ${protocol.maxLevel}`,
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height - 17,
  );
}

export function drawHeroStrikeProtocolReward(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const nextStage = getHeroStrikeStage(state.stageIndex + 1);
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const clearScore = Math.round(stage.clearBonus * difficulty.score);

  ctx.fillStyle = "rgba(2,6,16,.9)";
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

  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.font = "900 13px system-ui";
  ctx.fillText("다음 작전 프로토콜을 선택하세요", HERO_STRIKE_WIDTH / 2, 316);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 11px system-ui";
  ctx.fillText(`NEXT · ${nextStage.name}`, HERO_STRIKE_WIDTH / 2, 340);

  state.protocolChoices.forEach((protocol, index) => drawProtocolCard(ctx, protocol, index));
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("카드를 선택하면 다음 스테이지가 시작됩니다", HERO_STRIKE_WIDTH / 2, 654);
  ctx.textAlign = "left";
}

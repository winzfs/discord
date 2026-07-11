import { getRunGrade } from "./heroStrikeBalance";
import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getEvolutionShortLabels } from "./heroStrikeEvolutions";
import { getLoadoutSummary } from "./heroStrikeLoadout";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function gradeColor(grade: string) {
  if (grade === "S") return HERO_STRIKE_COLORS.gold;
  if (grade === "A") return HERO_STRIKE_COLORS.cyan;
  if (grade === "B") return HERO_STRIKE_COLORS.green;
  if (grade === "C") return HERO_STRIKE_COLORS.orange;
  return HERO_STRIKE_COLORS.red;
}

function drawStat(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number) {
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 9px system-ui";
  ctx.fillText(label, x, y);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 17px system-ui";
  ctx.fillText(value, x, y + 22);
}

export function drawHeroStrikeResult(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const victory = state.phase === "victory";
  const grade = getRunGrade(state);
  const evolutions = getEvolutionShortLabels(state);
  const reachedStage = Math.min(10, state.stageIndex + 1);

  ctx.fillStyle = "rgba(2,6,16,.92)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = victory ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.red;
  ctx.font = "900 11px system-ui";
  ctx.fillText(victory ? "ALL 10 STAGES COMPLETE" : `OPERATION ENDED · STAGE ${reachedStage}`, HERO_STRIKE_WIDTH / 2, 116);

  ctx.fillStyle = gradeColor(grade);
  ctx.font = "1000 72px system-ui";
  ctx.fillText(grade, HERO_STRIKE_WIDTH / 2, 196);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 24px system-ui";
  ctx.fillText(victory ? "완전 승리" : "작전 종료", HERO_STRIKE_WIDTH / 2, 230);

  roundedRect(ctx, 42, 258, HERO_STRIKE_WIDTH - 84, 218, 20);
  ctx.fillStyle = "rgba(7,20,39,.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.2)";
  ctx.stroke();

  drawStat(ctx, "SCORE", state.score.toLocaleString(), 104, 288);
  drawStat(ctx, "KILLS", String(state.kills), 210, 288);
  drawStat(ctx, "MAX COMBO", String(state.maxCombo), 316, 288);
  drawStat(ctx, "DAMAGE", Math.round(state.damageDealt).toLocaleString(), 104, 348);
  drawStat(ctx, "HITS", String(state.hitsTaken), 210, 348);
  drawStat(ctx, "BLINKS", String(state.blinksUsed), 316, 348);
  drawStat(ctx, "OBJECTIVES", `${state.objectivesCompleted}/10`, 104, 408);
  drawStat(ctx, "PERFECT", String(state.perfectStages), 210, 408);
  drawStat(ctx, "REROLLS", String(state.rerollsUsed), 316, 408);

  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.font = "900 11px system-ui";
  ctx.fillText(`RESEARCH DATA +${state.runResearchEarned} · RANK ${state.researchRank}`, HERO_STRIKE_WIDTH / 2, 462);

  ctx.fillStyle = evolutions.length > 0 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.muted;
  ctx.font = "800 10px system-ui";
  ctx.fillText(
    evolutions.length > 0 ? `EVOLUTION · ${evolutions.join(" · ")}` : "EVOLUTION · 없음",
    HERO_STRIKE_WIDTH / 2,
    512,
  );
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.fillText(getLoadoutSummary(state.loadout), HERO_STRIKE_WIDTH / 2, 536);

  roundedRect(ctx, 92, 570, HERO_STRIKE_WIDTH - 184, 64, 20);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 18px system-ui";
  ctx.fillText("장비 재정비", HERO_STRIKE_WIDTH / 2, 609);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("화면을 눌러 출격 준비로 이동", HERO_STRIKE_WIDTH / 2, 661);
  ctx.textAlign = "left";
}

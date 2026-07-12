import { getRunGrade } from "./heroStrikeBalance";
import { getHeroStrikeCombatRank } from "./heroStrikeCombatRank";
import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getHeroStrikeOperationSummary } from "./heroStrikeEncounterDirector";
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
  ctx.font = "800 8px system-ui";
  ctx.fillText(label, x, y);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 16px system-ui";
  ctx.fillText(value, x, y + 21);
}

function debriefAdvice(
  state: HeroStrikeState,
  missionsSucceeded: number,
  missionsFailed: number,
  averageRank: number,
) {
  if (state.hitsTaken >= Math.max(4, state.stageIndex + 2)) {
    return "다음 목표 · 공격 예고를 본 뒤 DRIVE와 블링크로 피격을 줄이세요";
  }
  if (missionsFailed >= Math.max(2, missionsSucceeded / 2)) {
    return "다음 목표 · 잡몹보다 PRIORITY와 작전 구역을 먼저 처리하세요";
  }
  if (averageRank < 48) {
    return "다음 목표 · 그레이즈·BREAK·빠른 표적 격파로 전투 랭크를 올리세요";
  }
  if (state.evolutions.length === 0 && state.stageIndex >= 4) {
    return "다음 목표 · 카드의 진화 조건을 맞춰 첫 무기 진화를 완성하세요";
  }
  return "전투 흐름 안정 · 더 높은 위험도와 완벽 임무를 노릴 수 있습니다";
}

export function drawHeroStrikeResult(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const victory = state.phase === "victory";
  const grade = getRunGrade(state);
  const combatRank = getHeroStrikeCombatRank(state);
  const operation = getHeroStrikeOperationSummary(state);
  const evolutions = getEvolutionShortLabels(state);
  const reachedStage = Math.min(10, state.stageIndex + 1);
  const advice = debriefAdvice(
    state,
    operation.missionsSucceeded,
    operation.missionsFailed,
    combatRank.averagePoints,
  );

  ctx.fillStyle = "rgba(2,6,16,.94)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = victory ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.red;
  ctx.font = "900 11px system-ui";
  ctx.fillText(victory ? "OPERATION COMPLETE" : `OPERATION ENDED · STAGE ${reachedStage}`, HERO_STRIKE_WIDTH / 2, 79);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 25px system-ui";
  ctx.fillText("전투 보고서", HERO_STRIKE_WIDTH / 2, 112);

  ctx.fillStyle = gradeColor(grade);
  ctx.font = "1000 60px system-ui";
  ctx.fillText(grade, HERO_STRIKE_WIDTH / 2, 178);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 9px system-ui";
  ctx.fillText(`FINAL GRADE · PEAK COMBAT ${combatRank.peakGrade}`, HERO_STRIKE_WIDTH / 2, 198);

  roundedRect(ctx, 34, 218, HERO_STRIKE_WIDTH - 68, 282, 20);
  ctx.fillStyle = "rgba(7,20,39,.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.2)";
  ctx.stroke();

  drawStat(ctx, "SCORE", state.score.toLocaleString(), 90, 246);
  drawStat(ctx, "KILLS", String(state.kills), 210, 246);
  drawStat(ctx, "HITS", String(state.hitsTaken), 330, 246);

  drawStat(ctx, "MISSIONS", `${operation.missionsSucceeded} CLEAR`, 90, 302);
  drawStat(ctx, "FAILED", String(operation.missionsFailed), 210, 302);
  drawStat(ctx, "SALVAGE", String(operation.salvage), 330, 302);

  drawStat(ctx, "COMBAT AVG", `${Math.round(combatRank.averagePoints)}%`, 90, 358);
  drawStat(ctx, "BOSS BREAK", String(state.bossBreaks), 210, 358);
  drawStat(ctx, "MAX COMBO", String(state.maxCombo), 330, 358);

  drawStat(ctx, "EVOLUTION", String(evolutions.length), 90, 414);
  drawStat(ctx, "PERFECT", String(operation.perfectMissions), 210, 414);
  drawStat(ctx, "STAGE", `${reachedStage}/10`, 330, 414);

  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.font = "900 10px system-ui";
  ctx.fillText(`RESEARCH DATA +${state.runResearchEarned} · BLUEPRINT RANK ${state.researchRank}`, HERO_STRIKE_WIDTH / 2, 479);

  roundedRect(ctx, 42, 521, HERO_STRIKE_WIDTH - 84, 77, 16);
  ctx.fillStyle = "rgba(13,26,48,.9)";
  ctx.fill();
  ctx.strokeStyle = HERO_STRIKE_COLORS.cyan;
  ctx.globalAlpha = 0.35;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 9px system-ui";
  ctx.fillText(evolutions.length > 0 ? `EVOLUTION · ${evolutions.join(" · ")}` : "EVOLUTION · 미완성", HERO_STRIKE_WIDTH / 2, 543);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "800 10px system-ui";
  ctx.fillText(advice, HERO_STRIKE_WIDTH / 2, 567);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 9px system-ui";
  ctx.fillText(getLoadoutSummary(state.loadout), HERO_STRIKE_WIDTH / 2, 587);

  roundedRect(ctx, 92, 623, HERO_STRIKE_WIDTH - 184, 64, 20);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 18px system-ui";
  ctx.fillText("같은 장비로 재정비", HERO_STRIKE_WIDTH / 2, 661);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("화면을 눌러 출격 준비로 이동", HERO_STRIKE_WIDTH / 2, 714);
  ctx.textAlign = "left";
}

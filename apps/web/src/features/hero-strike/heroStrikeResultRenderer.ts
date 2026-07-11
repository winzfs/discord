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

export function drawHeroStrikeResult(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const victory = state.phase === "victory";
  const grade = getRunGrade(state);
  const evolutions = getEvolutionShortLabels(state);
  const reachedStage = Math.min(10, state.stageIndex + 1);

  ctx.fillStyle = "rgba(2,6,16,.9)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = victory ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.red;
  ctx.font = "900 11px system-ui";
  ctx.fillText(victory ? "ALL 10 STAGES COMPLETE" : `OPERATION ENDED · STAGE ${reachedStage}`, HERO_STRIKE_WIDTH / 2, 190);

  ctx.fillStyle = gradeColor(grade);
  ctx.font = "1000 78px system-ui";
  ctx.fillText(grade, HERO_STRIKE_WIDTH / 2, 278);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 28px system-ui";
  ctx.fillText(victory ? "완전 승리" : "작전 종료", HERO_STRIKE_WIDTH / 2, 318);

  roundedRect(ctx, 54, 350, HERO_STRIKE_WIDTH - 108, 150, 20);
  ctx.fillStyle = "rgba(7,20,39,.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.2)";
  ctx.stroke();

  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 10px system-ui";
  ctx.fillText("SCORE", 116, 378);
  ctx.fillText("KILLS", 304, 378);
  ctx.fillText("MAX COMBO", 116, 430);
  ctx.fillText("HITS", 304, 430);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 20px system-ui";
  ctx.fillText(state.score.toLocaleString(), 116, 402);
  ctx.fillText(String(state.kills), 304, 402);
  ctx.fillText(String(state.maxCombo), 116, 454);
  ctx.fillText(String(state.hitsTaken), 304, 454);
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.font = "900 12px system-ui";
  ctx.fillText(`RESEARCH DATA +${state.runResearchEarned} · RANK ${state.researchRank}`, HERO_STRIKE_WIDTH / 2, 484);

  ctx.fillStyle = evolutions.length > 0 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.muted;
  ctx.font = "800 10px system-ui";
  ctx.fillText(
    evolutions.length > 0 ? `EVOLUTION · ${evolutions.join(" · ")}` : "EVOLUTION · 없음",
    HERO_STRIKE_WIDTH / 2,
    526,
  );
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.fillText(getLoadoutSummary(state.loadout), HERO_STRIKE_WIDTH / 2, 550);

  roundedRect(ctx, 92, 574, HERO_STRIKE_WIDTH - 184, 64, 20);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 18px system-ui";
  ctx.fillText("장비 재정비", HERO_STRIKE_WIDTH / 2, 613);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("화면을 눌러 출격 준비로 이동", HERO_STRIKE_WIDTH / 2, 664);
  ctx.textAlign = "left";
}

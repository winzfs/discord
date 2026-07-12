import { getHeroStrikeCombatRank, type HeroStrikeCombatGrade } from "./heroStrikeCombatRank";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

function gradeColor(grade: HeroStrikeCombatGrade) {
  if (grade === "S") return HERO_STRIKE_COLORS.gold;
  if (grade === "A") return HERO_STRIKE_COLORS.cyan;
  if (grade === "B") return HERO_STRIKE_COLORS.green;
  if (grade === "C") return HERO_STRIKE_COLORS.orange;
  return HERO_STRIKE_COLORS.red;
}

export function drawHeroStrikeCombatRank(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  if (state.phase !== "playing" && state.phase !== "paused") return;
  const rank = getHeroStrikeCombatRank(state);
  const x = 292;
  const y = state.bossSpawned ? 238 : 190;
  const width = 104;
  const color = gradeColor(rank.grade);

  ctx.save();
  ctx.fillStyle = "rgba(3,9,21,.78)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, 25, 9);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,.09)";
  ctx.fillRect(x + 25, y + 16, width - 33, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x + 25, y + 16, (width - 33) * rank.ratio, 4);

  ctx.fillStyle = color;
  ctx.font = "1000 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(rank.grade, x + 13, y + 18);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 7px system-ui";
  ctx.textAlign = "right";
  ctx.fillText("COMBAT RANK", x + width - 7, y + 10);
  ctx.restore();
  ctx.textAlign = "left";
}

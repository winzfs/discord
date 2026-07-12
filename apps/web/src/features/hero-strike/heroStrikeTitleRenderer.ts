import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getLoadoutSummary } from "./heroStrikeLoadout";
import { getResearchProgress } from "./heroStrikeMetaProgress";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export function drawHeroStrikeTitle(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const research = getResearchProgress(state.researchData);
  ctx.fillStyle = "rgba(2,6,16,.5)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 12px system-ui";
  ctx.fillText("TACTICAL ROGUELITE STRIKE", HERO_STRIKE_WIDTH / 2, 208);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 46px system-ui";
  ctx.fillText("HERO STRIKE", HERO_STRIKE_WIDTH / 2, 260);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 14px system-ui";
  ctx.fillText("드래그하면 DRIVE · 손을 떼면 FOCUS FIRE", HERO_STRIKE_WIDTH / 2, 298);
  ctx.fillText("정렬과 타이밍으로 10개 작전을 돌파하세요", HERO_STRIKE_WIDTH / 2, 322);

  roundedRect(ctx, 72, 350, HERO_STRIKE_WIDTH - 144, 62, 18);
  ctx.fillStyle = "rgba(7,20,39,.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.28)";
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 11px system-ui";
  ctx.fillText(`RESEARCH RANK ${research.rank}`, HERO_STRIKE_WIDTH / 2, 374);
  ctx.fillStyle = "rgba(255,255,255,.1)";
  ctx.fillRect(92, 387, HERO_STRIKE_WIDTH - 184, 6);
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.fillRect(92, 387, (HERO_STRIKE_WIDTH - 184) * research.ratio, 6);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 9px system-ui";
  const researchText = research.next > research.current
    ? `DATA ${state.researchData} / ${research.next}`
    : `DATA ${state.researchData} · MAX`;
  ctx.fillText(researchText, HERO_STRIKE_WIDTH / 2, 405);

  roundedRect(ctx, 88, 440, HERO_STRIKE_WIDTH - 176, 64, 20);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 19px system-ui";
  ctx.fillText("출격 준비", HERO_STRIKE_WIDTH / 2, 480);
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "800 11px system-ui";
  ctx.fillText(getLoadoutSummary(state.loadout), HERO_STRIKE_WIDTH / 2, 530);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText(`BEST ${state.highScore.toLocaleString()} · DRIVE 이동 · FOCUS 정밀사격`, HERO_STRIKE_WIDTH / 2, 555);
  ctx.textAlign = "left";
}

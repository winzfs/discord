import { getNextHeroStrikeBlueprint } from "./heroStrikeBlueprints";
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
  const nextBlueprint = getNextHeroStrikeBlueprint(research.rank);
  ctx.fillStyle = "rgba(2,6,16,.5)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 12px system-ui";
  ctx.fillText("MISSION SHOOTER ROGUELITE", HERO_STRIKE_WIDTH / 2, 208);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 46px system-ui";
  ctx.fillText("HERO STRIKE", HERO_STRIKE_WIDTH / 2, 260);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 14px system-ui";
  ctx.fillText("공격 예고를 읽고 임무 목표를 완수하세요", HERO_STRIKE_WIDTH / 2, 298);
  ctx.fillText("DRIVE 회피 · FOCUS 정밀사격 · 전술 빌드", HERO_STRIKE_WIDTH / 2, 322);

  roundedRect(ctx, 72, 350, HERO_STRIKE_WIDTH - 144, 72, 18);
  ctx.fillStyle = "rgba(7,20,39,.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.28)";
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 11px system-ui";
  ctx.fillText(`BLUEPRINT RANK ${research.rank}`, HERO_STRIKE_WIDTH / 2, 374);
  ctx.fillStyle = "rgba(255,255,255,.1)";
  ctx.fillRect(92, 387, HERO_STRIKE_WIDTH - 184, 6);
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.fillRect(92, 387, (HERO_STRIKE_WIDTH - 184) * research.ratio, 6);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 8px system-ui";
  const researchText = nextBlueprint
    ? `NEXT RANK ${nextBlueprint.rank} · ${nextBlueprint.title}`
    : "기본 BLUEPRINT 전체 해금";
  ctx.fillText(researchText, HERO_STRIKE_WIDTH / 2, 408);

  roundedRect(ctx, 88, 450, HERO_STRIKE_WIDTH - 176, 64, 20);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 19px system-ui";
  ctx.fillText("출격 준비", HERO_STRIKE_WIDTH / 2, 490);
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "800 11px system-ui";
  ctx.fillText(getLoadoutSummary(state.loadout), HERO_STRIKE_WIDTH / 2, 540);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText(`BEST ${state.highScore.toLocaleString()} · 임무·전투 랭크·SALVAGE`, HERO_STRIKE_WIDTH / 2, 565);
  ctx.textAlign = "left";
}

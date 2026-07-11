import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import {
  DIFFICULTY_OPTIONS,
  getLoadoutSummary,
  PRIMARY_WEAPON_OPTIONS,
  SUPPORT_LOADOUT_OPTIONS,
  TACTICAL_LOADOUT_OPTIONS,
} from "./heroStrikeLoadout";
import {
  HERO_STRIKE_LOADOUT_BACK_BOUNDS,
  HERO_STRIKE_LOADOUT_CARD_BOUNDS,
  HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS,
  type HeroStrikeLoadoutRow,
  type HeroStrikeRect,
} from "./heroStrikeLoadoutLayout";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, bounds: HeroStrikeRect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
}

function drawSectionLabel(ctx: CanvasRenderingContext2D, title: string, subtitle: string, y: number) {
  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 12px system-ui";
  ctx.fillText(title, 18, y);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 9px system-ui";
  ctx.fillText(subtitle, 92, y);
}

type DisplayOption = { id: string; title: string; icon: string; description: string };

function drawOptionRow(
  ctx: CanvasRenderingContext2D,
  row: HeroStrikeLoadoutRow,
  options: readonly DisplayOption[],
  selectedId: string,
  accent: string,
) {
  options.forEach((option, index) => {
    const bounds = HERO_STRIKE_LOADOUT_CARD_BOUNDS[row][index];
    const selected = option.id === selectedId;
    roundedRect(ctx, bounds, 14);
    ctx.fillStyle = selected ? "rgba(14,41,61,.96)" : "rgba(7,20,39,.86)";
    ctx.fill();
    ctx.strokeStyle = selected ? accent : "rgba(141,164,197,.2)";
    ctx.lineWidth = selected ? 2.5 : 1;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = selected ? accent : HERO_STRIKE_COLORS.muted;
    ctx.font = "900 22px system-ui";
    ctx.fillText(option.icon, bounds.x + bounds.width / 2, bounds.y + 27);
    ctx.fillStyle = HERO_STRIKE_COLORS.white;
    ctx.font = "900 12px system-ui";
    ctx.fillText(option.title, bounds.x + bounds.width / 2, bounds.y + 48);
    ctx.fillStyle = selected ? HERO_STRIKE_COLORS.white : HERO_STRIKE_COLORS.muted;
    ctx.font = "700 8px system-ui";
    ctx.fillText(option.description, bounds.x + bounds.width / 2, bounds.y + 67);

    if (selected) {
      ctx.fillStyle = accent;
      ctx.font = "1000 10px system-ui";
      ctx.fillText("SELECTED", bounds.x + bounds.width / 2, bounds.y + 79);
    }
  });
}

export function drawHeroStrikeLoadout(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  ctx.fillStyle = "rgba(2,6,16,.94)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);

  roundedRect(ctx, HERO_STRIKE_LOADOUT_BACK_BOUNDS, 10);
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "900 10px system-ui";
  ctx.fillText("← 뒤로", 45, 38);

  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 11px system-ui";
  ctx.fillText(`RESEARCH RANK ${state.researchRank}`, HERO_STRIKE_WIDTH / 2, 42);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 29px system-ui";
  ctx.fillText("출격 준비", HERO_STRIKE_WIDTH / 2, 78);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("장비 조합과 작전 난이도를 설정하세요", HERO_STRIKE_WIDTH / 2, 99);

  drawSectionLabel(ctx, "주무기", "기본 공격의 사거리·연사·타격감", 128);
  drawOptionRow(ctx, "primary", PRIMARY_WEAPON_OPTIONS, state.loadout.primary, HERO_STRIKE_COLORS.orange);
  drawSectionLabel(ctx, "보조 무기", "선택한 무기를 1단계 보유하고 시작", 252);
  drawOptionRow(ctx, "support", SUPPORT_LOADOUT_OPTIONS, state.loadout.support, HERO_STRIKE_COLORS.lime);
  drawSectionLabel(ctx, "전술 장비", "생존·회수·궁극기 시작 보너스", 376);
  drawOptionRow(ctx, "tactical", TACTICAL_LOADOUT_OPTIONS, state.loadout.tactical, HERO_STRIKE_COLORS.cyan);
  drawSectionLabel(ctx, "난이도", "적 수치와 점수·연구 보상 배율", 500);
  drawOptionRow(ctx, "difficulty", DIFFICULTY_OPTIONS, state.loadout.difficulty, HERO_STRIKE_COLORS.purple);

  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "800 10px system-ui";
  ctx.fillText(getLoadoutSummary(state.loadout), HERO_STRIKE_WIDTH / 2, 629);

  roundedRect(ctx, HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS, 19);
  ctx.fillStyle = state.loadout.difficulty === "legend" ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "1000 18px system-ui";
  ctx.fillText(state.loadout.difficulty === "legend" ? "전설 작전 출격" : "작전 출격", HERO_STRIKE_WIDTH / 2, 700);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 9px system-ui";
  ctx.fillText("선택한 세팅은 자동 저장됩니다", HERO_STRIKE_WIDTH / 2, 743);
  ctx.textAlign = "left";
}

import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeLobbyCategory, HeroStrikeLobbyOption } from "./heroStrikeLobbyData";
import {
  HERO_STRIKE_LOADOUT_CARD_BOUNDS,
  HERO_STRIKE_LOBBY_TAB_BOUNDS,
  HERO_STRIKE_LOBBY_TABS,
  type HeroStrikeLoadoutRow,
  type HeroStrikeRect,
} from "./heroStrikeLoadoutLayout";

const TAB_LABELS: Record<HeroStrikeLoadoutRow, string> = {
  primary: "PRIMARY",
  support: "SUPPORT",
  tactical: "TACTICAL",
  difficulty: "RISK",
};

function roundedRect(ctx: CanvasRenderingContext2D, bounds: HeroStrikeRect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
}

function drawTabs(
  ctx: CanvasRenderingContext2D,
  activeTab: HeroStrikeLoadoutRow,
  accent: string,
) {
  HERO_STRIKE_LOBBY_TABS.forEach((tab, index) => {
    const bounds = HERO_STRIKE_LOBBY_TAB_BOUNDS[index];
    const active = tab === activeTab;
    roundedRect(ctx, bounds, 10);
    ctx.fillStyle = active ? "rgba(13,35,55,.96)" : "rgba(5,15,29,.8)";
    ctx.fill();
    ctx.strokeStyle = active ? accent : "rgba(141,164,197,.14)";
    ctx.lineWidth = active ? 1.8 : 1;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = active ? accent : HERO_STRIKE_COLORS.muted;
    ctx.font = "1000 8px system-ui";
    ctx.fillText(TAB_LABELS[tab], bounds.x + bounds.width / 2, bounds.y + 17);
    ctx.fillStyle = active ? HERO_STRIKE_COLORS.white : "rgba(141,164,197,.48)";
    ctx.font = "800 7px system-ui";
    ctx.fillText(
      tab === "primary" ? "주무기" : tab === "support" ? "보조" : tab === "tactical" ? "전술" : "위험도",
      bounds.x + bounds.width / 2,
      bounds.y + 31,
    );

    if (active) {
      ctx.fillStyle = accent;
      ctx.fillRect(bounds.x + 12, bounds.y + bounds.height - 3, bounds.width - 24, 3);
    }
  });
  ctx.textAlign = "left";
}

function drawLockedOverlay(
  ctx: CanvasRenderingContext2D,
  bounds: HeroStrikeRect,
  option: HeroStrikeLobbyOption,
) {
  ctx.fillStyle = "rgba(2,6,15,.72)";
  roundedRect(ctx, bounds, 13);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "1000 16px system-ui";
  ctx.fillText("⌁", bounds.x + bounds.width / 2, bounds.y + 47);
  ctx.font = "1000 9px system-ui";
  ctx.fillText(`BLUEPRINT RANK ${option.unlockRank}`, bounds.x + bounds.width / 2, bounds.y + 72);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 7px system-ui";
  ctx.fillText("RESEARCH DATA로 해금", bounds.x + bounds.width / 2, bounds.y + 89);
  ctx.textAlign = "left";
}

function drawOptionCard(
  ctx: CanvasRenderingContext2D,
  option: HeroStrikeLobbyOption,
  bounds: HeroStrikeRect,
  accent: string,
) {
  roundedRect(ctx, bounds, 13);
  ctx.fillStyle = option.selected
    ? "rgba(12,37,57,.97)"
    : option.unlocked
      ? "rgba(6,18,35,.92)"
      : "rgba(12,16,25,.9)";
  ctx.fill();

  ctx.strokeStyle = option.selected ? accent : option.unlocked ? "rgba(141,164,197,.18)" : "rgba(141,164,197,.08)";
  ctx.lineWidth = option.selected ? 2.3 : 1;
  ctx.stroke();

  if (option.selected) {
    ctx.fillStyle = accent;
    ctx.fillRect(bounds.x + 1, bounds.y + 1, 4, bounds.height - 2);
    ctx.textAlign = "right";
    ctx.fillStyle = accent;
    ctx.font = "1000 7px system-ui";
    ctx.fillText("EQUIPPED", bounds.x + bounds.width - 9, bounds.y + 13);
  }

  ctx.textAlign = "center";
  ctx.globalAlpha = option.unlocked ? 1 : 0.25;
  ctx.fillStyle = option.selected ? accent : HERO_STRIKE_COLORS.muted;
  ctx.font = "1000 25px system-ui";
  ctx.fillText(option.icon, bounds.x + bounds.width / 2, bounds.y + 35);

  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 12px system-ui";
  ctx.fillText(option.title, bounds.x + bounds.width / 2, bounds.y + 56);

  ctx.fillStyle = option.selected ? accent : HERO_STRIKE_COLORS.cyan;
  ctx.font = "1000 8px system-ui";
  ctx.fillText(option.metric, bounds.x + bounds.width / 2, bounds.y + 76);

  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 7px system-ui";
  ctx.fillText(option.detail, bounds.x + bounds.width / 2, bounds.y + 92);

  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.beginPath();
  ctx.moveTo(bounds.x + 12, bounds.y + 101);
  ctx.lineTo(bounds.x + bounds.width - 12, bounds.y + 101);
  ctx.stroke();

  ctx.fillStyle = option.selected ? HERO_STRIKE_COLORS.white : HERO_STRIKE_COLORS.muted;
  ctx.font = "700 7px system-ui";
  ctx.fillText(option.description, bounds.x + bounds.width / 2, bounds.y + 116);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";

  if (!option.unlocked) drawLockedOverlay(ctx, bounds, option);
}

export function drawHeroStrikeLobbyOptions(
  ctx: CanvasRenderingContext2D,
  category: HeroStrikeLobbyCategory,
) {
  drawTabs(ctx, category.id, category.accent);
  category.options.forEach((option, index) => {
    const bounds = HERO_STRIKE_LOADOUT_CARD_BOUNDS[category.id][index];
    drawOptionCard(ctx, option, bounds, category.accent);
  });
}

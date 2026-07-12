import {
  getHeroStrikeArmoryOptions,
  getHeroStrikeArmoryStatus,
} from "./heroStrikeArmory";
import {
  HERO_STRIKE_ARMORY_CARD_BOUNDS,
  HERO_STRIKE_ARMORY_CONTINUE_BOUNDS,
} from "./heroStrikeArmoryLayout";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export function drawHeroStrikeArmory(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  const status = getHeroStrikeArmoryStatus(state);
  const options = getHeroStrikeArmoryOptions(state);

  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.font = "900 13px system-ui";
  ctx.fillText("FIELD ARMORY", HERO_STRIKE_WIDTH / 2, 330);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 25px system-ui";
  ctx.fillText("구역 정비", HERO_STRIKE_WIDTH / 2, 362);
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 11px system-ui";
  ctx.fillText(`SALVAGE ${status.salvage}`, HERO_STRIKE_WIDTH / 2, 390);

  options.forEach((option, index) => {
    const bounds = HERO_STRIKE_ARMORY_CARD_BOUNDS[index];
    const affordable = status.salvage >= option.cost;
    const selected = status.purchasedId === option.id;
    const disabled = status.purchaseMade && !selected;
    const accent = selected
      ? HERO_STRIKE_COLORS.green
      : affordable && !disabled
        ? HERO_STRIKE_COLORS.cyan
        : HERO_STRIKE_COLORS.muted;

    roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 17);
    ctx.fillStyle = selected ? "rgba(17,55,45,.96)" : "rgba(13,26,48,.96)";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = disabled ? 0.25 : 0.8;
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = accent;
    ctx.font = "1000 31px system-ui";
    ctx.fillText(option.icon, bounds.x + bounds.width / 2, bounds.y + 43);
    ctx.fillStyle = disabled ? HERO_STRIKE_COLORS.muted : HERO_STRIKE_COLORS.white;
    ctx.font = "900 12px system-ui";
    ctx.fillText(option.title, bounds.x + bounds.width / 2, bounds.y + 70);
    ctx.fillStyle = HERO_STRIKE_COLORS.muted;
    ctx.font = "700 8px system-ui";
    ctx.fillText(option.description, bounds.x + bounds.width / 2, bounds.y + 92);

    ctx.fillStyle = accent;
    ctx.font = "1000 12px system-ui";
    ctx.fillText(
      selected ? "PURCHASED" : `${option.cost} SALVAGE`,
      bounds.x + bounds.width / 2,
      bounds.y + 128,
    );
    ctx.fillStyle = HERO_STRIKE_COLORS.muted;
    ctx.font = "700 8px system-ui";
    ctx.fillText(
      status.purchaseMade ? (selected ? "정비 적용 완료" : "이번 구역 구매 완료") : affordable ? "터치하여 구매" : "SALVAGE 부족",
      bounds.x + bounds.width / 2,
      bounds.y + 147,
    );
  });

  const continueBounds = HERO_STRIKE_ARMORY_CONTINUE_BOUNDS;
  roundedRect(
    ctx,
    continueBounds.x,
    continueBounds.y,
    continueBounds.width,
    continueBounds.height,
    18,
  );
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "1000 17px system-ui";
  ctx.fillText("다음 구역으로", HERO_STRIKE_WIDTH / 2, continueBounds.y + 35);
  ctx.textAlign = "left";
}

import { drawHeroStrikeArmory } from "./heroStrikeArmoryRenderer";
import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_WIDTH,
  UPGRADE_CARD_BOUNDS,
} from "./heroStrikeConfig";
import { getHeroStrikeOperationSummary } from "./heroStrikeEncounterDirector";
import { getHeroStrikeSalvageBalance } from "./heroStrikeSalvage";
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
  const accent = HERO_STRIKE_COLORS.purple;
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
  ctx.font = "900 13px system-ui";
  ctx.fillText(protocol.title, bounds.x + bounds.width / 2, bounds.y + 88);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 9px system-ui";
  drawWrappedText(
    ctx,
    protocol.description,
    bounds.x + bounds.width / 2,
    bounds.y + 116,
    bounds.width - 18,
  );

  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 9px system-ui";
  ctx.fillText("CORE MODULE · 1회 한정", bounds.x + bounds.width / 2, bounds.y + bounds.height - 17);
}

export function drawHeroStrikeProtocolReward(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const nextStage = getHeroStrikeStage(state.stageIndex + 1);
  const operation = getHeroStrikeOperationSummary(state);
  const salvage = getHeroStrikeSalvageBalance(state);
  const hasProtocol = state.protocolChoices.length > 0;

  ctx.fillStyle = "rgba(2,6,16,.94)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 12px system-ui";
  ctx.fillText(`STAGE ${state.stageIndex + 1} CLEAR`, HERO_STRIKE_WIDTH / 2, 145);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 29px system-ui";
  ctx.fillText(stage.name, HERO_STRIKE_WIDTH / 2, 184);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 11px system-ui";
  ctx.fillText(
    `MISSION ${operation.missionsSucceeded} CLEAR · ${operation.missionsFailed} FAILED · SALVAGE ${salvage}`,
    HERO_STRIKE_WIDTH / 2,
    215,
  );
  ctx.fillStyle = state.stageHits === 0 ? HERO_STRIKE_COLORS.green : HERO_STRIKE_COLORS.orange;
  ctx.font = "900 10px system-ui";
  ctx.fillText(
    state.stageHits === 0 ? "PERFECT DEFENSE · 추가 작전 평가 반영" : `HITS ${state.stageHits} · 다음 구역에서 수리 권장`,
    HERO_STRIKE_WIDTH / 2,
    240,
  );
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText(`NEXT · ${nextStage.name}`, HERO_STRIKE_WIDTH / 2, 267);

  if (hasProtocol) {
    ctx.fillStyle = HERO_STRIKE_COLORS.purple;
    ctx.font = "900 12px system-ui";
    ctx.fillText("BOSS CORE · 작전 방향을 확정하세요", HERO_STRIKE_WIDTH / 2, 315);
    state.protocolChoices.forEach((protocol, index) => drawProtocolCard(ctx, protocol, index));
    ctx.fillStyle = HERO_STRIKE_COLORS.muted;
    ctx.font = "700 10px system-ui";
    ctx.fillText("코어 선택 후 FIELD ARMORY가 열립니다", HERO_STRIKE_WIDTH / 2, 654);
  } else {
    drawHeroStrikeArmory(ctx, state);
  }
  ctx.textAlign = "left";
}

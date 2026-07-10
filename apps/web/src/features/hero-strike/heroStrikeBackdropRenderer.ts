import { HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getCurrentHeroStrikeStage, type HeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

const backdropCache = new Map<string, HTMLCanvasElement>();

function buildBackdrop(stage: HeroStrikeStage, overdrive: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = HERO_STRIKE_WIDTH;
  canvas.height = HERO_STRIKE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const gradient = ctx.createLinearGradient(0, 0, 0, HERO_STRIKE_HEIGHT);
  gradient.addColorStop(0, overdrive ? "#34203f" : stage.topColor);
  gradient.addColorStop(0.55, overdrive ? "#171d3c" : stage.middleColor);
  gradient.addColorStop(1, stage.bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);

  const glow = ctx.createRadialGradient(HERO_STRIKE_WIDTH / 2, 270, 20, HERO_STRIKE_WIDTH / 2, 300, 360);
  glow.addColorStop(0, overdrive ? "rgba(255, 166, 69, .2)" : stage.glowColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);

  ctx.strokeStyle = stage.gridColor;
  ctx.lineWidth = 1;
  for (let x = -80; x < HERO_STRIKE_WIDTH + 80; x += 52) {
    ctx.beginPath();
    ctx.moveTo(HERO_STRIKE_WIDTH / 2 + (x - HERO_STRIKE_WIDTH / 2) * 0.28, 180);
    ctx.lineTo(x, HERO_STRIKE_HEIGHT);
    ctx.stroke();
  }
  for (let y = 240; y < HERO_STRIKE_HEIGHT; y += 58) {
    const progress = (y - 180) / (HERO_STRIKE_HEIGHT - 180);
    ctx.globalAlpha = 0.025 + progress * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(HERO_STRIKE_WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return canvas;
}

function getBackdrop(stage: HeroStrikeStage, overdrive: boolean) {
  const key = `${stage.id}-${overdrive ? "overdrive" : "normal"}`;
  const cached = backdropCache.get(key);
  if (cached) return cached;
  const created = buildBackdrop(stage, overdrive);
  backdropCache.set(key, created);
  return created;
}

export function drawHeroStrikeBackdrop(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const overdrive = state.player.overdrive > 0;
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(getBackdrop(stage, overdrive), 0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  ctx.imageSmoothingEnabled = smoothing;

  ctx.fillStyle = overdrive ? "#ffd166" : "#f8fbff";
  for (const star of state.stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillRect(star.x, star.y, star.size, star.size * (overdrive ? 4 : 2.2));
  }
  ctx.globalAlpha = 1;
}
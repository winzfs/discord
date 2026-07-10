import {
  BUBBLE_RADIUS,
  HERO_ASSETS,
  HERO_COLORS,
  LOSS_LINE_Y,
  PUZZLE_HEIGHT,
  PUZZLE_WIDTH,
  SHOOTER_Y,
  type PuzzleHeroKind,
} from "./puzzleBubbleConfig";
import { getCellPosition, type Bubble, type PuzzleSpecialKind, type Shot } from "./puzzleBubbleEngine";
import { drawCrispHeroPortrait } from "./puzzleBubblePortraitRenderer";

export type RenderState = {
  bubbles: Bubble[];
  falling: Bubble[];
  shot: Shot | null;
  currentKind: PuzzleHeroKind;
  nextKind: PuzzleHeroKind;
  currentSpecial?: PuzzleSpecialKind;
  nextSpecial?: PuzzleSpecialKind;
  aimX: number;
  aimY: number;
  score: number;
  combo: number;
  shotsUntilDrop: number;
  gameOver: boolean;
  stageCleared: boolean;
  removedCount: number;
  targetRemoved: number;
  feverRemaining: number;
  flash: number;
};

const images = new Map<PuzzleHeroKind, HTMLImageElement>();

export function preloadPuzzleBubbleImages() {
  (Object.entries(HERO_ASSETS) as [PuzzleHeroKind, string][]).forEach(([kind, src]) => {
    const image = new Image();
    image.src = src;
    images.set(kind, image);
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawBackdrop(ctx: CanvasRenderingContext2D, feverActive: boolean) {
  const gradient = ctx.createLinearGradient(0, 0, 0, PUZZLE_HEIGHT);
  gradient.addColorStop(0, feverActive ? "#542f70" : "#172f58");
  gradient.addColorStop(0.52, feverActive ? "#24163e" : "#0c1831");
  gradient.addColorStop(1, "#070c19");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, PUZZLE_WIDTH, PUZZLE_HEIGHT);

  const glow = ctx.createRadialGradient(PUZZLE_WIDTH / 2, 180, 20, PUZZLE_WIDTH / 2, 220, 330);
  glow.addColorStop(0, feverActive ? "rgba(255, 209, 102, .24)" : "rgba(56, 189, 248, .19)");
  glow.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, PUZZLE_WIDTH, 600);
}

function drawHeader(ctx: CanvasRenderingContext2D, state: RenderState) {
  roundedRect(ctx, 12, 12, PUZZLE_WIDTH - 24, 74, 20);
  ctx.fillStyle = "rgba(5, 12, 28, .78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(125, 211, 252, .2)";
  ctx.stroke();

  ctx.fillStyle = "#91a7c8";
  ctx.font = "700 11px system-ui";
  ctx.fillText("SCORE", 30, 37);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 25px system-ui";
  ctx.fillText(state.score.toLocaleString(), 29, 66);

  ctx.textAlign = "center";
  ctx.fillStyle = state.feverRemaining > 0 ? "#ffd166" : state.combo > 1 ? "#ffde8a" : "#8ca0bd";
  ctx.font = "900 16px system-ui";
  ctx.fillText(state.feverRemaining > 0 ? `FEVER ${state.feverRemaining.toFixed(1)}s` : state.combo > 1 ? `COMBO x${state.combo}` : "HERO POP", PUZZLE_WIDTH / 2, 55);

  ctx.textAlign = "right";
  ctx.fillStyle = "#91a7c8";
  ctx.font = "700 11px system-ui";
  ctx.fillText("DROP", PUZZLE_WIDTH - 30, 37);
  ctx.fillStyle = "#ff8b6a";
  ctx.font = "900 25px system-ui";
  ctx.fillText(String(state.shotsUntilDrop), PUZZLE_WIDTH - 30, 66);
  ctx.textAlign = "left";
}

function drawGoal(ctx: CanvasRenderingContext2D, state: RenderState) {
  const progress = Math.min(1, state.removedCount / state.targetRemoved);
  roundedRect(ctx, 22, 92, PUZZLE_WIDTH - 44, 22, 11);
  ctx.fillStyle = "rgba(3, 8, 20, .75)";
  ctx.fill();
  roundedRect(ctx, 25, 95, (PUZZLE_WIDTH - 50) * progress, 16, 8);
  ctx.fillStyle = state.feverRemaining > 0 ? "#ffd166" : "#5ee6c4";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`버블 제거 ${Math.min(state.removedCount, state.targetRemoved)} / ${state.targetRemoved}`, PUZZLE_WIDTH / 2, 108);
  ctx.textAlign = "left";
}

function drawSpecialMark(ctx: CanvasRenderingContext2D, special: PuzzleSpecialKind, x: number, y: number, radius: number) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(15, radius * .85)}px system-ui`;
  if (special === "bomb") {
    ctx.fillStyle = "#111827";
    ctx.strokeStyle = "#ffb347";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius * .55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillText("✦", x, y + 1);
  } else {
    const gradient = ctx.createLinearGradient(x - radius, y, x + radius, y);
    gradient.addColorStop(0, "#ff5d8f");
    gradient.addColorStop(.33, "#ffd166");
    gradient.addColorStop(.66, "#61d7ff");
    gradient.addColorStop(1, "#72f08a");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * .62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText("★", x, y + 1);
  }
  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, kind: PuzzleHeroKind, x: number, y: number, scale = 1, alpha = 1, special?: PuzzleSpecialKind) {
  const radius = BUBBLE_RADIUS * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = special === "bomb" ? "#ff9e35" : special === "rainbow" ? "#ffffff" : HERO_COLORS[kind];
  ctx.shadowBlur = special ? 24 * scale : 16 * scale;

  const gradient = ctx.createRadialGradient(x - radius * .3, y - radius * .36, 2, x, y, radius);
  gradient.addColorStop(0, "rgba(255,255,255,.96)");
  gradient.addColorStop(.22, HERO_COLORS[kind]);
  gradient.addColorStop(1, "#111827");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius - 4 * scale, 0, Math.PI * 2);
  ctx.clip();
  const image = images.get(kind);
  if (image?.complete && image.naturalWidth > 0) drawCrispHeroPortrait(ctx, image, x, y, radius * 2);
  ctx.restore();

  if (special) drawSpecialMark(ctx, special, x, y, radius);
  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.arc(x, y, radius - 1, Math.PI * 1.08, Math.PI * 1.75);
  ctx.stroke();
  ctx.restore();
}

function drawAim(ctx: CanvasRenderingContext2D, state: RenderState) {
  if (state.shot || state.gameOver || state.stageCleared) return;
  const dx = state.aimX - PUZZLE_WIDTH / 2;
  const dy = Math.min(-20, state.aimY - SHOOTER_Y);
  const length = Math.hypot(dx, dy) || 1;
  let x = PUZZLE_WIDTH / 2;
  let y = SHOOTER_Y;
  let vx = dx / length;
  const vy = dy / length;
  ctx.fillStyle = state.currentSpecial ? "#ffd166" : "rgba(255,255,255,.48)";
  for (let index = 0; index < 17; index += 1) {
    x += vx * 18;
    y += vy * 18;
    if (x < 18 || x > PUZZLE_WIDTH - 18) vx *= -1;
    if (y < 115) break;
    ctx.globalAlpha = Math.max(.1, .65 - index * .03);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLauncher(ctx: CanvasRenderingContext2D, state: RenderState) {
  drawAim(ctx, state);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(PUZZLE_WIDTH / 2, SHOOTER_Y + 28, 55, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  drawBubble(ctx, state.currentKind, PUZZLE_WIDTH / 2, SHOOTER_Y, 1.14, 1, state.currentSpecial);
  ctx.fillStyle = "#91a7c8";
  ctx.font = "700 10px system-ui";
  ctx.fillText("NEXT", 25, 681);
  drawBubble(ctx, state.nextKind, 52, 712, .72, 1, state.nextSpecial);
}

function drawResult(ctx: CanvasRenderingContext2D, state: RenderState) {
  if (!state.gameOver && !state.stageCleared) return;
  ctx.fillStyle = "rgba(2, 6, 18, .84)";
  ctx.fillRect(0, 0, PUZZLE_WIDTH, PUZZLE_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = state.stageCleared ? "#72f08a" : "#ffffff";
  ctx.font = "900 34px system-ui";
  ctx.fillText(state.stageCleared ? "STAGE CLEAR!" : "MISSION FAILED", PUZZLE_WIDTH / 2, 330);
  ctx.fillStyle = "#a9b8ce";
  ctx.font = "700 15px system-ui";
  ctx.fillText(`SCORE  ${state.score.toLocaleString()}`, PUZZLE_WIDTH / 2, 366);
  roundedRect(ctx, 105, 405, 210, 58, 18);
  ctx.fillStyle = state.stageCleared ? "#72f08a" : "#f97316";
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "900 17px system-ui";
  ctx.fillText(state.stageCleared ? "다음 판" : "다시 시작", PUZZLE_WIDTH / 2, 441);
  ctx.textAlign = "left";
}

export function renderPuzzleBubble(ctx: CanvasRenderingContext2D, state: RenderState) {
  ctx.clearRect(0, 0, PUZZLE_WIDTH, PUZZLE_HEIGHT);
  drawBackdrop(ctx, state.feverRemaining > 0);
  drawHeader(ctx, state);
  drawGoal(ctx, state);

  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = "rgba(255, 112, 92, .26)";
  ctx.beginPath();
  ctx.moveTo(16, LOSS_LINE_Y);
  ctx.lineTo(PUZZLE_WIDTH - 16, LOSS_LINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  state.bubbles.forEach((bubble) => {
    const position = getCellPosition(bubble.row, bubble.col);
    drawBubble(ctx, bubble.kind, position.x, position.y, 1, 1, bubble.special);
  });
  state.falling.forEach((bubble) => drawBubble(ctx, bubble.kind, bubble.x ?? 0, bubble.y ?? 0, 1, bubble.alpha ?? 1, bubble.special));
  if (state.shot) drawBubble(ctx, state.shot.kind, state.shot.x, state.shot.y, 1, 1, state.shot.special);
  drawLauncher(ctx, state);

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(.34, state.flash)})`;
    ctx.fillRect(0, 0, PUZZLE_WIDTH, PUZZLE_HEIGHT);
  }
  drawResult(ctx, state);
}

import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getEvolutionShortLabels } from "./heroStrikeEvolutions";
import { getObjectiveProgressRatio, getObjectiveStatusText } from "./heroStrikeObjectives";
import type { HeroStrikeState } from "./heroStrikeTypes";
import { getEliteTraitForStage, getEliteTraitLabel, getWaveLabel } from "./heroStrikeWaveDirector";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawObjective(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing") return;
  const x = 203;
  const y = 124;
  const width = 158;
  const ratio = getObjectiveProgressRatio(state);
  roundedRect(ctx, x, y, width, 25, 9);
  ctx.fillStyle = "rgba(4,10,24,.76)";
  ctx.fill();
  ctx.strokeStyle = state.objectiveComplete ? HERO_STRIKE_COLORS.green : "rgba(105,231,255,.28)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(x + 7, y + 18, width - 14, 3);
  ctx.fillStyle = state.objectiveComplete ? HERO_STRIKE_COLORS.green : HERO_STRIKE_COLORS.cyan;
  ctx.fillRect(x + 7, y + 18, (width - 14) * ratio, 3);
  ctx.fillStyle = state.objectiveComplete ? HERO_STRIKE_COLORS.green : HERO_STRIKE_COLORS.white;
  ctx.font = "800 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(state.objectiveComplete ? "목표 완료" : getObjectiveStatusText(state), x + width / 2, y + 12);
  ctx.textAlign = "left";
}

function drawCenteredBanner(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  color: string,
  y: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = "rgba(2,6,16,.72)";
  ctx.fillRect(52, y - 34, HERO_STRIKE_WIDTH - 104, 72);
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.font = "1000 22px system-ui";
  ctx.fillText(title, HERO_STRIKE_WIDTH / 2, y - 3);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "800 11px system-ui";
  ctx.fillText(subtitle, HERO_STRIKE_WIDTH / 2, y + 20);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawWaveBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing" || state.waveBanner <= 0 || state.bossSpawned || state.stageBanner > 0.2) return;
  const elite = state.waveIndex === 3;
  const trait = getEliteTraitForStage(state.stageIndex);
  const subtitle = elite
    ? `${getWaveLabel(state.waveIndex)} · ${getEliteTraitLabel(trait)} 특성`
    : getWaveLabel(state.waveIndex);
  drawCenteredBanner(
    ctx,
    `WAVE ${state.waveIndex} / 4`,
    subtitle,
    elite ? HERO_STRIKE_COLORS.purple : HERO_STRIKE_COLORS.cyan,
    245,
    Math.min(1, state.waveBanner * 1.6),
  );
}

function drawBossPhaseBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.bossPhaseBanner <= 0) return;
  drawCenteredBanner(
    ctx,
    state.bossPhaseLabel,
    "탄막 재구성 · 잠시 후 공격 재개",
    HERO_STRIKE_COLORS.red,
    290,
    Math.min(1, state.bossPhaseBanner * 1.8),
  );
}

function drawEvolutionBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.evolutionBanner <= 0) return;
  drawCenteredBanner(
    ctx,
    "WEAPON EVOLUTION",
    state.evolutionLabel,
    HERO_STRIKE_COLORS.gold,
    365,
    Math.min(1, state.evolutionBanner * 1.5),
  );
}

function drawEvolutionTags(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing" || state.evolutions.length === 0) return;
  const labels = getEvolutionShortLabels(state);
  ctx.textAlign = "left";
  ctx.font = "900 8px system-ui";
  let x = 20;
  for (const label of labels) {
    const width = ctx.measureText(label).width + 14;
    roundedRect(ctx, x, 154, width, 17, 7);
    ctx.fillStyle = "rgba(4,10,24,.74)";
    ctx.fill();
    ctx.strokeStyle = HERO_STRIKE_COLORS.gold;
    ctx.stroke();
    ctx.fillStyle = HERO_STRIKE_COLORS.gold;
    ctx.fillText(label, x + 7, 166);
    x += width + 5;
  }
}

export function drawHeroStrikeCombatProgress(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  drawObjective(ctx, state);
  drawEvolutionTags(ctx, state);
  drawWaveBanner(ctx, state);
  drawBossPhaseBanner(ctx, state);
  drawEvolutionBanner(ctx, state);
}

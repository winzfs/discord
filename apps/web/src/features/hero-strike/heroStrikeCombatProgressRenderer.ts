import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getHeroStrikeMissionDefinition } from "./heroStrikeEncounterCatalog";
import { getEvolutionShortLabels } from "./heroStrikeEvolutions";
import type { HeroStrikeState } from "./heroStrikeTypes";
import { getEliteTraitForStage, getEliteTraitLabel } from "./heroStrikeWaveDirector";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
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
  const mission = getHeroStrikeMissionDefinition(state.stageIndex, state.waveIndex);
  const elite = state.waveIndex === 4;
  const trait = getEliteTraitForStage(state.stageIndex);
  const subtitle = elite
    ? `${mission.brief} · ${getEliteTraitLabel(trait)} ELITE`
    : mission.brief;
  drawCenteredBanner(
    ctx,
    mission.label,
    subtitle,
    elite ? HERO_STRIKE_COLORS.purple : mission.accent,
    245,
    Math.min(1, state.waveBanner * 1.6),
  );
}

function drawBossPhaseBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.bossPhaseBanner <= 0) return;
  drawCenteredBanner(
    ctx,
    state.bossPhaseLabel,
    "탄막 재구성 · BREAK 게이지 초기화",
    HERO_STRIKE_COLORS.red,
    290,
    Math.min(1, state.bossPhaseBanner * 1.8),
  );
}

function drawFlowBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.flowBanner <= 0) return;
  drawCenteredBanner(
    ctx,
    "PULSE RUSH",
    "화력·연사 상승 · 처치로 지속시간 연장",
    HERO_STRIKE_COLORS.gold,
    350,
    Math.min(1, state.flowBanner * 1.7),
  );
}

function drawBossBreakBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.bossBreakBanner <= 0) return;
  drawCenteredBanner(
    ctx,
    "BOSS BREAK",
    "취약 상태 · FOCUS FIRE!",
    HERO_STRIKE_COLORS.gold,
    300,
    Math.min(1, state.bossBreakBanner * 1.8),
  );
}

function drawEvolutionBanner(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.evolutionBanner <= 0) return;
  drawCenteredBanner(
    ctx,
    "WEAPON EVOLUTION",
    state.evolutionLabel,
    HERO_STRIKE_COLORS.gold,
    410,
    Math.min(1, state.evolutionBanner * 1.5),
  );
}

function drawEvolutionTags(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing" || state.evolutions.length === 0 || state.player.combo >= 2 || state.bossSpawned) return;
  const labels = getEvolutionShortLabels(state);
  ctx.textAlign = "left";
  ctx.font = "900 8px system-ui";
  let x = 20;
  for (const label of labels) {
    const width = ctx.measureText(label).width + 14;
    roundedRect(ctx, x, 216, width, 17, 7);
    ctx.fillStyle = "rgba(4,10,24,.74)";
    ctx.fill();
    ctx.strokeStyle = HERO_STRIKE_COLORS.gold;
    ctx.stroke();
    ctx.fillStyle = HERO_STRIKE_COLORS.gold;
    ctx.fillText(label, x + 7, 228);
    x += width + 5;
  }
}

export function drawHeroStrikeCombatProgress(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  drawEvolutionTags(ctx, state);
  drawWaveBanner(ctx, state);
  drawBossPhaseBanner(ctx, state);
  drawBossBreakBanner(ctx, state);
  drawFlowBanner(ctx, state);
  drawEvolutionBanner(ctx, state);
}

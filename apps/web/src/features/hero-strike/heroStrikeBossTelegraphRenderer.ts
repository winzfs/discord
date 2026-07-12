import { getHeroStrikeBossActionSnapshot } from "./heroStrikeBossDirector";
import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

function drawAimedPattern(
  ctx: CanvasRenderingContext2D,
  boss: HeroStrikeEnemy,
  targetX: number,
  targetY: number,
  progress: number,
  wide: boolean,
) {
  const angle = Math.atan2(targetY - boss.y, targetX - boss.x);
  const length = HERO_STRIKE_HEIGHT;
  const spread = wide ? 0.34 : 0.08;
  ctx.save();
  ctx.globalAlpha = 0.25 + progress * 0.55;
  ctx.strokeStyle = progress > 0.75 ? HERO_STRIKE_COLORS.white : HERO_STRIKE_COLORS.red;
  ctx.lineWidth = 1.5 + progress * 2;
  for (const offset of wide ? [-spread, 0, spread] : [0]) {
    ctx.beginPath();
    ctx.moveTo(boss.x, boss.y);
    ctx.lineTo(
      boss.x + Math.cos(angle + offset) * length,
      boss.y + Math.sin(angle + offset) * length,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawLanePattern(
  ctx: CanvasRenderingContext2D,
  boss: HeroStrikeEnemy,
  progress: number,
) {
  ctx.save();
  for (let index = -4; index <= 4; index += 1) {
    if ((index + Math.floor(boss.age * 2)) % 4 === 0) continue;
    const x = boss.x + index * 27;
    ctx.globalAlpha = 0.08 + progress * 0.13;
    ctx.fillStyle = HERO_STRIKE_COLORS.red;
    ctx.fillRect(x - 8, boss.y + 20, 16, HERO_STRIKE_HEIGHT - boss.y);
    ctx.globalAlpha = 0.3 + progress * 0.5;
    ctx.strokeStyle = HERO_STRIKE_COLORS.red;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, boss.y + 20);
    ctx.lineTo(x, HERO_STRIKE_HEIGHT);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRingPattern(
  ctx: CanvasRenderingContext2D,
  boss: HeroStrikeEnemy,
  progress: number,
  spiral: boolean,
) {
  const radius = boss.radius + 28 + (1 - progress) * 24;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate((spiral ? 1 : -1) * progress * Math.PI * 1.5);
  ctx.globalAlpha = 0.35 + progress * 0.55;
  ctx.strokeStyle = HERO_STRIKE_COLORS.red;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  const arms = spiral ? 4 : 6;
  for (let index = 0; index < arms; index += 1) {
    const angle = index * Math.PI * 2 / arms;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (radius - 8), Math.sin(angle) * (radius - 8));
    ctx.lineTo(Math.cos(angle) * (radius + 14), Math.sin(angle) * (radius + 14));
    ctx.stroke();
  }
  ctx.restore();
}

function drawExposure(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
  boss: HeroStrikeEnemy,
) {
  const pulse = Math.sin(state.elapsed * 10) * 0.5 + 0.5;
  const weakX = boss.x + Math.sin(boss.age * 1.15 + boss.phase) * boss.radius * 0.72;
  const weakY = boss.y - boss.radius * 0.08;
  ctx.save();
  ctx.globalAlpha = 0.65 + pulse * 0.3;
  ctx.strokeStyle = HERO_STRIKE_COLORS.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(weakX, weakY, 13 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "1000 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("CORE EXPOSED", boss.x, boss.y + boss.radius + 28);
  ctx.restore();
  ctx.textAlign = "left";
}

export function drawHeroStrikeBossTelegraph(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  const boss = state.enemies.find((enemy) => enemy.boss && !enemy.dead);
  if (!boss) return;
  const action = getHeroStrikeBossActionSnapshot(state, boss);

  if (action.phase === "exposed" || (boss.breakStun ?? 0) > 0) {
    drawExposure(ctx, state, boss);
    return;
  }
  if (action.phase !== "telegraph") return;

  if (action.pattern === "fan" || action.pattern === "burst" || action.pattern === "hybrid") {
    drawAimedPattern(
      ctx,
      boss,
      action.targetX,
      action.targetY,
      action.progress,
      action.pattern !== "burst",
    );
  } else if (action.pattern === "lanes") {
    drawLanePattern(ctx, boss, action.progress);
  } else {
    drawRingPattern(ctx, boss, action.progress, action.pattern === "spiral");
  }

  ctx.save();
  ctx.fillStyle = "rgba(3,6,16,.78)";
  ctx.fillRect(62, 244, HERO_STRIKE_WIDTH - 124, 39);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.red;
  ctx.font = "1000 14px system-ui";
  ctx.fillText(action.patternLabel, HERO_STRIKE_WIDTH / 2, 261);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "800 9px system-ui";
  ctx.fillText("공격 방향을 확인하고 DRIVE로 회피", HERO_STRIKE_WIDTH / 2, 276);
  ctx.restore();
  ctx.textAlign = "left";
}

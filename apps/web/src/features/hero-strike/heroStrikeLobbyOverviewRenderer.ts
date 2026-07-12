import { getTracerImage } from "./heroStrikeAssets";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { getHeroStrikeLobbySnapshot } from "./heroStrikeLobbyData";
import { HERO_STRIKE_LOADOUT_BACK_BOUNDS, type HeroStrikeRect } from "./heroStrikeLoadoutLayout";

type LobbySnapshot = ReturnType<typeof getHeroStrikeLobbySnapshot>;

function roundedRect(ctx: CanvasRenderingContext2D, bounds: HeroStrikeRect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  bounds: HeroStrikeRect,
  accent: string,
) {
  roundedRect(ctx, bounds, 14);
  ctx.fillStyle = "rgba(6,17,33,.9)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawCommandHeader(ctx: CanvasRenderingContext2D, snapshot: LobbySnapshot) {
  roundedRect(ctx, HERO_STRIKE_LOADOUT_BACK_BOUNDS, 9);
  ctx.fillStyle = "rgba(255,255,255,.07)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.18)";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "900 10px system-ui";
  ctx.fillText("←", 38, 35);

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "1000 9px system-ui";
  ctx.fillText("COMMAND DECK // READY", 76, 25);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 14px system-ui";
  ctx.fillText("HERO STRIKE TASKFORCE", 76, 42);

  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "1000 9px system-ui";
  ctx.fillText(`BP RANK ${snapshot.blueprint.rank}`, HERO_STRIKE_WIDTH - 14, 25);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 8px system-ui";
  ctx.fillText(`DATA ${snapshot.blueprint.data}`, HERO_STRIKE_WIDTH - 14, 41);
  ctx.textAlign = "left";
}

function drawHeroShowcase(ctx: CanvasRenderingContext2D, snapshot: LobbySnapshot) {
  const bounds = { x: 14, y: 62, width: 152, height: 170 };
  drawPanel(ctx, bounds, HERO_STRIKE_COLORS.orange);

  ctx.save();
  roundedRect(ctx, bounds, 14);
  ctx.clip();
  const glow = ctx.createRadialGradient(78, 120, 8, 78, 120, 108);
  glow.addColorStop(0, "rgba(255,155,61,.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  ctx.strokeStyle = "rgba(105,231,255,.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(86, 128, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(86, 128, 42, 0, Math.PI * 2);
  ctx.stroke();

  const image = getTracerImage();
  if (image?.complete && image.naturalWidth > 0) {
    const frameHeight = image.naturalHeight / 4;
    const targetHeight = 142;
    const targetWidth = image.naturalWidth * (targetHeight / frameHeight);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      frameHeight,
      82 - targetWidth / 2,
      68,
      targetWidth,
      targetHeight,
    );
  } else {
    ctx.fillStyle = HERO_STRIKE_COLORS.orange;
    ctx.beginPath();
    ctx.arc(82, 126, 34, 0, Math.PI * 2);
    ctx.fill();
  }

  const fade = ctx.createLinearGradient(0, 168, 0, 234);
  fade.addColorStop(0, "rgba(6,17,33,0)");
  fade.addColorStop(1, "rgba(6,17,33,.98)");
  ctx.fillStyle = fade;
  ctx.fillRect(bounds.x, 156, bounds.width, 78);
  ctx.restore();

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.font = "1000 8px system-ui";
  ctx.fillText(snapshot.hero.role, 26, 186);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 20px system-ui";
  ctx.fillText(snapshot.hero.name, 26, 207);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 7px system-ui";
  ctx.fillText(snapshot.hero.tactical, 26, 222);
  ctx.textAlign = "left";
}

function drawThreatBars(ctx: CanvasRenderingContext2D, bars: number) {
  for (let index = 0; index < 5; index += 1) {
    ctx.fillStyle = index < bars ? HERO_STRIKE_COLORS.red : "rgba(255,255,255,.08)";
    ctx.fillRect(281 + index * 14, 104, 9, 5 + index * 2);
  }
}

function drawMissionBriefing(ctx: CanvasRenderingContext2D, snapshot: LobbySnapshot) {
  const bounds = { x: 176, y: 62, width: 230, height: 170 };
  drawPanel(ctx, bounds, HERO_STRIKE_COLORS.cyan);
  const mission = snapshot.mission;

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "1000 8px system-ui";
  ctx.fillText(`${mission.operationCode} // ACTIVE OPERATION`, 190, 82);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 17px system-ui";
  ctx.fillText(mission.name, 190, 103);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 8px system-ui";
  ctx.fillText(mission.subtitle, 190, 117);

  ctx.fillStyle = HERO_STRIKE_COLORS.red;
  ctx.font = "1000 7px system-ui";
  ctx.fillText(`THREAT ${mission.threatLabel}`, 190, 137);
  drawThreatBars(ctx, mission.threatBars);

  ctx.strokeStyle = "rgba(105,231,255,.12)";
  ctx.beginPath();
  ctx.moveTo(190, 148);
  ctx.lineTo(392, 148);
  ctx.stroke();

  const stats = [
    ["ENCOUNTERS", String(mission.encounters)],
    ["ETA", `~${mission.estimatedMinutes} MIN`],
    ["SCORE", `${Math.round(mission.scoreMultiplier * 100)}%`],
  ] as const;
  stats.forEach(([label, value], index) => {
    const x = 190 + index * 68;
    ctx.fillStyle = HERO_STRIKE_COLORS.muted;
    ctx.font = "800 7px system-ui";
    ctx.fillText(label, x, 166);
    ctx.fillStyle = index === 2 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white;
    ctx.font = "1000 11px system-ui";
    ctx.fillText(value, x, 182);
  });

  ctx.fillStyle = "rgba(255,95,109,.1)";
  ctx.fillRect(190, 195, 202, 24);
  ctx.fillStyle = HERO_STRIKE_COLORS.red;
  ctx.font = "900 7px system-ui";
  ctx.fillText("BOSS", 198, 210);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 9px system-ui";
  ctx.fillText(mission.bossName, 235, 210);
}

export function drawHeroStrikeLobbyOverview(
  ctx: CanvasRenderingContext2D,
  snapshot: LobbySnapshot,
) {
  drawCommandHeader(ctx, snapshot);
  drawHeroShowcase(ctx, snapshot);
  drawMissionBriefing(ctx, snapshot);
}

import { getHeroStrikeCombatMode, getHeroStrikeFocusProgress } from "./heroStrikeCombatControl";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeState, PrimaryWeaponId } from "./heroStrikeTypes";

function weaponInstructions(primary: PrimaryWeaponId) {
  if (primary === "scatter-array") {
    return {
      drive: "넓은 5펠릿 · 빠른 자동 장전",
      focus: "탄 2발 소비 · 밀집 10펠릿 BREAK",
    };
  }
  if (primary === "rail-driver") {
    return {
      drive: "이동하며 스파크 사격 · 축전",
      focus: "손을 떼고 정렬 · 관통포 방출",
    };
  }
  return {
    drive: "좌우 제압 점사 · 빠른 냉각",
    focus: "정밀 8점사 · 관통·고화력",
  };
}

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

export function drawHeroStrikeCombatTutorial(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing" || state.stageIndex !== 0 || state.stageElapsed > 8.5) return;
  const alpha = Math.min(1, state.stageElapsed / 0.45, (8.5 - state.stageElapsed) / 1.1);
  if (alpha <= 0) return;

  const instructions = weaponInstructions(state.loadout.primary);
  const mode = getHeroStrikeCombatMode(state);
  const focusProgress = getHeroStrikeFocusProgress(state);
  const x = 26;
  const y = 316;
  const width = HERO_STRIKE_WIDTH - 52;
  const height = 112;

  ctx.save();
  ctx.globalAlpha = alpha;
  roundedRect(ctx, x, y, width, height, 18);
  ctx.fillStyle = "rgba(2,7,18,.92)";
  ctx.fill();
  ctx.strokeStyle = mode === "focus" ? HERO_STRIKE_COLORS.white : HERO_STRIKE_COLORS.cyan;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "1000 9px system-ui";
  ctx.fillText("COMBAT LINK ONLINE", HERO_STRIKE_WIDTH / 2, y + 18);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 16px system-ui";
  ctx.fillText("드래그하면 DRIVE · 손을 떼면 FOCUS", HERO_STRIKE_WIDTH / 2, y + 42);

  const driveActive = mode === "drive";
  ctx.textAlign = "left";
  ctx.fillStyle = driveActive ? HERO_STRIKE_COLORS.cyan : HERO_STRIKE_COLORS.muted;
  ctx.font = "1000 9px system-ui";
  ctx.fillText("DRIVE", x + 16, y + 68);
  ctx.font = "800 9px system-ui";
  ctx.fillText(instructions.drive, x + 68, y + 68);

  ctx.fillStyle = !driveActive ? HERO_STRIKE_COLORS.white : HERO_STRIKE_COLORS.muted;
  ctx.font = "1000 9px system-ui";
  ctx.fillText("FOCUS", x + 16, y + 91);
  ctx.font = "800 9px system-ui";
  ctx.fillText(instructions.focus, x + 68, y + 91);

  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(x + 16, y + 101, width - 32, 4);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.fillRect(x + 16, y + 101, (width - 32) * focusProgress, 4);
  ctx.restore();
  ctx.textAlign = "left";
}

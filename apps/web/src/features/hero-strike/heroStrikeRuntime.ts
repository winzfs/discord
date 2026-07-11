import { updateHeroStrikeAgencyMovement, updateHeroStrikeArtillery } from "./heroStrikeAgency";
import { updateBossPhase } from "./heroStrikeBossPhases";
import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_HIGH_SCORE_KEY,
  HERO_STRIKE_PLAYER_RESPONSE,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { addFloatingText } from "./heroStrikeEffects";
import { updateEnemyFire } from "./heroStrikeEnemyFire";
import {
  getHeroStrikeFlowMovementResponse,
  isHeroStrikeFlowRush,
  updateHeroStrikeFlow,
} from "./heroStrikeFlow";
import { finalizeHeroStrikeRun } from "./heroStrikeMetaProgress";
import { resolvePlayerCollisions, updatePickups } from "./heroStrikePlayerRuntime";
import { updateEnemyMovement, updateSpawning } from "./heroStrikeSpawner";
import { tickHeroStrikeStage } from "./heroStrikeStageRuntime";
import { updateSupportWeapons } from "./heroStrikeSupportWeapons";
import type { HeroStrikeState } from "./heroStrikeTypes";
import { resolveBulletCollisions, updateBullets, updatePlayerFire } from "./heroStrikeWeaponRuntime";

function updateStars(state: HeroStrikeState, dt: number) {
  const rushBoost = isHeroStrikeFlowRush(state) ? 1.65 : 1;
  const speedMultiplier = state.phase === "playing"
    ? (1 + Math.min(1.2, state.player.combo / 60)) * rushBoost
    : 0.35;
  for (const star of state.stars) {
    star.y += star.speed * speedMultiplier * dt;
    if (star.y > HERO_STRIKE_HEIGHT + 4) {
      star.y = -4;
      star.x = Math.random() * HERO_STRIKE_WIDTH;
    }
  }
}

function updateBlinkRecharge(state: HeroStrikeState, dt: number) {
  const player = state.player;
  if (player.blinkCharges >= player.blinkMaxCharges) {
    player.blinkRecharge = 0;
    return;
  }
  player.blinkRecharge -= dt;
  if (player.blinkRecharge > 0) return;
  player.blinkCharges = Math.min(player.blinkMaxCharges, player.blinkCharges + 1);
  player.blinkRecharge = player.blinkCharges < player.blinkMaxCharges ? player.blinkRechargeDuration : 0;
  addFloatingText(state, player.x, player.y - 48, "BLINK READY", HERO_STRIKE_COLORS.cyan, 11);
}

function updatePlayer(state: HeroStrikeState, dt: number) {
  const player = state.player;
  const beforeX = player.x;
  const beforeY = player.y;
  const responseRate = getHeroStrikeFlowMovementResponse(state, HERO_STRIKE_PLAYER_RESPONSE);
  const response = 1 - Math.exp(-responseRate * dt);
  player.x += (player.targetX - player.x) * response;
  player.y += (player.targetY - player.y) * response;
  player.x = Math.max(25, Math.min(HERO_STRIKE_WIDTH - 25, player.x));
  player.y = Math.max(330, Math.min(HERO_STRIKE_HEIGHT - 62, player.y));
  const movedDistance = Math.hypot(player.x - beforeX, player.y - beforeY);
  updateHeroStrikeAgencyMovement(state, movedDistance, dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.comboTimer = Math.max(0, player.comboTimer - dt);
  if (player.comboTimer <= 0) player.combo = 0;
  updateBlinkRecharge(state, dt);
}

function updateEnemies(state: HeroStrikeState, dt: number) {
  for (const enemy of state.enemies) {
    if (enemy.boss) updateBossPhase(state, enemy);
    updateEnemyMovement(state, enemy, dt);
    if ((enemy.breakStun ?? 0) <= 0) updateEnemyFire(state, enemy, dt);
    if (!enemy.boss && enemy.y > HERO_STRIKE_HEIGHT + 50) enemy.dead = true;
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
}

function updateEffects(state: HeroStrikeState, dt: number) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.96, dt * 60);
    particle.vy *= Math.pow(0.96, dt * 60);
    particle.alpha = Math.max(0, particle.life / particle.maxLife);
    if (particle.ring) particle.size += 150 * dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);

  for (const text of state.texts) {
    text.life -= dt;
    text.y -= 42 * dt;
  }
  state.texts = state.texts.filter((text) => text.life > 0);
  state.flash = Math.max(0, state.flash - dt * 1.7);
  state.shake = Math.max(0, state.shake - dt * 2.8);
  state.bossWarning = Math.max(0, state.bossWarning - dt);
  state.stageBanner = Math.max(0, state.stageBanner - dt);
  state.waveBanner = Math.max(0, state.waveBanner - dt);
  state.bossPhaseBanner = Math.max(0, state.bossPhaseBanner - dt);
  state.evolutionBanner = Math.max(0, state.evolutionBanner - dt);
  state.flowBanner = Math.max(0, state.flowBanner - dt);
  state.bossBreakBanner = Math.max(0, state.bossBreakBanner - dt);
}

function persistHighScore(state: HeroStrikeState) {
  if (state.score <= state.highScore) return;
  state.highScore = state.score;
  if (typeof window !== "undefined") window.localStorage.setItem(HERO_STRIKE_HIGH_SCORE_KEY, String(state.highScore));
}

export function tickHeroStrike(state: HeroStrikeState, dt: number) {
  updateStars(state, dt);
  updateEffects(state, dt);
  if (state.phase !== "playing") {
    if (state.phase === "game-over" || state.phase === "victory") {
      finalizeHeroStrikeRun(state);
      persistHighScore(state);
    }
    return;
  }

  if (state.hitStop > 0) {
    state.hitStop = Math.max(0, state.hitStop - dt);
    return;
  }

  state.elapsed += dt;
  updateHeroStrikeFlow(state, dt);
  tickHeroStrikeStage(state, dt);
  updatePlayer(state, dt);
  updateHeroStrikeArtillery(state, dt);
  updatePlayerFire(state, dt);
  updateSpawning(state, dt);
  updateEnemies(state, dt);
  updateSupportWeapons(state, dt);
  if (state.phase !== "playing") return;

  updateBullets(state, dt);
  resolveBulletCollisions(state);
  if (state.phase !== "playing") return;
  resolvePlayerCollisions(state);
  if (state.phase !== "playing") return;
  updatePickups(state, dt);

  if (state.player.combo > 0 && state.player.combo % 10 === 0 && state.player.comboTimer > 2.1) {
    addFloatingText(state, state.player.x, state.player.y - 54, `${state.player.combo} COMBO`, HERO_STRIKE_COLORS.gold, 18);
    state.player.comboTimer = 2.09;
  }
}

import { compactInPlace } from "./heroStrikeArrayUtils";
import { getEliteResearchReward } from "./heroStrikeBalance";
import { applyBossBreakPressure, getBossBreakDamageMultiplier } from "./heroStrikeBossBreak";
import { isHeroStrikeFocus } from "./heroStrikeCombatControl";
import { applyEnemyHitFeedback, playEnemyDefeatFeedback } from "./heroStrikeCombatFeedback";
import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_MAX_BULLETS,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import { hasEvolution } from "./heroStrikeEvolutions";
import { addHeroStrikeFlow } from "./heroStrikeFlow";
import { grantResearchData } from "./heroStrikeMetaProgress";
import { recordStageEnemyDefeat } from "./heroStrikeObjectives";
import { maybeSpawnBonusPickup, spawnEnemyXp, spawnHeroStrikePickup } from "./heroStrikePickups";
import { completeHeroStrikeStage } from "./heroStrikeStageRuntime";
import {
  getChainDamageScale,
  getChainRange,
  getExplosionDamageScale,
} from "./heroStrikeUpgradeScaling";
import type {
  HeroStrikeBullet,
  HeroStrikeEnemy,
  HeroStrikeState,
} from "./heroStrikeTypes";

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function awardEliteDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  if (!enemy.elite) return;
  const research = grantResearchData(state, getEliteResearchReward(state.stageIndex));
  spawnHeroStrikePickup(state, "xp-core", enemy.x, enemy.y, 22 + state.stageIndex * 2);
  addFloatingText(state, enemy.x, enemy.y + enemy.radius + 22, `ELITE · DATA +${research}`, HERO_STRIKE_COLORS.purple, 15);
  state.shake = Math.max(state.shake, 0.55);
}

export function awardEnemyDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  state.kills += 1;
  state.player.combo += 1;
  state.player.comboTimer = 2.25;
  recordStageEnemyDefeat(state, enemy);
  const comboMultiplier = 1 + Math.min(3, Math.floor(state.player.combo / 12)) * 0.2;
  const awardedScore = Math.round(enemy.score * comboMultiplier * state.player.scoreMultiplier);
  state.score += awardedScore;
  const baseUltimateGain = enemy.boss ? 28 : enemy.elite ? 10 : 4;
  const ultimateGain = baseUltimateGain * state.player.ultimateGainMultiplier;
  state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + ultimateGain);
  const baseFlow = enemy.boss ? 26 : enemy.elite ? 15 : 5;
  addHeroStrikeFlow(state, baseFlow * (isHeroStrikeFocus(state) ? 1.08 : 0.82));
  playEnemyDefeatFeedback(enemy);
  addBurst(
    state,
    enemy.x,
    enemy.y,
    enemy.boss ? HERO_STRIKE_COLORS.gold : enemy.elite ? HERO_STRIKE_COLORS.purple : HERO_STRIKE_COLORS.orange,
    enemy.boss ? 36 : enemy.elite ? 22 : 12,
    enemy.boss ? 280 : enemy.elite ? 210 : 165,
    enemy.boss ? 6 : enemy.elite ? 5 : 3.5,
  );
  addFloatingText(
    state,
    enemy.x,
    enemy.y - enemy.radius,
    `+${awardedScore}`,
    HERO_STRIKE_COLORS.gold,
    enemy.boss ? 24 : enemy.elite ? 18 : 14,
  );

  spawnEnemyXp(state, enemy);
  awardEliteDefeat(state, enemy);
  maybeSpawnBonusPickup(state, enemy);
  if (enemy.boss) completeHeroStrikeStage(state);
}

function scatterDistanceMultiplier(bullet: HeroStrikeBullet, enemy: HeroStrikeEnemy) {
  if (bullet.style !== "scatter-array" || bullet.originY === undefined) return 1;
  const distance = Math.abs(bullet.originY - enemy.y);
  const closeness = Math.max(0, Math.min(1, 1 - distance / 410));
  return 0.58 + closeness * 0.86;
}

function tankFrontalMultiplier(enemy: HeroStrikeEnemy, bullet?: HeroStrikeBullet) {
  if (enemy.kind !== "tank" || !bullet || bullet.style === "rail-driver") return 1;
  const centerHit = Math.abs(bullet.x - enemy.x) < enemy.radius * 0.48;
  return centerHit ? 0.3 : 1;
}

function bossWeakPointMultiplier(enemy: HeroStrikeEnemy, bullet?: HeroStrikeBullet) {
  if (!enemy.boss || !bullet) return { damage: 1, breakPower: 1, weak: false };
  const weakX = enemy.x + Math.sin(enemy.age * 1.15 + enemy.phase) * enemy.radius * 0.72;
  const weak = Math.abs(bullet.x - weakX) <= Math.max(13, enemy.radius * 0.26);
  return weak
    ? { damage: 1.24, breakPower: 1.65, weak: true }
    : { damage: 1, breakPower: 0.72, weak: false };
}

function damageEnemy(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  damage: number,
  bullet?: HeroStrikeBullet,
) {
  if (enemy.dead || state.phase !== "playing") return;
  const styleScale = bullet ? scatterDistanceMultiplier(bullet, enemy) : 1;
  const tankScale = tankFrontalMultiplier(enemy, bullet);
  const weakPoint = bossWeakPointMultiplier(enemy, bullet);
  const actualDamage = damage
    * styleScale
    * tankScale
    * weakPoint.damage
    * getBossBreakDamageMultiplier(enemy);
  const previousHp = enemy.hp;
  state.damageDealt += Math.min(previousHp, Math.max(0, actualDamage));
  enemy.hp -= actualDamage;
  if (bullet) {
    applyBossBreakPressure(
      state,
      enemy,
      actualDamage,
      (bullet.breakPower ?? 1) * weakPoint.breakPower,
    );
    applyEnemyHitFeedback(state, enemy, bullet, actualDamage, enemy.hp <= 0);
    if (tankScale < 1 && Math.random() < 0.16) {
      addFloatingText(state, enemy.x, enemy.y - enemy.radius, "BLOCK", HERO_STRIKE_COLORS.shield, 10);
    }
    if (weakPoint.weak && Math.random() < 0.3) {
      addFloatingText(state, enemy.x, enemy.y - enemy.radius - 8, "WEAK", HERO_STRIKE_COLORS.gold, 11);
    }
  }
  if (enemy.hp <= 0) {
    enemy.dead = true;
    awardEnemyDefeat(state, enemy);
  }
}

function applyExplosion(state: HeroStrikeState, source: HeroStrikeEnemy, bullet: HeroStrikeBullet) {
  const radius = bullet.explosionRadius ?? 0;
  const level = state.player.explosiveRoundsLevel;
  if (radius <= 0 || level <= 0 || state.phase !== "playing") return;
  const radiusSquared = radius * radius;
  addRing(state, source.x, source.y, HERO_STRIKE_COLORS.orange, Math.min(26, radius * 0.45));
  for (const enemy of state.enemies) {
    if (enemy.id === source.id || enemy.dead) continue;
    if (distanceSquared(source.x, source.y, enemy.x, enemy.y) > radiusSquared) continue;
    damageEnemy(state, enemy, bullet.damage * getExplosionDamageScale(level));
    if (state.phase !== "playing") return;
  }
}

function applyChain(state: HeroStrikeState, source: HeroStrikeEnemy, bullet: HeroStrikeBullet) {
  const chainCount = bullet.chain ?? 0;
  if (chainCount <= 0 || state.phase !== "playing") return;
  const arcOverload = hasEvolution(state, "arc-overload");
  const range = getChainRange(chainCount) * (arcOverload ? 1.12 : 1);
  const candidates = state.enemies
    .filter((enemy) => !enemy.dead && enemy.id !== source.id)
    .map((enemy) => ({ enemy, distance: distanceSquared(source.x, source.y, enemy.x, enemy.y) }))
    .filter((entry) => entry.distance <= range * range)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, chainCount);

  for (let index = 0; index < candidates.length; index += 1) {
    const target = candidates[index].enemy;
    addBurst(state, target.x, target.y, HERO_STRIKE_COLORS.lime, arcOverload ? 5 : 3, 72, 1.8);
    const evolutionScale = arcOverload ? 1.18 : 1;
    damageEnemy(state, target, bullet.damage * getChainDamageScale(chainCount, index) * evolutionScale);
    if (state.phase !== "playing") return;
  }
}

export function resolveBulletCollisions(state: HeroStrikeState) {
  for (const bullet of state.bullets) {
    if (bullet.enemy || bullet.life <= 0) continue;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const hitRadius = bullet.radius + enemy.radius;
      if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) > hitRadius * hitRadius) continue;

      damageEnemy(state, enemy, bullet.damage, bullet);
      addBurst(
        state,
        bullet.x,
        bullet.y,
        bullet.color,
        bullet.style === "rail-driver" ? 7 : bullet.style === "scatter-array" ? 4 : 2,
        bullet.style === "rail-driver" ? 110 : 70,
        bullet.style === "rail-driver" ? 2.8 : 1.6,
      );
      if (state.phase !== "playing") break;
      applyExplosion(state, enemy, bullet);
      applyChain(state, enemy, bullet);

      if (bullet.pierce > 0) bullet.pierce -= 1;
      else bullet.life = 0;
      if (bullet.life <= 0 || state.phase !== "playing") break;
    }
    if (state.phase !== "playing") break;
  }
  compactInPlace(state.enemies, (enemy) => !enemy.dead);
}

export function updateBullets(state: HeroStrikeState, dt: number) {
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }

  compactInPlace(
    state.bullets,
    (bullet) => bullet.life > 0
      && bullet.x > -40
      && bullet.x < HERO_STRIKE_WIDTH + 40
      && bullet.y > -60
      && bullet.y < HERO_STRIKE_HEIGHT + 60,
  );
  if (state.bullets.length > HERO_STRIKE_MAX_BULLETS) {
    state.bullets.splice(0, state.bullets.length - HERO_STRIKE_MAX_BULLETS);
  }
}

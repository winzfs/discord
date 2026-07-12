import { getBossHealth, getNormalEnemyHealthScale, getSpawnReliefMultiplier } from "./heroStrikeBalance";
import { getBossBreakMax, updateBossBreakState } from "./heroStrikeBossBreak";
import { getBossPhaseMovementMultiplier } from "./heroStrikeBossPhases";
import { updateEnemyImpactFeedback } from "./heroStrikeCombatFeedback";
import { HERO_STRIKE_BOSS_Y, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getHeroStrikeEncounterEnemy } from "./heroStrikeEncounters";
import { getFormationInterval, getNextFormation } from "./heroStrikeFormations";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import { chooseEnemyKindForStage, getCurrentHeroStrikeStage, type NormalEnemyKind } from "./heroStrikeStages";
import type { EliteTrait, HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";
import { openQueuedHeroStrikeUpgrade } from "./heroStrikeUpgrades";
import {
  getEliteTraitForStage,
  getWaveEntryGroupSize,
  getWaveSpawnMultiplier,
  shouldSpawnElite,
  updateHeroStrikeWave,
} from "./heroStrikeWaveDirector";

const ENEMY_STATS: Record<NormalEnemyKind, Pick<HeroStrikeEnemy, "radius" | "hp" | "maxHp" | "reward" | "score">> = {
  runner: { radius: 13, hp: 52, maxHp: 52, reward: 5, score: 125 },
  drone: { radius: 18, hp: 110, maxHp: 110, reward: 8, score: 205 },
  tank: { radius: 24, hp: 270, maxHp: 270, reward: 14, score: 390 },
  sniper: { radius: 15, hp: 135, maxHp: 135, reward: 10, score: 285 },
  weaver: { radius: 16, hp: 120, maxHp: 120, reward: 9, score: 250 },
  bomber: { radius: 23, hp: 330, maxHp: 330, reward: 17, score: 485 },
};

function enemyBaseSpeed(kind: NormalEnemyKind) {
  if (kind === "runner") return 92;
  if (kind === "drone") return 58;
  if (kind === "tank") return 38;
  if (kind === "sniper") return 50;
  if (kind === "weaver") return 72;
  return 35;
}

function enemyFireCooldown(kind: NormalEnemyKind) {
  if (kind === "runner") return 1.35 + Math.random() * 0.75;
  if (kind === "sniper") return 1.55 + Math.random() * 0.45;
  if (kind === "bomber") return 1.5 + Math.random() * 0.5;
  if (kind === "tank") return 1.35 + Math.random() * 0.5;
  return 1.15 + Math.random() * 0.95;
}

function eliteHealthMultiplier(trait: EliteTrait) {
  if (trait === "armored") return 2.7;
  if (trait === "veteran") return 2.3;
  return 2;
}

function eliteSpeedMultiplier(trait: EliteTrait) {
  if (trait === "rapid") return 1.2;
  if (trait === "veteran") return 1.1;
  return 1;
}

function chooseEncounterEnemy(state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  return Math.random() < 0.68
    ? getHeroStrikeEncounterEnemy(state.waveIndex)
    : chooseEnemyKindForStage(stage);
}

export function spawnEnemy(
  state: HeroStrikeState,
  requestedKind?: NormalEnemyKind,
  eliteTrait?: EliteTrait,
  requestedX?: number,
  requestedY = -36,
) {
  const stage = getCurrentHeroStrikeStage(state);
  const kind = requestedKind ?? chooseEncounterEnemy(state);
  const base = ENEMY_STATS[kind];
  const healthScale = getNormalEnemyHealthScale(state, stage.durationSeconds);
  const elite = eliteTrait !== undefined;
  const hpScale = healthScale * (eliteTrait ? eliteHealthMultiplier(eliteTrait) : 1);
  const x = requestedX === undefined
    ? 30 + Math.random() * (HERO_STRIKE_WIDTH - 60)
    : Math.max(30, Math.min(HERO_STRIKE_WIDTH - 30, requestedX));
  const speed = enemyBaseSpeed(kind) * stage.enemySpeedMultiplier * (eliteTrait ? eliteSpeedMultiplier(eliteTrait) : 1);
  const rewardScale = elite ? 2.4 : 1;
  const scoreScale = elite ? 4 : 1;
  const cooldownScale = eliteTrait === "rapid" ? 0.62 : eliteTrait === "veteran" ? 0.78 : 1;

  state.enemies.push({
    id: state.nextId++,
    kind,
    x,
    y: requestedY,
    vx: (Math.random() - 0.5) * (kind === "weaver" ? 34 : 18),
    vy: speed * (0.9 + Math.random() * 0.22),
    radius: base.radius * (elite ? 1.16 : 1),
    hp: base.hp * hpScale,
    maxHp: base.maxHp * hpScale,
    fireCooldown: enemyFireCooldown(kind) * cooldownScale,
    age: 0,
    phase: Math.random() * Math.PI * 2,
    reward: Math.round(base.reward * rewardScale),
    score: Math.round(base.score * healthScale * scoreScale),
    boss: false,
    hitFlash: 0,
    hitPulse: 0,
    recoilX: 0,
    recoilY: 0,
    elite,
    eliteTrait,
  });
}

function spawnElite(state: HeroStrikeState) {
  const kinds: readonly NormalEnemyKind[] = ["drone", "tank", "sniper", "weaver", "bomber"];
  const kind = kinds[state.stageIndex % kinds.length];
  const trait = getEliteTraitForStage(state.stageIndex);
  state.eliteSpawned = true;
  state.waveBanner = 2.1;
  spawnEnemy(state, kind, trait);
}

function spawnFormation(state: HeroStrikeState, enemyCap: number) {
  const remaining = Math.max(0, enemyCap - state.enemies.length);
  for (const unit of getNextFormation(state).slice(0, remaining)) {
    const kind = Math.random() < 0.5 ? getHeroStrikeEncounterEnemy(state.waveIndex) : unit.kind;
    spawnEnemy(state, kind, undefined, unit.x, unit.y);
  }
}

function softenEncounterTransition(state: HeroStrikeState) {
  let keptEnemyBullets = 0;
  state.bullets = state.bullets.filter((bullet) => {
    if (!bullet.enemy) return true;
    keptEnemyBullets += 1;
    return keptEnemyBullets % 2 === 0;
  });
}

export function spawnBoss(state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  state.bossSpawned = true;
  state.bossWarning = 2.8;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  state.missiles = [];
  state.enemies = [];
  const hp = getBossHealth(state, stage);
  state.enemies.push({
    id: state.nextId++,
    kind: "boss",
    x: HERO_STRIKE_WIDTH / 2,
    y: -100,
    vx: 66 + state.stageIndex * 6,
    vy: 72,
    radius: 48 + state.stageIndex * 2.4,
    hp,
    maxHp: hp,
    fireCooldown: 1.35,
    age: 0,
    phase: state.stageIndex,
    reward: 82 + state.stageIndex * 25,
    score: stage.bossScore,
    boss: true,
    hitFlash: 0,
    hitPulse: 0,
    recoilX: 0,
    recoilY: 0,
    bossPhase: 1,
    breakGauge: 0,
    breakMax: getBossBreakMax(hp),
    breakStun: 0,
  });
}

export function updateSpawning(state: HeroStrikeState, dt: number) {
  const stage = getCurrentHeroStrikeStage(state);
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const hasBossEntity = state.enemies.some((enemy) => enemy.boss && !enemy.dead);

  // bossSpawned can be reserved before a queued upgrade screen. Spawn the boss once play resumes.
  if (state.bossSpawned && !hasBossEntity) {
    spawnBoss(state);
    return;
  }

  const waveChanged = updateHeroStrikeWave(state, stage.durationSeconds);
  if (!state.bossSpawned && state.stageElapsed >= stage.durationSeconds) {
    softenEncounterTransition(state);
    if (openQueuedHeroStrikeUpgrade(state)) {
      state.bossSpawned = true;
      return;
    }
    spawnBoss(state);
    return;
  }
  if (state.bossSpawned) return;

  const enemyCap = 10 + Math.min(6, Math.floor(state.stageIndex / 2));

  if (waveChanged) {
    softenEncounterTransition(state);
    state.spawnCooldown = 0.46 * difficulty.spawnInterval;
    state.formationCooldown = Math.min(state.formationCooldown, 3.1);
    if (openQueuedHeroStrikeUpgrade(state)) return;
    const groupSize = Math.min(3, getWaveEntryGroupSize(state.waveIndex));
    for (let index = 0; index < groupSize && state.enemies.length < enemyCap; index += 1) {
      spawnEnemy(state, getHeroStrikeEncounterEnemy(state.waveIndex));
    }
    return;
  }

  if (shouldSpawnElite(state)) {
    spawnElite(state);
    state.spawnCooldown = 1.05 * difficulty.spawnInterval;
    state.formationCooldown = Math.max(state.formationCooldown, 5);
    return;
  }

  state.formationCooldown -= dt;
  if (state.stageElapsed > 7 && state.formationCooldown <= 0 && state.enemies.length <= enemyCap - 4) {
    spawnFormation(state, enemyCap);
    state.formationCooldown = getFormationInterval(state) * 1.12 * difficulty.spawnInterval;
    state.spawnCooldown = Math.max(state.spawnCooldown, 0.86);
    return;
  }

  state.spawnCooldown -= dt;
  if (state.spawnCooldown > 0) return;
  if (state.enemies.length >= enemyCap) {
    state.spawnCooldown = 0.48;
    return;
  }

  spawnEnemy(state);
  state.spawnCooldown = Math.max(stage.spawnMin * 1.08, stage.spawnBase - state.stageElapsed * stage.spawnDecay)
    * getWaveSpawnMultiplier(state.waveIndex)
    * getSpawnReliefMultiplier(state)
    * difficulty.spawnInterval
    * (0.9 + Math.random() * 0.42);
}

function updateBossMovement(enemy: HeroStrikeEnemy, dt: number) {
  updateBossBreakState(enemy, dt);
  if ((enemy.breakStun ?? 0) > 0) {
    enemy.x += enemy.recoilX * dt;
    enemy.y += enemy.recoilY * dt;
    return;
  }
  if (enemy.y < HERO_STRIKE_BOSS_Y) {
    enemy.y = Math.min(HERO_STRIKE_BOSS_Y, enemy.y + enemy.vy * dt);
    return;
  }

  const stageIndex = Math.round(enemy.phase);
  const stageSpeed = stageIndex >= 7 ? 1.2 : stageIndex >= 4 ? 1.13 : stageIndex >= 2 ? 1.06 : 1;
  enemy.x += enemy.vx * stageSpeed * getBossPhaseMovementMultiplier(enemy) * dt;
  if (enemy.x < 66 || enemy.x > HERO_STRIKE_WIDTH - 66) enemy.vx *= -1;

  const bobAmount = stageIndex === 3 ? 25 : stageIndex >= 4 ? 18 : 8;
  enemy.y = HERO_STRIKE_BOSS_Y + Math.sin(enemy.age * (1.2 + stageIndex * 0.08)) * bobAmount;
}

function updateRunnerMovement(state: HeroStrikeState, enemy: HeroStrikeEnemy, dt: number) {
  enemy.fireCooldown -= dt;
  if (enemy.y < 112) {
    enemy.y += enemy.vy * dt;
    return;
  }

  if (enemy.fireCooldown <= 0) {
    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    enemy.vx = dx / length * 290;
    enemy.vy = dy / length * 290;
    enemy.fireCooldown = 3.35;
  }

  if (enemy.fireCooldown > 2.82) {
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    return;
  }

  if (enemy.fireCooldown < 0.52) {
    enemy.x += Math.sin(enemy.age * 8) * 8 * dt;
    return;
  }

  enemy.x += Math.sin(enemy.age * 4.2 + enemy.phase) * 26 * dt;
  enemy.y += Math.max(32, Math.abs(enemy.vy) * 0.24) * dt;
}

export function updateEnemyMovement(state: HeroStrikeState, enemy: HeroStrikeEnemy, dt: number) {
  enemy.age += dt;
  updateEnemyImpactFeedback(enemy, dt);
  if (enemy.boss) {
    updateBossMovement(enemy, dt);
    return;
  }

  if (enemy.kind === "runner") {
    updateRunnerMovement(state, enemy, dt);
  } else if (enemy.kind === "sniper") {
    const hoverY = 155 + Math.sin(enemy.phase) * 30;
    if (enemy.y < hoverY) enemy.y += enemy.vy * dt;
    else if (enemy.age < 10) enemy.x += Math.sin(enemy.age * 1.8 + enemy.phase) * 42 * dt;
    else enemy.y += enemy.vy * 0.68 * dt;
  } else if (enemy.kind === "weaver") {
    enemy.x += (enemy.vx + Math.sin(enemy.age * 5.4 + enemy.phase) * 62) * dt;
    enemy.y += enemy.vy * dt;
  } else if (enemy.kind === "bomber") {
    enemy.x += Math.sin(enemy.age * 1.25 + enemy.phase) * 15 * dt;
    enemy.y += enemy.vy * 0.84 * dt;
  } else {
    const wave = enemy.kind === "drone" ? 18 : 7;
    enemy.x += (enemy.vx + Math.sin(enemy.age * 2.2 + enemy.phase) * wave) * dt;
    enemy.y += enemy.vy * dt;
  }

  enemy.x += enemy.recoilX * dt;
  enemy.y += enemy.recoilY * dt;
  enemy.x = Math.max(enemy.radius, Math.min(HERO_STRIKE_WIDTH - enemy.radius, enemy.x));
}

import { HERO_STRIKE_BOSS_Y, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { chooseEnemyKindForStage, getCurrentHeroStrikeStage } from "./heroStrikeStages";
import type { EnemyKind, HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

type NormalEnemyKind = Exclude<EnemyKind, "boss">;

const ENEMY_STATS: Record<NormalEnemyKind, Pick<HeroStrikeEnemy, "radius" | "hp" | "maxHp" | "reward" | "score">> = {
  runner: { radius: 13, hp: 36, maxHp: 36, reward: 6, score: 110 },
  drone: { radius: 18, hp: 72, maxHp: 72, reward: 10, score: 180 },
  tank: { radius: 24, hp: 170, maxHp: 170, reward: 18, score: 330 },
  sniper: { radius: 15, hp: 96, maxHp: 96, reward: 14, score: 260 },
  weaver: { radius: 16, hp: 84, maxHp: 84, reward: 12, score: 225 },
  bomber: { radius: 23, hp: 225, maxHp: 225, reward: 23, score: 430 },
};

function difficultyScale(state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const stageProgress = Math.min(1, state.stageElapsed / stage.durationSeconds);
  return 1 + stageProgress * 0.62 + state.stageIndex * 0.22;
}

function enemyBaseSpeed(kind: NormalEnemyKind) {
  if (kind === "runner") return 104;
  if (kind === "drone") return 62;
  if (kind === "tank") return 42;
  if (kind === "sniper") return 54;
  if (kind === "weaver") return 78;
  return 38;
}

function enemyFireCooldown(kind: NormalEnemyKind) {
  if (kind === "runner") return 99;
  if (kind === "sniper") return 1.7 + Math.random() * 0.5;
  if (kind === "bomber") return 1.45 + Math.random() * 0.55;
  if (kind === "tank") return 1.25 + Math.random() * 0.55;
  return 1.05 + Math.random() * 1.1;
}

export function spawnEnemy(state: HeroStrikeState, requestedKind?: NormalEnemyKind) {
  const stage = getCurrentHeroStrikeStage(state);
  const kind = requestedKind ?? chooseEnemyKindForStage(stage);
  const base = ENEMY_STATS[kind];
  const scale = difficultyScale(state);
  const x = 30 + Math.random() * (HERO_STRIKE_WIDTH - 60);
  const speed = enemyBaseSpeed(kind) * stage.enemySpeedMultiplier;
  state.enemies.push({
    id: state.nextId++,
    kind,
    x,
    y: -36,
    vx: (Math.random() - 0.5) * (kind === "weaver" ? 34 : 18),
    vy: speed * (0.9 + Math.random() * 0.25),
    radius: base.radius,
    hp: base.hp * scale,
    maxHp: base.maxHp * scale,
    fireCooldown: enemyFireCooldown(kind),
    age: 0,
    phase: Math.random() * Math.PI * 2,
    reward: base.reward,
    score: Math.round(base.score * scale),
    boss: false,
  });
}

export function spawnBoss(state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  state.bossSpawned = true;
  state.bossWarning = 2.8;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  state.missiles = [];
  const hp = stage.bossHpBase + state.player.level * stage.bossHpPerLevel;
  state.enemies.push({
    id: state.nextId++,
    kind: "boss",
    x: HERO_STRIKE_WIDTH / 2,
    y: -100,
    vx: 72 + state.stageIndex * 7,
    vy: 78,
    radius: 48 + state.stageIndex * 2.4,
    hp,
    maxHp: hp,
    fireCooldown: 1.25,
    age: 0,
    phase: state.stageIndex,
    reward: 110 + state.stageIndex * 35,
    score: stage.bossScore,
    boss: true,
  });
}

export function updateSpawning(state: HeroStrikeState, dt: number) {
  const stage = getCurrentHeroStrikeStage(state);
  if (!state.bossSpawned && state.stageElapsed >= stage.durationSeconds) {
    spawnBoss(state);
    return;
  }
  if (state.bossSpawned) return;

  state.spawnCooldown -= dt;
  if (state.spawnCooldown > 0) return;

  spawnEnemy(state);
  state.spawnCooldown = Math.max(stage.spawnMin, stage.spawnBase - state.stageElapsed * stage.spawnDecay)
    * (0.74 + Math.random() * 0.58);
}

function updateBossMovement(enemy: HeroStrikeEnemy, dt: number) {
  if (enemy.y < HERO_STRIKE_BOSS_Y) {
    enemy.y = Math.min(HERO_STRIKE_BOSS_Y, enemy.y + enemy.vy * dt);
    return;
  }

  const stageIndex = Math.round(enemy.phase);
  const speedMultiplier = stageIndex >= 4 ? 1.18 : stageIndex >= 2 ? 1.08 : 1;
  enemy.x += enemy.vx * speedMultiplier * dt;
  if (enemy.x < 66 || enemy.x > HERO_STRIKE_WIDTH - 66) enemy.vx *= -1;

  const bobAmount = stageIndex === 3 ? 25 : stageIndex >= 4 ? 18 : 8;
  enemy.y = HERO_STRIKE_BOSS_Y + Math.sin(enemy.age * (1.2 + stageIndex * 0.12)) * bobAmount;
}

export function updateEnemyMovement(enemy: HeroStrikeEnemy, dt: number) {
  enemy.age += dt;
  if (enemy.boss) {
    updateBossMovement(enemy, dt);
    return;
  }

  if (enemy.kind === "sniper") {
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
    const wave = enemy.kind === "runner" ? 32 : enemy.kind === "drone" ? 18 : 8;
    enemy.x += (enemy.vx + Math.sin(enemy.age * (enemy.kind === "runner" ? 4.8 : 2.2) + enemy.phase) * wave) * dt;
    enemy.y += enemy.vy * dt;
  }

  enemy.x = Math.max(enemy.radius, Math.min(HERO_STRIKE_WIDTH - enemy.radius, enemy.x));
}
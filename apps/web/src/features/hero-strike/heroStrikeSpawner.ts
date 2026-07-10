import { HERO_STRIKE_BOSS_Y, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { chooseEnemyKindForStage, getCurrentHeroStrikeStage } from "./heroStrikeStages";
import type { EnemyKind, HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

const ENEMY_STATS: Record<Exclude<EnemyKind, "boss">, Pick<HeroStrikeEnemy, "radius" | "hp" | "maxHp" | "reward" | "score">> = {
  runner: { radius: 13, hp: 36, maxHp: 36, reward: 6, score: 110 },
  drone: { radius: 18, hp: 72, maxHp: 72, reward: 10, score: 180 },
  tank: { radius: 24, hp: 170, maxHp: 170, reward: 18, score: 330 },
};

function difficultyScale(state: HeroStrikeState) {
  return 1 + Math.min(0.7, state.stageElapsed / 45) + state.stageIndex * 0.18;
}

export function spawnEnemy(state: HeroStrikeState, requestedKind?: Exclude<EnemyKind, "boss">) {
  const stage = getCurrentHeroStrikeStage(state);
  const kind = requestedKind ?? chooseEnemyKindForStage(stage);
  const base = ENEMY_STATS[kind];
  const scale = difficultyScale(state);
  const x = 30 + Math.random() * (HERO_STRIKE_WIDTH - 60);
  const baseSpeed = kind === "runner" ? 104 : kind === "drone" ? 62 : 42;
  const speed = baseSpeed * stage.enemySpeedMultiplier;
  state.enemies.push({
    id: state.nextId++,
    kind,
    x,
    y: -36,
    vx: (Math.random() - 0.5) * 18,
    vy: speed * (0.9 + Math.random() * 0.25),
    radius: base.radius,
    hp: base.hp * scale,
    maxHp: base.maxHp * scale,
    fireCooldown: kind === "runner" ? 99 : 1.1 + Math.random() * 1.25,
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
  state.bossWarning = 2.6;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  const hp = stage.bossHpBase + state.player.level * stage.bossHpPerLevel;
  state.enemies.push({
    id: state.nextId++,
    kind: "boss",
    x: HERO_STRIKE_WIDTH / 2,
    y: -100,
    vx: 74 + state.stageIndex * 8,
    vy: 78,
    radius: 48 + state.stageIndex * 3,
    hp,
    maxHp: hp,
    fireCooldown: 1.3,
    age: 0,
    phase: state.stageIndex,
    reward: 100 + state.stageIndex * 35,
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

export function updateEnemyMovement(enemy: HeroStrikeEnemy, dt: number) {
  enemy.age += dt;
  if (enemy.boss) {
    if (enemy.y < HERO_STRIKE_BOSS_Y) enemy.y = Math.min(HERO_STRIKE_BOSS_Y, enemy.y + enemy.vy * dt);
    else {
      enemy.x += enemy.vx * dt;
      if (enemy.x < 70 || enemy.x > HERO_STRIKE_WIDTH - 70) enemy.vx *= -1;
    }
    return;
  }

  const wave = enemy.kind === "runner" ? 32 : enemy.kind === "drone" ? 18 : 8;
  enemy.x += (enemy.vx + Math.sin(enemy.age * (enemy.kind === "runner" ? 4.8 : 2.2) + enemy.phase) * wave) * dt;
  enemy.y += enemy.vy * dt;
  enemy.x = Math.max(enemy.radius, Math.min(HERO_STRIKE_WIDTH - enemy.radius, enemy.x));
}
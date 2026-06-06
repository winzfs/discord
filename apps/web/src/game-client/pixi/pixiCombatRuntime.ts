import { getAllBoardHeroes, getHeroById } from "@discord-random-defense/game";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { createGameLayout } from "./gameLayout";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { MAX_ATTACKERS_PER_TICK } from "./pixiGameTypes";
import { updateEnemyViewHp } from "./pixiEnemyView";
import { destroyActiveEnemy } from "./pixiEnemyRuntime";
import { getProgressHeroPower, applyEconomyRewardBonus } from "./pixiProgressBonuses";
import { getHeroLevelMultiplier } from "./pixiLobbyHeroPool";
import { getHeroSynergyAttackMultiplier, getHeroSynergyLabel } from "./pixiHeroSynergyRuntime";
import { getPixiUnitAttackRange, isPointInPixiUnitRange } from "./pixiUnitRange";
import { chargeMythicUltimateFromAttack, tryTriggerMythicUltimate } from "./pixiUltimateRuntime";
import { applyMythicHeroSkillEffects } from "./pixiSkillRuntime";
import { spawnDistinctHeroAttackFx } from "./pixiHeroAttackFxRuntime";
import { pickWinstonBeamTargets, spawnWinstonElectricBeam } from "./pixiWinstonBeamRuntime";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";
import { spawnBaseSkillFx } from "./pixiBaseSkillFxRuntime";
import {
  applyBaseHeroSkillPostDamage,
  applyBaseHeroSkillPreDamage,
  getBaseHeroSkillFxKind,
} from "./pixiBaseHeroSkillRuntime";

export type PixiCombatRuntimeOptions = {
  getCellCenter: (refs: GameRefs, cellIndex: number) => { x: number; y: number; cell: number };
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
  invalidateControls: (refs: GameRefs) => void;
  drawTopHud: (refs: GameRefs, layout: ReturnType<typeof createGameLayout>) => void;
  drawControls: (refs: GameRefs, layout: ReturnType<typeof createGameLayout>) => void;
  drawBoard: (refs: GameRefs, layout: ReturnType<typeof createGameLayout>) => void;
};

const SPRITE_ATTACK_HERO_IDS = new Set(["tracer", "kiriko", "dva", "zarya", "cassidy", "winston", "genji", "ana", "illari"]);
const HERO_IDLE_DIRECTION_HOLD_MS = 3000;
const ZARYA_MAX_BEAM_CHARGE = 6;
const ZARYA_BEAM_CHAIN_WINDOW_MS = 1200;
let boardDrawQueued = false;
let hudControlsDrawQueued = false;

function requestBoardDraw(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  if (boardDrawQueued) return;
  boardDrawQueued = true;

  window.requestAnimationFrame(() => {
    boardDrawQueued = false;
    options.drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
  });
}

function requestHudControlsDraw(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  if (hudControlsDrawQueued) return;
  hudControlsDrawQueued = true;

  window.requestAnimationFrame(() => {
    hudControlsDrawQueued = false;
    const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
    options.drawTopHud(refs, layout);
    options.drawControls(refs, layout);
  });
}

function getHeroSpriteAttackDuration(heroId: string) {
  if (heroId === "cassidy") return 520;
  if (heroId === "zarya") return 620;
  if (heroId === "winston") return 420;
  return 260;
}

function roleAccent(role: HeroRole | undefined) {
  if (role === "tank") return 0x87b7ff;
  if (role === "support") return 0x7dffb2;
  return 0xffd166;
}

function pickAttackTarget(refs: GameRefs, role: HeroRole | undefined, from: { x: number; y: number }, range: number): ActiveEnemy | null {
  const liveEnemies = refs.activeEnemies.filter(
    (enemy) => enemy.alive && enemy.progress >= 0 && isPointInPixiUnitRange(from, enemy, range),
  );
  if (liveEnemies.length === 0) return null;

  if (role === "damage") {
    const boss = liveEnemies.find((enemy) => enemy.boss);
    if (boss) return boss;
  }

  liveEnemies.sort((a, b) => b.progress - a.progress);
  return liveEnemies[0] ?? null;
}

function getHeroDamage(refs: GameRefs, hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const gradeBase =
    hero.grade === "mythic"
      ? 150
      : hero.grade === "legendary"
        ? 95
        : hero.grade === "epic"
          ? 52
          : hero.grade === "rare"
            ? 28
            : 16;
  const roleMultiplier = role === "damage" ? 1.35 : role === "tank" ? 0.62 : 0.48;
  const fallbackPower = Math.round(gradeBase * roleMultiplier);
  const progressPower = getProgressHeroPower(refs.progressBonuses, hero, fallbackPower);
  const lobbyLevelMultiplier = getHeroLevelMultiplier(refs.heroLevels[hero.heroId] ?? 1);
  const synergyMultiplier = getHeroSynergyAttackMultiplier(refs, hero);

  return Math.round(
    progressPower *
      lobbyLevelMultiplier *
      refs.progressBonuses.attackMultiplier *
      synergyMultiplier *
      (1 + refs.state.powerUpgradeLevel * 0.16),
  );
}

function damageEnemy(
  refs: GameRefs,
  enemy: ActiveEnemy,
  damage: number,
  options: PixiCombatRuntimeOptions,
) {
  if (!enemy.alive) return;

  enemy.hp = Math.max(0, enemy.hp - damage);
  updateEnemyViewHp(enemy.view, enemy.hp, enemy.maxHp);

  if (enemy.hp > 0) return;

  enemy.alive = false;

  const reward = applyEconomyRewardBonus(refs.progressBonuses, enemy.reward);
  refs.waveKilled += 1;
  refs.waveReward += reward;
  refs.state = {
    ...refs.state,
    resources: refs.state.resources + reward,
    defeatedEnemies: refs.state.defeatedEnemies + (enemy.boss ? 0 : 1),
    defeatedBosses: refs.state.defeatedBosses + (enemy.boss ? 1 : 0),
    score: refs.state.score + reward * 3 + (enemy.boss ? 250 : 20),
  };

  options.floatText(refs, `+${reward}`, enemy.x, enemy.y - 26, colors.green);
  destroyActiveEnemy(enemy);
  options.invalidateControls(refs);
  requestHudControlsDraw(refs, options);
}

function applyTankSlow(enemy: ActiveEnemy) {
  enemy.speed = Math.max(0.2, enemy.speed * 0.88);
}

function triggerHeroSpriteAttack(refs: GameRefs, hero: BoardHero, from: { x: number; y: number }, target: ActiveEnemy, options: PixiCombatRuntimeOptions) {
  if (!SPRITE_ATTACK_HERO_IDS.has(hero.heroId)) return;

  const now = Date.now();
  const direction = target.x < from.x ? "left" : "right";
  const duration = getHeroSpriteAttackDuration(hero.heroId);

  refs.heroSpriteAttacks[hero.instanceId] = {
    direction,
    until: now + duration,
    idleUntil: now + HERO_IDLE_DIRECTION_HOLD_MS,
  };

  requestBoardDraw(refs, options);

  window.setTimeout(() => {
    requestBoardDraw(refs, options);
  }, duration + 20);

  window.setTimeout(() => {
    requestBoardDraw(refs, options);
  }, HERO_IDLE_DIRECTION_HOLD_MS + 20);
}

function showBaseSkillStartupFx(refs: GameRefs, hero: BoardHero, role: HeroRole, target: ActiveEnemy, options: PixiCombatRuntimeOptions) {
  const fxKind = getBaseHeroSkillFxKind(hero, role);
  if (!fxKind) return;

  spawnBaseSkillFx(
    refs,
    { addAnimation: options.addAnimation },
    fxKind,
    target,
  );
}

function applyBaseHeroPostDamage(
  refs: GameRefs,
  hero: BoardHero,
  role: HeroRole,
  target: ActiveEnemy,
  damage: number,
  options: PixiCombatRuntimeOptions,
) {
  applyBaseHeroSkillPostDamage(
    refs,
    {
      damageEnemy: (refs, enemy, damage) => damageEnemy(refs, enemy, damage, options),
      floatText: options.floatText,
      addAnimation: options.addAnimation,
    },
    hero,
    role,
    target,
    damage,
  );
}

function applyAttackDamage(refs: GameRefs, hero: BoardHero, role: HeroRole, target: ActiveEnemy, damage: number, options: PixiCombatRuntimeOptions) {
  if (!target.alive) return;

  if (role === "tank") applyTankSlow(target);

  damageEnemy(refs, target, damage, options);
  applyBaseHeroPostDamage(refs, hero, role, target, damage, options);
}

function updateZaryaBeamCharge(refs: GameRefs, hero: BoardHero, target: ActiveEnemy) {
  const now = Date.now();
  const previous = refs.zaryaBeamCharges[hero.instanceId];
  const isContinuing =
    previous &&
    previous.targetId === target.id &&
    now - previous.lastAttackAt <= ZARYA_BEAM_CHAIN_WINDOW_MS;

  const charge = isContinuing
    ? Math.min(ZARYA_MAX_BEAM_CHARGE, previous.charge + 1)
    : 1;

  refs.zaryaBeamCharges[hero.instanceId] = {
    targetId: target.id,
    charge,
    lastAttackAt: now,
  };

  return charge;
}

function getZaryaBeamDamage(baseDamage: number, charge: number) {
  return Math.round(baseDamage * (0.78 + charge * 0.16));
}

function spawnZaryaBeamEffect(
  refs: GameRefs,
  options: PixiCombatRuntimeOptions,
  from: { x: number; y: number },
  target: ActiveEnemy,
  charge: number,
  done: () => void,
) {
  const beam = acquireFxGraphics(refs);
  const duration = 620;
  const baseOuterWidth = 7 + charge * 1.9;
  const baseInnerWidth = 2.5 + charge * 0.7;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      if (!target.alive) {
        beam.alpha = Math.max(0, 1 - progress);
        return;
      }

      const pulse = 0.72 + Math.sin(progress * Math.PI * 8) * 0.18;
      const alpha = 0.92 - progress * 0.18;
      const outerWidth = baseOuterWidth * pulse;
      const innerWidth = baseInnerWidth * (0.9 + pulse * 0.12);

      beam.clear();
      beam.moveTo(from.x, from.y);
      beam.lineTo(target.x, target.y);
      beam.stroke({ color: 0xff4fd8, width: outerWidth, alpha: 0.28 * alpha });
      beam.moveTo(from.x, from.y);
      beam.lineTo(target.x, target.y);
      beam.stroke({ color: 0xff9ff1, width: Math.max(3, outerWidth * 0.52), alpha: 0.32 * alpha });
      beam.moveTo(from.x, from.y);
      beam.lineTo(target.x, target.y);
      beam.stroke({ color: 0xffffff, width: innerWidth, alpha });
    },
    done: () => {
      releaseFxGraphics(refs, beam);
      done();
    },
  });
}

function tryTriggerUltimateAttack(refs: GameRefs, options: PixiCombatRuntimeOptions, hero: BoardHero, from: { x: number; y: number }, target: ActiveEnemy, damage: number) {
  chargeMythicUltimateFromAttack(refs, hero);

  const triggered = tryTriggerMythicUltimate(
    refs,
    {
      addAnimation: options.addAnimation,
      floatText: options.floatText,
      damageEnemy: (refs, enemy, damage) => damageEnemy(refs, enemy, damage, options),
    },
    hero,
    from,
    target,
    damage,
  );

  requestBoardDraw(refs, options);
  return triggered;
}

function drawBoardNow(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  requestBoardDraw(refs, options);
}

function applySkillEffects(refs: GameRefs, options: PixiCombatRuntimeOptions, hero: BoardHero, role: HeroRole, target: ActiveEnemy, damage: number, from: { x: number; y: number }) {
  return applyMythicHeroSkillEffects(
    refs,
    {
      addAnimation: options.addAnimation,
      damageEnemy: (refs, enemy, damage) => damageEnemy(refs, enemy, damage, options),
      drawBoard: (refs) => drawBoardNow(refs, options),
      floatText: options.floatText,
    },
    hero,
    role,
    target,
    damage,
    from,
  );
}

export function spawnAttackEffects(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  const heroes = getAllBoardHeroes(refs.state.board);
  if (heroes.length === 0) return;

  heroes.slice(0, Math.min(heroes.length, MAX_ATTACKERS_PER_TICK)).forEach((hero, index) => {
    const definition = getHeroById(hero.heroId);
    const role = definition?.role ?? "damage";
    const fromIndex = hero.position.row * refs.state.boardSize.columns + hero.position.column;
    const from = options.getCellCenter(refs, fromIndex);
    const range = getPixiUnitAttackRange(hero);
    const target = pickAttackTarget(refs, role, from, range);
    if (!target) return;

    let damage = getHeroDamage(refs, hero);
    const synergyLabel = getHeroSynergyLabel(refs, hero);
    if (synergyLabel && index === 0) {
      options.floatText(refs, synergyLabel, from.x, from.y - 34, 0x7dffb2);
    }

    damage = applyBaseHeroSkillPreDamage(hero, role, damage);
    triggerHeroSpriteAttack(refs, hero, from, target, options);
    showBaseSkillStartupFx(refs, hero, role, target, options);
    damage = applySkillEffects(refs, options, hero, role, target, damage, from);
    if (!target.alive) return;

    if (tryTriggerUltimateAttack(refs, options, hero, from, target, damage)) {
      return;
    }

    if (hero.heroId === "winston") {
      const beamTargets = pickWinstonBeamTargets(refs, target);
      spawnWinstonElectricBeam(
        refs,
        {
          addAnimation: options.addAnimation,
          applyDamage: (enemy, value) => damageEnemy(refs, enemy, value, options),
        },
        from,
        beamTargets,
        damage,
        () => {
          if (index === 0) options.floatText(refs, `${Math.round(damage * 0.72)}`, target.x, target.y - 18, 0x87b7ff);
        },
      );
      return;
    }

    if (hero.heroId === "zarya") {
      const charge = updateZaryaBeamCharge(refs, hero, target);
      const beamDamage = getZaryaBeamDamage(damage, charge);
      spawnZaryaBeamEffect(refs, options, from, target, charge, () => {
        applyAttackDamage(refs, hero, role, target, beamDamage, options);
        if (index === 0) {
          options.floatText(refs, `${beamDamage}`, target.x, target.y - 18, charge >= 4 ? 0xff7de9 : colors.yellow);
        }
      });
      return;
    }

    if (
      spawnDistinctHeroAttackFx(
        refs,
        {
          addAnimation: options.addAnimation,
          applyDamage: (enemy, value) => damageEnemy(refs, enemy, value, options),
          floatText: (value, x, y, color) => options.floatText(refs, value, x, y, color),
        },
        hero.heroId,
        from,
        target,
        damage,
      )
    ) {
      return;
    }

    const projectile = acquireFxGraphics(refs);
    projectile.circle(0, 0, hero.grade === "mythic" ? 5 : 3.5);
    projectile.fill({ color: roleAccent(role), alpha: 1 });
    projectile.x = from.x;
    projectile.y = from.y;

    const targetAtFire = { x: target.x, y: target.y };

    options.addAnimation(refs, {
      duration: 280 + index * 18,
      update: (progress) => {
        const eased = 1 - Math.pow(1 - progress, 2);
        projectile.x = from.x + (targetAtFire.x - from.x) * eased;
        projectile.y = from.y + (targetAtFire.y - from.y) * eased;
        projectile.alpha = Math.max(0, 1 - progress * 0.18);
      },
      done: () => {
        releaseFxGraphics(refs, projectile);
        applyAttackDamage(refs, hero, role, target, damage, options);
        if (index === 0) options.floatText(refs, `${damage}`, target.x, target.y - 18, roleAccent(role));
      },
    });
  });
}

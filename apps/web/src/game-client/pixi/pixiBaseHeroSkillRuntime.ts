import { getHeroById, skills } from "@discord-random-defense/game";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { getProgressHeroMasteryEffect } from "./pixiProgressBonuses";
import { spawnBaseSkillFx, type BaseSkillFxKind } from "./pixiBaseSkillFxRuntime";

export type BaseHeroSkillRuntimeOptions = {
  damageEnemy: (refs: GameRefs, enemy: ActiveEnemy, damage: number) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
  addAnimation?: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
};

type SkillProfile = {
  damageMultiplier: number;
  splashMultiplier: number;
  splashRadius: number;
  extraHitMultiplier: number;
  slowMultiplier: number;
  coinBonus: number;
  fxKind: BaseSkillFxKind | null;
  text?: string;
  color: number;
};

const DEFAULT_PROFILE: SkillProfile = {
  damageMultiplier: 1,
  splashMultiplier: 0,
  splashRadius: 0,
  extraHitMultiplier: 0,
  slowMultiplier: 1,
  coinBonus: 0,
  fxKind: null,
  color: colors.white,
};

function getHeroSkillIds(hero: BoardHero) {
  return getHeroById(hero.heroId)?.skillIds ?? [];
}

function getSkillTags(skillId: string) {
  return skills.find((skill) => skill.id === skillId)?.tags ?? [];
}

function hasTag(skillIds: string[], tag: string) {
  return skillIds.some((skillId) => getSkillTags(skillId).includes(tag));
}

function isNonMythic(hero: BoardHero) {
  return hero.grade !== "mythic";
}

function getGradeScale(hero: BoardHero) {
  if (hero.grade === "legendary") return 1.35;
  if (hero.grade === "epic") return 1.16;
  if (hero.grade === "rare") return 1.08;
  return 1;
}

function getRoleDamageScale(role: HeroRole) {
  if (role === "damage") return 1.18;
  if (role === "tank") return 0.82;
  return 0.68;
}

function getRoleControlScale(role: HeroRole) {
  if (role === "tank") return 1.28;
  if (role === "support") return 1.08;
  return 0.86;
}

function buildSkillProfile(hero: BoardHero, role: HeroRole): SkillProfile {
  if (!isNonMythic(hero)) return DEFAULT_PROFILE;

  const skillIds = getHeroSkillIds(hero);
  const gradeScale = getGradeScale(hero);
  const damageScale = getRoleDamageScale(role);
  const controlScale = getRoleControlScale(role);
  const profile: SkillProfile = { ...DEFAULT_PROFILE };

  if (hasTag(skillIds, "attack")) {
    profile.damageMultiplier += 0.1 * gradeScale * damageScale;
    profile.fxKind = "attack";
    profile.text = "공격";
    profile.color = colors.yellow;
  }

  if (hasTag(skillIds, "boss-killer")) {
    profile.damageMultiplier += 0.13 * gradeScale * damageScale;
    profile.fxKind = "boss";
    profile.text = "약점";
    profile.color = colors.orange;
  }

  if (hasTag(skillIds, "area-damage") || hasTag(skillIds, "burst")) {
    profile.splashMultiplier = Math.max(profile.splashMultiplier, (0.3 + 0.06 * gradeScale) * damageScale);
    profile.splashRadius = Math.max(profile.splashRadius, 64 + 12 * gradeScale);
    profile.fxKind = "area";
    profile.text = "폭발";
    profile.color = colors.orange;
  }

  if (hasTag(skillIds, "chain") || hasTag(skillIds, "multi-hit") || hasTag(skillIds, "extra-hit")) {
    profile.extraHitMultiplier = Math.max(profile.extraHitMultiplier, (0.28 + 0.06 * gradeScale) * damageScale);
    profile.fxKind = "chain";
    profile.text = "연쇄";
    profile.color = 0x88e9ff;
  }

  if (hasTag(skillIds, "pierce") || hasTag(skillIds, "beam")) {
    profile.splashMultiplier = Math.max(profile.splashMultiplier, (0.36 + 0.05 * gradeScale) * damageScale);
    profile.splashRadius = Math.max(profile.splashRadius, 86 + 14 * gradeScale);
    profile.fxKind = "beam";
    profile.text = "관통";
    profile.color = 0xbde7ff;
  }

  if (hasTag(skillIds, "debuff") || hasTag(skillIds, "slow") || hasTag(skillIds, "freeze") || hasTag(skillIds, "grouping")) {
    const baseSlow = hasTag(skillIds, "freeze") ? 0.78 : hasTag(skillIds, "grouping") ? 0.8 : 0.86;
    profile.slowMultiplier = Math.min(profile.slowMultiplier, Math.max(0.64, 1 - (1 - baseSlow) * controlScale));
    profile.damageMultiplier += role === "tank" ? 0.02 * gradeScale : 0;
    profile.fxKind = "control";
    profile.text = hasTag(skillIds, "freeze") ? "빙결" : hasTag(skillIds, "grouping") ? "중력" : "감속";
    profile.color = 0x8fdcff;
  }

  if (hasTag(skillIds, "mark") || hasTag(skillIds, "vulnerable")) {
    profile.damageMultiplier += role === "damage" ? 0.12 * gradeScale : 0.04 * gradeScale;
    profile.slowMultiplier = Math.min(profile.slowMultiplier, role === "damage" ? 0.94 : 0.9);
    profile.fxKind = "mark";
    profile.text = "표식";
    profile.color = 0xff8f74;
  }

  if (hasTag(skillIds, "buff") || hasTag(skillIds, "haste") || hasTag(skillIds, "power-up") || hasTag(skillIds, "team-wide")) {
    profile.damageMultiplier += role === "support" ? 0 : 0.03 * gradeScale;
    profile.fxKind = "support";
    profile.text = "지원";
    profile.color = 0x7dffb2;
  }

  if (hasTag(skillIds, "turret") || hasTag(skillIds, "support-fire")) {
    profile.extraHitMultiplier = Math.max(profile.extraHitMultiplier, role === "support" ? 0.2 + 0.03 * gradeScale : 0.28 + 0.04 * gradeScale);
    profile.fxKind = "turret";
    profile.text = "포탑";
    profile.color = 0xd8c1ff;
  }

  if (hasTag(skillIds, "economy") || hasTag(skillIds, "coin-bonus") || hasTag(skillIds, "wave-reward")) {
    profile.coinBonus = Math.round(role === "support" ? 2 + gradeScale : 1 + gradeScale);
    profile.damageMultiplier += role === "support" ? 0 : 0.02 * gradeScale;
    profile.fxKind = "economy";
    profile.text = "보상";
    profile.color = colors.green;
  }

  if (hasTag(skillIds, "overcrowd-bonus")) {
    profile.damageMultiplier += 0.03 * Math.min(8, Math.floor(hero.grade === "legendary" ? 5 : 2));
    profile.fxKind = "control";
    profile.text = "반격";
    profile.color = colors.red;
  }

  return profile;
}

function applyMasteryToProfile(refs: GameRefs, hero: BoardHero, profile: SkillProfile) {
  const mastery = getProgressHeroMasteryEffect(refs.progressBonuses, hero.heroId);
  if (mastery.level <= 1) return profile;

  return {
    ...profile,
    splashMultiplier: profile.splashMultiplier * mastery.skillMultiplier,
    splashRadius: profile.splashRadius > 0 ? profile.splashRadius + Math.min(24, mastery.level * 1.4) : 0,
    extraHitMultiplier: profile.extraHitMultiplier * mastery.skillMultiplier,
    slowMultiplier: profile.slowMultiplier < 1
      ? Math.max(0.56, 1 - (1 - profile.slowMultiplier) * mastery.controlMultiplier)
      : profile.slowMultiplier,
    coinBonus: profile.coinBonus + mastery.bonusCoin,
  };
}

function applySlow(target: ActiveEnemy, multiplier: number) {
  if (multiplier >= 1) return;
  target.speed = Math.max(0.2, target.speed * multiplier);
}

function applySplash(
  refs: GameRefs,
  target: ActiveEnemy,
  damage: number,
  profile: SkillProfile,
  options: BaseHeroSkillRuntimeOptions,
) {
  if (profile.splashMultiplier <= 0 || profile.splashRadius <= 0) return;

  const splashDamage = Math.max(1, Math.round(damage * profile.splashMultiplier));
  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive || enemy.id === target.id) continue;
    if (Math.hypot(enemy.x - target.x, enemy.y - target.y) > profile.splashRadius) continue;
    options.damageEnemy(refs, enemy, splashDamage);
  }
}

function applyExtraHit(
  refs: GameRefs,
  target: ActiveEnemy,
  damage: number,
  profile: SkillProfile,
  options: BaseHeroSkillRuntimeOptions,
) {
  if (profile.extraHitMultiplier <= 0) return null;

  const extraTarget = refs.activeEnemies
    .filter((enemy) => enemy.alive && enemy.id !== target.id && enemy.progress >= 0)
    .sort((a, b) => b.progress - a.progress)[0];
  if (!extraTarget) return null;

  options.damageEnemy(refs, extraTarget, Math.max(1, Math.round(damage * profile.extraHitMultiplier)));
  return extraTarget;
}

export function applyBaseHeroSkillPreDamage(hero: BoardHero, role: HeroRole, baseDamage: number) {
  const profile = buildSkillProfile(hero, role);
  return Math.max(1, Math.round(baseDamage * profile.damageMultiplier));
}

export function applyBaseHeroSkillPostDamage(
  refs: GameRefs,
  options: BaseHeroSkillRuntimeOptions,
  hero: BoardHero,
  role: HeroRole,
  target: ActiveEnemy,
  damage: number,
) {
  const profile = applyMasteryToProfile(refs, hero, buildSkillProfile(hero, role));
  if (!isNonMythic(hero)) return;

  applySlow(target, profile.slowMultiplier);
  applySplash(refs, target, damage, profile, options);
  const extraTarget = applyExtraHit(refs, target, damage, profile, options);
  spawnBaseSkillFx(refs, options.addAnimation ? { addAnimation: options.addAnimation } : undefined, profile.fxKind, target, extraTarget);

  if (profile.coinBonus > 0 && target.hp <= 0) {
    refs.state = {
      ...refs.state,
      resources: refs.state.resources + profile.coinBonus,
      score: refs.state.score + profile.coinBonus * 3,
    };
  }

  if (profile.text) {
    options.floatText(refs, profile.text, target.x, target.y - 42, profile.color);
  }
}

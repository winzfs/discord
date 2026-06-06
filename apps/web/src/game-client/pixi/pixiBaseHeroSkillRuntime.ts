import { getHeroById, skills } from "@discord-random-defense/game";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { getProgressHeroMasteryEffect } from "./pixiProgressBonuses";

export type BaseHeroSkillRuntimeOptions = {
  damageEnemy: (refs: GameRefs, enemy: ActiveEnemy, damage: number) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

type SkillProfile = {
  damageMultiplier: number;
  splashMultiplier: number;
  splashRadius: number;
  extraHitMultiplier: number;
  slowMultiplier: number;
  coinBonus: number;
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

function buildSkillProfile(hero: BoardHero, role: HeroRole): SkillProfile {
  if (!isNonMythic(hero)) return DEFAULT_PROFILE;

  const skillIds = getHeroSkillIds(hero);
  const gradeScale = getGradeScale(hero);
  const profile: SkillProfile = { ...DEFAULT_PROFILE };

  if (hasTag(skillIds, "attack")) {
    profile.damageMultiplier += 0.08 * gradeScale;
    profile.text = "공격";
    profile.color = colors.yellow;
  }

  if (hasTag(skillIds, "boss-killer")) {
    profile.damageMultiplier += 0.08 * gradeScale;
    profile.text = "약점";
    profile.color = colors.orange;
  }

  if (hasTag(skillIds, "area-damage") || hasTag(skillIds, "burst")) {
    profile.splashMultiplier = Math.max(profile.splashMultiplier, 0.22 + 0.04 * gradeScale);
    profile.splashRadius = Math.max(profile.splashRadius, 62 + 10 * gradeScale);
    profile.text = "폭발";
    profile.color = colors.orange;
  }

  if (hasTag(skillIds, "chain") || hasTag(skillIds, "multi-hit") || hasTag(skillIds, "extra-hit")) {
    profile.extraHitMultiplier = Math.max(profile.extraHitMultiplier, 0.22 + 0.05 * gradeScale);
    profile.text = "연쇄";
    profile.color = 0x88e9ff;
  }

  if (hasTag(skillIds, "pierce") || hasTag(skillIds, "beam")) {
    profile.splashMultiplier = Math.max(profile.splashMultiplier, 0.3 + 0.04 * gradeScale);
    profile.splashRadius = Math.max(profile.splashRadius, 84 + 12 * gradeScale);
    profile.text = "관통";
    profile.color = 0xbde7ff;
  }

  if (hasTag(skillIds, "debuff") || hasTag(skillIds, "slow") || hasTag(skillIds, "freeze") || hasTag(skillIds, "grouping")) {
    profile.slowMultiplier = Math.min(profile.slowMultiplier, hasTag(skillIds, "freeze") ? 0.82 : 0.9);
    profile.text = hasTag(skillIds, "freeze") ? "빙결" : "감속";
    profile.color = 0x8fdcff;
  }

  if (hasTag(skillIds, "mark") || hasTag(skillIds, "vulnerable")) {
    profile.damageMultiplier += 0.08 * gradeScale;
    profile.slowMultiplier = Math.min(profile.slowMultiplier, 0.94);
    profile.text = "표식";
    profile.color = 0xff8f74;
  }

  if (hasTag(skillIds, "buff") || hasTag(skillIds, "haste") || hasTag(skillIds, "power-up") || hasTag(skillIds, "team-wide")) {
    profile.damageMultiplier += role === "support" ? 0.1 * gradeScale : 0.05 * gradeScale;
    profile.text = "증폭";
    profile.color = 0x7dffb2;
  }

  if (hasTag(skillIds, "turret") || hasTag(skillIds, "support-fire")) {
    profile.extraHitMultiplier = Math.max(profile.extraHitMultiplier, 0.28 + 0.04 * gradeScale);
    profile.text = "포탑";
    profile.color = 0xd8c1ff;
  }

  if (hasTag(skillIds, "economy") || hasTag(skillIds, "coin-bonus") || hasTag(skillIds, "wave-reward")) {
    profile.coinBonus = Math.round(1 + gradeScale);
    profile.damageMultiplier += 0.03 * gradeScale;
    profile.text = "보상";
    profile.color = colors.green;
  }

  if (hasTag(skillIds, "overcrowd-bonus")) {
    profile.damageMultiplier += 0.04 * Math.min(8, Math.floor(hero.grade === "legendary" ? 5 : 2));
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
      ? Math.max(0.62, 1 - (1 - profile.slowMultiplier) * mastery.controlMultiplier)
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
  if (profile.extraHitMultiplier <= 0) return;

  const extraTarget = refs.activeEnemies
    .filter((enemy) => enemy.alive && enemy.id !== target.id && enemy.progress >= 0)
    .sort((a, b) => b.progress - a.progress)[0];
  if (!extraTarget) return;

  options.damageEnemy(refs, extraTarget, Math.max(1, Math.round(damage * profile.extraHitMultiplier)));
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
  applyExtraHit(refs, target, damage, profile, options);

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

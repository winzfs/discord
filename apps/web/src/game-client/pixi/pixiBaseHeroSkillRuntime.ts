import { getHeroById, skills } from "@discord-random-defense/game";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { getProgressHeroMasteryEffect } from "./pixiProgressBonuses";
import { spawnBaseSkillFx, type BaseSkillFxKind } from "./pixiBaseSkillFxRuntime";
import { getPrimarySkillEffectLog } from "./pixiSkillEffectLogRuntime";
import {
  applySingleControl,
  createAreaControlConfig,
  createControlZone,
  createSingleControlConfig,
  type ControlEffectConfig,
} from "./pixiControlEffectRuntime";

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
  coinBonus: number;
  control: ControlEffectConfig | null;
  fxKind: BaseSkillFxKind | null;
  text?: string;
  color: number;
};

const DEFAULT_PROFILE: SkillProfile = {
  damageMultiplier: 1,
  splashMultiplier: 0,
  splashRadius: 0,
  extraHitMultiplier: 0,
  coinBonus: 0,
  control: null,
  fxKind: null,
  color: colors.white,
};

const SKILL_EFFECT_POPUP_COOLDOWN_MS = 900;
const lastSkillEffectPopupAt: Record<string, number> = {};

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

function tuneControlByRole(config: ControlEffectConfig, role: HeroRole, gradeScale: number): ControlEffectConfig {
  const roleBonus = role === "tank" ? 1.12 : role === "support" ? 1.04 : 0.92;
  return {
    ...config,
    durationMs: Math.round(config.durationMs * roleBonus * (1 + (gradeScale - 1) * 0.18)),
    radius: Math.round(config.radius * (1 + (gradeScale - 1) * 0.12)),
  };
}

function applyUnifiedEffectLabel(profile: SkillProfile, skillIds: string[]) {
  const effectLog = getPrimarySkillEffectLog(skillIds);
  if (!effectLog) return profile;

  return {
    ...profile,
    text: effectLog.label,
    color: effectLog.color,
  };
}

function buildSkillProfile(hero: BoardHero, role: HeroRole): SkillProfile {
  if (!isNonMythic(hero)) return DEFAULT_PROFILE;

  const skillIds = getHeroSkillIds(hero);
  const gradeScale = getGradeScale(hero);
  const damageScale = getRoleDamageScale(role);
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

  if (hasTag(skillIds, "grouping")) {
    profile.control = tuneControlByRole(createAreaControlConfig(), role, gradeScale);
    profile.fxKind = "control";
    profile.text = "영역제어";
    profile.color = 0x9c83ff;
  } else if (hasTag(skillIds, "debuff") || hasTag(skillIds, "slow") || hasTag(skillIds, "freeze")) {
    profile.control = tuneControlByRole(createSingleControlConfig(hasTag(skillIds, "freeze")), role, gradeScale);
    profile.fxKind = null;
    profile.text = hasTag(skillIds, "freeze") ? "단일빙결" : "단일제어";
    profile.color = 0x8fdcff;
  }

  if (hasTag(skillIds, "mark") || hasTag(skillIds, "vulnerable")) {
    profile.damageMultiplier += role === "damage" ? 0.12 * gradeScale : 0.04 * gradeScale;
    if (!profile.control) profile.control = tuneControlByRole(createSingleControlConfig(false), role, gradeScale);
    profile.fxKind = null;
    profile.text = "표식";
    profile.color = 0xff8f74;
  }

  if (hasTag(skillIds, "buff") || hasTag(skillIds, "haste") || hasTag(skillIds, "power-up") || hasTag(skillIds, "team-wide")) {
    profile.damageMultiplier += role === "support" ? 0 : 0.03 * gradeScale;
    profile.fxKind = null;
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
    profile.fxKind = null;
    profile.text = "보상";
    profile.color = colors.green;
  }

  if (hasTag(skillIds, "overcrowd-bonus")) {
    profile.damageMultiplier += 0.03 * Math.min(8, Math.floor(hero.grade === "legendary" ? 5 : 2));
    profile.fxKind = null;
    profile.text = "반격";
    profile.color = colors.red;
  }

  return applyUnifiedEffectLabel(profile, skillIds);
}

export function getBaseHeroSkillFxKind(hero: BoardHero, role: HeroRole) {
  return buildSkillProfile(hero, role).fxKind;
}

function applyMasteryToProfile(refs: GameRefs, hero: BoardHero, profile: SkillProfile) {
  const mastery = getProgressHeroMasteryEffect(refs.progressBonuses, hero.heroId);
  if (mastery.level <= 1) return profile;

  return {
    ...profile,
    splashMultiplier: profile.splashMultiplier * mastery.skillMultiplier,
    splashRadius: profile.splashRadius > 0 ? profile.splashRadius + Math.min(24, mastery.level * 1.4) : 0,
    extraHitMultiplier: profile.extraHitMultiplier * mastery.skillMultiplier,
    coinBonus: profile.coinBonus + mastery.bonusCoin,
    control: profile.control
      ? {
          ...profile.control,
          durationMs: Math.round(profile.control.durationMs * mastery.controlMultiplier),
          radius: profile.control.mode === "zone" ? profile.control.radius + Math.min(14, mastery.level) : profile.control.radius,
        }
      : null,
  };
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

function applyControl(refs: GameRefs, target: ActiveEnemy, profile: SkillProfile) {
  if (!profile.control) return;

  if (profile.control.mode === "zone") {
    createControlZone(refs, target, profile.control);
    return;
  }

  applySingleControl(target, profile.control);
}

function shouldShowSkillEffectPopup(hero: BoardHero) {
  const now = Date.now();
  const previous = lastSkillEffectPopupAt[hero.instanceId] ?? 0;
  if (now - previous < SKILL_EFFECT_POPUP_COOLDOWN_MS) return false;
  lastSkillEffectPopupAt[hero.instanceId] = now;
  return true;
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

  applyControl(refs, target, profile);
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

  if (profile.text && shouldShowSkillEffectPopup(hero)) {
    options.floatText(refs, profile.text, target.x, target.y - 42, profile.color);
  }
}

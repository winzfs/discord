import { getSkillById, getSkillTacticalLabel, type SkillEffectType } from "@discord-random-defense/game";
import { colors } from "./gameTheme";

export type SkillEffectLog = {
  label: string;
  color: number;
  effectType: SkillEffectType;
};

const EFFECT_COLORS: Record<SkillEffectType, number> = {
  damage: colors.white,
  splash: colors.orange,
  chain: 0x88e9ff,
  control: 0x8fdcff,
  amplify: 0xff8f74,
  tempo: 0x7dffb2,
  economy: colors.green,
  execute: 0xff6f7d,
  shield: 0x87b7ff,
  summon: 0xd8c1ff,
};

const EFFECT_PRIORITY: SkillEffectType[] = [
  "execute",
  "economy",
  "control",
  "amplify",
  "splash",
  "chain",
  "summon",
  "shield",
  "tempo",
  "damage",
];

export function getPrimarySkillEffectLog(skillIds: string[]): SkillEffectLog | null {
  const effects = skillIds
    .map((skillId) => getSkillById(skillId))
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));

  if (effects.length === 0) return null;

  const selected = [...effects].sort(
    (a, b) => EFFECT_PRIORITY.indexOf(a.effectType) - EFFECT_PRIORITY.indexOf(b.effectType),
  )[0];

  return {
    label: getSkillTacticalLabel(selected),
    color: EFFECT_COLORS[selected.effectType],
    effectType: selected.effectType,
  };
}

export function getSkillEffectColor(effectType: SkillEffectType) {
  return EFFECT_COLORS[effectType];
}

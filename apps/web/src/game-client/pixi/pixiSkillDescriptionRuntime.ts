import { getHeroById, getSkillEffectLabel, skills, type SkillDefinition } from "@discord-random-defense/game";

export type PixiSkillDescription = {
  id: string;
  condition: string;
  effectLabel: string;
  effectSummary: string;
  lines: string[];
};

function getCondition(skill: SkillDefinition) {
  if (skill.type === "ultimate") return "궁극기 게이지 100%";
  if (skill.tags.includes("unique")) return "기본 공격 시 42% 확률";
  if (skill.type === "attack") return "기본 공격 시 42% 확률";
  if (skill.type === "control") return "기본 공격 시 30% 확률";
  return "기본 공격 시 24% 확률";
}

function getEffectLines(skill: SkillDefinition) {
  const label = getSkillEffectLabel(skill.effectType);
  const tags = skill.tags;
  const lines = [`${label.shortLabel}: ${label.description}`];

  if (skill.effectType === "damage" && tags.includes("boss-killer")) lines.push("보스/고체력 적 대응력이 높습니다.");
  if (skill.effectType === "splash") lines.push("몰려 있는 적을 함께 처리합니다.");
  if (skill.effectType === "chain") lines.push("추가타로 여러 적을 이어서 압박합니다.");
  if (skill.effectType === "control") lines.push(tags.includes("freeze") ? "강한 둔화로 전선을 지연시킵니다." : "이동속도를 낮춰 누수를 줄입니다.");
  if (skill.effectType === "amplify") lines.push("표식/취약으로 후속 피해 효율을 올립니다.");
  if (skill.effectType === "tempo") lines.push("공격속도나 궁극기 흐름을 보조합니다.");
  if (skill.effectType === "economy") lines.push("보상 흐름을 늘려 경제를 보조합니다.");
  if (skill.effectType === "execute") lines.push("약해진 적을 빠르게 마무리합니다.");
  if (skill.effectType === "shield") lines.push("방어/지연 효과로 전선을 안정화합니다.");
  if (skill.effectType === "summon") lines.push("보조 화력으로 라인을 보강합니다.");

  return lines.slice(0, 2);
}

function getManualUltimateLines(heroId: string, skill: SkillDefinition) {
  const label = getSkillEffectLabel(skill.effectType);
  const prefix = `${label.shortLabel}: ${label.description}`;

  if (heroId === "dva") return [prefix, "영웅 위치 기준 넓은 범위 450% 피해"];
  if (heroId === "zarya") return [prefix, "3초 흡입/속박 + 240% 피해"];
  if (heroId === "tracer") return [prefix, "부착 후 0.5초 뒤 520% 폭발"];
  if (heroId === "cassidy") return [prefix, "3초 락온 후 진행도 비례 피해"];
  if (heroId === "winston") return [prefix, "광역 충격파 240% 피해 + 감속"];
  if (heroId === "genji") return [prefix, "전방 최대 5명에게 210% 피해"];
  if (heroId === "ana") return [prefix, "공격 배율 +12% 지원"];
  if (heroId === "kiriko") return [prefix, "5초 동안 공격속도 200%"];
  if (heroId === "illari") return [prefix, "범위 300% 태양 폭발"];
  return [prefix, "궁극기 게이지 100% 발동"];
}

export function getPixiHeroSkills(heroId: string) {
  const definition = getHeroById(heroId);
  if (!definition) return [];
  return definition.skillIds
    .map((skillId) => skills.find((skill) => skill.id === skillId))
    .filter((skill): skill is SkillDefinition => Boolean(skill));
}

export function getPixiSkillDescription(heroId: string, skill: SkillDefinition): PixiSkillDescription {
  const label = getSkillEffectLabel(skill.effectType);

  return {
    id: skill.id,
    condition: getCondition(skill),
    effectLabel: label.shortLabel,
    effectSummary: label.description,
    lines: skill.type === "ultimate" ? getManualUltimateLines(heroId, skill) : getEffectLines(skill),
  };
}

import { getHeroById, skills, type SkillDefinition } from "@discord-random-defense/game";

export type PixiSkillDescription = {
  id: string;
  condition: string;
  lines: string[];
};

function getCondition(skill: SkillDefinition) {
  if (skill.type === "ultimate") return "게이지 100%";
  if (skill.tags.includes("unique")) return "공격 시 적용";
  if (skill.type === "attack") return "42%";
  if (skill.type === "control") return "30%";
  return "24%";
}

function getTagLines(skill: SkillDefinition) {
  const tags = skill.tags;
  const lines: string[] = [];

  if (tags.includes("attack")) lines.push("피해량 소폭 증가");
  if (tags.includes("boss-killer")) lines.push("강한 적 대응 보정");
  if (tags.includes("area-damage") || tags.includes("burst")) lines.push("주변 약한 광역 피해");
  if (tags.includes("chain") || tags.includes("multi-hit") || tags.includes("extra-hit")) lines.push("전방 몬스터 추가타");
  if (tags.includes("pierce") || tags.includes("beam")) lines.push("관통형 보조 피해");
  if (tags.includes("slow")) lines.push("대상 이동속도 감소");
  if (tags.includes("freeze")) lines.push("강한 둔화 적용");
  if (tags.includes("grouping")) lines.push("몰린 적 제어에 유리");
  if (tags.includes("mark") || tags.includes("vulnerable")) lines.push("표식/취약 피해 보정");
  if (tags.includes("buff") || tags.includes("power-up")) lines.push("전투 피해 보조");
  if (tags.includes("haste") || tags.includes("team-wide")) lines.push("팀 전투 템포 강화");
  if (tags.includes("turret") || tags.includes("support-fire")) lines.push("보조 포격 추가 피해");
  if (tags.includes("economy") || tags.includes("coin-bonus") || tags.includes("wave-reward")) lines.push("처치 보상 보너스");

  if (lines.length === 0) lines.push("영웅 공격력 기반");
  return lines.slice(0, 2);
}

function getManualUltimateLines(heroId: string) {
  if (heroId === "dva") return ["영웅 위치 기준 자폭", "넓은 범위 450% 피해"];
  if (heroId === "zarya") return ["좁은 3초 중력자탄", "흡입/속박 + 240%"];
  if (heroId === "tracer") return ["펄스폭탄 부착", "0.5초 후 520% 폭발"];
  if (heroId === "cassidy") return ["3초 느린 락온", "진행도 비례 피해"];
  if (heroId === "winston") return ["광역 충격파", "240% 피해 + 감속"];
  if (heroId === "genji") return ["전방 5명 베기", "각 210% 피해"];
  if (heroId === "ana") return ["나노 강화제", "공격 배율 +12%"];
  if (heroId === "kiriko") return ["여우길 5초", "공격속도 200%"];
  if (heroId === "illari") return ["태양 폭발", "범위 300% 피해"];
  return ["게이지 100% 발동", "범위 피해"];
}

export function getPixiHeroSkills(heroId: string) {
  const definition = getHeroById(heroId);
  if (!definition) return [];
  return definition.skillIds
    .map((skillId) => skills.find((skill) => skill.id === skillId))
    .filter((skill): skill is SkillDefinition => Boolean(skill));
}

export function getPixiSkillDescription(heroId: string, skill: SkillDefinition): PixiSkillDescription {
  return {
    id: skill.id,
    condition: getCondition(skill),
    lines: skill.type === "ultimate" ? getManualUltimateLines(heroId) : getTagLines(skill),
  };
}

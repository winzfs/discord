import type { SkillDefinition } from "../types/skill";

export const skills: SkillDefinition[] = [
  { id: "deadeye", displayName: "집중 사격", type: "ultimate", assetKey: "skill.placeholder", tags: ["single-target"] },
  { id: "shield-pulse", displayName: "방어 파동", type: "control", assetKey: "skill.placeholder", tags: ["slow"] },
  { id: "boost-field", displayName: "증폭 지대", type: "support", assetKey: "skill.placeholder", tags: ["buff"] },
];

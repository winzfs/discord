import type { SkillDefinition } from "../types/skill";

export const skills: SkillDefinition[] = [
  { id: "deadeye", displayName: "집중 사격", type: "ultimate", assetKey: "skill.placeholder", tags: ["single-target"] },
  { id: "shield-pulse", displayName: "방어 파동", type: "control", assetKey: "skill.placeholder", tags: ["slow"] },
  { id: "boost-field", displayName: "증폭 지대", type: "support", assetKey: "skill.placeholder", tags: ["buff"] },

  { id: "dva-fusion-cannons", displayName: "융합포", type: "attack", assetKey: "skill.placeholder", tags: ["dva", "area-damage", "close-range"] },
  { id: "dva-defense-matrix", displayName: "방어 매트릭스", type: "control", assetKey: "skill.placeholder", tags: ["dva", "slow", "damage-reduction"] },
  { id: "dva-self-destruct", displayName: "자폭", type: "ultimate", assetKey: "skill.placeholder", tags: ["dva", "large-burst", "area-damage"] },

  { id: "zarya-particle-cannon", displayName: "입자포", type: "attack", assetKey: "skill.placeholder", tags: ["zarya", "ramp-up", "single-target"] },
  { id: "zarya-projected-barrier", displayName: "방벽 충전", type: "support", assetKey: "skill.placeholder", tags: ["zarya", "charge", "power-up"] },
  { id: "zarya-graviton-surge", displayName: "중력자탄", type: "ultimate", assetKey: "skill.placeholder", tags: ["zarya", "grouping", "control"] },

  { id: "winston-tesla-cannon", displayName: "테슬라 캐논", type: "attack", assetKey: "skill.placeholder", tags: ["winston", "chain", "area-damage"] },
  { id: "winston-jump-pack", displayName: "점프 팩", type: "control", assetKey: "skill.placeholder", tags: ["winston", "impact", "slow"] },
  { id: "winston-primal-rage", displayName: "원시의 분노", type: "ultimate", assetKey: "skill.placeholder", tags: ["winston", "disrupt", "knockback"] },

  { id: "tracer-pulse-pistols", displayName: "펄스 쌍권총", type: "attack", assetKey: "skill.placeholder", tags: ["tracer", "fast", "multi-hit"] },
  { id: "tracer-blink", displayName: "점멸", type: "attack", assetKey: "skill.placeholder", tags: ["tracer", "extra-hit", "front-target"] },
  { id: "tracer-pulse-bomb", displayName: "펄스 폭탄", type: "ultimate", assetKey: "skill.placeholder", tags: ["tracer", "sticky-bomb", "burst"] },

  { id: "cassidy-peacekeeper", displayName: "피스키퍼", type: "attack", assetKey: "skill.placeholder", tags: ["cassidy", "critical", "single-target"] },
  { id: "cassidy-magnetic-grenade", displayName: "자력 수류탄", type: "control", assetKey: "skill.placeholder", tags: ["cassidy", "mark", "vulnerable"] },
  { id: "cassidy-deadeye", displayName: "황야의 무법자", type: "ultimate", assetKey: "skill.placeholder", tags: ["cassidy", "boss-killer", "execute"] },

  { id: "genji-shuriken", displayName: "수리검", type: "attack", assetKey: "skill.placeholder", tags: ["genji", "multi-shot", "fast"] },
  { id: "genji-swift-strike", displayName: "질풍참", type: "attack", assetKey: "skill.placeholder", tags: ["genji", "dash", "low-hp-target"] },
  { id: "genji-dragonblade", displayName: "용검", type: "ultimate", assetKey: "skill.placeholder", tags: ["genji", "chain-kill", "execute"] },

  { id: "ana-biotic-rifle", displayName: "생체 소총", type: "support", assetKey: "skill.placeholder", tags: ["ana", "vulnerable", "single-target"] },
  { id: "ana-sleep-dart", displayName: "수면총", type: "control", assetKey: "skill.placeholder", tags: ["ana", "slow", "disable"] },
  { id: "ana-nano-boost", displayName: "나노 강화제", type: "ultimate", assetKey: "skill.placeholder", tags: ["ana", "damage-boost", "attack-speed"] },

  { id: "kiriko-kunai", displayName: "쿠나이", type: "attack", assetKey: "skill.placeholder", tags: ["kiriko", "critical", "precision"] },
  { id: "kiriko-protection-suzu", displayName: "정화의 방울", type: "support", assetKey: "skill.placeholder", tags: ["kiriko", "cleanse", "attack-speed"] },
  { id: "kiriko-kitsune-rush", displayName: "여우길", type: "ultimate", assetKey: "skill.placeholder", tags: ["kiriko", "team-buff", "haste"] },

  { id: "illari-solar-rifle", displayName: "태양 소총", type: "attack", assetKey: "skill.placeholder", tags: ["illari", "charged-shot", "burst"] },
  { id: "illari-healing-pylon", displayName: "치유 파일론", type: "support", assetKey: "skill.placeholder", tags: ["illari", "pylon", "damage-boost"] },
  { id: "illari-captive-sun", displayName: "태양 작렬", type: "ultimate", assetKey: "skill.placeholder", tags: ["illari", "mark", "area-explosion"] },
];

import type { SkillDefinition } from "../types/skill";

export const skills: SkillDefinition[] = [
  { id: "basic-shot", displayName: "기본 사격", type: "attack", assetKey: "skill.placeholder", tags: ["single-target"] },
  { id: "focus-shot", displayName: "집중 사격", type: "attack", assetKey: "skill.placeholder", tags: ["single-target", "boss-killer"] },
  { id: "area-burst", displayName: "범위 폭발", type: "attack", assetKey: "skill.placeholder", tags: ["area-damage"] },
  { id: "piercing-shot", displayName: "관통 사격", type: "attack", assetKey: "skill.placeholder", tags: ["line", "pierce"] },
  { id: "chain-spark", displayName: "연쇄 전류", type: "attack", assetKey: "skill.placeholder", tags: ["chain", "multi-hit"] },
  { id: "burst-rocket", displayName: "로켓 폭발", type: "attack", assetKey: "skill.placeholder", tags: ["burst", "area-damage"] },

  { id: "deadeye", displayName: "집중 사격", type: "ultimate", assetKey: "skill.placeholder", tags: ["single-target"] },
  { id: "shield-pulse", displayName: "방어 파동", type: "control", assetKey: "skill.placeholder", tags: ["slow"] },
  { id: "boost-field", displayName: "증폭 지대", type: "support", assetKey: "skill.placeholder", tags: ["buff"] },
  { id: "barrier-guard", displayName: "방벽 수호", type: "control", assetKey: "skill.placeholder", tags: ["shield", "delay"] },
  { id: "team-boost", displayName: "전술 지원", type: "support", assetKey: "skill.placeholder", tags: ["buff", "attack-speed"] },
  { id: "core-guard", displayName: "코어 수호", type: "control", assetKey: "skill.placeholder", tags: ["shield", "slow"] },
  { id: "overclock", displayName: "오버클럭", type: "support", assetKey: "skill.placeholder", tags: ["buff", "haste"] },
  { id: "team-highlight", displayName: "팀 하이라이트", type: "support", assetKey: "skill.placeholder", tags: ["team-wide", "economy"] },
  { id: "highlight-barrage", displayName: "하이라이트 포화", type: "attack", assetKey: "skill.placeholder", tags: ["area-damage", "boss-killer"] },
  { id: "last-stand", displayName: "최후의 저항", type: "control", assetKey: "skill.placeholder", tags: ["shield", "last-stand"] },
  { id: "freeze-trap", displayName: "빙결 함정", type: "control", assetKey: "skill.placeholder", tags: ["slow", "freeze"] },
  { id: "scrap-turret", displayName: "고철 포탑", type: "attack", assetKey: "skill.placeholder", tags: ["turret", "steady"] },
  { id: "nano-pack", displayName: "나노 팩", type: "support", assetKey: "skill.placeholder", tags: ["buff", "power-up"] },
  { id: "gravity-mine", displayName: "중력 지뢰", type: "control", assetKey: "skill.placeholder", tags: ["grouping", "slow"] },
  { id: "orbital-laser", displayName: "궤도 레이저", type: "attack", assetKey: "skill.placeholder", tags: ["area-damage", "beam"] },

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

import type { SkillDefinition, SkillEffectGroup, SkillEffectType, SkillType } from "../types/skill";

type RawSkillDefinition = Omit<SkillDefinition, "effectType" | "effectGroup" | "summary">;

function hasAnyTag(skill: RawSkillDefinition, tags: string[]) {
  return tags.some((tag) => skill.tags.includes(tag));
}

function getSkillEffectType(skill: RawSkillDefinition): SkillEffectType {
  if (hasAnyTag(skill, ["coin-bonus", "economy", "wave-reward"])) return "economy";
  if (hasAnyTag(skill, ["execute", "chain-kill", "low-hp-target"])) return "execute";
  if (hasAnyTag(skill, ["attack-speed", "haste", "ultimate-charge", "cleanse"])) return "tempo";
  if (hasAnyTag(skill, ["power-up", "damage-boost", "mark", "vulnerable", "critical", "precision"])) return "amplify";
  if (hasAnyTag(skill, ["shield", "damage-reduction", "barrier", "last-stand"])) return "shield";
  if (hasAnyTag(skill, ["slow", "freeze", "grouping", "disable", "knockback", "control", "disrupt", "delay"])) return "control";
  if (hasAnyTag(skill, ["turret", "support-fire"])) return "summon";
  if (hasAnyTag(skill, ["chain", "multi-hit", "extra-hit", "multi-shot"])) return "chain";
  if (hasAnyTag(skill, ["area-damage", "burst", "large-burst", "beam", "splash", "sticky-bomb"])) return "splash";
  return "damage";
}

function getSkillEffectGroup(effectType: SkillEffectType): SkillEffectGroup {
  if (effectType === "control" || effectType === "shield") return "crowd-control";
  if (effectType === "tempo" || effectType === "amplify") return "team-scaling";
  if (effectType === "economy") return "resource-scaling";
  if (effectType === "execute") return "finisher";
  return "damage-core";
}

function getSkillSummary(skill: RawSkillDefinition, effectType: SkillEffectType) {
  const gradeTag = skill.tags.find((tag) => ["common", "rare", "epic", "legendary"].includes(tag));
  const gradeText = gradeTag ? `${gradeTag} ` : "";

  switch (effectType) {
    case "control":
      return `${gradeText}적 이동을 늦추거나 묶어 전선 시간을 벌어줍니다.`;
    case "shield":
      return `${gradeText}방어/지연 효과로 누수를 줄이고 전선을 안정화합니다.`;
    case "amplify":
      return `${gradeText}표식, 취약, 강화로 후속 피해 기대값을 높입니다.`;
    case "tempo":
      return `${gradeText}공격속도나 궁극기 흐름을 앞당겨 전투 템포를 올립니다.`;
    case "economy":
      return `${gradeText}처치 보상이나 웨이브 보상을 늘려 장기 성장을 돕습니다.`;
    case "execute":
      return `${gradeText}약해진 적을 마무리해 웨이브 누수를 줄입니다.`;
    case "chain":
      return `${gradeText}추가타나 연쇄 피해로 여러 적을 이어서 압박합니다.`;
    case "splash":
      return `${gradeText}광역 피해로 군집 웨이브를 처리합니다.`;
    case "summon":
      return `${gradeText}임시 화력 또는 보조 공격체를 더해 라인을 보강합니다.`;
    case "damage":
    default:
      return `${gradeText}기본 단일 피해로 안정적인 처리를 담당합니다.`;
  }
}

function normalizeSkillDefinition(skill: RawSkillDefinition): SkillDefinition {
  const effectType = getSkillEffectType(skill);
  return {
    ...skill,
    effectType,
    effectGroup: getSkillEffectGroup(effectType),
    summary: getSkillSummary(skill, effectType),
  };
}

const rawSkills: RawSkillDefinition[] = [
  { id: "spark-runner-zap", displayName: "펄스 견제 사격", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "common", "attack", "fast", "single-target"] },
  { id: "rookie-guard-bash", displayName: "방패 밀치기", type: "control", assetKey: "skill.placeholder", tags: ["unique", "common", "debuff", "slow", "frontline"] },
  { id: "mini-mender-boost", displayName: "응급 증폭", type: "support", assetKey: "skill.placeholder", tags: ["unique", "common", "buff", "power-up"] },
  { id: "scrap-gunner-ricochet", displayName: "고철 도탄탄", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "common", "attack", "extra-hit"] },
  { id: "slow-bot-oil", displayName: "감속 오일 살포", type: "control", assetKey: "skill.placeholder", tags: ["unique", "common", "debuff", "slow"] },
  { id: "charge-helper-tip", displayName: "긴급 정비 수당", type: "support", assetKey: "skill.placeholder", tags: ["unique", "common", "economy", "coin-bonus"] },

  { id: "pulse-ranger-mark", displayName: "탈론 표식탄", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "rare", "attack", "boss-killer", "mark"] },
  { id: "barrier-guard-lock", displayName: "십자군 방벽 고정", type: "control", assetKey: "skill.placeholder", tags: ["unique", "rare", "debuff", "slow", "shield"] },
  { id: "field-medic-rally", displayName: "야전 전술 격려", type: "support", assetKey: "skill.placeholder", tags: ["unique", "rare", "buff", "attack-speed"] },
  { id: "frost-warden-chill", displayName: "극저온 결계", type: "control", assetKey: "skill.placeholder", tags: ["unique", "rare", "debuff", "freeze", "slow"] },
  { id: "burst-scout-flare", displayName: "로켓 조명탄", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "rare", "attack", "area-damage", "burst"] },
  { id: "nano-aide-injector", displayName: "나노 보조 주입", type: "support", assetKey: "skill.placeholder", tags: ["unique", "rare", "buff", "power-up"] },

  { id: "plasma-mage-orb", displayName: "하드라이트 광자구", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "epic", "attack", "area-damage", "wave-clear"] },
  { id: "core-knight-anchor", displayName: "전술 방패 앵커", type: "control", assetKey: "skill.placeholder", tags: ["unique", "epic", "debuff", "slow", "shield"] },
  { id: "overclock-tech-haste", displayName: "오아시스 가속 회로", type: "support", assetKey: "skill.placeholder", tags: ["unique", "epic", "buff", "haste", "ultimate-charge"] },
  { id: "arc-captain-current", displayName: "널 섹터 전류망", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "epic", "attack", "chain", "multi-hit"] },
  { id: "gravity-jailer-field", displayName: "달 기지 중력장", type: "control", assetKey: "skill.placeholder", tags: ["unique", "epic", "debuff", "grouping", "slow"] },
  { id: "combat-engineer-turret", displayName: "스크랩 임시 포탑", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "epic", "attack", "turret", "support-fire"] },

  { id: "credit-hacker-bounty", displayName: "현상금 해킹", type: "support", assetKey: "skill.placeholder", tags: ["unique", "legendary", "economy", "coin-bonus"] },
  { id: "credit-hacker-network", displayName: "네트워크 증폭", type: "support", assetKey: "skill.placeholder", tags: ["unique", "legendary", "buff", "team-wide", "attack-speed"] },
  { id: "railgun-ace-piercer", displayName: "레일 관통탄", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "legendary", "attack", "pierce", "boss-killer"] },
  { id: "railgun-ace-weakpoint", displayName: "약점 조준", type: "control", assetKey: "skill.placeholder", tags: ["unique", "legendary", "debuff", "mark", "vulnerable"] },
  { id: "last-bastion-fortress", displayName: "요새 모드", type: "control", assetKey: "skill.placeholder", tags: ["unique", "legendary", "debuff", "slow", "last-stand"] },
  { id: "last-bastion-retaliate", displayName: "최후 반격", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "legendary", "attack", "overcrowd-bonus"] },
  { id: "orbital-sniper-laser", displayName: "궤도 레이저", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "legendary", "attack", "beam", "area-damage"] },
  { id: "orbital-sniper-lockon", displayName: "궤도 락온", type: "attack", assetKey: "skill.placeholder", tags: ["unique", "legendary", "attack", "highest-hp", "boss-killer"] },
  { id: "aegis-commander-order", displayName: "이지스 명령", type: "support", assetKey: "skill.placeholder", tags: ["unique", "legendary", "buff", "team-wide", "shield"] },
  { id: "aegis-commander-suppression", displayName: "진압 지휘", type: "control", assetKey: "skill.placeholder", tags: ["unique", "legendary", "debuff", "slow", "commander"] },
  { id: "chrono-oracle-accelerate", displayName: "시간 가속", type: "support", assetKey: "skill.placeholder", tags: ["unique", "legendary", "buff", "haste", "team-wide"] },
  { id: "chrono-oracle-foresight", displayName: "예지 보상", type: "support", assetKey: "skill.placeholder", tags: ["unique", "legendary", "economy", "wave-reward", "ultimate-charge"] },

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
  { id: "kiriko-kitsune-rush", displayName: "여우길", type: "ultimate", assetKey: "skill.placeholder", tags: ["kiriko", "haste", "team-wide"] },

  { id: "illari-solar-rifle", displayName: "태양 소총", type: "attack", assetKey: "skill.placeholder", tags: ["illari", "charged-shot", "single-target"] },
  { id: "illari-healing-pylon", displayName: "태양 기둥", type: "support", assetKey: "skill.placeholder", tags: ["illari", "support-fire", "power-up"] },
  { id: "illari-captive-sun", displayName: "태양 작렬", type: "ultimate", assetKey: "skill.placeholder", tags: ["illari", "mark", "area-damage", "burst"] },
];

export const skills: SkillDefinition[] = rawSkills.map(normalizeSkillDefinition);

export function getSkillById(id: string): SkillDefinition | null {
  return skills.find((skill) => skill.id === id) ?? null;
}

export function getSkillsByEffectType(effectType: SkillEffectType): SkillDefinition[] {
  return skills.filter((skill) => skill.effectType === effectType);
}

export function getSkillsByEffectGroup(effectGroup: SkillEffectGroup): SkillDefinition[] {
  return skills.filter((skill) => skill.effectGroup === effectGroup);
}

export function getSkillTacticalLabel(skill: SkillDefinition) {
  switch (skill.effectType) {
    case "control":
      return "제어";
    case "shield":
      return "방어";
    case "amplify":
      return "증폭";
    case "tempo":
      return "템포";
    case "economy":
      return "경제";
    case "execute":
      return "처형";
    case "chain":
      return "연쇄";
    case "splash":
      return "광역";
    case "summon":
      return "소환";
    case "damage":
    default:
      return "피해";
  }
}

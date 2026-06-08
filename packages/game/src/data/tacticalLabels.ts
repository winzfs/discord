import type { AttackType } from "../types/hero";
import type { HeroTacticalArchetype, HeroTargetPriority } from "../types/heroTactics";
import type { SkillEffectType } from "../types/skill";

export type TacticalLabel = {
  label: string;
  shortLabel: string;
  description: string;
};

export const heroArchetypeLabels: Record<HeroTacticalArchetype, TacticalLabel> = {
  precision: {
    label: "정밀 딜러",
    shortLabel: "정밀",
    description: "보스나 고체력 적을 우선 처리합니다.",
  },
  "wave-clear": {
    label: "광역 딜러",
    shortLabel: "광역",
    description: "몰려오는 군집 웨이브를 처리합니다.",
  },
  "control-stall": {
    label: "제어형",
    shortLabel: "제어",
    description: "감속, 빙결, 방벽으로 전선을 지연시킵니다.",
  },
  amplifier: {
    label: "증폭형",
    shortLabel: "증폭",
    description: "표식, 취약, 피해 증가로 핵심 딜러를 보조합니다.",
  },
  "tempo-support": {
    label: "지원형",
    shortLabel: "지원",
    description: "공격속도, 궁극기, 전투 흐름을 보조합니다.",
  },
  "economy-support": {
    label: "경제형",
    shortLabel: "경제",
    description: "보상, 코인, 자원 흐름을 보조합니다.",
  },
  execution: {
    label: "처형 딜러",
    shortLabel: "처형",
    description: "체력이 낮은 적을 빠르게 마무리합니다.",
  },
};

export const attackTypeLabels: Record<AttackType, TacticalLabel> = {
  single: {
    label: "단일 공격",
    shortLabel: "단일",
    description: "한 대상을 안정적으로 공격합니다.",
  },
  area: {
    label: "범위 공격",
    shortLabel: "범위",
    description: "여러 적이나 주변 적에게 피해를 줍니다.",
  },
  control: {
    label: "제어 공격",
    shortLabel: "제어",
    description: "공격과 함께 감속/방해 효과를 노립니다.",
  },
  support: {
    label: "보조 공격",
    shortLabel: "보조",
    description: "직접 피해보다 팀 보조 효과가 중심입니다.",
  },
};

export const skillEffectLabels: Record<SkillEffectType, TacticalLabel> = {
  damage: {
    label: "피해",
    shortLabel: "피해",
    description: "기본 피해량을 높입니다.",
  },
  splash: {
    label: "광역",
    shortLabel: "광역",
    description: "몰려 있는 적을 함께 처리합니다.",
  },
  chain: {
    label: "연쇄",
    shortLabel: "연쇄",
    description: "추가타나 전이 피해로 여러 적을 압박합니다.",
  },
  control: {
    label: "제어",
    shortLabel: "제어",
    description: "감속, 빙결, 방해로 전선을 지연시킵니다.",
  },
  amplify: {
    label: "증폭",
    shortLabel: "증폭",
    description: "표식, 취약, 피해 증가로 후속 피해를 키웁니다.",
  },
  tempo: {
    label: "지원",
    shortLabel: "지원",
    description: "공격속도나 궁극기 흐름을 보조합니다.",
  },
  economy: {
    label: "경제",
    shortLabel: "경제",
    description: "보상, 코인, 자원 흐름을 늘립니다.",
  },
  execute: {
    label: "처형",
    shortLabel: "처형",
    description: "약해진 적을 마무리합니다.",
  },
  shield: {
    label: "방어",
    shortLabel: "방어",
    description: "방벽이나 피해 감소로 누수를 줄입니다.",
  },
  summon: {
    label: "소환",
    shortLabel: "소환",
    description: "포탑이나 보조 화력을 추가합니다.",
  },
};

export const targetPriorityLabels: Record<HeroTargetPriority, TacticalLabel> = {
  front: {
    label: "선두 우선",
    shortLabel: "선두",
    description: "가장 앞선 적을 공격합니다.",
  },
  boss: {
    label: "보스 우선",
    shortLabel: "보스",
    description: "보스나 주요 적을 먼저 공격합니다.",
  },
  "highest-hp": {
    label: "고체력 우선",
    shortLabel: "고체력",
    description: "체력이 높은 적을 먼저 공격합니다.",
  },
  cluster: {
    label: "군집 우선",
    shortLabel: "군집",
    description: "주변에 적이 많은 대상을 먼저 공격합니다.",
  },
  "low-hp": {
    label: "마무리 우선",
    shortLabel: "마무리",
    description: "체력이 낮은 적을 먼저 공격합니다.",
  },
  support: {
    label: "지원 기준",
    shortLabel: "지원",
    description: "기본 전선 흐름에 맞춰 공격합니다.",
  },
};

export function getHeroArchetypeLabel(archetype: HeroTacticalArchetype) {
  return heroArchetypeLabels[archetype];
}

export function getAttackTypeLabel(attackType: AttackType) {
  return attackTypeLabels[attackType];
}

export function getSkillEffectLabel(effectType: SkillEffectType) {
  return skillEffectLabels[effectType];
}

export function getTargetPriorityLabel(priority: HeroTargetPriority) {
  return targetPriorityLabels[priority];
}

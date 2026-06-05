import { Container } from "pixi.js";
import { getHeroById, skills, type BoardHero, type SkillDefinition } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { clearPixiContainer, makePixiPanel, makePixiText } from "./pixiSharedView";
import { makePixiTouchBoundary } from "./pixiPointerGuards";

function gradeLabel(grade: string | undefined) {
  if (grade === "mythic") return "신화";
  if (grade === "legendary") return "전설";
  if (grade === "epic") return "영웅";
  if (grade === "rare") return "희귀";
  return "일반";
}

function roleLabel(role: string | undefined) {
  if (role === "tank") return "탱커";
  if (role === "support") return "지원";
  return "딜러";
}

function attackTypeLabel(attackType: string | undefined) {
  if (attackType === "area") return "광역";
  if (attackType === "support") return "지원";
  if (attackType === "control") return "제어";
  return "단일";
}

function skillTypeLabel(type: SkillDefinition["type"]) {
  if (type === "attack") return "공격";
  if (type === "control") return "제어";
  if (type === "support") return "지원";
  return "궁극기";
}

function getHeroSkills(heroId: string) {
  return skills.filter((skill) => skill.tags.includes(heroId));
}

function getHeroSkillEffectLines(heroId: string, skill: SkillDefinition) {
  if (skill.type === "ultimate") return getHeroUltimateEffectLines(heroId);

  const descriptions: Record<string, string[]> = {
    "dva-fusion-cannons": ["대상 주변 최대 4명에게 공격력 24% 확산 피해", "주 대상 피해 104%"],
    "dva-defense-matrix": ["보스 또는 선두 적을 강하게 억제", "대상 이동속도 62%로 감소"],
    "zarya-particle-cannon": ["자동공격이 지속 빔으로 변경", "연속 타격 시 94%→174%까지 피해/빔 강화"],
    "zarya-projected-barrier": ["빔 차지 3단계 이상일 때 발동", "대상 감속 + 주 대상 피해 108%"],
    "winston-tesla-cannon": ["대상 주변 최대 3명에게 공격력 34% 연쇄 피해", "주 대상 피해는 90%로 낮지만 광역 압박"],
    "winston-jump-pack": ["선두 적 1명에게 공격력 52% 충격 피해", "충격 대상 이동속도 58%로 감소"],
    "tracer-pulse-pistols": ["주 대상에게 공격력 18% 추가 다단히트", "주 대상 최종 피해 96%"],
    "tracer-blink": ["선두 적 1명에게 공격력 48% 추가 사격", "후방보다 앞쪽 누수 방지 특화"],
    "cassidy-peacekeeper": ["22% 확률 정밀 치명타", "표식과 함께 적용 시 최대 약 177% 피해"],
    "cassidy-magnetic-grenade": ["대상 이동속도 64%로 감소", "일반 114%, 보스 124% 표식 피해"],
    "genji-shuriken": ["선두 적 최대 2명에게 공격력 32% 수리검 피해", "주 대상 피해 98%"],
    "genji-deflect": ["보스 또는 선두 위협에게 공격력 62% 반격 피해", "수리검과 별도 타겟 압박"],
    "ana-biotic-rifle": ["취약 표식으로 일반 122%, 보스 138% 피해", "단일 핵심 대상 저격"],
    "ana-sleep-dart": ["36% 확률 또는 보스에게 수면총 발동", "대상 이동속도 36%로 크게 감소"],
    "kiriko-kunai": ["보스/전방/확률 조건에서 급소 판정", "일반 102%, 급소 168% 피해"],
    "kiriko-protection-suzu": ["20% 확률로 정화의 방울 발동", "전투 공격 배율을 소량 누적 증가"],
    "illari-solar-rifle": ["34% 확률 또는 보스에게 충전 사격", "일반 108%, 충전 152% 피해"],
    "illari-healing-pylon": ["대상 주변 2명에게 공격력 26% 보조 피해", "광역 보조딜 역할"],
  };

  return descriptions[skill.id] ?? ["자동 공격 적중 시 보조 효과 발동", "영웅 공격력 기반 피해"];
}

function getHeroUltimateEffectLines(heroId: string) {
  if (heroId === "dva") return ["영웅 위치 기준 넓은 범위 자폭", "범위 내 적에게 공격력 450% 피해"];
  if (heroId === "zarya") return ["대상 위치에 좁은 3초 중력자탄 생성", "주변 적을 중심으로 흡입/속박, 종료 시 240% 피해"];
  if (heroId === "tracer") return ["대상에게 펄스폭탄 부착", "0.5초 후 폭발, 범위 공격력 520% 피해"];
  if (heroId === "cassidy") return ["보이는 모든 적 3초 느린 락온", "공격력 비례 진행도. 100%면 처치, 아니면 비례 피해"];
  if (heroId === "winston") return ["영웅 주변 광역 충격파", "공격력 240% 피해 + 감속"];
  if (heroId === "genji") return ["전방 적 최대 5명 베기", "각 대상 공격력 210% 피해"];
  if (heroId === "ana") return ["전투 전체 공격 배율 증가", "발동 시 공격력 배율 +12%"];
  if (heroId === "kiriko") return ["여우길로 전투 전체 공격 배율 증가", "발동 시 공격력 배율 +10%"];
  if (heroId === "illari") return ["대상 위치에 태양 폭발", "범위 내 적에게 공격력 300% 피해"];

  return ["노란 궁극기 게이지 100% 충전 시 발동", "범위 내 적에게 공격력 260% 피해"];
}

function getSkillConditionText(heroId: string, skill: SkillDefinition) {
  if (heroId === "zarya" && skill.id === "zarya-particle-cannon") {
    return "조건: 자동 공격, 같은 대상 연속 타격";
  }

  if (skill.type === "ultimate") return "조건: 노란 궁극기 게이지 100%";
  if (skill.id === "zarya-projected-barrier") return "조건: 입자포 차지 3단계 이상";
  if (skill.id === "ana-sleep-dart") return "조건: 자동 공격 적중, 36% 또는 보스";
  if (skill.id === "kiriko-protection-suzu") return "조건: 자동 공격 적중, 20% 확률";
  if (skill.id === "illari-solar-rifle") return "조건: 자동 공격 적중, 34% 또는 보스";
  return "조건: 자동 공격 적중";
}

function getSkillStatusText(skill: SkillDefinition) {
  if (skill.type === "ultimate") return "게이지 발동";
  return "자동 발동";
}

function makeInfoLine(value: string, y: number, fill = 0xd8d0c8, size = 10) {
  const text = makePixiText(value, size, fill);
  text.x = 14;
  text.y = y;
  return text;
}

export type PixiUnitInfoViewOptions = {
  hero: BoardHero;
  stackCount: number;
  cellIndex: number;
  rendererWidth: number;
  rendererHeight: number;
};

export function clearPixiUnitInfoView(target: Container) {
  clearPixiContainer(target);
}

export function drawPixiUnitInfoView(target: Container, options: PixiUnitInfoViewOptions) {
  clearPixiContainer(target);

  const definition = getHeroById(options.hero.heroId);
  const heroSkills = getHeroSkills(options.hero.heroId);
  const normalSkills = heroSkills.filter((skill) => skill.type !== "ultimate");
  const ultimateSkills = heroSkills.filter((skill) => skill.type === "ultimate");
  const width = Math.min(360, options.rendererWidth - 24);
  const height = Math.min(278, options.rendererHeight - 120);
  const view = new Container();
  view.x = Math.max(12, options.rendererWidth / 2 - width / 2);
  view.y = Math.max(62, options.rendererHeight - height - 118);
  makePixiTouchBoundary(view, width, height);
  view.addChild(makePixiPanel(width, height, 0x2d2925, 0x1d1714, 14));

  const title = makePixiText(definition?.displayName ?? options.hero.heroId, 17, colors.yellow);
  title.x = 14;
  title.y = 10;
  view.addChild(title);

  const grade = makePixiText(`${gradeLabel(options.hero.grade)} · ${roleLabel(definition?.role)} · ${attackTypeLabel(definition?.attackType)}`, 12, colors.white);
  grade.x = 14;
  grade.y = 36;
  view.addChild(grade);

  const stats = definition
    ? `전투력 ${definition.power}  속도 ${definition.attackSpeed}  사거리 ${definition.range}`
    : "영웅 정보를 찾을 수 없음";
  view.addChild(makeInfoLine(stats, 57, 0xd8d0c8, 11));

  const stackText = makeInfoLine(`셀 ${options.cellIndex + 1} · 중첩 ${options.stackCount}/3`, 75, options.stackCount >= 3 ? colors.yellow : 0xb7afa8, 11);
  view.addChild(stackText);

  let y = 98;
  const skillTitle = makePixiText("스킬", 12, colors.green);
  skillTitle.x = 14;
  skillTitle.y = y;
  view.addChild(skillTitle);
  y += 18;

  if (normalSkills.length === 0) {
    view.addChild(makeInfoLine("등록된 스킬 없음", y, 0xb7afa8));
    y += 16;
  } else {
    normalSkills.slice(0, 2).forEach((skill) => {
      const line = `${skill.displayName} [${skillTypeLabel(skill.type)} · ${getSkillStatusText(skill)}]`;
      view.addChild(makeInfoLine(line, y, colors.white, 10));
      y += 14;
      view.addChild(makeInfoLine(getSkillConditionText(options.hero.heroId, skill), y, 0xb7afa8, 9));
      y += 13;
      getHeroSkillEffectLines(options.hero.heroId, skill).forEach((effectLine) => {
        view.addChild(makeInfoLine(`- ${effectLine}`, y, 0xd8d0c8, 9));
        y += 12;
      });
      y += 2;
    });
  }

  const ultimateTitle = makePixiText("궁극기", 12, 0xffc46b);
  ultimateTitle.x = 14;
  ultimateTitle.y = y;
  view.addChild(ultimateTitle);
  y += 18;

  if (ultimateSkills.length === 0) {
    view.addChild(makeInfoLine("등록된 궁극기 없음", y, 0xb7afa8));
  } else {
    ultimateSkills.slice(0, 1).forEach((skill) => {
      const line = `${skill.displayName} [${getSkillStatusText(skill)}]`;
      view.addChild(makeInfoLine(line, y, colors.white, 10));
      y += 14;
      view.addChild(makeInfoLine(getSkillConditionText(options.hero.heroId, skill), y, 0xb7afa8, 9));
      y += 13;
      getHeroUltimateEffectLines(options.hero.heroId).forEach((effectLine) => {
        view.addChild(makeInfoLine(`- ${effectLine}`, y, 0xd8d0c8, 9));
        y += 12;
      });
    });
  }

  target.addChild(view);
}

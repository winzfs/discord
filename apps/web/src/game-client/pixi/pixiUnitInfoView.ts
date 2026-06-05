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

function getSkillConditionText(heroId: string, skill: SkillDefinition) {
  if (heroId === "zarya" && skill.id === "zarya-particle-cannon") {
    return "자동 공격 시 지속 빔. 같은 대상 연속 공격 시 차지/피해 증가";
  }

  if (skill.type === "attack") return "기본 자동 공격 컨셉. 현재 전투력/사거리 계산에 반영";
  if (skill.type === "ultimate") return "궁극기 컨셉 데이터만 있음. 아직 자동 발동 미구현";
  return "스킬 컨셉 데이터만 있음. 아직 자동 발동 미구현";
}

function getSkillStatusText(heroId: string, skill: SkillDefinition) {
  if (heroId === "zarya" && skill.id === "zarya-particle-cannon") return "발동 중";
  if (skill.type === "attack") return "부분 반영";
  return "미구현";
}

function makeInfoLine(value: string, y: number, fill = 0xd8d0c8, size = 11) {
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
  const width = Math.min(340, options.rendererWidth - 24);
  const height = Math.min(210, options.rendererHeight - 170);
  const view = new Container();
  view.x = Math.max(12, options.rendererWidth / 2 - width / 2);
  view.y = Math.max(78, options.rendererHeight - height - 144);
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
  view.addChild(makeInfoLine(stats, 57));

  const stackText = makeInfoLine(`셀 ${options.cellIndex + 1} · 중첩 ${options.stackCount}/3`, 75, options.stackCount >= 3 ? colors.yellow : 0xb7afa8);
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
      const line = `${skill.displayName} [${skillTypeLabel(skill.type)} · ${getSkillStatusText(options.hero.heroId, skill)}]`;
      view.addChild(makeInfoLine(line, y, colors.white));
      y += 15;
      view.addChild(makeInfoLine(`조건: ${getSkillConditionText(options.hero.heroId, skill)}`, y, 0xb7afa8, 10));
      y += 17;
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
      const line = `${skill.displayName} [${getSkillStatusText(options.hero.heroId, skill)}]`;
      view.addChild(makeInfoLine(line, y, colors.white));
      y += 15;
      view.addChild(makeInfoLine(`조건: ${getSkillConditionText(options.hero.heroId, skill)}`, y, 0xb7afa8, 10));
    });
  }

  target.addChild(view);
}

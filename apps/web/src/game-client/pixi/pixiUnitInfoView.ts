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
    "dva-fusion-cannons": ["42%: 주변 4명 24% 피해", "주 대상 104%"],
    "dva-defense-matrix": ["30%: 보스/선두 억제", "이속 62%로 감소"],
    "zarya-particle-cannon": ["항상: 지속 빔", "94%→174% 강화"],
    "zarya-projected-barrier": ["24%: 차지 3+ 조건", "감속 + 피해 108%"],
    "winston-tesla-cannon": ["기본: 좁은 전기 광선", "최대 4명 72%/46%"],
    "winston-jump-pack": ["30%: 선두 충격", "42% 피해 + 감속"],
    "tracer-pulse-pistols": ["42%: 18% 추가타", "주 대상 96%"],
    "tracer-blink": ["42%: 선두 적 48%", "누수 방지"],
    "cassidy-peacekeeper": ["42%: 치명타", "피해 155%"],
    "cassidy-magnetic-grenade": ["30%: 감속/표식", "일반114%, 보스124%"],
    "genji-shuriken": ["42%: 선두 2명", "각 32% 추가"],
    "genji-swift-strike": ["42%: 저체력 3명", "이동 참격 108%"],
    "ana-biotic-rifle": ["24%: 취약 사격", "일반122%, 보스138%"],
    "ana-sleep-dart": ["30%: 3초 수면", "보스도 적용"],
    "kiriko-kunai": ["42%: 급소 판정", "일반102%, 급소168%"],
    "kiriko-protection-suzu": ["24%: 정화의 방울", "공격 배율 소량 증가"],
    "illari-solar-rifle": ["42%: 충전 사격", "일반134%, 보스152%"],
    "illari-healing-pylon": ["24%: 주변 2명", "각 26% 보조 피해"],
  };

  return descriptions[skill.id] ?? ["확률 발동", "영웅 공격력 기반"];
}

function getHeroUltimateEffectLines(heroId: string) {
  if (heroId === "dva") return ["영웅 위치 기준 자폭", "넓은 범위 450% 피해"];
  if (heroId === "zarya") return ["좁은 3초 중력자탄", "흡입/속박 + 240%"];
  if (heroId === "tracer") return ["펄스폭탄 부착", "0.5초 후 520% 폭발"];
  if (heroId === "cassidy") return ["3초 느린 락온", "진행도 비례 피해"];
  if (heroId === "winston") return ["광역 충격파", "240% 피해 + 감속"];
  if (heroId === "genji") return ["전방 5명 베기", "각 210% 피해"];
  if (heroId === "ana") return ["나노 강화제", "공격 배율 +12%"];
  if (heroId === "kiriko") return ["여우길 5초", "공격속도 200%"];
  if (heroId === "illari") return ["태양 폭발", "범위 300% 피해"];

  return ["게이지 100% 발동", "범위 260% 피해"];
}

function getSkillConditionText(heroId: string, skill: SkillDefinition) {
  if (heroId === "zarya" && skill.id === "zarya-particle-cannon") return "항상";
  if (skill.type === "ultimate") return "게이지 100%";
  if (skill.id === "zarya-projected-barrier") return "24%, 차지 3+";
  if (skill.id === "ana-sleep-dart") return "30%, 보스 가능";
  if (skill.type === "attack") return "42%";
  if (skill.type === "control") return "30%";
  return "24%";
}

function getSkillStatusText(skill: SkillDefinition) {
  if (skill.type === "ultimate") return "게이지";
  return "확률";
}

function makeInfoLine(value: string, x: number, y: number, fill = 0xd8d0c8, size = 10) {
  const text = makePixiText(value, size, fill);
  text.x = x;
  text.y = y;
  return text;
}

function drawSkillCard(
  view: Container,
  skill: SkillDefinition,
  heroId: string,
  x: number,
  y: number,
  width: number,
) {
  const title = makePixiText(`${skill.displayName} [${skillTypeLabel(skill.type)}·${getSkillStatusText(skill)}]`, 9, colors.white);
  title.x = x;
  title.y = y;
  view.addChild(title);

  const condition = makeInfoLine(`조건: ${getSkillConditionText(heroId, skill)}`, x, y + 13, 0xb7afa8, 8);
  view.addChild(condition);

  getHeroSkillEffectLines(heroId, skill).slice(0, 2).forEach((line, index) => {
    view.addChild(makeInfoLine(`- ${line}`, x, y + 25 + index * 11, 0xd8d0c8, 8));
  });

  const divider = makeInfoLine("", x + width - 1, y, 0xd8d0c8, 8);
  view.addChild(divider);
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
  const height = Math.min(232, options.rendererHeight - 120);
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
  view.addChild(makeInfoLine(stats, 14, 57, 0xd8d0c8, 10));
  view.addChild(makeInfoLine(`셀 ${options.cellIndex + 1} · 중첩 ${options.stackCount}/3`, 14, 74, options.stackCount >= 3 ? colors.yellow : 0xb7afa8, 10));

  const skillTitle = makePixiText("스킬", 12, colors.green);
  skillTitle.x = 14;
  skillTitle.y = 96;
  view.addChild(skillTitle);

  const cardWidth = (width - 38) / 2;
  if (normalSkills[0]) drawSkillCard(view, normalSkills[0], options.hero.heroId, 14, 116, cardWidth);
  if (normalSkills[1]) drawSkillCard(view, normalSkills[1], options.hero.heroId, 24 + cardWidth, 116, cardWidth);

  const ultimateY = 172;
  const ultimateTitle = makePixiText("궁극기", 12, 0xffc46b);
  ultimateTitle.x = 14;
  ultimateTitle.y = ultimateY;
  view.addChild(ultimateTitle);

  const ultimate = ultimateSkills[0];
  if (ultimate) {
    view.addChild(makeInfoLine(`${ultimate.displayName} [${getSkillStatusText(ultimate)}]`, 14, ultimateY + 18, colors.white, 10));
    view.addChild(makeInfoLine(`조건: ${getSkillConditionText(options.hero.heroId, ultimate)}`, 14, ultimateY + 32, 0xb7afa8, 8));
    getHeroUltimateEffectLines(options.hero.heroId).slice(0, 2).forEach((line, index) => {
      view.addChild(makeInfoLine(`- ${line}`, 14 + index * (cardWidth + 10), ultimateY + 44, 0xd8d0c8, 8));
    });
  } else {
    view.addChild(makeInfoLine("등록된 궁극기 없음", 14, ultimateY + 18, 0xb7afa8, 9));
  }

  target.addChild(view);
}

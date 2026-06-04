import { getHeroById } from "@discord-random-defense/game";
import type { BoardHero } from "@discord-random-defense/game";
import { unitAttackTypeLabel, unitGradeLabel, unitRoleLabel } from "./pixiUnitInfoLabels";

export function getUnitInfoText(hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const name = definition?.displayName ?? hero.heroId;
  const meta = `${unitGradeLabel(hero.grade)} · ${unitRoleLabel(definition?.role)} · ${unitAttackTypeLabel(definition?.attackType)}`;
  const power = definition?.power ?? 0;
  const speed = definition?.attackSpeed ?? 0;
  const range = definition?.range ?? 0;
  const stats = `전투력 ${power}   공속 ${speed.toFixed(2)}   사거리 ${range.toFixed(1)}`;

  return { name, meta, stats };
}

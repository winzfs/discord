import { getHeroStrikeUpgradeRole, type HeroStrikeUpgradeRole } from "./heroStrikeBuildCatalog";
import type { HeroStrikeState, UpgradeOption } from "./heroStrikeTypes";

type WeightedPick = (state: HeroStrikeState, pool: UpgradeOption[]) => UpgradeOption;

const ROLE_ORDER: readonly HeroStrikeUpgradeRole[] = ["weapon", "systems", "survival"];

export function draftHeroStrikeUpgradeChoices(
  state: HeroStrikeState,
  available: UpgradeOption[],
  weightedPick: WeightedPick,
  count = 3,
) {
  const remaining = [...available];
  const choices: UpgradeOption[] = [];

  for (const role of ROLE_ORDER) {
    if (choices.length >= count) break;
    const rolePool = remaining.filter((option) => getHeroStrikeUpgradeRole(option.id) === role);
    if (rolePool.length === 0) continue;
    const picked = weightedPick(state, rolePool);
    choices.push(picked);
    remaining.splice(remaining.indexOf(picked), 1);
  }

  while (choices.length < count && remaining.length > 0) {
    const picked = weightedPick(state, remaining);
    choices.push(picked);
    remaining.splice(remaining.indexOf(picked), 1);
  }

  return choices;
}

import type { HeroStrikeState } from "./heroStrikeTypes";

const HERO_STRIKE_SUPPORT_BASE_DAMAGE = 24;

export function getHeroStrikeSupportBaseDamage(state: HeroStrikeState) {
  const powerLevel = state.upgradeLevels["power-core"] ?? 0;
  return HERO_STRIKE_SUPPORT_BASE_DAMAGE * Math.pow(1.12, powerLevel);
}

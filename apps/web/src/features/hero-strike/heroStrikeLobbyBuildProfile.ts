import type { HeroStrikeLoadout } from "./heroStrikeTypes";

function primaryTag(loadout: HeroStrikeLoadout) {
  if (loadout.primary === "scatter-array") return "CLOSE BURST";
  if (loadout.primary === "rail-driver") return "PRECISION";
  return "RAPID";
}

function supportTag(loadout: HeroStrikeLoadout) {
  if (loadout.support === "drone-wing") return "SUMMON";
  if (loadout.support === "side-cannons") return "SUPPRESS";
  return "LOCK-ON";
}

function tacticalTag(loadout: HeroStrikeLoadout) {
  if (loadout.tactical === "salvage-magnet") return "RECOVERY";
  if (loadout.tactical === "pulse-battery") return "ULTIMATE";
  return "DEFENSE";
}

export function getHeroStrikeLobbyBuildProfile(loadout: HeroStrikeLoadout) {
  const tags = [primaryTag(loadout), supportTag(loadout), tacticalTag(loadout)] as const;
  const title = loadout.primary === "rail-driver"
    ? "HUNTER CONFIGURATION"
    : loadout.primary === "scatter-array"
      ? "BREACH CONFIGURATION"
      : "ASSAULT CONFIGURATION";
  return { title, tags };
}

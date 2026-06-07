export type HeroTacticalArchetype =
  | "precision"
  | "wave-clear"
  | "control-stall"
  | "amplifier"
  | "tempo-support"
  | "economy-support"
  | "execution";

export type HeroDamageProfile = "steady" | "burst" | "chain" | "splash" | "ramp" | "support";

export type HeroStatusKeyword =
  | "slow"
  | "freeze"
  | "mark"
  | "vulnerable"
  | "chain"
  | "splash"
  | "execute"
  | "haste"
  | "shield"
  | "economy"
  | "summon"
  | "burst"
  | "ramp";

export type HeroTargetPriority = "front" | "boss" | "highest-hp" | "cluster" | "low-hp" | "support";

export type HeroTacticalProfile = {
  heroId: string;
  archetype: HeroTacticalArchetype;
  damageProfile: HeroDamageProfile;
  primaryStatus: HeroStatusKeyword | null;
  secondaryStatus?: HeroStatusKeyword | null;
  targetPriority: HeroTargetPriority;
  powerMultiplier: number;
  attackIntervalMultiplier: number;
  concept: string;
  combatNote: string;
};

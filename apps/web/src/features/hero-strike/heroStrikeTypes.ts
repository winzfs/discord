export type HeroStrikePhase = "title" | "loadout" | "playing" | "level-up" | "stage-clear" | "paused" | "game-over" | "victory";
export type EnemyKind = "runner" | "drone" | "tank" | "sniper" | "weaver" | "bomber" | "boss";
export type EliteTrait = "armored" | "rapid" | "scatter" | "veteran";
export type EvolutionId = "pulse-storm" | "hunter-swarm" | "arc-overload" | "aegis-wing";
export type StageObjectiveId = "kills" | "graze" | "combo" | "survivor" | "elite";
export type PrimaryWeaponId = "pulse-blasters" | "scatter-array" | "rail-driver";
export type SupportLoadoutId = "homing-missile" | "drone-wing" | "side-cannons";
export type TacticalLoadoutId = "shield-matrix" | "salvage-magnet" | "pulse-battery";
export type HeroStrikeDifficulty = "recruit" | "agent" | "legend";
export type HeroStrikeLoadout = {
  primary: PrimaryWeaponId;
  support: SupportLoadoutId;
  tactical: TacticalLoadoutId;
  difficulty: HeroStrikeDifficulty;
};
export type StageId =
  | "kings-row"
  | "hanamura-ruins"
  | "null-sector-factory"
  | "antarctic-base"
  | "junkertown-skyway"
  | "nepal-monastery"
  | "numbani-overrun"
  | "rialto-night"
  | "horizon-lunar"
  | "gibraltar-orbit";
export type PickupKind =
  | "xp"
  | "heal"
  | "charge"
  | "shield"
  | "bomb"
  | "overdrive"
  | "xp-core";
export type UpgradeId =
  | "rapid-fire"
  | "twin-shot"
  | "power-core"
  | "piercing"
  | "magnet"
  | "shield"
  | "pulse-drive"
  | "overclock"
  | "homing-missile"
  | "drone-wing"
  | "side-cannons"
  | "rear-guard"
  | "explosive-rounds"
  | "chain-core"
  | "critical-core";
export type StageProtocolId =
  | "vital-core"
  | "reactor-boost"
  | "precision-link"
  | "pulse-sync"
  | "blink-capacitor";
export type EnemyBulletVariant = "orb" | "needle" | "heavy" | "shard";

export type Vec2 = { x: number; y: number };

export type HeroStrikePlayer = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  invulnerable: number;
  blinkCharges: number;
  blinkMaxCharges: number;
  blinkRecharge: number;
  blinkRechargeDuration: number;
  fireCooldown: number;
  fireInterval: number;
  damage: number;
  bulletSpeed: number;
  bulletCount: number;
  spread: number;
  pierce: number;
  magnetRadius: number;
  campaignMagnetBonus: number;
  ultimate: number;
  ultimateMax: number;
  ultimateGainMultiplier: number;
  level: number;
  xp: number;
  nextXp: number;
  xpGainMultiplier: number;
  scoreMultiplier: number;
  campaignDamageMultiplier: number;
  campaignFireRateMultiplier: number;
  bonusCriticalChance: number;
  bonusCriticalMultiplier: number;
  combo: number;
  comboTimer: number;
  overdrive: number;
  overdriveLevel: number;
  homingMissileLevel: number;
  missileCooldown: number;
  supportDroneLevel: number;
  supportDroneCooldown: number;
  sideCannonLevel: number;
  rearGuardLevel: number;
  explosiveRoundsLevel: number;
  chainCoreLevel: number;
  criticalChance: number;
  criticalMultiplier: number;
};

export type HeroStrikeBullet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierce: number;
  enemy: boolean;
  life: number;
  color: string;
  explosionRadius?: number;
  chain?: number;
  variant?: EnemyBulletVariant;
  grazed?: boolean;
};

export type HeroStrikeMissile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  turnRate: number;
  damage: number;
  radius: number;
  explosionRadius: number;
  life: number;
  targetId: number | null;
};

export type HeroStrikeEnemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  fireCooldown: number;
  age: number;
  phase: number;
  reward: number;
  score: number;
  boss: boolean;
  bossPhase?: number;
  elite?: boolean;
  eliteTrait?: EliteTrait;
  dead?: boolean;
};

export type HeroStrikePickup = {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  life: number;
};

export type HeroStrikeParticle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  ring?: boolean;
};

export type FloatingText = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
};

export type HeroStrikeStar = {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
};

export type UpgradeOption = {
  id: UpgradeId;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic";
  currentLevel: number;
  nextLevel: number;
  maxLevel: number;
};

export type StageProtocolOption = {
  id: StageProtocolId;
  title: string;
  description: string;
  icon: string;
  rarity: "rare" | "epic";
  currentLevel: number;
  nextLevel: number;
  maxLevel: number;
};

export type HeroStrikeState = {
  phase: HeroStrikePhase;
  previousPhase: HeroStrikePhase;
  loadout: HeroStrikeLoadout;
  elapsed: number;
  stageElapsed: number;
  score: number;
  highScore: number;
  kills: number;
  maxCombo: number;
  hitsTaken: number;
  damageDealt: number;
  blinksUsed: number;
  objectivesCompleted: number;
  perfectStages: number;
  upgradeRerolls: number;
  rerollsUsed: number;
  nextId: number;
  player: HeroStrikePlayer;
  bullets: HeroStrikeBullet[];
  missiles: HeroStrikeMissile[];
  enemies: HeroStrikeEnemy[];
  pickups: HeroStrikePickup[];
  particles: HeroStrikeParticle[];
  texts: FloatingText[];
  stars: HeroStrikeStar[];
  spawnCooldown: number;
  formationCooldown: number;
  formationIndex: number;
  stageIndex: number;
  stageBanner: number;
  waveIndex: number;
  waveBanner: number;
  eliteSpawned: boolean;
  eliteDefeated: boolean;
  bossSpawned: boolean;
  bossDefeated: boolean;
  bossWarning: number;
  bossPhaseBanner: number;
  bossPhaseLabel: string;
  shake: number;
  flash: number;
  stageKills: number;
  stageHits: number;
  stageGrazes: number;
  stageMaxCombo: number;
  objectiveId: StageObjectiveId;
  objectiveTarget: number;
  objectiveComplete: boolean;
  objectiveRewarded: boolean;
  upgradeChoices: UpgradeOption[];
  upgradeLevels: Partial<Record<UpgradeId, number>>;
  protocolChoices: StageProtocolOption[];
  protocolLevels: Partial<Record<StageProtocolId, number>>;
  evolutions: EvolutionId[];
  evolutionBanner: number;
  evolutionLabel: string;
  researchData: number;
  researchRank: number;
  runResearchEarned: number;
  resultCommitted: boolean;
  pointerActive: boolean;
  pointerLastX: number | null;
  pointerLastY: number | null;
};

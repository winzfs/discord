export type HeroStrikePhase = "title" | "playing" | "level-up" | "paused" | "game-over" | "victory";
export type EnemyKind = "runner" | "drone" | "tank" | "boss";
export type PickupKind = "xp" | "heal" | "charge";
export type UpgradeId = "rapid-fire" | "twin-shot" | "power-core" | "piercing" | "magnet" | "shield" | "pulse-drive" | "overclock";

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
  fireCooldown: number;
  fireInterval: number;
  damage: number;
  bulletSpeed: number;
  bulletCount: number;
  spread: number;
  pierce: number;
  magnetRadius: number;
  ultimate: number;
  ultimateMax: number;
  level: number;
  xp: number;
  nextXp: number;
  combo: number;
  comboTimer: number;
  overdrive: number;
  overdriveLevel: number;
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
  grazed?: boolean;
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
};

export type HeroStrikeState = {
  phase: HeroStrikePhase;
  previousPhase: HeroStrikePhase;
  elapsed: number;
  score: number;
  highScore: number;
  kills: number;
  nextId: number;
  player: HeroStrikePlayer;
  bullets: HeroStrikeBullet[];
  enemies: HeroStrikeEnemy[];
  pickups: HeroStrikePickup[];
  particles: HeroStrikeParticle[];
  texts: FloatingText[];
  stars: HeroStrikeStar[];
  spawnCooldown: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
  bossWarning: number;
  shake: number;
  flash: number;
  upgradeChoices: UpgradeOption[];
  upgradeLevels: Partial<Record<UpgradeId, number>>;
  pointerActive: boolean;
  pointerLastX: number | null;
  pointerLastY: number | null;
};

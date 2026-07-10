import type { UpgradeId } from "./heroStrikeTypes";

export const HERO_STRIKE_UPGRADE_MAX_LEVELS: Record<UpgradeId, number> = {
  "rapid-fire": 5,
  "twin-shot": 3,
  "power-core": 5,
  piercing: 3,
  magnet: 5,
  shield: 5,
  "pulse-drive": 5,
  overclock: 5,
  "homing-missile": 5,
  "drone-wing": 4,
  "side-cannons": 3,
  "rear-guard": 3,
  "explosive-rounds": 4,
  "chain-core": 3,
  "critical-core": 5,
};

export const HERO_STRIKE_WEAPON_UPGRADES = new Set<UpgradeId>([
  "homing-missile",
  "drone-wing",
  "side-cannons",
  "rear-guard",
  "explosive-rounds",
  "chain-core",
  "critical-core",
]);

export function getRapidFireInterval(level: number) {
  return Math.max(0.07, 0.18 * Math.pow(0.84, level));
}

export function getForwardBulletCount(level: number) {
  return 1 + Math.max(0, level);
}

export function getPowerCoreDamage(level: number) {
  return 24 * Math.pow(1.22, Math.max(0, level));
}

export function getMagnetRadius(level: number) {
  return 180 + level * 45 + level * level * 10;
}

export function getShieldGrant(level: number) {
  return Math.min(3, Math.max(1, level));
}

export function getPulseDriveCharge(level: number) {
  return 20 + level * 12;
}

export function getUltimateGainMultiplier(level: number) {
  return 1 + level * 0.15;
}

export function getOverdriveDamageMultiplier(level: number) {
  return 1.25 + level * 0.15;
}

export function getMissileFireInterval(level: number) {
  return Math.max(0.38, 1.45 - level * 0.19);
}

export function getMissileSpeed(level: number) {
  return 340 + level * 20;
}

export function getMissileTurnRate(level: number) {
  return 5.8 + level * 0.65;
}

export function getMissileDamageScale(level: number) {
  return 1.25 + level * 0.38;
}

export function getMissileExplosionRadius(level: number) {
  return 40 + level * 10;
}

export function getDroneFireInterval(level: number, timedBoost: boolean) {
  return Math.max(0.18, 0.58 - level * 0.075 - (timedBoost ? 0.08 : 0));
}

export function getDroneDamageScale(level: number, timedBoost: boolean) {
  return 0.32 + level * 0.13 + (timedBoost ? 0.18 : 0);
}

export function getSideCannonAngles(level: number) {
  if (level >= 3) return [-0.62, -0.38, -0.2, 0.2, 0.38, 0.62];
  if (level >= 2) return [-0.48, -0.25, 0.25, 0.48];
  return [-0.3, 0.3];
}

export function getSideCannonDamageScale(level: number) {
  return 0.42 + level * 0.1;
}

export function getRearGuardAngles(level: number) {
  if (level >= 3) return [Math.PI - 0.5, Math.PI - 0.25, Math.PI, Math.PI + 0.25, Math.PI + 0.5];
  if (level >= 2) return [Math.PI - 0.25, Math.PI, Math.PI + 0.25];
  return [Math.PI];
}

export function getRearGuardDamageScale(level: number) {
  return 0.38 + level * 0.1;
}

export function getExplosionRadius(level: number) {
  return 22 + level * 9;
}

export function getExplosionDamageScale(level: number) {
  return 0.24 + level * 0.11;
}

export function getChainRange(level: number) {
  return 125 + level * 35;
}

export function getChainDamageScale(level: number, chainIndex: number) {
  return Math.max(0.2, 0.28 + level * 0.09 - chainIndex * 0.05);
}

export function getCriticalChance(level: number) {
  return Math.min(0.4, level * 0.075);
}

export function getCriticalMultiplier(level: number) {
  return 1.65 + level * 0.18;
}

export function describeUpgradeLevel(id: UpgradeId, level: number): string {
  switch (id) {
    case "rapid-fire": return `공격 간격 ${getRapidFireInterval(level).toFixed(2)}초`;
    case "twin-shot": return `정면 탄환 ${getForwardBulletCount(level)}발`;
    case "power-core": return `모든 무기 공격력 x${Math.pow(1.22, level).toFixed(2)}`;
    case "piercing": return `기본탄 관통 ${level}회`;
    case "magnet": return `경험치 흡수 반경 ${getMagnetRadius(level)}`;
    case "shield": return `보호막 ${getShieldGrant(level)}칸 · 무적 ${(0.35 + level * 0.12).toFixed(2)}초`;
    case "pulse-drive": return `게이지 획득 +${level * 15}% · 즉시 +${getPulseDriveCharge(level)}`;
    case "overclock": return `오버드라이브 피해 x${getOverdriveDamageMultiplier(level).toFixed(2)}`;
    case "homing-missile": return `발사 ${getMissileFireInterval(level).toFixed(2)}초 · 폭발 ${getMissileExplosionRadius(level)}`;
    case "drone-wing": return `드론 연사 ${getDroneFireInterval(level, false).toFixed(2)}초 · 피해 강화`;
    case "side-cannons": return `측면 보조탄 ${getSideCannonAngles(level).length}발`;
    case "rear-guard": return `후방 방어탄 ${getRearGuardAngles(level).length}발`;
    case "explosive-rounds": return `폭발 반경 ${getExplosionRadius(level)} · 추가피해 ${Math.round(getExplosionDamageScale(level) * 100)}%`;
    case "chain-core": return `최대 ${level}기 전이 · 범위 ${getChainRange(level)}`;
    case "critical-core": return `치명타 ${Math.round(getCriticalChance(level) * 100)}% · x${getCriticalMultiplier(level).toFixed(2)}`;
  }
  return "";
}
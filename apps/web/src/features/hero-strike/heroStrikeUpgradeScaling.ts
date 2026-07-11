import type { UpgradeId } from "./heroStrikeTypes";

export const HERO_STRIKE_UPGRADE_MAX_LEVELS: Record<UpgradeId, number> = {
  "rapid-fire": 3,
  "twin-shot": 2,
  "power-core": 3,
  piercing: 2,
  magnet: 3,
  shield: 2,
  "pulse-drive": 3,
  overclock: 3,
  "homing-missile": 3,
  "drone-wing": 3,
  "side-cannons": 2,
  "rear-guard": 1,
  "explosive-rounds": 2,
  "chain-core": 2,
  "critical-core": 3,
};

export const HERO_STRIKE_WEAPON_UPGRADES = new Set<UpgradeId>([
  "rapid-fire",
  "twin-shot",
  "power-core",
  "piercing",
  "homing-missile",
  "drone-wing",
  "side-cannons",
  "explosive-rounds",
  "chain-core",
  "critical-core",
]);

export function getRapidFireInterval(level: number, baseInterval = 0.18) {
  return Math.max(baseInterval * 0.72, baseInterval * Math.pow(0.9, Math.max(0, level)));
}

export function getForwardBulletCount(level: number, baseCount = 1) {
  return baseCount + Math.max(0, Math.min(2, level));
}

export function getPowerCoreDamage(level: number, baseDamage = 24) {
  return baseDamage * Math.pow(1.16, Math.max(0, level));
}

export function getMagnetRadius(level: number) {
  return 180 + Math.max(0, level) * 38;
}

export function getShieldGrant(level: number) {
  return level >= 2 ? 2 : 1;
}

export function getPulseDriveCharge(level: number) {
  return 16 + Math.max(0, level) * 10;
}

export function getUltimateGainMultiplier(level: number) {
  return 1 + Math.max(0, level) * 0.1;
}

export function getFlowRushDuration(level: number) {
  return 5.4 + Math.max(0, level) * 0.55;
}

export function getFlowRushDamageMultiplier(level: number) {
  return 1.16 + Math.max(0, level) * 0.04;
}

export function getFlowRushFireRateMultiplier(level: number) {
  return Math.max(0.62, 0.73 - Math.max(0, level) * 0.035);
}

export function getMissileFireInterval(level: number) {
  return Math.max(0.82, 1.5 - Math.max(0, level) * 0.2);
}

export function getMissileSpeed(level: number) {
  return 330 + Math.max(0, level) * 18;
}

export function getMissileTurnRate(level: number) {
  return 5.5 + Math.max(0, level) * 0.55;
}

export function getMissileDamageScale(level: number) {
  return 1.02 + Math.max(0, level) * 0.24;
}

export function getMissileExplosionRadius(level: number) {
  return 36 + Math.max(0, level) * 8;
}

export function getDroneFireInterval(level: number, timedBoost: boolean) {
  return Math.max(0.4, 0.68 - Math.max(0, level) * 0.075 - (timedBoost ? 0.05 : 0));
}

export function getDroneDamageScale(level: number, timedBoost: boolean) {
  return 0.22 + Math.max(0, level) * 0.1 + (timedBoost ? 0.1 : 0);
}

export function getSideCannonAngles(level: number) {
  if (level >= 2) return [-0.44, -0.22, 0.22, 0.44];
  return [-0.28, 0.28];
}

export function getSideCannonDamageScale(level: number) {
  return 0.28 + Math.max(0, level) * 0.08;
}

export function getRearGuardAngles(_level: number) {
  return [Math.PI];
}

export function getRearGuardDamageScale(level: number) {
  return 0.26 + Math.max(0, level) * 0.06;
}

export function getExplosionRadius(level: number) {
  return 18 + Math.max(0, level) * 8;
}

export function getExplosionDamageScale(level: number) {
  return 0.16 + Math.max(0, level) * 0.09;
}

export function getChainRange(level: number) {
  return 105 + Math.max(0, level) * 28;
}

export function getChainDamageScale(level: number, chainIndex: number) {
  return Math.max(0.16, 0.2 + Math.max(0, level) * 0.07 - chainIndex * 0.045);
}

export function getCriticalChance(level: number) {
  return Math.min(0.2, Math.max(0, level) * 0.06);
}

export function getCriticalMultiplier(level: number) {
  return 1.6 + Math.max(0, level) * 0.14;
}

export function describeUpgradeLevel(id: UpgradeId, level: number): string {
  switch (id) {
    case "rapid-fire": return `공격 간격 ${getRapidFireInterval(level).toFixed(2)}초`;
    case "twin-shot": return `정면 탄환 ${getForwardBulletCount(level)}발`;
    case "power-core": return `모든 무기 공격력 x${Math.pow(1.16, level).toFixed(2)}`;
    case "piercing": return `기본탄 관통 ${level}회`;
    case "magnet": return `경험치 흡수 반경 ${getMagnetRadius(level)}`;
    case "shield": return `보호막 ${getShieldGrant(level)}칸 · 짧은 무적`;
    case "pulse-drive": return `궁극기 획득 +${level * 10}% · 즉시 +${getPulseDriveCharge(level)}`;
    case "overclock": return `FLOW ${getFlowRushDuration(level).toFixed(1)}초 · 피해 x${getFlowRushDamageMultiplier(level).toFixed(2)}`;
    case "homing-missile": return `발사 ${getMissileFireInterval(level).toFixed(2)}초 · 폭발 ${getMissileExplosionRadius(level)}`;
    case "drone-wing": return `드론 연사 ${getDroneFireInterval(level, false).toFixed(2)}초 · 피해 강화`;
    case "side-cannons": return `측면 보조탄 ${getSideCannonAngles(level).length}발`;
    case "rear-guard": return "후방 방어탄 1발";
    case "explosive-rounds": return `폭발 반경 ${getExplosionRadius(level)} · 추가피해 ${Math.round(getExplosionDamageScale(level) * 100)}%`;
    case "chain-core": return `최대 ${level}기 전이 · 범위 ${getChainRange(level)}`;
    case "critical-core": return `치명타 ${Math.round(getCriticalChance(level) * 100)}% · x${getCriticalMultiplier(level).toFixed(2)}`;
  }
  return "";
}

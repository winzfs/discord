import type { NormalEnemyKind } from "./heroStrikeStages";

export type HeroStrikeEncounterId = "scout" | "cross-fire" | "hunter" | "siege";

export type HeroStrikeEncounter = {
  id: HeroStrikeEncounterId;
  label: string;
  subtitle: string;
  accent: string;
  preferredEnemies: readonly NormalEnemyKind[];
};

const ENCOUNTERS: readonly HeroStrikeEncounter[] = [
  {
    id: "scout",
    label: "SCOUT",
    subtitle: "표적을 정렬하고 FOCUS 사격을 준비하세요",
    accent: "#69e7ff",
    preferredEnemies: ["runner", "drone"],
  },
  {
    id: "cross-fire",
    label: "CROSS FIRE",
    subtitle: "좌우 협공에 맞춰 사격 축을 전환하세요",
    accent: "#ff9fc6",
    preferredEnemies: ["drone", "weaver", "sniper"],
  },
  {
    id: "hunter",
    label: "HUNTER",
    subtitle: "돌진과 저격을 먼저 끊으세요",
    accent: "#ffd166",
    preferredEnemies: ["runner", "sniper", "weaver"],
  },
  {
    id: "siege",
    label: "SIEGE",
    subtitle: "측면을 잡고 중장갑 편대를 돌파하세요",
    accent: "#ff7a66",
    preferredEnemies: ["tank", "bomber", "sniper"],
  },
];

export function getHeroStrikeEncounter(waveIndex: number) {
  return ENCOUNTERS[Math.max(0, Math.min(ENCOUNTERS.length - 1, waveIndex - 1))];
}

export function getHeroStrikeEncounterEnemy(waveIndex: number, roll = Math.random()) {
  const enemies = getHeroStrikeEncounter(waveIndex).preferredEnemies;
  return enemies[Math.min(enemies.length - 1, Math.floor(roll * enemies.length))];
}

export function getHeroStrikeEncounterProgress(waveIndex: number) {
  return Math.max(0, Math.min(1, waveIndex / ENCOUNTERS.length));
}

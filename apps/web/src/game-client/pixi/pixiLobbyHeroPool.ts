import { heroes, type HeroDefinition } from "@discord-random-defense/game";
import { loadLobbyProgress } from "../../game-lobby/lobbyProgressStorage";

export type PixiHeroLevelMap = Record<string, number>;

export type PixiLobbyHeroPool = {
  heroes: HeroDefinition[];
  levels: PixiHeroLevelMap;
};

export function loadPixiLobbyHeroPool(): PixiLobbyHeroPool {
  const progress = loadLobbyProgress();
  const ownedById = new Map(progress.heroes.filter((hero) => hero.owned).map((hero) => [hero.id, hero]));
  const lineupIds = new Set(progress.lineupHeroIds.filter((id) => ownedById.has(id)));
  const lineupHeroes = heroes.filter((hero) => lineupIds.has(hero.id));
  const ownedHeroes = heroes.filter((hero) => ownedById.has(hero.id));
  const playableHeroes = lineupHeroes.length > 0 ? lineupHeroes : ownedHeroes.length > 0 ? ownedHeroes : heroes;

  return {
    heroes: playableHeroes,
    levels: Object.fromEntries(
      playableHeroes.map((hero) => {
        const progressHero = ownedById.get(hero.id);
        return [hero.id, Math.max(1, progressHero?.level ?? 1)];
      }),
    ),
  };
}

export function getHeroLevelMultiplier(level: number) {
  return 1 + Math.max(0, level - 1) * 0.12;
}

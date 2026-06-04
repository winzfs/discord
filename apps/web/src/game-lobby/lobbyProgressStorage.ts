import { initialArtifacts, initialHeroes, type LobbyArtifact, type LobbyHero } from "./lobbyData";

const STORAGE_KEY = "discord-random-defense:lobby-progress:v1";

export type LobbyProgressSnapshot = {
  heroes: LobbyHero[];
  artifacts: LobbyArtifact[];
};

function cloneDefaultProgress(): LobbyProgressSnapshot {
  return {
    heroes: initialHeroes.map((hero) => ({ ...hero })),
    artifacts: initialArtifacts.map((artifact) => ({ ...artifact })),
  };
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function mergeHeroes(savedHeroes: Partial<LobbyHero>[] | undefined): LobbyHero[] {
  const savedById = new Map((savedHeroes ?? []).map((hero) => [hero.id, hero]));
  return initialHeroes.map((hero) => {
    const saved = savedById.get(hero.id);
    if (!saved) return { ...hero };
    return {
      ...hero,
      level: typeof saved.level === "number" ? saved.level : hero.level,
      shards: typeof saved.shards === "number" ? saved.shards : hero.shards,
      owned: typeof saved.owned === "boolean" ? saved.owned : hero.owned,
    };
  });
}

function mergeArtifacts(savedArtifacts: Partial<LobbyArtifact>[] | undefined): LobbyArtifact[] {
  const savedById = new Map((savedArtifacts ?? []).map((artifact) => [artifact.id, artifact]));
  return initialArtifacts.map((artifact) => {
    const saved = savedById.get(artifact.id);
    if (!saved) return { ...artifact };
    return {
      ...artifact,
      level: typeof saved.level === "number" ? saved.level : artifact.level,
      pieces: typeof saved.pieces === "number" ? saved.pieces : artifact.pieces,
      owned: typeof saved.owned === "boolean" ? saved.owned : artifact.owned,
    };
  });
}

export function loadLobbyProgress(): LobbyProgressSnapshot {
  if (!canUseLocalStorage()) return cloneDefaultProgress();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneDefaultProgress();

  try {
    const parsed = JSON.parse(raw) as Partial<LobbyProgressSnapshot>;
    return {
      heroes: mergeHeroes(parsed.heroes),
      artifacts: mergeArtifacts(parsed.artifacts),
    };
  } catch {
    return cloneDefaultProgress();
  }
}

export function saveLobbyProgress(snapshot: LobbyProgressSnapshot) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      heroes: snapshot.heroes.map(({ id, level, shards, owned }) => ({ id, level, shards, owned })),
      artifacts: snapshot.artifacts.map(({ id, level, pieces, owned }) => ({ id, level, pieces, owned })),
    }),
  );
}

export function resetLobbyProgress() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

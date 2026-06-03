export type SeededRandom = () => number;

export function createSeededRandom(seed: string): SeededRandom {
  let state = 0;
  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return () => {
    // Deterministic placeholder RNG. Replace only if tests and replay compatibility are considered.
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

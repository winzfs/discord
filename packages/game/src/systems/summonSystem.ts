import { heroes } from "../data/heroes";
import type { GameState } from "../types/gameState";
import type { BoardHero } from "../types/hero";
import type { SeededRandom } from "../utils/random";

export function summonHero(state: GameState, random: SeededRandom): GameState {
  const emptyIndex = state.board.findIndex((slot) => slot === null);
  if (emptyIndex < 0) return state;

  const hero = heroes[Math.floor(random() * heroes.length)] ?? heroes[0];
  const boardHero: BoardHero = {
    instanceId: `hero-${state.summonCount + 1}`,
    heroId: hero.id,
    grade: hero.grade,
    position: {
      row: Math.floor(emptyIndex / state.boardSize.columns),
      column: emptyIndex % state.boardSize.columns,
    },
  };

  const nextBoard = [...state.board];
  nextBoard[emptyIndex] = boardHero;

  return {
    ...state,
    board: nextBoard,
    summonCount: state.summonCount + 1,
  };
}

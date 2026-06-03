import type { GameState } from "../types/gameState";

export function advanceWave(state: GameState): GameState {
  // TODO: 웨이브 진행과 보스 웨이브 처리를 구현합니다.
  return { ...state, currentWave: state.currentWave + 1 };
}

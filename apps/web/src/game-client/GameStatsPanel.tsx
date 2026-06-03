import { getSummonCost } from "@discord-random-defense/game";
import type { GameState } from "@discord-random-defense/game";

type GameStatsPanelProps = {
  state: GameState;
};

export function GameStatsPanel({ state }: GameStatsPanelProps) {
  return (
    <div className="game-stats-grid">
      <div className="stat-card">
        <span>웨이브</span>
        <strong>{state.currentWave} / 30</strong>
      </div>
      <div className="stat-card">
        <span>생명</span>
        <strong>{state.lives}</strong>
      </div>
      <div className="stat-card">
        <span>코인</span>
        <strong>{state.resources}</strong>
      </div>
      <div className="stat-card">
        <span>점수</span>
        <strong>{state.score.toLocaleString()}</strong>
      </div>
      <div className="stat-card">
        <span>다음 소환 비용</span>
        <strong>{getSummonCost(state.summonCount)}</strong>
      </div>
      <div className="stat-card">
        <span>상태</span>
        <strong>{state.status}</strong>
      </div>
    </div>
  );
}

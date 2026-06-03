import { getSummonCost } from "@discord-random-defense/game";
import type { GameState } from "@discord-random-defense/game";

type GameStatsPanelProps = {
  state: GameState;
};

function getStatusLabel(status: GameState["status"]): string {
  if (status === "ready") return "대기";
  if (status === "playing") return "방어 중";
  if (status === "cleared") return "승리";
  return "실패";
}

export function GameStatsPanel({ state }: GameStatsPanelProps) {
  return (
    <header className="game-hud">
      <div className="hud-main">
        <span className="hud-label">WAVE</span>
        <strong>{state.currentWave}<small>/30</small></strong>
      </div>
      <div className="hud-pill danger">
        <span>CORE</span>
        <strong>{state.lives}</strong>
      </div>
      <div className="hud-pill coin">
        <span>COIN</span>
        <strong>{state.resources}</strong>
      </div>
      <div className="hud-pill score">
        <span>SCORE</span>
        <strong>{state.score.toLocaleString()}</strong>
      </div>
      <div className="hud-pill">
        <span>SUMMON</span>
        <strong>{getSummonCost(state.summonCount)}</strong>
      </div>
      <div className={`hud-status status-${state.status}`}>
        {getStatusLabel(state.status)}
      </div>
    </header>
  );
}

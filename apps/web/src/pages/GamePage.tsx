import { useMemo, useState } from "react";
import {
  completeCurrentWave,
  createInitialGameState,
  createSeededRandom,
  mergeHeroes,
  startWave,
  summonHero,
} from "@discord-random-defense/game";
import type { GameState, HeroGrade, MergeResult, SummonResult, WaveProgressResult } from "@discord-random-defense/game";
import { BattleLane } from "../game-client/BattleLane";
import { GameBoard } from "../game-client/GameBoard";
import { GameControls } from "../game-client/GameControls";
import { GameStatsPanel } from "../game-client/GameStatsPanel";

function createNewGame(): GameState {
  return createInitialGameState(`local-${Date.now()}`);
}

export function GamePage() {
  const [state, setState] = useState<GameState>(() => createNewGame());
  const [message, setMessage] = useState("작전 개시. 랜덤 호출로 서버 코어를 방어해.");
  const random = useMemo(() => createSeededRandom(state.seed), [state.seed]);
  const canInteract = state.status !== "cleared" && state.status !== "failed";

  function handleSummon(): SummonResult {
    const result = summonHero(state, random);
    setState(result.state);
    return result;
  }

  function handleMerge(grade: HeroGrade): MergeResult {
    const result = mergeHeroes(state, grade, random);
    setState(result.state);
    return result;
  }

  function handleClearWave(): WaveProgressResult {
    const playingState = startWave(state);
    const result = completeCurrentWave(playingState);
    setState(result.state);
    return result;
  }

  function handleLeakWave(): WaveProgressResult {
    const playingState = startWave(state);
    const result = completeCurrentWave(playingState, {
      leakedEnemies: [{ enemyId: "bug-grunt", count: 3 }],
    });
    setState(result.state);
    return result;
  }

  function handleReset() {
    setState(createNewGame());
    setMessage("새 작전 시작. 이번 판은 전설 가자.");
  }

  return (
    <main className="game-screen" aria-label="싱글 랜덤 디펜스">
      <GameStatsPanel state={state} />
      <section className="battle-stage">
        <BattleLane state={state} message={message} />
        <div className="summon-board-panel">
          <div className="board-title-row">
            <div>
              <span className="panel-kicker">SQUAD BOARD</span>
              <h2>영웅 배치판</h2>
            </div>
            <strong>4 × 4</strong>
          </div>
          <GameBoard board={state.board} columns={state.boardSize.columns} />
        </div>
      </section>
      <GameControls
        canInteract={canInteract}
        onSummon={handleSummon}
        onMerge={handleMerge}
        onClearWave={handleClearWave}
        onLeakWave={handleLeakWave}
        onReset={handleReset}
        onMessage={setMessage}
      />
    </main>
  );
}

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
import { PageSection } from "../components/common/PageSection";
import { GameBoard } from "../game-client/GameBoard";
import { GameControls } from "../game-client/GameControls";
import { GameStatsPanel } from "../game-client/GameStatsPanel";

function createNewGame(): GameState {
  return createInitialGameState(`local-${Date.now()}`);
}

export function GamePage() {
  const [state, setState] = useState<GameState>(() => createNewGame());
  const [message, setMessage] = useState("랜덤 영웅을 소환해서 30웨이브까지 버텨보자.");
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
    setMessage("새 게임 시작. 이번 판은 전설 가자.");
  }

  return (
    <PageSection
      title="싱글 랜덤 디펜스 프로토타입"
      description="아직 전투 애니메이션 전 단계야. 먼저 4x4 필드, 소환, 합성, 웨이브 진행, 점수 계산을 버튼으로 테스트할 수 있게 연결했어."
    >
      <div className="game-prototype">
        <GameStatsPanel state={state} />
        <div className="game-message" role="status">
          {message}
        </div>
        <GameBoard board={state.board} columns={state.boardSize.columns} />
        <GameControls
          canInteract={canInteract}
          onSummon={handleSummon}
          onMerge={handleMerge}
          onClearWave={handleClearWave}
          onLeakWave={handleLeakWave}
          onReset={handleReset}
          onMessage={setMessage}
        />
      </div>
    </PageSection>
  );
}

import type { GameState } from "@discord-random-defense/game";

type BattleLaneProps = {
  state: GameState;
  message: string;
};

export function BattleLane({ state, message }: BattleLaneProps) {
  const bossWave = state.currentWave % 5 === 0;
  const progress = Math.min(100, Math.max(8, (state.currentWave / 30) * 100));

  return (
    <section className="battle-lane" aria-label="전장 진행 상황">
      <div className="enemy-gate">
        <span className="gate-label">침입 게이트</span>
        <span className="enemy-chip">{bossWave ? "서버크래셔 접근" : "버그 웨이브 접근"}</span>
      </div>
      <div className="lane-track">
        <div className="lane-progress" style={{ width: `${progress}%` }} />
        <div className="enemy-token" style={{ left: `${Math.min(88, progress)}%` }}>
          {bossWave ? "👾" : "🐛"}
        </div>
      </div>
      <div className="server-core">
        <span className="core-icon">◆</span>
        <div>
          <strong>서버 코어</strong>
          <span>내구도 {state.lives}</span>
        </div>
      </div>
      <p className="battle-message">{message}</p>
    </section>
  );
}

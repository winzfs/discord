import { useCallback, useEffect, useState } from "react";
import {
  fetchTrainingLeaderboard,
  type TrainingGameKey,
  type TrainingLeaderboardEntry,
} from "./leaderboard";

const GAME_LABELS: Record<TrainingGameKey, string> = {
  reaction: "반응속도",
  widow: "대기샷",
};

function metricLabel(gameKey: TrainingGameKey, entry: TrainingLeaderboardEntry): string {
  if (gameKey === "reaction") {
    return entry.avgReactionMs ? `${entry.avgReactionMs}ms · ${entry.accuracy}%` : `${entry.accuracy}%`;
  }
  return `${entry.headshotRate ?? 0}% HS · ${entry.accuracy}%`;
}

export function TrainingLeaderboard() {
  const [gameKey, setGameKey] = useState<TrainingGameKey>("reaction");
  const [entries, setEntries] = useState<TrainingLeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const nextEntries = await fetchTrainingLeaderboard(gameKey, 10);
      setEntries(nextEntries);
      setStatus("ready");
    } catch {
      setEntries([]);
      setStatus("error");
    }
  }, [gameKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="training-ranking" aria-label="훈련소 랭킹">
      <header className="training-ranking-header">
        <div>
          <small>GLOBAL TRAINING RANKING</small>
          <h2>훈련소 랭킹</h2>
        </div>
        <button type="button" onClick={() => void load()} aria-label="랭킹 새로고침">↻</button>
      </header>

      <div className="training-ranking-tabs" role="tablist" aria-label="게임별 랭킹">
        {(Object.keys(GAME_LABELS) as TrainingGameKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={gameKey === key}
            className={gameKey === key ? "is-active" : ""}
            onClick={() => setGameKey(key)}
          >
            {GAME_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="training-ranking-list">
        {status === "loading" ? <p className="training-ranking-state">랭킹 불러오는 중…</p> : null}
        {status === "error" ? (
          <p className="training-ranking-state is-error">랭킹 서버에 연결하지 못했어요.</p>
        ) : null}
        {status === "ready" && entries.length === 0 ? (
          <p className="training-ranking-state">아직 등록된 기록이 없습니다. 첫 기록을 남겨보세요.</p>
        ) : null}
        {status === "ready" ? entries.map((entry) => (
          <article key={`${gameKey}-${entry.rank}-${entry.nickname}`} className={`training-rank-row rank-${entry.rank}`}>
            <strong className="training-rank-position">{entry.rank}</strong>
            <div className="training-rank-user">
              <b>{entry.nickname}</b>
              <span>{metricLabel(gameKey, entry)}</span>
            </div>
            <strong className="training-rank-score">{entry.score.toLocaleString()}</strong>
          </article>
        )) : null}
      </div>
    </section>
  );
}

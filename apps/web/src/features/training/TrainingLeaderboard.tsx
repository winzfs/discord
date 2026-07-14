import { useCallback, useEffect, useState } from "react";
import {
  retryDiscordTrainingIdentity,
  useDiscordTrainingIdentity,
} from "./discordIdentity";
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
  const identityState = useDiscordTrainingIdentity();
  const [gameKey, setGameKey] = useState<TrainingGameKey>("reaction");
  const [entries, setEntries] = useState<TrainingLeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"waiting" | "loading" | "ready" | "error">("waiting");

  const load = useCallback(async () => {
    if (identityState.status !== "ready") {
      setStatus("waiting");
      setEntries([]);
      return;
    }

    setStatus("loading");
    try {
      const nextEntries = await fetchTrainingLeaderboard(gameKey, 10);
      setEntries(nextEntries);
      setStatus("ready");
    } catch {
      setEntries([]);
      setStatus("error");
    }
  }, [gameKey, identityState.identity?.guildId, identityState.status]);

  useEffect(() => {
    if (identityState.status === "ready") {
      void load();
    } else {
      setStatus("waiting");
      setEntries([]);
    }
  }, [identityState.status, load]);

  const showIdentityState = identityState.status !== "ready";

  return (
    <section className="training-ranking" aria-label="현재 Discord 서버 훈련소 랭킹">
      <header className="training-ranking-header">
        <div>
          <small>CURRENT SERVER RANKING</small>
          <h2>서버 훈련소 랭킹</h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          aria-label="랭킹 새로고침"
          disabled={identityState.status !== "ready" || status === "loading"}
        >↻</button>
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
        {showIdentityState ? (
          <div className={`training-ranking-state training-ranking-auth is-${identityState.status}`}>
            <strong>Discord 계정 연결 필요</strong>
            <p>{identityState.status === "loading"
              ? "상단에서 Discord 계정을 연결하고 있어요…"
              : identityState.status === "error"
                ? identityState.message
                : "상단의 ‘Discord 계정 연결’ 버튼을 누르면 현재 서버 랭킹을 확인하고 기록을 저장할 수 있어요."}</p>
            {identityState.status === "error" ? (
              <button type="button" onClick={retryDiscordTrainingIdentity}>다시 연결</button>
            ) : null}
          </div>
        ) : null}

        {!showIdentityState && status === "loading" ? <p className="training-ranking-state">서버 랭킹 불러오는 중…</p> : null}
        {!showIdentityState && status === "error" ? (
          <div className="training-ranking-state training-ranking-auth is-error">
            <p>서버 랭킹을 불러오지 못했어요.</p>
            <button type="button" onClick={() => void load()}>다시 불러오기</button>
          </div>
        ) : null}
        {!showIdentityState && status === "ready" && entries.length === 0 ? (
          <p className="training-ranking-state">이 서버에는 아직 기록이 없습니다. 첫 기록을 남겨보세요.</p>
        ) : null}
        {!showIdentityState && status === "ready" ? entries.map((entry) => (
          <article
            key={`${gameKey}-${entry.discordUserId}`}
            className={`training-rank-row rank-${entry.rank} ${entry.discordUserId === identityState.identity?.userId ? "is-me" : ""}`}
          >
            <strong className="training-rank-position">{entry.rank}</strong>
            <span className="training-rank-avatar" aria-hidden="true">
              {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : entry.displayName.slice(0, 1)}
            </span>
            <div className="training-rank-user">
              <b>{entry.displayName}{entry.discordUserId === identityState.identity?.userId ? " · 나" : ""}</b>
              <span>{metricLabel(gameKey, entry)}</span>
            </div>
            <strong className="training-rank-score">{entry.score.toLocaleString()}</strong>
          </article>
        )) : null}
      </div>
    </section>
  );
}

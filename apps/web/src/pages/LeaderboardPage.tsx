import { useEffect, useState } from "react";
import { PageSection } from "../components/common/PageSection";
import { apiClient, type LeaderboardData } from "../lib/apiClient";

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiClient
      .leaderboard(20)
      .then((data) => {
        if (alive) setLeaderboard(data);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "랭킹을 불러오지 못했습니다.");
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageSection title="랭킹" description="싱글플레이 점수와 도달 웨이브 랭킹입니다.">
      <div className="placeholder-card">
        {error ? <p className="notice-text">{error}</p> : null}
        {!leaderboard && !error ? <p className="notice-text">랭킹을 불러오는 중입니다.</p> : null}
        {leaderboard?.entries.length === 0 ? <p className="notice-text">아직 등록된 기록이 없습니다.</p> : null}
        {leaderboard && leaderboard.entries.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>플레이어</th>
                  <th>점수</th>
                  <th>웨이브</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.entries.map((entry) => (
                  <tr key={entry.bestRunId}>
                    <td>{entry.rank}</td>
                    <td>{entry.globalName ?? entry.username}</td>
                    <td>{entry.bestScore.toLocaleString()}</td>
                    <td>{entry.bestWave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}

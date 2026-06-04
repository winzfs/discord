import { useEffect, useState } from "react";
import { PageSection } from "../components/common/PageSection";
import { apiClient, type CurrentUser, type LeaderboardData } from "../lib/apiClient";

export function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([apiClient.me(), apiClient.leaderboard(5)])
      .then(([currentUser, ranking]) => {
        if (!alive) return;
        setUser(currentUser);
        setLeaderboard(ranking);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "대시보드를 불러오지 못했습니다.");
      });

    return () => {
      alive = false;
    };
  }, []);

  const displayName = user?.profile?.globalName ?? user?.profile?.username ?? user?.discordId ?? "로그인 필요";
  const topEntry = leaderboard?.entries[0];

  return (
    <PageSection title="대시보드" description="내 기록, 최근 플레이, 랭킹 요약을 표시합니다.">
      {error ? (
        <div className="placeholder-card">
          <p className="notice-text">{error}</p>
          <a className="primary-link" href="/login">Discord 로그인</a>
        </div>
      ) : null}

      <div className="grid-list">
        <div className="placeholder-card">
          <p className="notice-text">로그인 유저</p>
          <h3>{displayName}</h3>
          <p className="notice-text">서버 멤버: {user ? (user.isGuildMember ? "확인됨" : "미확인") : "-"}</p>
        </div>
        <div className="placeholder-card">
          <p className="notice-text">현재 1위</p>
          <h3>{topEntry ? topEntry.globalName ?? topEntry.username : "기록 없음"}</h3>
          <p className="notice-text">점수 {topEntry ? topEntry.bestScore.toLocaleString() : "-"}</p>
        </div>
        <div className="placeholder-card">
          <p className="notice-text">게임 시작</p>
          <a className="primary-link" href="/play">바로 플레이</a>
        </div>
      </div>
    </PageSection>
  );
}

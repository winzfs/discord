import { useEffect, useState } from "react";
import { PageSection } from "../components/common/PageSection";
import { apiClient, type AdminSummary } from "../lib/apiClient";

export function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiClient
      .adminSummary()
      .then((data) => {
        if (alive) setSummary(data);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "관리자 요약을 불러오지 못했습니다.");
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageSection title="관리자" description="최근 기록과 운영 로그를 확인할 관리자 화면입니다.">
      <div className="grid-list">
        <div className="placeholder-card">
          <p className="notice-text">전체 유저</p>
          <p className="stat-number">{summary ? summary.totals.users.toLocaleString() : "-"}</p>
        </div>
        <div className="placeholder-card">
          <p className="notice-text">전체 플레이 기록</p>
          <p className="stat-number">{summary ? summary.totals.gameRuns.toLocaleString() : "-"}</p>
        </div>
      </div>

      <div className="placeholder-card">
        {error ? <p className="notice-text">{error}</p> : null}
        {!summary && !error ? <p className="notice-text">관리자 요약을 불러오는 중입니다.</p> : null}
        {summary?.recentRuns.length === 0 ? <p className="notice-text">최근 기록이 없습니다.</p> : null}
        {summary && summary.recentRuns.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>유저</th>
                  <th>점수</th>
                  <th>웨이브</th>
                  <th>처치</th>
                  <th>보스</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td>{run.globalName ?? run.username}</td>
                    <td>{run.score.toLocaleString()}</td>
                    <td>{run.wave}</td>
                    <td>{run.kills}</td>
                    <td>{run.bossKills}</td>
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

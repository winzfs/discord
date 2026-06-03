import { PageSection } from "../components/common/PageSection";

export function DashboardPage() {
  return (
    <PageSection title="대시보드" description="내 기록, 최근 플레이, 랭킹 요약을 표시할 화면입니다.">
      <div className="grid-list">
        <div className="placeholder-card">개인 최고 기록 placeholder</div>
        <div className="placeholder-card">최근 게임 결과 placeholder</div>
        <div className="placeholder-card">서버 랭킹 요약 placeholder</div>
      </div>
    </PageSection>
  );
}
